using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Persistence;

/// <summary>
/// Catalog seed/validation, constraint, and EF-model tests for the
/// achievement core, against real PostgreSQL.
/// </summary>
public sealed class AchievementPersistenceTests : IClassFixture<TestDatabaseFixture>
{
    private readonly TestDatabaseFixture _fixture;

    public AchievementPersistenceTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task SeedInsertsExactlyTheApprovedCatalog()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);

        await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);

        var rows = await db.Achievements
            .AsNoTracking()
            .OrderBy(achievement => achievement.Code)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(AchievementCatalog.Definitions.Count, rows.Count);
        foreach (var definition in AchievementCatalog.Definitions)
        {
            var row = Assert.Single(
                rows,
                candidate => candidate.Code == definition.Code);
            Assert.Equal(definition.Id, row.Id);
            Assert.Equal(definition.Name, row.Name);
            Assert.Equal(definition.Description, row.Description);
            Assert.Equal(definition.Category, row.Category);
            Assert.Null(row.IconUrl);
            Assert.True(row.IsActive);
            Assert.NotEqual(default, row.CreatedAt);
        }
    }

    [Fact]
    public async Task SeedRepetitionIsAStrictNoOp()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);

        await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);
        var before = await SnapshotAsync(db);
        await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);
        var after = await SnapshotAsync(db);

        Assert.Equal(before, after);
    }

    [Fact]
    public async Task ConcurrentSeedAcrossContextsSerializesToOneCatalog()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var seedDb = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(seedDb);

        await using var providerA = _fixture.CreateServiceProvider();
        await using var providerB = _fixture.CreateServiceProvider();
        await using var scopeA = providerA.CreateAsyncScope();
        await using var scopeB = providerB.CreateAsyncScope();
        var dbA = scopeA.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var dbB = scopeB.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await Task.WhenAll(
            AchievementSeed.SeedAndValidateAsync(dbA, TestContext.Current.CancellationToken),
            AchievementSeed.SeedAndValidateAsync(dbB, TestContext.Current.CancellationToken));

        Assert.Equal(AchievementCatalog.Definitions.Count, await seedDb.Achievements.CountAsync(
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task PartialCatalogIsCompletedAndThenValidates()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);
        var first = AchievementCatalog.FirstSteps;
        db.Achievements.Add(Achievement.Create(
            first.Id, first.Code, first.Name, first.Description,
            null, first.Category, isActive: true, DateTimeOffset.UtcNow));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        // Must not throw: the missing rows are inserted and the complete
        // catalog validates.
        await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);

        Assert.Equal(AchievementCatalog.Definitions.Count, await db.Achievements.CountAsync(
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task ConflictingCodeIdentityFailsValidation()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);
        try
        {
            var definition = AchievementCatalog.BuildingMomentum;
            db.Achievements.Add(Achievement.Create(
                Guid.NewGuid(), definition.Code, definition.Name, definition.Description,
                null, definition.Category, isActive: true, DateTimeOffset.UtcNow));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken));
            Assert.Contains("conflicting identity", exception.Message, StringComparison.Ordinal);
        }
        finally
        {
            await ResetCatalogAsync(db);
        }
    }

    [Fact]
    public async Task ConflictingIdIdentityFailsValidation()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);
        try
        {
            var definition = AchievementCatalog.CommittedContributor;
            db.Achievements.Add(Achievement.Create(
                definition.Id, "renamed-away-code", definition.Name, definition.Description,
                null, definition.Category, isActive: true, DateTimeOffset.UtcNow));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken));
            Assert.Contains("validation failed", exception.Message, StringComparison.Ordinal);
        }
        finally
        {
            await ResetCatalogAsync(db);
        }
    }

    [Fact]
    public async Task InvalidCategoryFailsValidation()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);
        try
        {
            await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                UPDATE "Achievements"
                SET "Category" = 'Streak'
                WHERE "Id" = {AchievementCatalog.FirstSteps.Id}
                """, TestContext.Current.CancellationToken);

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken));
            Assert.Contains("invalid category", exception.Message, StringComparison.Ordinal);
        }
        finally
        {
            await ResetCatalogAsync(db);
        }
    }

    [Fact]
    public async Task UnexpectedExtraRowFailsValidation()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);
        try
        {
            await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);
            db.Achievements.Add(Achievement.Create(
                Guid.NewGuid(), "unexpected-achievement", "Unexpected", "Not approved.",
                null, "Milestone", isActive: true, DateTimeOffset.UtcNow));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken));
            Assert.Contains("unexpected catalog row", exception.Message, StringComparison.Ordinal);
        }
        finally
        {
            await ResetCatalogAsync(db);
        }
    }

    [Fact]
    public async Task SeedUpsertsDisplayFieldsAndNeverReactivates()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);
        try
        {
            await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);
            var definition = AchievementCatalog.FirstSteps;
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                UPDATE "Achievements"
                SET "Name" = 'Drifted name',
                    "Description" = 'Drifted description.',
                    "IconUrl" = 'https://example.test/icon.svg',
                    "IsActive" = FALSE
                WHERE "Id" = {definition.Id}
                """, TestContext.Current.CancellationToken);

            await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);

            db.ChangeTracker.Clear();
            var row = await db.Achievements.SingleAsync(
                achievement => achievement.Id == definition.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(definition.Name, row.Name);
            Assert.Equal(definition.Description, row.Description);
            Assert.Null(row.IconUrl);
            // An operational deactivation is never silently reverted.
            Assert.False(row.IsActive);
        }
        finally
        {
            await ResetCatalogAsync(db);
        }
    }

    [Fact]
    public async Task DuplicateUserAchievementIsRejectedWithTheApprovedConstraintName()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);
        await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);
        var graph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(db);
        await RedeemAsync(graph.Quest.Id, graph.Actor.Id, DateTimeOffset.UtcNow);
        var award = await db.UserAchievements.SingleAsync(
            item => item.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken);

        var exception = await Assert.ThrowsAsync<PostgresException>(() =>
            db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "UserAchievements"
                    ("Id", "UserId", "AchievementId", "AwardedAt", "XpTransactionId")
                VALUES
                    ({Guid.NewGuid()}, {award.UserId}, {award.AchievementId},
                     {DateTimeOffset.UtcNow}, {award.XpTransactionId})
                """, TestContext.Current.CancellationToken));
        Assert.Equal(PostgresErrorCodes.UniqueViolation, exception.SqlState);
        Assert.Equal(
            "UX_UserAchievements_Milestone",
            exception.ConstraintName);
    }

    [Fact]
    public async Task AwardForeignKeysRestrictDeletionOfReferencedRows()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);
        await AchievementSeed.SeedAndValidateAsync(db, TestContext.Current.CancellationToken);
        var graph = await XpLedgerTestHelpers.SeedRedemptionGraphAsync(db);
        await RedeemAsync(graph.Quest.Id, graph.Actor.Id, DateTimeOffset.UtcNow);
        var award = await db.UserAchievements.SingleAsync(
            item => item.UserId == graph.Actor.Id,
            TestContext.Current.CancellationToken);

        foreach (var command in new[]
        {
            $"DELETE FROM \"Achievements\" WHERE \"Id\" = '{award.AchievementId}'",
            $"DELETE FROM \"AspNetUsers\" WHERE \"Id\" = '{award.UserId}'",
            $"DELETE FROM \"XpTransactions\" WHERE \"Id\" = '{award.XpTransactionId}'",
        })
        {
            var exception = await Assert.ThrowsAsync<PostgresException>(() =>
                db.Database.ExecuteSqlRawAsync(
                    command,
                    TestContext.Current.CancellationToken));
            Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, exception.SqlState);
        }
    }

    [Fact]
    public async Task AchievementTablesHaveNoConcurrencyTokenAndTheApprovedIndexSet()
    {
        using var seedScope = await _fixture.CreateSeededScopeAsync();
        var db = seedScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await ClearCatalogAsync(db);

        var achievementEntity = db.Model.FindEntityType(typeof(Achievement));
        Assert.NotNull(achievementEntity);
        Assert.DoesNotContain(
            achievementEntity.GetProperties(),
            property => property.IsConcurrencyToken);
        var awardEntity = db.Model.FindEntityType(typeof(UserAchievement));
        Assert.NotNull(awardEntity);
        Assert.DoesNotContain(
            awardEntity.GetProperties(),
            property => property.IsConcurrencyToken);

        var awardIndexes = await db.Database.SqlQuery<string>($"""
                SELECT indexname AS "Value"
                FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'UserAchievements'
                """)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(6, awardIndexes.Count);
        var achievementIndexes = await db.Database.SqlQuery<string>($"""
                SELECT indexname AS "Value"
                FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'Achievements'
                """)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(2, achievementIndexes.Count);

        // All four FK relationships use Restrict.
        Assert.Equal(4, awardEntity.GetForeignKeys().Count());
        Assert.All(
            awardEntity.GetForeignKeys(),
            fk => Assert.Equal(DeleteBehavior.Restrict, fk.DeleteBehavior));
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

    private static async Task<List<CatalogSnapshot>> SnapshotAsync(KiwimpactDbContext db) =>
        await db.Achievements
            .AsNoTracking()
            .OrderBy(achievement => achievement.Code)
            .Select(achievement => new CatalogSnapshot(
                achievement.Id,
                achievement.Code,
                achievement.Name,
                achievement.Description,
                achievement.IconUrl,
                achievement.Category,
                achievement.IsActive,
                achievement.CreatedAt))
            .ToListAsync(TestContext.Current.CancellationToken);


    private static async Task ClearCatalogAsync(KiwimpactDbContext db)
    {
        // Shared class database: every test arranges its catalog from a
        // known empty state.
        await db.Database.ExecuteSqlRawAsync(
            """
            DELETE FROM "FeaturedPassportAchievements";
            DELETE FROM "MemberRewardEventAchievements";
            DELETE FROM "MemberRewardEvents";
            DELETE FROM "UserAchievements";
            DELETE FROM "Achievements";
            """,
            TestContext.Current.CancellationToken);
        db.ChangeTracker.Clear();
    }

    private static async Task ResetCatalogAsync(KiwimpactDbContext db)
    {
        // Shared class database: remove any corruption this test installed
        // and restore the canonical validated catalog for later tests.
        await db.Database.ExecuteSqlRawAsync(
            """
            DELETE FROM "FeaturedPassportAchievements";
            DELETE FROM "MemberRewardEventAchievements";
            DELETE FROM "MemberRewardEvents";
            DELETE FROM "UserAchievements";
            DELETE FROM "Achievements";
            """,
            TestContext.Current.CancellationToken);
        db.ChangeTracker.Clear();
        await AchievementSeed.SeedAndValidateAsync(
            db, TestContext.Current.CancellationToken);
    }

    private sealed record CatalogSnapshot(
        Guid Id,
        string Code,
        string Name,
        string Description,
        string? IconUrl,
        string Category,
        bool IsActive,
        DateTimeOffset CreatedAt);
}
