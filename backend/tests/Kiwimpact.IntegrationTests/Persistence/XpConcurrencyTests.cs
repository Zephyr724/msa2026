using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
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
/// Deterministic real-overlap concurrency tests for the D5 lock-order matrix.
/// Overlap is forced with externally held FOR UPDATE row locks and
/// pg_stat_activity blocked-session observation — never Task.WhenAll alone.
/// </summary>
public sealed class XpConcurrencyTests : IClassFixture<TestDatabaseFixture>
{
    private static readonly TimeSpan BlockTimeout = TimeSpan.FromSeconds(15);
    private readonly TestDatabaseFixture _fixture;

    public XpConcurrencyTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task RedemptionUsesTheSerializedProfileCommunityCommittedBeforeItsLock()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var communityA = await XpLedgerTestHelpers.SeedRegionAsync(seedDb, "XP M1 community A");
        var communityB = await XpLedgerTestHelpers.SeedRegionAsync(seedDb, "XP M1 community B");
        var graph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(
            seedDb, QuestDifficulty.Easy, communityA.Id);

        var (connection, transaction) = await HoldProfileLockAsync(graph.Actor.Id);
        try
        {
            var redemption = RedeemAsync(graph.Quest.Id, graph.Actor.Id);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "UserProfiles",
                    1,
                    BlockTimeout),
                "The redemption did not reach the profile lock.");

            // Change the Home Community inside the external transaction and
            // commit: the resumed redemption must snapshot the serialized
            // value B, never the stale pre-lock value A.
            await using (var update = new NpgsqlCommand(
                "UPDATE \"UserProfiles\" SET \"HomeCommunityRegionId\" = @region WHERE \"Id\" = @id",
                connection,
                transaction))
            {
                update.Parameters.AddWithValue("region", communityB.Id);
                update.Parameters.AddWithValue("id", graph.Actor.Id);
                await update.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
            }
            await transaction.CommitAsync(TestContext.Current.CancellationToken);

            await redemption.WaitAsync(BlockTimeout, TestContext.Current.CancellationToken);

            seedDb.ChangeTracker.Clear();
            var completion = await seedDb.QuestCompletions.SingleAsync(
                item => item.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken);
            var xp = await seedDb.XpTransactions.SingleAsync(
                item => item.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(communityB.Id, completion.CommunityRegionIdAtCompletion);
            Assert.Equal(communityB.Id, xp.CommunityRegionIdAtAward);
        }
        finally
        {
            await transaction.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    [Fact]
    public async Task SameUserRedemptionsAcrossDifferentQuestsSerializeExactly()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedTwoQuestGraphAsync(seedDb);

        var (connection, transaction) = await HoldProfileLockAsync(graph.Actor.Id);
        try
        {
            var first = RedeemAsync(graph.EasyQuest.Id, graph.Actor.Id);
            var second = RedeemAsync(graph.HardQuest.Id, graph.Actor.Id);
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
                transaction1 => transaction1.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            var profile = await seedDb.UserProfiles.SingleAsync(
                item => item.Id == graph.Actor.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(200, profile.TotalXp);
            Assert.Equal(4, profile.Level);
        }
        finally
        {
            await transaction.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    [Fact]
    public async Task TwoReconcilersForTheSameCompletionAwardExactlyOnce()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var completion = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
            seedDb, QuestDifficulty.Easy);

        await using var providerA = CreateProvider();
        await using var providerB = CreateProvider();
        var workerA = CreateService(providerA);
        var workerB = CreateService(providerB);

        var (connection, transaction) = await HoldProfileLockAsync(completion.UserId);
        try
        {
            var passA = workerA.ReconcilePassCoreAsync(TestContext.Current.CancellationToken);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "UserProfiles",
                    1,
                    BlockTimeout),
                "The first reconciler did not reach the profile lock.");

            var passB = workerB.ReconcilePassCoreAsync(TestContext.Current.CancellationToken);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "XpTransactions",
                    1,
                    BlockTimeout),
                "The second reconciler did not block on the unique award boundary.");

            await transaction.CommitAsync(TestContext.Current.CancellationToken);
            var results = await Task.WhenAll(passA, passB)
                .WaitAsync(BlockTimeout, TestContext.Current.CancellationToken);

            Assert.Equal(1, results[0].Awarded);
            Assert.Equal(0, results[1].Awarded);
            Assert.Equal(1, results[1].AlreadyAwarded);

            seedDb.ChangeTracker.Clear();
            Assert.Equal(1, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, completion.Id));
            var profile = await seedDb.UserProfiles.SingleAsync(
                item => item.Id == completion.UserId,
                TestContext.Current.CancellationToken);
            Assert.Equal(50, profile.TotalXp);
        }
        finally
        {
            await transaction.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    [Fact]
    public async Task TwoReconcilersForDifferentCompletionsOfOneUserIncrementExactlyTwice()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedTwoQuestGraphAsync(seedDb);
        var completionEasy = SeedPendingCompletion(seedDb, graph, graph.EasyQuest, graph.EasyParticipation);
        var completionHard = SeedPendingCompletion(seedDb, graph, graph.HardQuest, graph.HardParticipation);
        await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);

        var (connection, transaction) = await HoldProfileLockAsync(graph.Actor.Id);
        try
        {
            var awardEasy = AwardAsync(completionEasy);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "UserProfiles",
                    1,
                    BlockTimeout),
                "The first reconciler did not reach the profile lock.");

            var awardHard = AwardAsync(completionHard);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "UserProfiles",
                    2,
                    BlockTimeout),
                "The second reconciler did not reach the profile lock.");

            await transaction.CommitAsync(TestContext.Current.CancellationToken);
            var outcomes = await Task.WhenAll(awardEasy, awardHard)
                .WaitAsync(BlockTimeout, TestContext.Current.CancellationToken);

            Assert.All(outcomes, outcome => Assert.Equal(XpAwardOutcome.Awarded, outcome));

            seedDb.ChangeTracker.Clear();
            Assert.Equal(2, await seedDb.XpTransactions.CountAsync(
                transaction1 => transaction1.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            var profile = await seedDb.UserProfiles.SingleAsync(
                item => item.Id == graph.Actor.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(200, profile.TotalXp);
            Assert.Equal(4, profile.Level);
        }
        finally
        {
            await transaction.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    [Fact]
    public async Task ReconciliationAndRedemptionNeverDoubleAward()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedTwoQuestGraphAsync(seedDb);
        var pending = SeedPendingCompletion(seedDb, graph, graph.HardQuest, graph.HardParticipation);
        await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);

        await using var provider = CreateProvider();
        var service = CreateService(provider);

        var (connection, transaction) = await HoldProfileLockAsync(graph.Actor.Id);
        try
        {
            var pass = service.ReconcilePassCoreAsync(TestContext.Current.CancellationToken);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "UserProfiles",
                    1,
                    BlockTimeout),
                "The reconciler did not reach the profile lock.");

            var redemption = RedeemAsync(graph.EasyQuest.Id, graph.Actor.Id);
            Assert.True(
                await XpLedgerTestHelpers.WaitForBlockedSessionsAsync(
                    _fixture.ConnectionString,
                    "UserProfiles",
                    2,
                    BlockTimeout),
                "The redemption did not reach the profile lock.");

            await transaction.CommitAsync(TestContext.Current.CancellationToken);
            var result = await pass.WaitAsync(BlockTimeout, TestContext.Current.CancellationToken);
            await redemption.WaitAsync(BlockTimeout, TestContext.Current.CancellationToken);

            Assert.Equal(1, result.Awarded);
            seedDb.ChangeTracker.Clear();
            Assert.Equal(1, await XpLedgerTestHelpers.CountXpRowsAsync(seedDb, pending.Id));
            var redemptionCompletion = await seedDb.QuestCompletions.SingleAsync(
                item => item.QuestId == graph.EasyQuest.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(1, await XpLedgerTestHelpers.CountXpRowsAsync(
                seedDb, redemptionCompletion.Id));
            var profile = await seedDb.UserProfiles.SingleAsync(
                item => item.Id == graph.Actor.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(200, profile.TotalXp);

            // The redemption-created pair is never eligible afterwards.
            var repeat = await service.ReconcilePassCoreAsync(
                TestContext.Current.CancellationToken);
            Assert.Equal(0, repeat.Scanned);
            Assert.Equal(0, repeat.Awarded);
        }
        finally
        {
            await transaction.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    [Fact]
    public async Task MixedFlowsCompleteWithoutDeadlockWithinTheStatementTimeout()
    {
        for (var round = 0; round < 3; round++)
        {
            using var seedScope = await _fixture.CreateSeededScopeAsync();
            var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var graph = await SeedTwoQuestGraphAsync(seedDb);
            var pending = SeedPendingCompletion(seedDb, graph, graph.HardQuest, graph.HardParticipation);
            await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);

            var stagger = Task.Run(async () =>
            {
                var (connection, transaction) = await HoldProfileLockAsync(graph.Actor.Id);
                try
                {
                    await Task.Delay(200, TestContext.Current.CancellationToken);
                    await transaction.CommitAsync(TestContext.Current.CancellationToken);
                }
                finally
                {
                    await transaction.DisposeAsync();
                    await connection.DisposeAsync();
                }
            }, TestContext.Current.CancellationToken);

            var first = RedeemAsync(graph.EasyQuest.Id, graph.Actor.Id);
            var award = AwardAsync(pending);

            await Task.WhenAll(stagger, first, award)
                .WaitAsync(TimeSpan.FromSeconds(25), TestContext.Current.CancellationToken);

            Assert.Equal(XpAwardOutcome.Awarded, await award);
            seedDb.ChangeTracker.Clear();
            Assert.Equal(2, await seedDb.XpTransactions.CountAsync(
                transaction1 => transaction1.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            var profile = await seedDb.UserProfiles.SingleAsync(
                item => item.Id == graph.Actor.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(200, profile.TotalXp);
        }
    }

    private async Task RedeemAsync(Guid questId, Guid actorId)
    {
        await using var provider = _fixture.CreateServiceProvider();
        await using var scope = provider.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var repository = new QuestCompletionRepository(
            db, XpLedgerTestHelpers.Protector);
        await repository.RedeemAsync(
            questId,
            actorId,
            XpLedgerTestHelpers.DisplayCode,
            DateTimeOffset.UtcNow,
            TestContext.Current.CancellationToken);
    }

    private async Task<XpAwardOutcome> AwardAsync(QuestCompletion completion)
    {
        await using var provider = _fixture.CreateServiceProvider();
        await using var scope = provider.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var repository = new XpLedgerRepository(db);
        return await repository.AwardVerifiedCompletionAsync(
            completion,
            DateTimeOffset.UtcNow,
            TestContext.Current.CancellationToken);
    }

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
        collection.AddScoped<IXpLedgerRepository, XpLedgerRepository>();
        return collection.BuildServiceProvider();
    }

    private static XpReconciliationRunner CreateService(ServiceProvider provider) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new XpReconciliationOptions()),
            NullLogger<XpReconciliationRunner>.Instance);

    private static QuestCompletion SeedPendingCompletion(
        KiwimpactDbContext db,
        TwoQuestGraph graph,
        Quest quest,
        QuestParticipation participation)
    {
        var completion = QuestCompletion.CreateVerifiedWithCode(
            graph.Actor.Id,
            quest,
            participation,
            null,
            DateTimeOffset.UtcNow);
        db.QuestCompletions.Add(completion);
        return completion;
    }

    private static async Task<TwoQuestGraph> SeedTwoQuestGraphAsync(KiwimpactDbContext db)
    {
        var creator = XpLedgerTestHelpers.NewUser("xp-concurrency-creator");
        var actor = XpLedgerTestHelpers.NewUser("xp-concurrency-actor");
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
}
