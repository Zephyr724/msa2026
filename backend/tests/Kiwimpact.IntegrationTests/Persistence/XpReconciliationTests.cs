using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Reconciliation;
using Kiwimpact.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Persistence;

public sealed class XpReconciliationTests : IClassFixture<TestDatabaseFixture>
{
    private readonly TestDatabaseFixture _fixture;

    public XpReconciliationTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task PassAwardsEveryEligibleCompletionWithExactSnapshots()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await using var provider = CreateProvider();
        var service = CreateService(provider);
        await DrainAsync(service);
        var community = await XpLedgerTestHelpers.SeedRegionAsync(
            seedDb, "XP reconciliation community");
        var easy = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
            seedDb, QuestDifficulty.Easy, community.Id);
        var medium = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
            seedDb, QuestDifficulty.Medium);
        var hard = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
            seedDb, QuestDifficulty.Hard, community.Id);

        var result = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);

        Assert.True(result.AdvisoryLockAcquired);
        Assert.Equal(3, result.Awarded);
        Assert.Equal(0, result.AlreadyAwarded);
        Assert.Equal(0, result.Failed);
        Assert.Equal(0, result.Unprocessable);
        Assert.False(result.Aborted);
        Assert.True(result.PassComplete);

        seedDb.ChangeTracker.Clear();
        await AssertExactAwardAsync(seedDb, easy, 50, community.Id);
        await AssertExactAwardAsync(seedDb, medium, 100, null);
        await AssertExactAwardAsync(seedDb, hard, 150, community.Id);
        Assert.False(await XpLedgerTestHelpers.NewXpLedgerRepository(seedDb).HasRewardPendingCompletionsAsync(
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task RepeatedPassIsAStrictNoOp()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await using var provider = CreateProvider();
        var service = CreateService(provider);
        await DrainAsync(service);
        var completion = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
            seedDb, QuestDifficulty.Medium);

        var first = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, first.Awarded);

        seedDb.ChangeTracker.Clear();
        var xpCount = await seedDb.XpTransactions.CountAsync(
            TestContext.Current.CancellationToken);
        var profile = await seedDb.UserProfiles.SingleAsync(
            item => item.Id == completion.UserId,
            TestContext.Current.CancellationToken);
        var totalXp = profile.TotalXp;
        var level = profile.Level;
        var updatedAt = profile.UpdatedAt;

        var second = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);

        Assert.Equal(0, second.Scanned);
        Assert.Equal(0, second.Awarded);
        Assert.Equal(0, second.AlreadyAwarded);
        Assert.Equal(0, second.Failed);
        Assert.True(second.PassComplete);
        seedDb.ChangeTracker.Clear();
        Assert.Equal(xpCount, await seedDb.XpTransactions.CountAsync(
            TestContext.Current.CancellationToken));
        var after = await seedDb.UserProfiles.SingleAsync(
            item => item.Id == completion.UserId,
            TestContext.Current.CancellationToken);
        Assert.Equal(totalXp, after.TotalXp);
        Assert.Equal(level, after.Level);
        Assert.Equal(updatedAt, after.UpdatedAt);
    }

    [Fact]
    public async Task MultipleBatchesAreProcessedUntilTheQueryReturnsEmpty()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await using var provider = CreateProvider();
        var service = CreateService(provider, new XpReconciliationOptions
        {
            BatchSize = 2,
        });
        await DrainAsync(service);
        for (var index = 0; index < 5; index++)
        {
            await XpLedgerTestHelpers.SeedPendingCompletionAsync(
                seedDb,
                QuestDifficulty.Easy,
                verifiedAtUtc: DateTimeOffset.UtcNow.AddMinutes(index));
        }

        var result = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);

        Assert.Equal(5, result.Scanned);
        Assert.Equal(5, result.Awarded);
        Assert.True(result.PassComplete);
        Assert.False(await XpLedgerTestHelpers.NewXpLedgerRepository(seedDb).HasRewardPendingCompletionsAsync(
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task NullTimestampRowIsUnprocessableCountedAndBlocksCompletion()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await using var provider = CreateProvider();
        var service = CreateService(provider);
        await DrainAsync(service);
        var normal = await XpLedgerTestHelpers.SeedPendingCompletionAsync(seedDb);
        var impossibleGraph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(seedDb);
        var impossibleId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        await seedDb.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "QuestCompletions"
                ("Id", "UserId", "QuestId", "ParticipationId", "Method", "Status",
                 "CompletedAt", "VerifiedAtUtc", "RewardDifficultySnapshot",
                 "QuestCategorySnapshot",
                 "CommunityRegionIdAtCompletion", "CreatedAt", "UpdatedAt")
            VALUES
                ({impossibleId}, {impossibleGraph.Actor.Id}, {impossibleGraph.Quest.Id},
                 {impossibleGraph.Participation.Id}, 'CompletionCode', 'Verified',
                 {now}, NULL, 'Easy',
                 {impossibleGraph.Quest.Category.ToString()},
                 NULL, {now}, {now})
            """, TestContext.Current.CancellationToken);

        try
        {
            var result = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);

            Assert.Equal(1, result.Awarded);
            Assert.Equal(0, result.Failed);
            Assert.Equal(1, result.Unprocessable);
            Assert.False(result.PassComplete);
            Assert.Equal(0, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, impossibleId));
            Assert.Equal(1, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, normal.Id));
            Assert.True(await XpLedgerTestHelpers.NewXpLedgerRepository(seedDb).HasRewardPendingCompletionsAsync(
                TestContext.Current.CancellationToken));

            // A second pass makes the same terminal accounting, never an award.
            var repeat = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);
            Assert.Equal(0, repeat.Awarded);
            Assert.Equal(1, repeat.Unprocessable);
            Assert.False(repeat.PassComplete);
            Assert.Equal(0, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, impossibleId));
        }
        finally
        {
            await seedDb.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"QuestCompletions\" WHERE \"Id\" = {impossibleId}",
                TestContext.Current.CancellationToken);
        }
    }

    [Fact]
    public async Task PermanentFailureIsAttemptedOncePerPassAndRetriedOnNextPass()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await using var provider = CreateProvider();
        var service = CreateService(provider, new XpReconciliationOptions
        {
            MaxConsecutiveRowFailures = 5,
        });
        await DrainAsync(service);
        var failing = await XpLedgerTestHelpers.SeedPendingCompletionAsync(seedDb);

        await InstallCountingTriggerAsync(seedDb, [failing.Id]);
        try
        {
            var first = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);
            Assert.Equal(1, first.Failed);
            Assert.Equal(0, first.Awarded);
            Assert.False(first.Aborted);
            Assert.False(first.PassComplete);
            Assert.Equal(1, await AttemptCountAsync(seedDb));

            var second = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);
            Assert.Equal(1, second.Failed);
            Assert.Equal(2, await AttemptCountAsync(seedDb));
            Assert.Equal(0, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, failing.Id));
        }
        finally
        {
            await DropCountingTriggerAsync(seedDb);
        }

        // With the failure removed, the next explicitly invoked pass succeeds.
        var healed = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, healed.Awarded);
        Assert.Equal(1, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, failing.Id));
    }

    [Fact]
    public async Task CircuitBreakerAbortsThePassAtTheConsecutiveFailureThreshold()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await using var provider = CreateProvider();
        var service = CreateService(provider, new XpReconciliationOptions
        {
            MaxConsecutiveRowFailures = 2,
        });
        await DrainAsync(service);
        var failing = new List<Guid>();
        for (var index = 0; index < 3; index++)
        {
            var completion = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
                seedDb,
                QuestDifficulty.Easy,
                verifiedAtUtc: DateTimeOffset.UtcNow.AddMinutes(index));
            failing.Add(completion.Id);
        }

        await InstallCountingTriggerAsync(seedDb, failing);
        try
        {
            var result = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);

            Assert.True(result.Aborted);
            Assert.Equal(2, result.Failed);
            Assert.False(result.PassComplete);
            Assert.Equal(2, await AttemptCountAsync(seedDb));
            foreach (var id in failing)
                Assert.Equal(0, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, id));
        }
        finally
        {
            await DropCountingTriggerAsync(seedDb);
        }
    }

    [Fact]
    public async Task FailureThenAlreadyAwardedThenFailureDoesNotTripTheCircuitBreaker()
    {
        // This test can be the first member of the class selected by a filter,
        // so migrate the class database before the initial drain query.
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await using var provider = CreateProvider();
        var service = CreateService(provider, new XpReconciliationOptions
        {
            MaxConsecutiveRowFailures = 2,
        });
        await DrainAsync(service);
        var now = DateTimeOffset.UtcNow;
        var firstFailure = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
            seedDb, QuestDifficulty.Easy, verifiedAtUtc: now.AddMinutes(-3));
        var overlapped = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
            seedDb, QuestDifficulty.Easy, verifiedAtUtc: now.AddMinutes(-2));
        var secondFailure = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
            seedDb, QuestDifficulty.Easy, verifiedAtUtc: now.AddMinutes(-1));

        // The first failing row sleeps inside its insert attempt so the
        // overlap winner can commit deterministically while the pass is
        // provably inside that attempt; the sequence bump before the sleep is
        // the observable attempt signal.
        await seedDb.Database.ExecuteSqlRawAsync(
            "CREATE SEQUENCE IF NOT EXISTS xp_attempt_counter_for_test",
            TestContext.Current.CancellationToken);
        await seedDb.Database.ExecuteSqlRawAsync(
            $"""
            CREATE OR REPLACE FUNCTION count_xp_attempt_for_test() RETURNS trigger AS $fn$
            BEGIN
                IF NEW."SourceCompletionId" = '{firstFailure.Id}' THEN
                    PERFORM nextval('xp_attempt_counter_for_test');
                    PERFORM pg_sleep(2);
                    RAISE EXCEPTION 'forced reconciliation failure for test';
                END IF;
                IF NEW."SourceCompletionId" = '{secondFailure.Id}' THEN
                    RAISE EXCEPTION 'forced reconciliation failure for test';
                END IF;
                RETURN NEW;
            END;
            $fn$ LANGUAGE plpgsql
            """,
            TestContext.Current.CancellationToken);
        await seedDb.Database.ExecuteSqlRawAsync(
            """
            CREATE TRIGGER xp_attempt_count_for_test
            BEFORE INSERT ON "XpTransactions"
            FOR EACH ROW EXECUTE FUNCTION count_xp_attempt_for_test()
            """,
            TestContext.Current.CancellationToken);

        try
        {
            var passTask = service.ReconcilePassCoreAsync(
                TestContext.Current.CancellationToken);

            // Wait until the pass is inside the first failing attempt, then a
            // concurrent worker awards the middle completion first.
            var attemptObserved = false;
            for (var poll = 0; poll < 100 && !attemptObserved; poll++)
            {
                attemptObserved = await AttemptCountAsync(seedDb) >= 1;
                if (!attemptObserved)
                    await Task.Delay(50, TestContext.Current.CancellationToken);
            }
            Assert.True(attemptObserved, "The first failing attempt never started.");
            await seedDb.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "XpTransactions"
                    ("Id", "UserId", "QuestId", "SourceCompletionId", "XpAmount",
                     "CommunityRegionIdAtAward", "CreatedAt")
                VALUES
                    ({Guid.NewGuid()}, {overlapped.UserId}, {overlapped.QuestId},
                     {overlapped.Id}, {50}, NULL, {overlapped.VerifiedAtUtc!.Value})
                """, TestContext.Current.CancellationToken);

            var result = await passTask.WaitAsync(
                TimeSpan.FromSeconds(30), TestContext.Current.CancellationToken);

            // Failure, benign overlap loser, failure: the already-awarded
            // outcome breaks the streak, so the threshold of 2 is never hit.
            Assert.False(result.Aborted);
            Assert.Equal(0, result.Awarded);
            Assert.Equal(1, result.AlreadyAwarded);
            Assert.Equal(2, result.Failed);
            Assert.Equal(3, result.Scanned);
            Assert.False(result.PassComplete);
            Assert.Equal(1, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, overlapped.Id));
        }
        finally
        {
            await DropCountingTriggerAsync(seedDb);
        }
    }

    [Fact]
    public async Task FailureLogsAboveDebugContainOnlyCountsAndExceptionTypes()
    {
        await using var provider = CreateProvider();
        var drainService = CreateService(provider);
        await DrainAsync(drainService);

        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var community = await XpLedgerTestHelpers.SeedRegionAsync(
            seedDb, "XP logging community");
        var failing = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
            seedDb, QuestDifficulty.Easy, community.Id);
        var communityId = failing.CommunityRegionIdAtCompletion;

        await InstallCountingTriggerAsync(seedDb, [failing.Id]);
        var logger = new CapturingLogger<XpReconciliationRunner>();
        var service = new XpReconciliationRunner(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new XpReconciliationOptions()),
            logger);
        try
        {
            var result = await service.ReconcilePassCoreAsync(
                TestContext.Current.CancellationToken);
            Assert.Equal(1, result.Failed);

            var aboveDebug = logger.Entries
                .Where(entry => entry.Level > LogLevel.Debug)
                .ToList();
            Assert.NotEmpty(aboveDebug);

            // The exception type is the only exception detail permitted.
            Assert.Contains(
                aboveDebug,
                entry =>
                    entry.Level == LogLevel.Warning &&
                    entry.Message.Contains("DbUpdateException", StringComparison.Ordinal));
            foreach (var entry in aboveDebug)
            {
                // No exception object and no exception detail text.
                Assert.Null(entry.Exception);
                Assert.DoesNotContain(
                    "forced reconciliation failure",
                    entry.Message,
                    StringComparison.OrdinalIgnoreCase);
                // No completion, user, quest, or community identifiers.
                Assert.DoesNotContain(
                    failing.Id.ToString("D"),
                    entry.Message,
                    StringComparison.OrdinalIgnoreCase);
                Assert.DoesNotContain(
                    failing.UserId.ToString("D"),
                    entry.Message,
                    StringComparison.OrdinalIgnoreCase);
                Assert.DoesNotContain(
                    failing.QuestId.ToString("D"),
                    entry.Message,
                    StringComparison.OrdinalIgnoreCase);
                if (communityId.HasValue)
                {
                    Assert.DoesNotContain(
                        communityId.Value.ToString("D"),
                        entry.Message,
                        StringComparison.OrdinalIgnoreCase);
                }
            }

            // Row correlation remains available at Debug only.
            Assert.Contains(
                logger.Entries,
                entry =>
                    entry.Level == LogLevel.Debug &&
                    entry.Message.Contains(failing.Id.ToString("D"), StringComparison.Ordinal));
        }
        finally
        {
            await DropCountingTriggerAsync(seedDb);
        }
    }

    [Fact]
    public async Task ExternallyHeldAdvisoryLockSkipsThePassWithoutAwarding()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await using var provider = CreateProvider();
        var service = CreateService(provider);
        await DrainAsync(service);
        var completion = await XpLedgerTestHelpers.SeedPendingCompletionAsync(seedDb);

        await using var connection = new NpgsqlConnection(_fixture.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using (var acquire = new NpgsqlCommand(
            "SELECT pg_advisory_lock(@key);", connection))
        {
            acquire.Parameters.AddWithValue(
                "key", XpReconciliationRunner.AdvisoryLockKey);
            await acquire.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        }

        try
        {
            var skipped = await service.ReconcilePassAsync(
                TestContext.Current.CancellationToken);
            Assert.False(skipped.AdvisoryLockAcquired);
            Assert.Equal(0, skipped.Awarded);
            Assert.Equal(0, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, completion.Id));
        }
        finally
        {
            await using var release = new NpgsqlCommand(
                "SELECT pg_advisory_unlock(@key);", connection);
            release.Parameters.AddWithValue(
                "key", XpReconciliationRunner.AdvisoryLockKey);
            await release.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        }

        var resumed = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);
        Assert.True(resumed.AdvisoryLockAcquired);
        Assert.Equal(1, resumed.Awarded);
        Assert.Equal(1, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, completion.Id));
    }

    private static async Task AssertExactAwardAsync(
        KiwimpactDbContext db,
        Kiwimpact.Core.Entities.QuestCompletion completion,
        int expectedAmount,
        Guid? expectedCommunityId)
    {
        var xp = await db.XpTransactions.SingleAsync(
            transaction => transaction.SourceCompletionId == completion.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal(expectedAmount, xp.XpAmount);
        Assert.Equal(
            completion.VerifiedAtUtc!.Value,
            xp.CreatedAt,
            TimeSpan.FromMicroseconds(1));
        Assert.Equal(expectedCommunityId, xp.CommunityRegionIdAtAward);
        Assert.Equal(completion.UserId, xp.UserId);
        Assert.Equal(completion.QuestId, xp.QuestId);

        var profile = await db.UserProfiles.SingleAsync(
            item => item.Id == completion.UserId,
            TestContext.Current.CancellationToken);
        Assert.Equal(expectedAmount, profile.TotalXp);
        Assert.Equal(
            Kiwimpact.Core.Progression.ProgressionRules.ComputeLevel(expectedAmount),
            profile.Level);
    }

    private ServiceProvider CreateProvider()
    {
        var collection = new ServiceCollection();
        collection.AddDbContext<KiwimpactDbContext>(options =>
            options.UseNpgsql(
                _fixture.ConnectionString,
                npgsql => npgsql.MigrationsAssembly(
                    typeof(KiwimpactDbContext).Assembly.FullName)));
        collection.AddScoped<IXpLedgerRepository, XpLedgerRepository>();
        collection.AddScoped<AchievementAwardService>();
        return collection.BuildServiceProvider();
    }

    private static XpReconciliationRunner CreateService(
        ServiceProvider provider,
        XpReconciliationOptions? options = null) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(options ?? new XpReconciliationOptions()),
            NullLogger<XpReconciliationRunner>.Instance);

    private static async Task DrainAsync(XpReconciliationRunner service)
    {
        // Reconcile any rows left pending by earlier tests in this shared
        // class database so per-test counters are exact.
        var result = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);
        Assert.True(result.AdvisoryLockAcquired);
        Assert.Equal(0, result.Unprocessable);
    }

    private static async Task InstallCountingTriggerAsync(
        KiwimpactDbContext db,
        IReadOnlyCollection<Guid> rejectedCompletionIds)
    {
        var idList = string.Join(", ", rejectedCompletionIds.Select(id => $"'{id}'"));
        await db.Database.ExecuteSqlRawAsync(
            "CREATE SEQUENCE IF NOT EXISTS xp_attempt_counter_for_test",
            TestContext.Current.CancellationToken);
        await db.Database.ExecuteSqlRawAsync(
            $"""
            CREATE OR REPLACE FUNCTION count_xp_attempt_for_test() RETURNS trigger AS $fn$
            BEGIN
                IF NEW."SourceCompletionId" IN ({idList}) THEN
                    PERFORM nextval('xp_attempt_counter_for_test');
                    RAISE EXCEPTION 'forced reconciliation failure for test';
                END IF;
                RETURN NEW;
            END;
            $fn$ LANGUAGE plpgsql
            """,
            TestContext.Current.CancellationToken);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TRIGGER xp_attempt_count_for_test
            BEFORE INSERT ON "XpTransactions"
            FOR EACH ROW EXECUTE FUNCTION count_xp_attempt_for_test()
            """,
            TestContext.Current.CancellationToken);
    }

    private static async Task DropCountingTriggerAsync(KiwimpactDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            DROP TRIGGER IF EXISTS xp_attempt_count_for_test ON "XpTransactions";
            DROP FUNCTION IF EXISTS count_xp_attempt_for_test();
            DROP SEQUENCE IF EXISTS xp_attempt_counter_for_test
            """,
            TestContext.Current.CancellationToken);
    }

    private static async Task<long> AttemptCountAsync(KiwimpactDbContext db)
    {
        // Sequences are non-transactional: every forced insert attempt bumps
        // the counter permanently even though the award rolls back.
        var state = await db.Database.SqlQuery<SequenceState>($"""
                SELECT last_value AS "LastValue", is_called AS "IsCalled"
                FROM xp_attempt_counter_for_test
                """)
            .SingleAsync(TestContext.Current.CancellationToken);
        return state.IsCalled ? state.LastValue : 0;
    }

    private sealed record SequenceState(long LastValue, bool IsCalled);

    private sealed class CapturingLogger<T> : ILogger<T>
    {
        public List<(LogLevel Level, string Message, Exception? Exception)> Entries { get; } = [];

        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Entries.Add((logLevel, formatter(state, exception), exception));
        }
    }
}
