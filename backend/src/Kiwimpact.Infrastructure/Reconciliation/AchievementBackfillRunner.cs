using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Kiwimpact.Infrastructure.Reconciliation;

public sealed record AchievementBackfillPassResult(
    bool AdvisoryLockAcquired,
    int Scanned,
    int Awarded,
    int AlreadyAwarded,
    int Failed,
    bool Aborted,
    bool PassComplete);

/// <summary>
/// Bounded historical backfill runner: awards the approved milestones to
/// users who already hold XP transactions from before the achievement core
/// existed. Each pass processes bounded candidate batches; every user is
/// attempted at most once per pass and awarded inside its own per-user
/// transaction (profile lock → post-lock re-read → locked snapshot → one
/// flush). The session-level advisory lock is a courtesy optimization only
/// and is always released explicitly before the dedicated connection is
/// disposed.
///
/// An unexpected UserAchievement unique violation rolls back the user
/// transaction and is counted failed — an aborted transaction is never
/// reported as awarded or already awarded; the user heals on a later pass.
///
/// Logging contract: counts and exception types only at Information and
/// above; user IDs only at Debug; never profile or XP details, and never the
/// exception object.
/// </summary>
public sealed class AchievementBackfillRunner
{
    // Fixed compiled advisory-lock key, identical for every instance and
    // distinct from the XP reconciliation and achievement seed keys.
    public const long AdvisoryLockKey = 727_414_900_000_006_002L;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<AchievementBackfillOptions> _options;
    private readonly ILogger<AchievementBackfillRunner> _logger;

    public AchievementBackfillRunner(
        IServiceScopeFactory scopeFactory,
        IOptions<AchievementBackfillOptions> options,
        ILogger<AchievementBackfillRunner> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options;
        _logger = logger;
    }

    /// <summary>
    /// Runs one pass behind the courtesy advisory lock. Directly invokable so
    /// tests never need a running host or a real sleep.
    /// </summary>
    public async Task<AchievementBackfillPassResult> BackfillPassAsync(
        CancellationToken ct = default)
    {
        await using var connection = new NpgsqlConnection(await GetConnectionStringAsync(ct));
        await connection.OpenAsync(ct);
        if (!await TryAcquireAdvisoryLockAsync(connection, ct))
        {
            _logger.LogInformation(
                "Achievement backfill pass skipped: another worker holds the advisory lock.");
            return new AchievementBackfillPassResult(false, 0, 0, 0, 0, false, false);
        }

        try
        {
            return await BackfillPassCoreAsync(ct);
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
    public async Task<AchievementBackfillPassResult> BackfillPassCoreAsync(
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
            AchievementAwardService.BackfillCandidateScan scan;
            await using (var queryScope = _scopeFactory.CreateAsyncScope())
            {
                var service = queryScope.ServiceProvider
                    .GetRequiredService<AchievementAwardService>();
                scan = await service.FindBackfillCandidatesAsync(
                    options.BatchSize,
                    attemptedIds,
                    ct);
            }

            if (scan.ScannedUserIds.Count == 0)
                break;
            foreach (var userId in scan.ScannedUserIds)
                attemptedIds.Add(userId);

            foreach (var userId in scan.EligibleUserIds)
            {
                // Each user is attempted at most once per pass.
                scanned++;
                _logger.LogDebug(
                    "Attempting achievement backfill for user {UserId}.",
                    userId);
                try
                {
                    int committed;
                    await using (var userScope = _scopeFactory.CreateAsyncScope())
                    {
                        var service = userScope.ServiceProvider
                            .GetRequiredService<AchievementAwardService>();
                        committed = await service.AwardBackfillUserAsync(userId, ct);
                    }

                    if (committed > 0)
                    {
                        awarded++;
                    }
                    else
                    {
                        // The post-lock re-read found everything already
                        // awarded (an overlap loser under the lock protocol).
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
                    // object, no user ID above Debug.
                    _logger.LogWarning(
                        "Achievement backfill failed for a user ({ExceptionType}).",
                        exception.GetType().Name);
                    _logger.LogDebug(
                        "Failed backfill user was {UserId}.",
                        userId);
                    if (consecutiveFailures >= options.MaxConsecutiveRowFailures)
                    {
                        aborted = true;
                        break;
                    }
                }
            }
        }

        var passComplete = !aborted && failed == 0;
        _logger.LogInformation(
            "Achievement backfill pass: scanned={Scanned} awarded={Awarded} " +
            "alreadyAwarded={AlreadyAwarded} failed={Failed} complete={PassComplete}.",
            scanned,
            awarded,
            alreadyAwarded,
            failed,
            passComplete);

        return new AchievementBackfillPassResult(
            true,
            scanned,
            awarded,
            alreadyAwarded,
            failed,
            aborted,
            passComplete);
    }

    private async Task<string> GetConnectionStringAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        return db.Database.GetConnectionString()
            ?? throw new InvalidOperationException(
                "The achievement backfill connection string is not configured.");
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
                "Explicit achievement backfill advisory unlock failed ({ExceptionType}); " +
                "connection disposal is the backstop.",
                exception.GetType().Name);
        }
    }
}
