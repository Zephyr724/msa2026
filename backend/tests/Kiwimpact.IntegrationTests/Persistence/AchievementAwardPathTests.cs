using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Reconciliation;
using Kiwimpact.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Persistence;

/// <summary>
/// Award behavior on the two XP-creation paths: live Completion Code
/// redemption and per-row XP reconciliation. Covers milestone thresholds,
/// single-transaction atomicity and rollback, forced-conflict
/// rollback-and-retry (M2), and award immutability against later backdated
/// ledger rows (M1), all on real PostgreSQL.
/// </summary>
public sealed class AchievementAwardPathTests : IClassFixture<TestDatabaseFixture>
{
    private static readonly DateTimeOffset BaseTime =
        new(2026, 7, 20, 0, 0, 0, TimeSpan.Zero);
    private readonly TestDatabaseFixture _fixture;

    public AchievementAwardPathTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task LiveRedemptionAwardsFirstThirdAndFifthMilestones()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await AchievementSeed.SeedAndValidateAsync(
            seedDb, TestContext.Current.CancellationToken);
        var graph = await SeedMultiQuestGraphAsync(seedDb, 5);

        // Redemption timestamps must lie inside the Completion Code validity
        // window (seeded around real now), so use increasing real-time
        // values — still deterministic in order.
        var redemptionBase = DateTimeOffset.UtcNow;
        var xpIds = new List<Guid>();
        for (var index = 0; index < 5; index++)
        {
            await RedeemAsync(
                graph.Quests[index].Id,
                graph.Actor.Id,
                redemptionBase.AddMinutes(index));

            seedDb.ChangeTracker.Clear();
            var xpCount = await seedDb.XpTransactions.CountAsync(
                transaction => transaction.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(index + 1, xpCount);
            var expectedAwards = (index + 1) switch
            {
                1 => 1,
                2 => 1,
                3 => 3,
                4 => 3,
                _ => 5,
            };
            Assert.Equal(expectedAwards, await CountAwardsAsync(seedDb, graph.Actor.Id));
        }

        var snapshot = await OrderedSnapshotAsync(seedDb, graph.Actor.Id);
        xpIds = snapshot.Select(row => row.Id).ToList();
        var awards = await seedDb.UserAchievements
            .AsNoTracking()
            .Where(award => award.UserId == graph.Actor.Id)
            .ToListAsync(TestContext.Current.CancellationToken);

        AssertMilestoneAward(
            awards, AchievementCatalog.FirstSteps.Id, snapshot[0]);
        AssertMilestoneAward(
            awards, AchievementCatalog.BuildingMomentum.Id, snapshot[2]);
        AssertMilestoneAward(
            awards, AchievementCatalog.CommittedContributor.Id, snapshot[4]);
        AssertMilestoneAward(
            awards,
            AchievementCatalog.FindByCode("restore-nature-3")!.Id,
            snapshot[2]);
        AssertMilestoneAward(
            awards,
            AchievementCatalog.FindByCode("level-5")!.Id,
            snapshot[4]);
        Assert.Equal(250, (await seedDb.UserProfiles.SingleAsync(
            profile => profile.Id == graph.Actor.Id,
            TestContext.Current.CancellationToken)).TotalXp);
    }

    [Fact]
    public async Task LegacyCommunitySourcedAutomaticAwardIsNotAwardedAgain()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb =
            seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await AchievementSeed.SeedAndValidateAsync(
            seedDb,
            TestContext.Current.CancellationToken);
        var graph = await SeedMultiQuestGraphAsync(seedDb, 1);
        var now = DateTimeOffset.UtcNow;
        var legacyChallenge = CommunityChallenge.Create(
            RegionSeed.WhauId,
            now.AddDays(1),
            now.AddDays(2),
            1,
            AchievementCatalog.FirstSteps.Id,
            now);
        seedDb.CommunityChallenges.Add(legacyChallenge);
        seedDb.UserAchievements.Add(
            UserAchievement.CreateFromCommunityChallenge(
                graph.Actor.Id,
                AchievementCatalog.FirstSteps.Id,
                legacyChallenge.Id,
                now));
        await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);

        await RedeemAsync(
            graph.Quests[0].Id,
            graph.Actor.Id,
            DateTimeOffset.UtcNow);

        seedDb.ChangeTracker.Clear();
        var awards = await seedDb.UserAchievements
            .AsNoTracking()
            .Where(item =>
                item.UserId == graph.Actor.Id &&
                item.AchievementId == AchievementCatalog.FirstSteps.Id)
            .ToListAsync(TestContext.Current.CancellationToken);
        var onlyAward = Assert.Single(awards);
        Assert.Equal(legacyChallenge.Id, onlyAward.SourceCommunityChallengeId);
        Assert.Null(onlyAward.XpTransactionId);
    }

    [Fact]
    public async Task RedemptionFailureRollsBackCompletionXpProgressionAndAwards()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await AchievementSeed.SeedAndValidateAsync(
            seedDb, TestContext.Current.CancellationToken);
        var graph = await SeedMultiQuestGraphAsync(seedDb, 1);

        await InstallXpRejectingTriggerAsync(seedDb, graph.Actor.Id);
        try
        {
            await Assert.ThrowsAsync<DbUpdateException>(() =>
                RedeemAsync(graph.Quests[0].Id, graph.Actor.Id, DateTimeOffset.UtcNow));

            Assert.Equal(0, await seedDb.QuestCompletions.CountAsync(
                item => item.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            Assert.Equal(0, await seedDb.XpTransactions.CountAsync(
                item => item.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            Assert.Equal(0, await CountAwardsAsync(seedDb, graph.Actor.Id));
            seedDb.ChangeTracker.Clear();
            var profile = await seedDb.UserProfiles.SingleAsync(
                item => item.Id == graph.Actor.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(0, profile.TotalXp);
            Assert.Equal(1, profile.Level);
        }
        finally
        {
            await DropXpRejectingTriggerAsync(seedDb);
        }
    }

    [Fact]
    public async Task ForcedAwardConflictRollsBackTheEntireRedemptionAndACleanRetrySucceeds()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await AchievementSeed.SeedAndValidateAsync(
            seedDb, TestContext.Current.CancellationToken);
        var graph = await SeedMultiQuestGraphAsync(seedDb, 1);

        await InstallAwardConflictTriggerAsync(seedDb);
        try
        {
            var exception = await Assert.ThrowsAsync<DbUpdateException>(() =>
                RedeemAsync(graph.Quests[0].Id, graph.Actor.Id, DateTimeOffset.UtcNow));
            var postgres = Assert.IsType<PostgresException>(exception.InnerException);
            Assert.Equal(PostgresErrorCodes.UniqueViolation, postgres.SqlState);
            Assert.Equal(
                "UX_UserAchievements_Milestone",
                postgres.ConstraintName);

            // The aborted transaction committed nothing: no completion, no
            // XP, no progression, no award — and it is never reported as
            // awarded.
            Assert.Equal(0, await seedDb.QuestCompletions.CountAsync(
                item => item.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            Assert.Equal(0, await seedDb.XpTransactions.CountAsync(
                item => item.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            Assert.Equal(0, await CountAwardsAsync(seedDb, graph.Actor.Id));
            seedDb.ChangeTracker.Clear();
            Assert.Equal(0, (await seedDb.UserProfiles.SingleAsync(
                item => item.Id == graph.Actor.Id,
                TestContext.Current.CancellationToken)).TotalXp);
        }
        finally
        {
            await DropAwardConflictTriggerAsync(seedDb);
        }

        await RedeemAsync(graph.Quests[0].Id, graph.Actor.Id, DateTimeOffset.UtcNow);
        Assert.Equal(1, await seedDb.XpTransactions.CountAsync(
            item => item.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken));
        Assert.Equal(1, await CountAwardsAsync(seedDb, graph.Actor.Id));
    }

    [Fact]
    public async Task ReconciliationAwardsMilestonesFromTheFlushedSnapshot()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await AchievementSeed.SeedAndValidateAsync(
            seedDb, TestContext.Current.CancellationToken);

        await using var provider = CreateXpProvider();
        var runner = CreateXpRunner(provider);
        await DrainXpAsync(runner);

        // One user, three pending completions with distinct verification
        // times: the reconciliation pass awards all three XP rows and the
        // first and third milestones plus the Restore Nature specialist.
        var graph = await SeedMultiQuestGraphAsync(seedDb, 3);
        for (var index = 0; index < 3; index++)
        {
            var completion = QuestCompletion.CreateVerifiedWithCode(
                graph.Actor.Id,
                graph.Quests[index],
                graph.Participations[index],
                null,
                BaseTime.AddMinutes(index));
            seedDb.QuestCompletions.Add(completion);
        }
        await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);

        var result = await runner.ReconcilePassAsync(TestContext.Current.CancellationToken);

        Assert.Equal(3, result.Awarded);
        Assert.Equal(0, result.Failed);
        Assert.Equal(3, await seedDb.XpTransactions.CountAsync(
            transaction => transaction.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken));
        Assert.Equal(3, await CountAwardsAsync(seedDb, graph.Actor.Id));
        var snapshot = await OrderedSnapshotAsync(seedDb, graph.Actor.Id);
        var awards = await seedDb.UserAchievements
            .AsNoTracking()
            .Where(award => award.UserId == graph.Actor.Id)
            .ToListAsync(TestContext.Current.CancellationToken);
        AssertMilestoneAward(awards, AchievementCatalog.FirstSteps.Id, snapshot[0]);
        AssertMilestoneAward(awards, AchievementCatalog.BuildingMomentum.Id, snapshot[2]);
        AssertMilestoneAward(
            awards,
            AchievementCatalog.FindByCode("restore-nature-3")!.Id,
            snapshot[2]);
    }

    [Fact]
    public async Task ForcedAwardConflictRollsBackTheReconciliationRowAndHealsNextPass()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await AchievementSeed.SeedAndValidateAsync(
            seedDb, TestContext.Current.CancellationToken);

        await using var provider = CreateXpProvider();
        var runner = CreateXpRunner(provider);
        await DrainXpAsync(runner);
        var pending = await XpLedgerTestHelpers.SeedPendingCompletionAsync(seedDb);

        await InstallAwardConflictTriggerAsync(seedDb);
        try
        {
            var first = await runner.ReconcilePassAsync(TestContext.Current.CancellationToken);

            // The per-row transaction rolled back: no XP row, no award, the
            // row is counted failed — never awarded or already awarded.
            Assert.Equal(1, first.Failed);
            Assert.Equal(0, first.Awarded);
            Assert.Equal(0, first.AlreadyAwarded);
            Assert.False(first.PassComplete);
            Assert.Equal(0, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, pending.Id));
            Assert.Equal(0, await CountAwardsAsync(seedDb, pending.UserId));
        }
        finally
        {
            await DropAwardConflictTriggerAsync(seedDb);
        }

        var healed = await runner.ReconcilePassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, healed.Awarded);
        Assert.Equal(0, healed.Failed);
        Assert.Equal(1, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, pending.Id));
        Assert.Equal(1, await CountAwardsAsync(seedDb, pending.UserId));
    }

    [Fact]
    public async Task LaterBackdatedReconciliationDoesNotRewriteAnExistingAward()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await AchievementSeed.SeedAndValidateAsync(
            seedDb, TestContext.Current.CancellationToken);

        // Live award first at real now (inside the code validity window).
        var graph = await SeedMultiQuestGraphAsync(seedDb, 2);
        var liveTime = DateTimeOffset.UtcNow;
        await RedeemAsync(graph.Quests[0].Id, graph.Actor.Id, liveTime);
        var liveXp = await seedDb.XpTransactions.SingleAsync(
            transaction => transaction.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken);
        var awardBefore = await seedDb.UserAchievements
            .AsNoTracking()
            .SingleAsync(
                award =>
                    award.UserId == graph.Actor.Id &&
                    award.AchievementId == AchievementCatalog.FirstSteps.Id,
                TestContext.Current.CancellationToken);
        Assert.Equal(liveXp.Id, awardBefore.XpTransactionId);

        await using var provider = CreateXpProvider();
        var runner = CreateXpRunner(provider);
        await DrainXpAsync(runner);

        // A backdated completion (verified before the live award) is
        // reconciled later: the ledger gains an earlier-dated row, but the
        // committed award record is immutable.
        // Anchor the historical row to the live redemption so the two facts
        // always occupy consecutive Auckland calendar weeks. A fixed calendar
        // date eventually leaves a gap as real time advances.
        var backdatedTime = liveTime.AddDays(-7);
        var backdated = QuestCompletion.CreateVerifiedWithCode(
            graph.Actor.Id,
            graph.Quests[1],
            graph.Participations[1],
            null,
            backdatedTime);
        seedDb.QuestCompletions.Add(backdated);
        await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);

        var result = await runner.ReconcilePassAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, result.Awarded);

        seedDb.ChangeTracker.Clear();
        var awardAfter = await seedDb.UserAchievements.SingleAsync(
            award =>
                award.UserId == graph.Actor.Id &&
                award.AchievementId == AchievementCatalog.FirstSteps.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal(awardBefore.Id, awardAfter.Id);
        Assert.Equal(liveXp.Id, awardAfter.XpTransactionId);
        Assert.Equal(
            awardBefore.AwardedAt,
            awardAfter.AwardedAt,
            TimeSpan.FromMicroseconds(1));
        // The first milestone stays immutable. Historical reevaluation also
        // observes the two Auckland calendar weeks and awards the 2-week
        // streak from the later week.
        Assert.Equal(2, await seedDb.XpTransactions.CountAsync(
            transaction => transaction.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken));
        Assert.Equal(2, await CountAwardsAsync(seedDb, graph.Actor.Id));
        var streak = await seedDb.UserAchievements.SingleAsync(
            award =>
                award.UserId == graph.Actor.Id &&
                award.AchievementId ==
                    AchievementCatalog.FindByCode("weekly-streak-2")!.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal(liveXp.Id, streak.XpTransactionId);
    }

    private static void AssertMilestoneAward(
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

    private async Task RedeemAsync(Guid questId, Guid actorId, DateTimeOffset now)
    {
        await using var provider = _fixture.CreateServiceProvider();
        await using var scope = provider.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var repository = XpLedgerTestHelpers.NewQuestCompletionRepository(db);
        await repository.RedeemAsync(
            questId,
            actorId,
            XpLedgerTestHelpers.DisplayCode,
            now,
            TestContext.Current.CancellationToken);
    }

    private static async Task<int> CountAwardsAsync(KiwimpactDbContext db, Guid userId) =>
        await db.UserAchievements.CountAsync(
            award => award.UserId == userId,
            TestContext.Current.CancellationToken);

    private static async Task<List<XpTransaction>> OrderedSnapshotAsync(
        KiwimpactDbContext db,
        Guid userId) =>
        await db.XpTransactions
            .AsNoTracking()
            .Where(transaction => transaction.UserId == userId)
            .OrderBy(transaction => transaction.CreatedAt)
            .ThenBy(transaction => transaction.Id)
            .ToListAsync(TestContext.Current.CancellationToken);

    private static async Task<MultiQuestGraph> SeedMultiQuestGraphAsync(
        KiwimpactDbContext db,
        int questCount)
    {
        var creator = XpLedgerTestHelpers.NewUser("ach-path-creator");
        var actor = XpLedgerTestHelpers.NewUser("ach-path-actor");
        var profile = XpLedgerTestHelpers.NewProfile(actor.Id);
        db.Set<ApplicationUser>().AddRange(creator, actor);
        db.UserProfiles.Add(profile);
        var quests = new List<Quest>();
        var participations = new List<QuestParticipation>();
        for (var index = 0; index < questCount; index++)
        {
            var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
            var participation = QuestParticipation.CreateActive(
                actor.Id, quest.Id, DateTimeOffset.UtcNow.AddHours(-1));
            var code = XpLedgerTestHelpers.NewActiveCode(quest, creator.Id);
            db.Quests.Add(quest);
            db.QuestParticipations.Add(participation);
            db.CompletionCodes.Add(code);
            quests.Add(quest);
            participations.Add(participation);
        }
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return new MultiQuestGraph(actor, profile, quests, participations);
    }

    private sealed record MultiQuestGraph(
        ApplicationUser Actor,
        UserProfile Profile,
        IReadOnlyList<Quest> Quests,
        IReadOnlyList<QuestParticipation> Participations);

    private ServiceProvider CreateXpProvider()
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

    private static XpReconciliationRunner CreateXpRunner(ServiceProvider provider) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new XpReconciliationOptions()),
            NullLogger<XpReconciliationRunner>.Instance);

    private static async Task DrainXpAsync(XpReconciliationRunner runner)
    {
        // Reconcile any rows left pending by earlier tests in this shared
        // class database so per-test counters are exact.
        var result = await runner.ReconcilePassAsync(TestContext.Current.CancellationToken);
        Assert.True(result.AdvisoryLockAcquired);
    }

    private static async Task InstallXpRejectingTriggerAsync(
        KiwimpactDbContext db,
        Guid rejectedUserId)
    {
        await db.Database.ExecuteSqlRawAsync(
            $"""
            CREATE OR REPLACE FUNCTION reject_xp_insert_for_ach_test() RETURNS trigger AS $fn$
            BEGIN
                IF NEW."UserId" = '{rejectedUserId}' THEN
                    RAISE EXCEPTION 'forced XP insert failure for achievement test';
                END IF;
                RETURN NEW;
            END;
            $fn$ LANGUAGE plpgsql
            """,
            TestContext.Current.CancellationToken);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TRIGGER xp_insert_reject_for_ach_test
            BEFORE INSERT ON "XpTransactions"
            FOR EACH ROW EXECUTE FUNCTION reject_xp_insert_for_ach_test()
            """,
            TestContext.Current.CancellationToken);
    }

    private static async Task DropXpRejectingTriggerAsync(KiwimpactDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            DROP TRIGGER IF EXISTS xp_insert_reject_for_ach_test ON "XpTransactions";
            DROP FUNCTION IF EXISTS reject_xp_insert_for_ach_test()
            """,
            TestContext.Current.CancellationToken);
    }

    /// <summary>
    /// Forces an unexpected UserAchievement unique violation: the trigger
    /// inserts a conflicting row inside the statement so the statement's own
    /// insert fails with 23505 on the approved unique index. The
    /// pg_trigger_depth guard prevents recursive self-firing; the conflicting
    /// row never survives the surrounding rollback.
    /// </summary>
    private static async Task InstallAwardConflictTriggerAsync(KiwimpactDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE OR REPLACE FUNCTION force_ua_conflict_for_test() RETURNS trigger AS $fn$
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
            CREATE TRIGGER ua_conflict_for_test
            BEFORE INSERT ON "UserAchievements"
            FOR EACH ROW EXECUTE FUNCTION force_ua_conflict_for_test()
            """,
            TestContext.Current.CancellationToken);
    }

    private static async Task DropAwardConflictTriggerAsync(KiwimpactDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            DROP TRIGGER IF EXISTS ua_conflict_for_test ON "UserAchievements";
            DROP FUNCTION IF EXISTS force_ua_conflict_for_test()
            """,
            TestContext.Current.CancellationToken);
    }
}
