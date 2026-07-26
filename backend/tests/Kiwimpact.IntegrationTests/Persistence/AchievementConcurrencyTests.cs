using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Reconciliation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Persistence;

/// <summary>
/// Deterministic real-overlap concurrency tests for the achievement award
/// core. Overlap is forced with externally held FOR UPDATE row locks and
/// pg_stat_activity blocked-session observation — never timing sleeps.
/// </summary>
public sealed class AchievementConcurrencyTests : IClassFixture<TestDatabaseFixture>
{
    private static readonly TimeSpan BlockTimeout = TimeSpan.FromSeconds(15);
    private readonly TestDatabaseFixture _fixture;

    public AchievementConcurrencyTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task SameUserConcurrentLiveAwardsAttachTheMilestoneExactlyOnce()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        var graph = await SeedTwoQuestGraphAsync(seedDb);

        var (connection, transaction) = await HoldProfileLockAsync(graph.Actor.Id);
        try
        {
            var first = RedeemAsync(
                graph.EasyQuest.Id, graph.Actor.Id, DateTimeOffset.UtcNow.AddSeconds(-1));
            var second = RedeemAsync(
                graph.HardQuest.Id, graph.Actor.Id, DateTimeOffset.UtcNow);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "UserProfiles",
                    2,
                    BlockTimeout),
                "Both redemptions did not reach the profile lock.");

            await transaction.CommitAsync(TestContext.Current.CancellationToken);
            await Task.WhenAll(first, second)
                .WaitAsync(BlockTimeout, TestContext.Current.CancellationToken);

            seedDb.ChangeTracker.Clear();
            Assert.Equal(2, await seedDb.XpTransactions.CountAsync(
                row => row.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            // The profile lock serializes both evaluations, so the lock
            // winner creates milestone 1 from its one-row creation snapshot.
            // The other redemption may carry an earlier CreatedAt but commits
            // later; immutable award semantics must not rewrite the trigger.
            var awards = await seedDb.UserAchievements
                .AsNoTracking()
                .Where(award => award.UserId == graph.Actor.Id)
                .ToListAsync(TestContext.Current.CancellationToken);
            var award = Assert.Single(awards);
            Assert.Equal(
                Kiwimpact.Core.Achievements.AchievementCatalog.FirstSteps.Id,
                award.AchievementId);
            var snapshot = await OrderedSnapshotAsync(seedDb, graph.Actor.Id);
            var trigger = Assert.Single(
                snapshot,
                transaction => transaction.Id == award.XpTransactionId);
            Assert.Equal(
                trigger.CreatedAt,
                award.AwardedAt,
                TimeSpan.FromMicroseconds(1));
        }
        finally
        {
            await transaction.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    [Fact]
    public async Task LiveRedemptionVsBackfillSerializesOnTheProfileLock()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);

        // User with two legacy XP rows (no awards) on two completed quests,
        // and a third quest ready for live redemption.
        var graph = await SeedTwoQuestGraphAsync(seedDb);
        var backfillUser = graph.Actor.Id;
        var legacyQuest = XpLedgerTestHelpers.NewQuest(
            graph.EasyQuest.CreatedByUserId, QuestDifficulty.Easy);
        var legacyParticipation = QuestParticipation.CreateActive(
            graph.Actor.Id, legacyQuest.Id, DateTimeOffset.UtcNow.AddDays(-3));
        seedDb.Quests.Add(legacyQuest);
        seedDb.QuestParticipations.Add(legacyParticipation);
        var firstInstant = DateTimeOffset.UtcNow.AddDays(-2);
        var secondInstant = DateTimeOffset.UtcNow.AddDays(-1);
        var firstCompletion = QuestCompletion.CreateVerifiedWithCode(
            graph.Actor.Id,
            graph.EasyQuest,
            graph.EasyParticipation,
            null,
            firstInstant);
        var secondCompletion = QuestCompletion.CreateVerifiedWithCode(
            graph.Actor.Id,
            legacyQuest,
            legacyParticipation,
            null,
            secondInstant);
        seedDb.QuestCompletions.AddRange(firstCompletion, secondCompletion);
        await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);
        foreach (var completion in new[] { firstCompletion, secondCompletion })
        {
            await seedDb.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "XpTransactions"
                    ("Id", "UserId", "QuestId", "SourceCompletionId", "XpAmount",
                     "CommunityRegionIdAtAward", "CreatedAt")
                VALUES
                    ({Guid.NewGuid()}, {completion.UserId}, {completion.QuestId},
                     {completion.Id}, {50}, NULL, {completion.VerifiedAtUtc!.Value})
                """, TestContext.Current.CancellationToken);
        }

        await using var provider = CreateProvider();
        var runner = CreateRunner(provider);

        var (connection, transaction) = await HoldProfileLockAsync(backfillUser);
        try
        {
            var pass = runner.BackfillPassCoreAsync(TestContext.Current.CancellationToken);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "UserProfiles",
                    1,
                    BlockTimeout),
                "The backfill did not reach the profile lock.");

            var redemption = RedeemAsync(
                graph.HardQuest.Id, graph.Actor.Id, DateTimeOffset.UtcNow);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "UserProfiles",
                    2,
                    BlockTimeout),
                "The redemption did not reach the profile lock.");

            await transaction.CommitAsync(TestContext.Current.CancellationToken);
            var result = await pass.WaitAsync(
                BlockTimeout, TestContext.Current.CancellationToken);
            await redemption.WaitAsync(BlockTimeout, TestContext.Current.CancellationToken);

            Assert.Equal(0, result.Failed);
            seedDb.ChangeTracker.Clear();
            Assert.Equal(3, await seedDb.XpTransactions.CountAsync(
                row => row.UserId == backfillUser,
                TestContext.Current.CancellationToken));
            // Milestones 1 and 3 exactly once each, regardless of which path
            // won the profile lock.
            var awards = await seedDb.UserAchievements
                .AsNoTracking()
                .Where(award => award.UserId == backfillUser)
                .ToListAsync(TestContext.Current.CancellationToken);
            Assert.Equal(2, awards.Count);
            Assert.Contains(
                awards,
                award => award.AchievementId ==
                    Kiwimpact.Core.Achievements.AchievementCatalog.FirstSteps.Id);
            Assert.Contains(
                awards,
                award => award.AchievementId ==
                    Kiwimpact.Core.Achievements.AchievementCatalog.BuildingMomentum.Id);
            var snapshot = await OrderedSnapshotAsync(seedDb, backfillUser);
            foreach (var (achievementId, position) in new[]
            {
                (Kiwimpact.Core.Achievements.AchievementCatalog.FirstSteps.Id, 0),
                (Kiwimpact.Core.Achievements.AchievementCatalog.BuildingMomentum.Id, 2),
            })
            {
                var award = awards.Single(
                    candidate => candidate.AchievementId == achievementId);
                Assert.Equal(snapshot[position].Id, award.XpTransactionId);
            }
        }
        finally
        {
            await transaction.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    [Fact]
    public async Task TwoBackfillWorkersAwardTheSameUserExactlyOnce()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await SeedCatalogAsync(seedDb);
        var userId = await SeedLegacyUserAsync(seedDb);

        await using var providerA = CreateProvider();
        await using var providerB = CreateProvider();
        var workerA = CreateRunner(providerA);
        var workerB = CreateRunner(providerB);

        // Lock-free core passes: correctness must come from the profile lock
        // and the post-lock re-read, never from the advisory lock.
        var results = await Task.WhenAll(
            workerA.BackfillPassCoreAsync(TestContext.Current.CancellationToken),
            workerB.BackfillPassCoreAsync(TestContext.Current.CancellationToken))
            .WaitAsync(BlockTimeout, TestContext.Current.CancellationToken);

        Assert.All(results, result => Assert.Equal(0, result.Failed));
        Assert.Equal(1, results.Sum(result => result.Awarded));
        seedDb.ChangeTracker.Clear();
        // Five legacy rows: milestones 1, 3, and 5 exactly once each.
        var awards = await seedDb.UserAchievements
            .AsNoTracking()
            .Where(award => award.UserId == userId)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(3, awards.Count);
        var snapshot = await OrderedSnapshotAsync(seedDb, userId);
        foreach (var (achievementId, position) in new[]
        {
            (Kiwimpact.Core.Achievements.AchievementCatalog.FirstSteps.Id, 0),
            (Kiwimpact.Core.Achievements.AchievementCatalog.BuildingMomentum.Id, 2),
            (Kiwimpact.Core.Achievements.AchievementCatalog.CommittedContributor.Id, 4),
        })
        {
            var award = awards.Single(
                candidate => candidate.AchievementId == achievementId);
            Assert.Equal(snapshot[position].Id, award.XpTransactionId);
        }
    }

    private static async Task SeedCatalogAsync(KiwimpactDbContext db) =>
        await AchievementSeed.SeedAndValidateAsync(
            db, TestContext.Current.CancellationToken);

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

    private static async Task<List<XpTransaction>> OrderedSnapshotAsync(
        KiwimpactDbContext db,
        Guid userId) =>
        await db.XpTransactions
            .AsNoTracking()
            .Where(transaction => transaction.UserId == userId)
            .OrderBy(transaction => transaction.CreatedAt)
            .ThenBy(transaction => transaction.Id)
            .ToListAsync(TestContext.Current.CancellationToken);

    /// <summary>Seeds one legacy user with five XP rows and no awards.</summary>
    private static async Task<Guid> SeedLegacyUserAsync(KiwimpactDbContext db)
    {
        var creator = XpLedgerTestHelpers.NewUser("ach-conc-creator");
        var actor = XpLedgerTestHelpers.NewUser("ach-conc-actor");
        db.Set<ApplicationUser>().AddRange(creator, actor);
        db.UserProfiles.Add(XpLedgerTestHelpers.NewProfile(actor.Id));
        var baseTime = DateTimeOffset.UtcNow.AddDays(-5);
        for (var index = 0; index < 5; index++)
        {
            var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
            var participation = QuestParticipation.CreateActive(
                actor.Id, quest.Id, baseTime.AddHours(-1));
            var completion = QuestCompletion.CreateVerifiedWithCode(
                actor.Id, quest, participation, null, baseTime.AddMinutes(index * 10));
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
        return actor.Id;
    }

    private static async Task<TwoQuestGraph> SeedTwoQuestGraphAsync(KiwimpactDbContext db)
    {
        var creator = XpLedgerTestHelpers.NewUser("ach-conc2-creator");
        var actor = XpLedgerTestHelpers.NewUser("ach-conc2-actor");
        var profile = XpLedgerTestHelpers.NewProfile(actor.Id);
        var easyQuest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
        var hardQuest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Hard);
        var easyParticipation = QuestParticipation.CreateActive(
            actor.Id, easyQuest.Id, DateTimeOffset.UtcNow.AddHours(-1));
        var hardParticipation = QuestParticipation.CreateActive(
            actor.Id, hardQuest.Id, DateTimeOffset.UtcNow.AddHours(-1));
        var easyCode = XpLedgerTestHelpers.NewActiveCode(easyQuest, creator.Id);
        var hardCode = XpLedgerTestHelpers.NewActiveCode(hardQuest, creator.Id);

        db.Set<ApplicationUser>().AddRange(creator, actor);
        db.UserProfiles.Add(profile);
        db.Quests.AddRange(easyQuest, hardQuest);
        db.QuestParticipations.AddRange(easyParticipation, hardParticipation);
        db.CompletionCodes.AddRange(easyCode, hardCode);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return new TwoQuestGraph(
            actor,
            easyQuest,
            hardQuest,
            easyParticipation,
            hardParticipation);
    }

    private sealed record TwoQuestGraph(
        ApplicationUser Actor,
        Quest EasyQuest,
        Quest HardQuest,
        QuestParticipation EasyParticipation,
        QuestParticipation HardParticipation);

    private async Task<(NpgsqlConnection Connection, NpgsqlTransaction Transaction)>
        HoldProfileLockAsync(Guid userId)
    {
        var connection = new NpgsqlConnection(_fixture.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        var transaction = await connection.BeginTransactionAsync(
            TestContext.Current.CancellationToken);
        await using var command = new NpgsqlCommand(
            "SELECT \"Id\" FROM \"UserProfiles\" WHERE \"Id\" = @id FOR UPDATE",
            connection,
            transaction);
        command.Parameters.AddWithValue("id", userId);
        var found = await command.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        Assert.NotNull(found);
        return (connection, transaction);
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

    private static AchievementBackfillRunner CreateRunner(ServiceProvider provider) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new AchievementBackfillOptions()),
            NullLogger<AchievementBackfillRunner>.Instance);
}
