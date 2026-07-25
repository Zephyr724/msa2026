using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Kiwimpact.Infrastructure.Reconciliation;

public sealed record XpReconciliationPassResult(
    bool AdvisoryLockAcquired,
    int Scanned,
    int Awarded,
    int AlreadyAwarded,
    int Failed,
    int Unprocessable,
    bool Aborted,
    bool PassComplete);

/// <summary>
/// Repeatable reconciliation runner for Verified completions that predate the
/// XP ledger. Each pass awards exactly one XP transaction per eligible
/// completion inside its own transaction; unique SourceCompletionId plus the
/// conditional profile update is the correctness boundary. The session-level
/// advisory lock is a courtesy optimization only and is always released
/// explicitly before the dedicated connection is disposed.
///
/// Logging contract: counts and exception types only at Information and
/// above; completion IDs only at Debug; never XP values, profile, community,
/// or user data, and never the exception object.
/// </summary>
public sealed class XpReconciliationRunner
{
    // Fixed compiled advisory-lock key, identical for every instance and not
    // configurable.
    public const long AdvisoryLockKey = 727_414_900_000_005_017L;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<XpReconciliationOptions> _options;
    private readonly ILogger<XpReconciliationRunner> _logger;

    public XpReconciliationRunner(
        IServiceScopeFactory scopeFactory,
        IOptions<XpReconciliationOptions> options,
        ILogger<XpReconciliationRunner> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options;
        _logger = logger;
    }

    /// <summary>
    /// Runs one pass behind the courtesy advisory lock. Directly invokable so
    /// tests never need a running host or a real sleep.
    /// </summary>
    public async Task<XpReconciliationPassResult> ReconcilePassAsync(
        CancellationToken ct = default)
    {
        await using var connection = new NpgsqlConnection(await GetConnectionStringAsync(ct));
        await connection.OpenAsync(ct);
        if (!await TryAcquireAdvisoryLockAsync(connection, ct))
        {
            _logger.LogInformation(
                "XP reconciliation pass skipped: another worker holds the advisory lock.");
            return new XpReconciliationPassResult(false, 0, 0, 0, 0, 0, false, false);
        }

        try
        {
            return await ReconcilePassCoreAsync(ct);
        }
        finally
        {
            // Explicit release; connection disposal is the backstop.
            await ReleaseAdvisoryLockAsync(connection);
        }
    }

    /// <summary>
    /// The pass body without the courtesy advisory lock. Used by the hosted
    /// path and by tests that must force genuine worker overlap to prove
    /// correctness never depends on the lock.
    /// </summary>
    public async Task<XpReconciliationPassResult> ReconcilePassCoreAsync(
        CancellationToken ct = default)
    {
        var options = _options.Value;
        var attemptedIds = new HashSet<Guid>();
        var scanned = 0;
        var awarded = 0;
        var alreadyAwarded = 0;
        var failed = 0;
        var consecutiveFailures = 0;
        var aborted = false;

        while (!aborted)
        {
            IReadOnlyList<QuestCompletion> batch;
            await using (var queryScope = _scopeFactory.CreateAsyncScope())
            {
                var repository = queryScope.ServiceProvider
                    .GetRequiredService<IXpLedgerRepository>();
                batch = await repository.GetAwardEligibleBatchAsync(
                    options.BatchSize,
                    attemptedIds,
                    ct);
            }

            if (batch.Count == 0)
                break;
            scanned += batch.Count;

            foreach (var candidate in batch)
            {
                // Each row is attempted at most once per pass.
                attemptedIds.Add(candidate.Id);
                _logger.LogDebug(
                    "Attempting XP award for completion {CompletionId}.",
                    candidate.Id);
                try
                {
                    XpAwardOutcome outcome;
                    await using (var rowScope = _scopeFactory.CreateAsyncScope())
                    {
                        var rowRepository = rowScope.ServiceProvider
                            .GetRequiredService<IXpLedgerRepository>();
                        outcome = await rowRepository.AwardVerifiedCompletionAsync(
                            candidate,
                            DateTimeOffset.UtcNow,
                            ct);
                    }

                    if (outcome == XpAwardOutcome.Awarded)
                    {
                        awarded++;
                    }
                    else
                    {
                        alreadyAwarded++;
                    }

                    // Every non-failure outcome breaks the failure streak.
                    consecutiveFailures = 0;
                }
                catch (Exception exception) when (exception is not OperationCanceledException)
                {
                    failed++;
                    consecutiveFailures++;
                    // Bounded by contract: exception type only, no exception
                    // object, no completion ID above Debug.
                    _logger.LogWarning(
                        "XP award failed for a completion ({ExceptionType}).",
                        exception.GetType().Name);
                    _logger.LogDebug(
                        "Failed completion was {CompletionId}.",
                        candidate.Id);
                    if (consecutiveFailures >= options.MaxConsecutiveRowFailures)
                    {
                        aborted = true;
                        break;
                    }
                }
            }
        }

        int unprocessable;
        await using (var countScope = _scopeFactory.CreateAsyncScope())
        {
            var repository = countScope.ServiceProvider
                .GetRequiredService<IXpLedgerRepository>();
            unprocessable = await repository.CountUnprocessableRewardPendingAsync(ct);
        }

        var passComplete = !aborted && failed == 0 && unprocessable == 0;
        _logger.LogInformation(
            "XP reconciliation pass: scanned={Scanned} awarded={Awarded} " +
            "alreadyAwarded={AlreadyAwarded} failed={Failed} " +
            "unprocessable={Unprocessable} complete={PassComplete}.",
            scanned,
            awarded,
            alreadyAwarded,
            failed,
            unprocessable,
            passComplete);
        if (!passComplete)
        {
            _logger.LogWarning(
                "XP reward state is incomplete; the progression readiness gate stays closed.");
        }

        return new XpReconciliationPassResult(
            true,
            scanned,
            awarded,
            alreadyAwarded,
            failed,
            unprocessable,
            aborted,
            passComplete);
    }

    private async Task<string> GetConnectionStringAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        return db.Database.GetConnectionString()
            ?? throw new InvalidOperationException(
                "The XP reconciliation connection string is not configured.");
    }

    private static async Task<bool> TryAcquireAdvisoryLockAsync(
        NpgsqlConnection connection,
        CancellationToken ct)
    {
        await using var command = new NpgsqlCommand(
            "SELECT pg_try_advisory_lock(@key);",
            connection);
        command.Parameters.AddWithValue("key", AdvisoryLockKey);
        return (bool)(await command.ExecuteScalarAsync(ct))!;
    }

    private async Task ReleaseAdvisoryLockAsync(NpgsqlConnection connection)
    {
        try
        {
            await using var command = new NpgsqlCommand(
                "SELECT pg_advisory_unlock(@key);",
                connection);
            command.Parameters.AddWithValue("key", AdvisoryLockKey);
            await command.ExecuteScalarAsync();
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                "Explicit XP reconciliation advisory unlock failed ({ExceptionType}); " +
                "connection disposal is the backstop.",
                exception.GetType().Name);
        }
    }
}
