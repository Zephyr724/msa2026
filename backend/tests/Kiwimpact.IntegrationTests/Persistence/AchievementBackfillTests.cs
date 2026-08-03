using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Reconciliation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Persistence;

/// <summary>
/// Historical achievement backfill tests on real PostgreSQL: boundary-count
/// awards, deterministic triggers, strict no-op repetition, advisory-lock
/// skip, forced-conflict rollback and healing, failure accounting, circuit
/// breaker, and bounded logging.
/// </summary>
public sealed class AchievementBackfillTests : IClassFixture<TestDatabaseFixture>
{
    private static readonly DateTimeOffset BaseTime =
        new(2026, 7, 10, 0, 0, 0, TimeSpan.Zero);
    private readonly TestDatabaseFixture _fixture;

    public AchievementBackfillTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task BackfillAwardsExactlyTheEarnedMilestonesAtEveryBoundaryCount()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await using var provider = CreateProvider();
        var runner = CreateRunner(provider);
        await DrainAsync(runner);

        var counts = new[] { 0, 1, 2, 3, 4, 6 };
        var users = new List<Guid>();
        foreach (var count in counts)
            users.Add(await SeedLegacyUserAsync(seedDb, count, $"ach-bf-{count}"));

        var result = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);

        Assert.True(result.AdvisoryLockAcquired);
        Assert.Equal(6, result.Scanned);
        Assert.Equal(5, result.Awarded);
        Assert.Equal(1, result.AlreadyAwarded);
        Assert.Equal(0, result.Failed);
        Assert.True(result.PassComplete);

        var expectedAwards = new[] { 0, 1, 1, 3, 3, 5 };
        for (var index = 0; index < users.Count; index++)
        {
            Assert.Equal(expectedAwards[index], await CountAwardsAsync(seedDb, users[index]));
        }

        // The 6-row user: triggers are the 1st, 3rd, and 5th snapshot rows
        // and AwardedAt equals each trigger's CreatedAt.
        var snapshot = await OrderedSnapshotAsync(seedDb, users[5]);
        var awards = await AwardsAsync(seedDb, users[5]);
        AssertAward(awards, AchievementCatalog.FirstSteps.Id, snapshot[0]);
        AssertAward(awards, AchievementCatalog.BuildingMomentum.Id, snapshot[2]);
        AssertAward(awards, AchievementCatalog.CommittedContributor.Id, snapshot[4]);
        AssertAward(
            awards,
            AchievementCatalog.FindByCode("restore-nature-3")!.Id,
            snapshot[2]);
        AssertAward(
            awards,
            AchievementCatalog.FindByCode("level-5")!.Id,
            snapshot[4]);
    }

    [Fact]
    public async Task RepeatedPassIsAStrictNoOp()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await using var provider = CreateProvider();
        var runner = CreateRunner(provider);
        await DrainAsync(runner);
        var userId = await SeedLegacyUserAsync(seedDb, 3, "ach-bf-noop");

        var first = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, first.Awarded);
        var awardCount = await CountAwardsAsync(seedDb, userId);
        Assert.Equal(3, awardCount);

        var second = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(0, second.Scanned);
        Assert.Equal(0, second.Awarded);
        Assert.Equal(0, second.AlreadyAwarded);
        Assert.Equal(0, second.Failed);
        Assert.True(second.PassComplete);
        Assert.Equal(awardCount, await CountAwardsAsync(seedDb, userId));
    }

    [Fact]
    public async Task CandidateDiscoveryFiltersFullyAwardedUsersBeforeApplyingBatchLimit()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await using var provider = CreateProvider();
        var runner = CreateRunner(provider, new AchievementBackfillOptions
        {
            BatchSize = 2,
        });
        await DrainAsync(runner);

        var fullyAwardedIds = new[]
        {
            Guid.Parse("00000000-0000-0000-0000-000000000101"),
            Guid.Parse("00000000-0000-0000-0000-000000000102"),
            Guid.Parse("00000000-0000-0000-0000-000000000103"),
        };
        foreach (var userId in fullyAwardedIds)
        {
            await SeedLegacyUserAsync(
                seedDb,
                1,
                $"ach-bf-filtered-{userId:N}",
                actorId: userId);
        }

        var initial = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(fullyAwardedIds.Length, initial.Awarded);

        var missingUserId = Guid.Parse("00000000-0000-0000-0000-000000000200");
        await SeedLegacyUserAsync(
            seedDb,
            1,
            "ach-bf-filtered-missing",
            actorId: missingUserId);

        await using var queryScope = provider.CreateAsyncScope();
        var service = queryScope.ServiceProvider
            .GetRequiredService<AchievementAwardService>();
        var scan = await service.FindBackfillCandidatesAsync(
            2,
            Array.Empty<Guid>(),
            TestContext.Current.CancellationToken);

        Assert.Equal([missingUserId], scan.ScannedUserIds);
        Assert.Equal([missingUserId], scan.EligibleUserIds);
        foreach (var fullyAwardedId in fullyAwardedIds)
            Assert.DoesNotContain(fullyAwardedId, scan.ScannedUserIds);

        var completed = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, completed.Awarded);
    }

    [Fact]
    public async Task ExternallyHeldAdvisoryLockSkipsThePassWithoutAwarding()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await using var provider = CreateProvider();
        var runner = CreateRunner(provider);
        await DrainAsync(runner);
        var userId = await SeedLegacyUserAsync(seedDb, 1, "ach-bf-lock");

        await using var connection = new NpgsqlConnection(_fixture.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using (var acquire = new NpgsqlCommand(
            "SELECT pg_advisory_lock(@key);", connection))
        {
            acquire.Parameters.AddWithValue(
                "key", AchievementBackfillRunner.AdvisoryLockKey);
            await acquire.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        }

        try
        {
            var skipped = await runner.BackfillPassAsync(
                TestContext.Current.CancellationToken);
            Assert.False(skipped.AdvisoryLockAcquired);
            Assert.Equal(0, skipped.Awarded);
            Assert.Equal(0, await CountAwardsAsync(seedDb, userId));
        }
        finally
        {
            await using var release = new NpgsqlCommand(
                "SELECT pg_advisory_unlock(@key);", connection);
            release.Parameters.AddWithValue(
                "key", AchievementBackfillRunner.AdvisoryLockKey);
            await release.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        }

        var resumed = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);
        Assert.True(resumed.AdvisoryLockAcquired);
        Assert.Equal(1, resumed.Awarded);
        Assert.Equal(1, await CountAwardsAsync(seedDb, userId));
    }

    [Fact]
    public async Task ForcedConflictRollsBackTheUserCountsItFailedAndHealsNextPass()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await using var provider = CreateProvider();
        var runner = CreateRunner(provider);
        await DrainAsync(runner);
        var userId = await SeedLegacyUserAsync(seedDb, 3, "ach-bf-conflict");

        await InstallAwardConflictTriggerAsync(seedDb);
        try
        {
            var first = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);

            // The user transaction rolled back: no awards persisted, the
            // user is counted failed — never awarded or already awarded.
            Assert.Equal(1, first.Failed);
            Assert.Equal(0, first.Awarded);
            Assert.Equal(0, first.AlreadyAwarded);
            Assert.False(first.PassComplete);
            Assert.Equal(0, await CountAwardsAsync(seedDb, userId));
        }
        finally
        {
            await DropAwardConflictTriggerAsync(seedDb);
        }

        var healed = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, healed.Awarded);
        Assert.Equal(0, healed.Failed);
        Assert.Equal(3, await CountAwardsAsync(seedDb, userId));
    }

    [Fact]
    public async Task UserWithXpButNoProfileIsCountedFailedAndNeverAwarded()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await using var provider = CreateProvider();
        var runner = CreateRunner(provider);
        await DrainAsync(runner);
        var userId = await SeedLegacyUserAsync(
            seedDb, 1, "ach-bf-noprofile", withProfile: false);

        try
        {
            var result = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);

            Assert.Equal(0, result.Failed);
            Assert.Equal(0, result.Scanned);
            Assert.Equal(0, result.Awarded);
            Assert.True(result.PassComplete);
            Assert.Equal(0, await CountAwardsAsync(seedDb, userId));
        }
        finally
        {
            await DeleteLegacyUserDataAsync(seedDb, userId);
        }
    }

    [Fact]
    public async Task CircuitBreakerAbortsThePassAtTheConsecutiveFailureThreshold()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await using var provider = CreateProvider();
        var runner = CreateRunner(provider, new AchievementBackfillOptions
        {
            MaxConsecutiveRowFailures = 2,
        });
        await DrainAsync(runner);
        var breakerUsers = new List<Guid>();
        for (var index = 0; index < 3; index++)
        {
            breakerUsers.Add(await SeedLegacyUserAsync(
                seedDb, 1, $"ach-bf-breaker-{index}"));
        }

        await InstallAwardConflictTriggerAsync(seedDb);
        try
        {
            var result = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);

            Assert.True(result.Aborted);
            Assert.Equal(2, result.Failed);
            Assert.Equal(2, result.Scanned);
            Assert.False(result.PassComplete);
            foreach (var userId in breakerUsers)
                Assert.Equal(0, await CountAwardsAsync(seedDb, userId));
        }
        finally
        {
            await DropAwardConflictTriggerAsync(seedDb);
            await DeleteLegacyUserDataAsync(seedDb, breakerUsers.ToArray());
        }
    }

    [Fact]
    public async Task EqualTimestampLedgerRowsAreTieBrokenById()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await using var provider = CreateProvider();
        var runner = CreateRunner(provider);
        await DrainAsync(runner);

        // Two completions verified at the same instant -> two ledger rows
        // with identical CreatedAt; the (CreatedAt, Id) order is total.
        var sameInstant = BaseTime.AddDays(1);
        var creator = XpLedgerTestHelpers.NewUser("ach-bf-tie-creator");
        var actor = XpLedgerTestHelpers.NewUser("ach-bf-tie-actor");
        seedDb.Set<ApplicationUser>().AddRange(creator, actor);
        seedDb.UserProfiles.Add(XpLedgerTestHelpers.NewProfile(actor.Id));
        for (var index = 0; index < 2; index++)
        {
            var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
            var participation = QuestParticipation.CreateActive(
                actor.Id, quest.Id, sameInstant.AddHours(-1));
            var completion = QuestCompletion.CreateVerifiedWithCode(
                actor.Id, quest, participation, null, sameInstant);
            seedDb.Quests.Add(quest);
            seedDb.QuestParticipations.Add(participation);
            seedDb.QuestCompletions.Add(completion);
        }
        await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);
        await XpLedgerTestHelpers.MarkAchievementEvaluationStaleAsync(
            seedDb,
            actor.Id);
        var completions = await seedDb.QuestCompletions
            .Where(completion => completion.UserId == actor.Id)
            .ToListAsync(TestContext.Current.CancellationToken);
        foreach (var completion in completions)
        {
            await seedDb.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "XpTransactions"
                    ("Id", "UserId", "QuestId", "SourceCompletionId", "XpAmount",
                     "CommunityRegionIdAtAward", "CreatedAt")
                VALUES
                    ({Guid.NewGuid()}, {completion.UserId}, {completion.QuestId},
                     {completion.Id}, {50}, NULL, {sameInstant})
                """, TestContext.Current.CancellationToken);
        }

        var result = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, result.Awarded);

        var snapshot = await OrderedSnapshotAsync(seedDb, actor.Id);
        Assert.Equal(2, snapshot.Count);
        Assert.Equal(
            snapshot[0].CreatedAt,
            snapshot[1].CreatedAt,
            TimeSpan.FromMicroseconds(1));
        Assert.True(snapshot[0].Id.CompareTo(snapshot[1].Id) < 0);
        var awards = await AwardsAsync(seedDb, actor.Id);
        AssertAward(awards, AchievementCatalog.FirstSteps.Id, snapshot[0]);
    }

    [Fact]
    public async Task RewardPendingCompletionWithoutXpRowEarnsNothing()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await using var provider = CreateProvider();
        var runner = CreateRunner(provider);
        await DrainAsync(runner);

        // A Verified completion with no XP row is reward-pending: outside
        // every achievement boundary.
        var pending = await XpLedgerTestHelpers.SeedPendingCompletionAsync(seedDb);

        var result = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);

        Assert.Equal(0, result.Scanned);
        Assert.Equal(0, result.Awarded);
        Assert.True(result.PassComplete);
        Assert.Equal(0, await CountAwardsAsync(seedDb, pending.UserId));
    }

    [Fact]
    public async Task FailureLogsAboveDebugContainOnlyCountsAndExceptionTypes()
    {
        await using var provider = CreateProvider();
        var drainRunner = CreateRunner(provider);
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        await DrainAsync(drainRunner);
        var userId = await SeedLegacyUserAsync(
            seedDb, 1, "ach-bf-log");

        await InstallAwardConflictTriggerAsync(seedDb);
        try
        {
            var logger = new CapturingLogger<AchievementBackfillRunner>();
            var runner = new AchievementBackfillRunner(
                provider.GetRequiredService<IServiceScopeFactory>(),
                Options.Create(new AchievementBackfillOptions()),
                logger);

            var result = await runner.BackfillPassCoreAsync(TestContext.Current.CancellationToken);
            Assert.Equal(1, result.Failed);

            var aboveDebug = logger.Entries
                .Where(entry => entry.Level > LogLevel.Debug)
                .ToList();
            Assert.NotEmpty(aboveDebug);
            Assert.Contains(
                aboveDebug,
                entry =>
                    entry.Level == LogLevel.Warning &&
                    entry.Message.Contains("DbUpdateException", StringComparison.Ordinal));
            foreach (var entry in aboveDebug)
            {
                Assert.Null(entry.Exception);
                Assert.DoesNotContain(
                    userId.ToString("D"),
                    entry.Message,
                    StringComparison.OrdinalIgnoreCase);
            }
            Assert.Contains(
                logger.Entries,
                entry =>
                    entry.Level == LogLevel.Debug &&
                    entry.Message.Contains(userId.ToString("D"), StringComparison.Ordinal));
        }
        finally
        {
            await DropAwardConflictTriggerAsync(seedDb);
            await DeleteLegacyUserDataAsync(seedDb, userId);
        }
    }


    private static async Task DeleteLegacyUserDataAsync(
        KiwimpactDbContext db,
        params Guid[] userIds)
    {
        // Shared class database: permanently failing users would otherwise
        // keep polluting candidate discovery and pass counters of later
        // tests.
        foreach (var userId in userIds)
        {
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"XpTransactions\" WHERE \"UserId\" = {userId}",
                TestContext.Current.CancellationToken);
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"QuestCompletions\" WHERE \"UserId\" = {userId}",
                TestContext.Current.CancellationToken);
        }
    }

    private static async Task SeedCatalogAsync(KiwimpactDbContext db) =>
        await AchievementSeed.SeedAndValidateAsync(
            db, TestContext.Current.CancellationToken);

    private static async Task<int> CountAwardsAsync(KiwimpactDbContext db, Guid userId) =>
        await db.UserAchievements.CountAsync(
            award => award.UserId == userId,
            TestContext.Current.CancellationToken);

    private static async Task<List<UserAchievement>> AwardsAsync(
        KiwimpactDbContext db,
        Guid userId) =>
        await db.UserAchievements
            .AsNoTracking()
            .Where(award => award.UserId == userId)
            .ToListAsync(TestContext.Current.CancellationToken);

    private static async Task<List<XpTransaction>> OrderedSnapshotAsync(
        KiwimpactDbContext db,
        Guid userId) =>
        await db.XpTransactions
            .AsNoTracking()
            .Where(transaction => transaction.UserId == userId)
            .OrderBy(transaction => transaction.CreatedAt)
            .ThenBy(transaction => transaction.Id)
            .ToListAsync(TestContext.Current.CancellationToken);

    private static void AssertAward(
        IReadOnlyCollection<UserAchievement> awards,
        Guid achievementId,
        XpTransaction expectedTrigger)
    {
        var award = Assert.Single(
            awards,
            candidate => candidate.AchievementId == achievementId);
        Assert.Equal(expectedTrigger.Id, award.XpTransactionId);
        Assert.Equal(
            expectedTrigger.CreatedAt,
            award.AwardedAt,
            TimeSpan.FromMicroseconds(1));
    }

    /// <summary>
    /// Seeds one legacy (pre-6A) user holding <paramref name="xpCount"/>
    /// verified completions with raw-inserted XP rows and no achievement
    /// awards — the exact backfill input shape.
    /// </summary>
    private static async Task<Guid> SeedLegacyUserAsync(
        KiwimpactDbContext db,
        int xpCount,
        string prefix,
        bool withProfile = true,
        Guid? actorId = null)
    {
        var creator = XpLedgerTestHelpers.NewUser($"{prefix}-creator");
        var actor = XpLedgerTestHelpers.NewUser($"{prefix}-actor");
        if (actorId.HasValue)
            actor.Id = actorId.Value;
        db.Set<ApplicationUser>().AddRange(creator, actor);
        if (withProfile)
            db.UserProfiles.Add(XpLedgerTestHelpers.NewProfile(actor.Id));
        for (var index = 0; index < xpCount; index++)
        {
            var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
            var participation = QuestParticipation.CreateActive(
                actor.Id, quest.Id, BaseTime.AddHours(-1));
            var completion = QuestCompletion.CreateVerifiedWithCode(
                actor.Id, quest, participation, null, BaseTime.AddMinutes(index * 10));
            db.Quests.Add(quest);
            db.QuestParticipations.Add(participation);
            db.QuestCompletions.Add(completion);
        }
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        var completions = await db.QuestCompletions
            .Where(completion => completion.UserId == actor.Id)
            .ToListAsync(TestContext.Current.CancellationToken);
        foreach (var completion in completions)
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "XpTransactions"
                    ("Id", "UserId", "QuestId", "SourceCompletionId", "XpAmount",
                     "CommunityRegionIdAtAward", "CreatedAt")
                VALUES
                    ({Guid.NewGuid()}, {completion.UserId}, {completion.QuestId},
                     {completion.Id}, {50}, NULL, {completion.VerifiedAtUtc!.Value})
                """, TestContext.Current.CancellationToken);
        }
        if (withProfile)
        {
            await XpLedgerTestHelpers.MarkAchievementEvaluationStaleAsync(
                db,
                actor.Id);
        }
        return actor.Id;
    }

    private ServiceProvider CreateProvider()
    {
        var collection = new ServiceCollection();
        collection.AddDbContext<KiwimpactDbContext>(options =>
            options.UseNpgsql(
                _fixture.ConnectionString,
                npgsql => npgsql.MigrationsAssembly(
                    typeof(KiwimpactDbContext).Assembly.FullName)));
        collection.AddScoped<AchievementAwardService>();
        return collection.BuildServiceProvider();
    }

    private static AchievementBackfillRunner CreateRunner(
        ServiceProvider provider,
        AchievementBackfillOptions? options = null) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(options ?? new AchievementBackfillOptions()),
            NullLogger<AchievementBackfillRunner>.Instance);

    private static async Task DrainAsync(AchievementBackfillRunner runner)
    {
        // Award anything left pending by earlier tests in this shared class
        // database so per-test counters are exact.
        var result = await runner.BackfillPassAsync(TestContext.Current.CancellationToken);
        Assert.True(result.AdvisoryLockAcquired);
    }

    private static async Task InstallAwardConflictTriggerAsync(KiwimpactDbContext db)
    {
        // The pg_trigger_depth guard prevents recursive self-firing.
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE OR REPLACE FUNCTION force_ua_conflict_for_bf_test() RETURNS trigger AS $fn$
            BEGIN
                IF pg_trigger_depth() = 1 THEN
                    INSERT INTO "UserAchievements"
                        ("Id", "UserId", "AchievementId", "AwardedAt", "XpTransactionId")
                    VALUES
                        (gen_random_uuid(), NEW."UserId", NEW."AchievementId",
                         NEW."AwardedAt", NEW."XpTransactionId");
                END IF;
                RETURN NEW;
            END;
            $fn$ LANGUAGE plpgsql
            """,
            TestContext.Current.CancellationToken);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TRIGGER ua_conflict_for_bf_test
            BEFORE INSERT ON "UserAchievements"
            FOR EACH ROW EXECUTE FUNCTION force_ua_conflict_for_bf_test()
            """,
            TestContext.Current.CancellationToken);
    }

    private static async Task DropAwardConflictTriggerAsync(KiwimpactDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            DROP TRIGGER IF EXISTS ua_conflict_for_bf_test ON "UserAchievements";
            DROP FUNCTION IF EXISTS force_ua_conflict_for_bf_test()
            """,
            TestContext.Current.CancellationToken);
    }

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
