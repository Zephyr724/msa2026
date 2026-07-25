using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Persistence;

public sealed class XpLedgerPersistenceTests : IClassFixture<TestDatabaseFixture>
{
    private readonly TestDatabaseFixture _fixture;

    public XpLedgerPersistenceTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task RedemptionCreatesCompletionXpAndProgressionAtomically()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var community = await XpLedgerTestHelpers.SeedRegionAsync(
            seedDb, "XP redemption community");
        var graph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(
            seedDb, QuestDifficulty.Hard, community.Id);

        await RedeemAsync(graph.Quest.Id, graph.Actor.Id);

        seedDb.ChangeTracker.Clear();
        var completion = await seedDb.QuestCompletions.SingleAsync(
            item => item.UserId == graph.Actor.Id && item.QuestId == graph.Quest.Id,
            TestContext.Current.CancellationToken);
        var xp = await seedDb.XpTransactions.SingleAsync(
            item => item.SourceCompletionId == completion.Id,
            TestContext.Current.CancellationToken);
        var profile = await seedDb.UserProfiles.SingleAsync(
            item => item.Id == graph.Actor.Id,
            TestContext.Current.CancellationToken);

        Assert.Equal(completion.Id, xp.SourceCompletionId);
        Assert.Equal(graph.Actor.Id, xp.UserId);
        Assert.Equal(graph.Quest.Id, xp.QuestId);
        Assert.Equal(150, xp.XpAmount);
        Assert.Equal(community.Id, xp.CommunityRegionIdAtAward);
        Assert.Equal(community.Id, completion.CommunityRegionIdAtCompletion);
        Assert.Equal(completion.VerifiedAtUtc, xp.CreatedAt);
        Assert.NotNull(completion.VerifiedAtUtc);

        Assert.Equal(150, profile.TotalXp);
        Assert.Equal(3, profile.Level);
        Assert.True(profile.UpdatedAt > graph.Profile.UpdatedAt);
    }

    [Fact]
    public async Task RedemptionFailureRollsBackCompletionXpAndProgression()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(
            seedDb, QuestDifficulty.Medium);

        await InstallRejectingTriggerAsync(seedDb, graph.Actor.Id);
        try
        {
            await using var provider = _fixture.CreateServiceProvider();
            await using var scope = provider.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var repository = new QuestCompletionRepository(
                db, XpLedgerTestHelpers.Protector);

            await Assert.ThrowsAsync<DbUpdateException>(() =>
                repository.RedeemAsync(
                    graph.Quest.Id,
                    graph.Actor.Id,
                    XpLedgerTestHelpers.DisplayCode,
                    DateTimeOffset.UtcNow,
                    TestContext.Current.CancellationToken));

            Assert.Equal(0, await db.QuestCompletions.CountAsync(
                item => item.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            Assert.Equal(0, await db.XpTransactions.CountAsync(
                item => item.UserId == graph.Actor.Id,
                TestContext.Current.CancellationToken));
            // Clear the tracker: the rolled-back ApplyXpAward mutation must
            // not be read back from the tracked entity's current values.
            db.ChangeTracker.Clear();
            var profile = await db.UserProfiles.SingleAsync(
                item => item.Id == graph.Actor.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(0, profile.TotalXp);
            Assert.Equal(1, profile.Level);
            Assert.Equal(
                graph.Profile.UpdatedAt,
                profile.UpdatedAt,
                TimeSpan.FromMicroseconds(1));
        }
        finally
        {
            await DropRejectingTriggerAsync(seedDb);
        }
    }

    [Fact]
    public async Task SourceCompletionUniqueIndexRejectsDuplicateAwardWithApprovedName()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(seedDb);
        await RedeemAsync(graph.Quest.Id, graph.Actor.Id);
        var completion = await seedDb.QuestCompletions.SingleAsync(
            item => item.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken);

        var exception = await Assert.ThrowsAsync<PostgresException>(() =>
            seedDb.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "XpTransactions"
                    ("Id", "UserId", "QuestId", "SourceCompletionId", "XpAmount",
                     "CommunityRegionIdAtAward", "CreatedAt")
                VALUES
                    ({Guid.NewGuid()}, {graph.Actor.Id}, {graph.Quest.Id},
                     {completion.Id}, {50}, NULL, {DateTimeOffset.UtcNow})
                """, TestContext.Current.CancellationToken));
        Assert.Equal(PostgresErrorCodes.UniqueViolation, exception.SqlState);
        Assert.Equal(
            XpLedgerRepository.SourceCompletionConstraint,
            exception.ConstraintName);
    }

    [Fact]
    public async Task XpAmountCheckConstraintRejectsZeroAndNegativeAmounts()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var completion = await XpLedgerTestHelpers.SeedPendingCompletionAsync(seedDb);

        foreach (var amount in new[] { 0, -50 })
        {
            var exception = await Assert.ThrowsAsync<PostgresException>(() =>
                seedDb.Database.ExecuteSqlInterpolatedAsync($"""
                    INSERT INTO "XpTransactions"
                        ("Id", "UserId", "QuestId", "SourceCompletionId", "XpAmount",
                         "CommunityRegionIdAtAward", "CreatedAt")
                    VALUES
                        ({Guid.NewGuid()}, {completion.UserId}, {completion.QuestId},
                         {completion.Id}, {amount}, NULL, {DateTimeOffset.UtcNow})
                    """, TestContext.Current.CancellationToken));
            Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
            Assert.Equal("CK_XpTransactions_XpAmount_Positive", exception.ConstraintName);
        }
    }

    [Fact]
    public async Task LedgerIndexesMatchTheApprovedSetAndColumnOrder()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        var unique = await IndexDefinitionAsync(seedDb, "UX_XpTransactions_SourceCompletionId");
        Assert.Contains("UNIQUE INDEX", unique);
        Assert.Contains("(\"SourceCompletionId\")", unique);

        var byUser = await IndexDefinitionAsync(seedDb, "IX_XpTransactions_UserId_CreatedAt");
        Assert.DoesNotContain("UNIQUE", byUser);
        Assert.Contains("(\"UserId\", \"CreatedAt\")", byUser);

        var byCommunity = await IndexDefinitionAsync(
            seedDb, "IX_XpTransactions_CommunityRegionIdAtAward_CreatedAt");
        Assert.Contains("(\"CommunityRegionIdAtAward\", \"CreatedAt\")", byCommunity);

        var all = await seedDb.Database.SqlQuery<string>($"""
                SELECT indexname AS "Value"
                FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'XpTransactions'
                """)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(4, all.Count);
        Assert.Contains("PK_XpTransactions", all);
        Assert.DoesNotContain(all, name => name.Contains("QuestId", StringComparison.Ordinal));
    }

    [Fact]
    public async Task LedgerForeignKeysRestrictDeletionOfReferencedRows()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var community = await XpLedgerTestHelpers.SeedRegionAsync(seedDb, "XP FK community");
        var graph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(
            seedDb, QuestDifficulty.Easy, community.Id);
        await RedeemAsync(graph.Quest.Id, graph.Actor.Id);
        var completion = await seedDb.QuestCompletions.SingleAsync(
            item => item.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken);

        foreach (var command in new[]
        {
            $"DELETE FROM \"AspNetUsers\" WHERE \"Id\" = '{graph.Actor.Id}'",
            $"DELETE FROM \"Quests\" WHERE \"Id\" = '{graph.Quest.Id}'",
            $"DELETE FROM \"QuestCompletions\" WHERE \"Id\" = '{completion.Id}'",
            $"DELETE FROM \"Regions\" WHERE \"Id\" = '{community.Id}'",
        })
        {
            var exception = await Assert.ThrowsAsync<PostgresException>(() =>
                seedDb.Database.ExecuteSqlRawAsync(
                    command,
                    TestContext.Current.CancellationToken));
            Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, exception.SqlState);
        }
    }

    [Fact]
    public async Task MultipleAwardsForOneUserProduceExactTotalsAndLevel()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var easy = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(
            seedDb, QuestDifficulty.Easy);
        var hardQuest = XpLedgerTestHelpers.NewQuest(
            easy.Creator.Id, QuestDifficulty.Hard);
        var hardParticipation = QuestParticipation.CreateActive(
            easy.Actor.Id, hardQuest.Id, DateTimeOffset.UtcNow.AddHours(-1));
        var hardCode = XpLedgerTestHelpers.NewActiveCode(hardQuest, easy.Creator.Id);
        seedDb.Quests.Add(hardQuest);
        seedDb.QuestParticipations.Add(hardParticipation);
        seedDb.CompletionCodes.Add(hardCode);
        await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);

        await RedeemAsync(easy.Quest.Id, easy.Actor.Id);
        await RedeemAsync(hardQuest.Id, easy.Actor.Id);

        seedDb.ChangeTracker.Clear();
        var profile = await seedDb.UserProfiles.SingleAsync(
            item => item.Id == easy.Actor.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal(200, profile.TotalXp);
        Assert.Equal(4, profile.Level);
        Assert.Equal(2, await seedDb.XpTransactions.CountAsync(
            transaction => transaction.UserId == easy.Actor.Id,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task LedgerRowsIgnoreLaterQuestProfileAndRegionMutation()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var community = await XpLedgerTestHelpers.SeedRegionAsync(
            seedDb, "XP immutable community");
        var other = await XpLedgerTestHelpers.SeedRegionAsync(
            seedDb, "XP immutable other");
        var graph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(
            seedDb, QuestDifficulty.Easy, community.Id);
        await RedeemAsync(graph.Quest.Id, graph.Actor.Id);

        seedDb.ChangeTracker.Clear();
        var quest = await seedDb.Quests.SingleAsync(
            item => item.Id == graph.Quest.Id,
            TestContext.Current.CancellationToken);
        quest.Difficulty = QuestDifficulty.Hard;
        quest.XpAward = 9999;
        var profile = await seedDb.UserProfiles.SingleAsync(
            item => item.Id == graph.Actor.Id,
            TestContext.Current.CancellationToken);
        profile.HomeCommunityRegionId = other.Id;
        var region = await seedDb.Regions.SingleAsync(
            item => item.Id == community.Id,
            TestContext.Current.CancellationToken);
        region.IsActive = false;
        await seedDb.SaveChangesAsync(TestContext.Current.CancellationToken);

        seedDb.ChangeTracker.Clear();
        var xp = await seedDb.XpTransactions.SingleAsync(
            item => item.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal(50, xp.XpAmount);
        Assert.Equal(community.Id, xp.CommunityRegionIdAtAward);
        var completion = await seedDb.QuestCompletions.SingleAsync(
            item => item.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal(QuestDifficulty.Easy, completion.RewardDifficultySnapshot);
        Assert.Equal(community.Id, completion.CommunityRegionIdAtCompletion);
    }

    [Fact]
    public async Task LedgerAndProfileHaveNoConcurrencyToken()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        var xpEntity = seedDb.Model.FindEntityType(typeof(XpTransaction));
        Assert.NotNull(xpEntity);
        Assert.DoesNotContain(
            xpEntity.GetProperties(),
            property => property.IsConcurrencyToken);

        var profileEntity = seedDb.Model.FindEntityType(typeof(UserProfile));
        Assert.NotNull(profileEntity);
        Assert.DoesNotContain(
            profileEntity.GetProperties(),
            property => property.IsConcurrencyToken);

        var ledgerColumns = await seedDb.Database.SqlQuery<string>($"""
                SELECT column_name AS "Value"
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'XpTransactions'
                  AND lower(column_name) IN ('updatedat', 'version', 'xmin')
                """)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Empty(ledgerColumns);
    }

    [Fact]
    public async Task RuntimeEfModelContainsTheRestrictiveQuestRelationship()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        var entityType = seedDb.Model.FindEntityType(typeof(XpTransaction));
        Assert.NotNull(entityType);

        var questFk = Assert.Single(
            entityType.GetForeignKeys(),
            fk => fk.PrincipalEntityType.ClrType == typeof(Quest));
        Assert.Equal(DeleteBehavior.Restrict, questFk.DeleteBehavior);
        Assert.Equal(
            nameof(XpTransaction.QuestId),
            Assert.Single(questFk.Properties).Name);
        Assert.Equal("FK_XpTransactions_Quests_QuestId", questFk.GetConstraintName());

        // The approved index set carries no QuestId lookup index.
        Assert.DoesNotContain(
            entityType.GetIndexes(),
            index =>
                index.Properties.Count == 1 &&
                index.Properties[0].Name == nameof(XpTransaction.QuestId));

        // The FK indexes the rest of the model relies on survived the
        // convention removal with their existing names.
        var questEntity = seedDb.Model.FindEntityType(typeof(Quest));
        Assert.NotNull(questEntity);
        Assert.Contains(
            questEntity.GetIndexes(),
            index => index.GetDatabaseName() == "IX_Quests_CreatedByUserId");
        Assert.Contains(
            questEntity.GetIndexes(),
            index => index.GetDatabaseName() == "IX_Quests_LocationRegionId");
    }

    [Fact]
    public async Task NonVerifiedCompletionIsOutsideEveryRewardBoundary()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(seedDb);
        var now = DateTimeOffset.UtcNow;
        await seedDb.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "QuestCompletions"
                ("Id", "UserId", "QuestId", "ParticipationId", "Method", "Status",
                 "CompletedAt", "VerifiedAtUtc", "RewardDifficultySnapshot",
                 "CommunityRegionIdAtCompletion", "CreatedAt", "UpdatedAt")
            VALUES
                ({Guid.NewGuid()}, {graph.Actor.Id}, {graph.Quest.Id},
                 {graph.Participation.Id}, 'SelfReported', 'SelfReported',
                 {now}, NULL, 'Easy', NULL, {now}, {now})
            """, TestContext.Current.CancellationToken);

        var repository = new XpLedgerRepository(seedDb);
        Assert.False(await repository.HasRewardPendingCompletionsAsync(
            TestContext.Current.CancellationToken));
        Assert.Equal(0, await repository.CountUnprocessableRewardPendingAsync(
            TestContext.Current.CancellationToken));
        Assert.Empty(await repository.GetAwardEligibleBatchAsync(
            100,
            Array.Empty<Guid>(),
            TestContext.Current.CancellationToken));
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

    private static async Task<string> IndexDefinitionAsync(
        KiwimpactDbContext db,
        string indexName) =>
        await db.Database.SqlQuery<string>($"""
                SELECT indexdef AS "Value"
                FROM pg_indexes
                WHERE schemaname = 'public' AND indexname = {indexName}
                """)
            .SingleAsync(TestContext.Current.CancellationToken);

    private static async Task InstallRejectingTriggerAsync(
        KiwimpactDbContext db,
        Guid rejectedUserId)
    {
        await db.Database.ExecuteSqlRawAsync(
            $"""
            CREATE OR REPLACE FUNCTION reject_xp_insert_for_test() RETURNS trigger AS $fn$
            BEGIN
                IF NEW."UserId" = '{rejectedUserId}' THEN
                    RAISE EXCEPTION 'forced XP insert failure for test';
                END IF;
                RETURN NEW;
            END;
            $fn$ LANGUAGE plpgsql
            """,
            TestContext.Current.CancellationToken);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TRIGGER xp_insert_reject_for_test
            BEFORE INSERT ON "XpTransactions"
            FOR EACH ROW EXECUTE FUNCTION reject_xp_insert_for_test()
            """,
            TestContext.Current.CancellationToken);
    }

    private static async Task DropRejectingTriggerAsync(KiwimpactDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            DROP TRIGGER IF EXISTS xp_insert_reject_for_test ON "XpTransactions";
            DROP FUNCTION IF EXISTS reject_xp_insert_for_test()
            """,
            TestContext.Current.CancellationToken);
    }
}
