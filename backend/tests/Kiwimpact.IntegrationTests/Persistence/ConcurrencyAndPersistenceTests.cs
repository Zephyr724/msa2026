using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Persistence;

public sealed class ConcurrencyAndPersistenceTests : IClassFixture<TestDatabaseFixture>
{
    private readonly TestDatabaseFixture _fixture;

    public ConcurrencyAndPersistenceTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    // ── FK Relationships ────────────────────────────────────────────

    [Fact]
    public async Task Quest_CreatorFK_RestrictDelete_IsEnforced()
    {
        // The Quest.CreatedByUserId FK is required (non-nullable) with Restrict delete.
        // EF Core detects the severed required relationship at the change tracker level
        // and throws InvalidOperationException during Remove(), before any database call.
        using var scope = await _fixture.CreateFullySeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        var questCount = await db.Quests
            .CountAsync(q => q.CreatedByUserId == DemoQuestSeed.CuratorUserId,
                TestContext.Current.CancellationToken);
        Assert.True(questCount > 0, "Expected quests referencing the dev curator.");

        var curator = await db.Set<ApplicationUser>()
            .FirstAsync(u => u.Id == DemoQuestSeed.CuratorUserId,
                TestContext.Current.CancellationToken);

        // EF Core Restrict + non-nullable FK → InvalidOperationException at Remove().
        Assert.Throws<InvalidOperationException>(
            () => db.Set<ApplicationUser>().Remove(curator));
    }

    [Fact]
    public async Task Quest_RegionFK_RestrictDelete_IsEnforcedAtDatabaseLevel()
    {
        // Tests that PostgreSQL enforces the Restrict delete rule
        // on the Quest→Region FK. When a Region has dependent Quests, the
        // database must reject the delete with a foreign-key violation.
        //
        // We bypass EF change tracking by using raw SQL DELETE so the
        // database itself — not the EF change tracker — must enforce Restrict.
        using var scope = await _fixture.CreateFullySeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        // Use Henderson-Massey LocalArea (has Quests in demo seed, is a leaf
        // → no child-Region FK cascade).
        Guid regionId = RegionSeed.HendersonMasseyId;

        var questCount = await db.Quests
            .CountAsync(q => q.LocationRegionId == regionId,
                TestContext.Current.CancellationToken);
        Assert.True(questCount > 0, "Expected quests referencing Henderson-Massey LocalArea.");

        // Attempt a raw DELETE — EF change tracker cannot intercept this.
        // PostgreSQL must reject it because Quest.LocationRegionId → Region.Id
        // is configured with OnDelete(DeleteBehavior.Restrict).
        var ex = await Assert.ThrowsAsync<Npgsql.PostgresException>(
            () => db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"Regions\" WHERE \"Id\" = {regionId}",
                TestContext.Current.CancellationToken));

        // The PostgreSQL exception must carry FK violation SQLSTATE 23503.
        Assert.Equal("23503", ex.SqlState); // foreign_key_violation

        // Verify the Region still exists — the DELETE was rejected.
        var region = await db.Regions
            .FirstOrDefaultAsync(r => r.Id == regionId, TestContext.Current.CancellationToken);
        Assert.NotNull(region);

        // Verify dependent Quests are still linked.
        var stillLinked = await db.Quests
            .CountAsync(q => q.LocationRegionId == regionId,
                TestContext.Current.CancellationToken);
        Assert.Equal(questCount, stillLinked);
    }

    [Fact]
    public async Task QuestImage_CascadeDelete_Works()
    {
        using var scope = await _fixture.CreateFullySeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        // Get a quest that has images
        var quest = await db.Quests
            .Include(q => q.Images)
            .FirstAsync(q => q.Status == QuestStatus.Published,
                TestContext.Current.CancellationToken);
        Assert.NotEmpty(quest.Images);
        var imageCount = quest.Images.Count;

        db.Quests.Remove(quest);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        // Images should be cascade-deleted
        var remainingImages = await db.QuestImages
            .CountAsync(i => i.QuestId == quest.Id, TestContext.Current.CancellationToken);
        Assert.Equal(0, remainingImages);
    }

    // ── xmin Concurrency ────────────────────────────────────────────

    [Fact]
    public async Task StaleXminUpdate_ThrowsDbUpdateConcurrencyException()
    {
        // Use two separate DbContexts (two service providers) to simulate
        // concurrent modifications.

        // Context A: load the quest.
        IServiceScope scopeA = null!;
        IServiceScope scopeB = null!;
        try
        {
            scopeA = await _fixture.CreateFullySeededScopeAsync();
            var dbA = scopeA.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

            var quest = await dbA.Quests
                .FirstAsync(q => q.Status == QuestStatus.Published,
                    TestContext.Current.CancellationToken);

            // Context B: load the SAME quest and update it.
            var spB = _fixture.CreateServiceProvider();
            scopeB = spB.CreateScope();
            var dbB = scopeB.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

            // Ensure migrations are applied in dbB (the container already has them,
            // but dbB needs to know the model).
            await dbB.Database.MigrateAsync(TestContext.Current.CancellationToken);

            var questB = await dbB.Quests
                .FirstAsync(q => q.Id == quest.Id, TestContext.Current.CancellationToken);
            questB.Title = "Title updated by Context B";
            await dbB.SaveChangesAsync(TestContext.Current.CancellationToken);

            // Now Context A still has the stale xmin.
            // Update the same quest from Context A — this must throw.
            quest.Title = "Title updated by Context A (stale)";

            await Assert.ThrowsAsync<DbUpdateConcurrencyException>(
                () => dbA.SaveChangesAsync(TestContext.Current.CancellationToken));
        }
        finally
        {
            scopeB?.Dispose();
            scopeA?.Dispose();
        }
    }
}