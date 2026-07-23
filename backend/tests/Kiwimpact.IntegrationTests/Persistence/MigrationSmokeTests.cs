using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace Kiwimpact.IntegrationTests.Persistence;

public sealed class MigrationSmokeTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        .Build();

    private IServiceProvider _services = null!;

    public async ValueTask InitializeAsync()
    {
        await _dbContainer.StartAsync(TestContext.Current.CancellationToken);

        var collection = new ServiceCollection();
        collection.AddDbContext<KiwimpactDbContext>(options =>
            options.UseNpgsql(_dbContainer.GetConnectionString(),
                npgsql => npgsql.MigrationsAssembly(typeof(KiwimpactDbContext).Assembly.FullName)));

        _services = collection.BuildServiceProvider();
    }

    public async ValueTask DisposeAsync()
    {
        if (_services is IDisposable d)
            d.Dispose();
        await _dbContainer.DisposeAsync();
    }

    [Fact]
    public async Task Migration_AppliesToEmptyDatabase()
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await db.Database.MigrateAsync(TestContext.Current.CancellationToken);

        // Verify expected tables
        var tables = await db.Database
            .SqlQuery<string>($"""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """)
            .ToListAsync(TestContext.Current.CancellationToken);

        Assert.Contains(tables, t => t == "Regions");
        Assert.Contains(tables, t => t == "Quests");
        Assert.Contains(tables, t => t == "QuestImages");
        Assert.Contains(tables, t => t == "AspNetUsers");
    }

    [Fact]
    public async Task Migration_ContainsNoApplicationSeedRows()
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await db.Database.MigrateAsync(TestContext.Current.CancellationToken);

        // Regions table should be empty after migration (seed is separate)
        var regionCount = await db.Regions.CountAsync(TestContext.Current.CancellationToken);
        Assert.Equal(0, regionCount);
    }

    [Fact]
    public async Task RootUniqueness_PreventsDuplicateRootRegions()
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await db.Database.MigrateAsync(TestContext.Current.CancellationToken);

        var now = DateTimeOffset.UtcNow;

        // Insert first root region
        db.Regions.Add(new Core.Entities.Region
        {
            Id = Guid.NewGuid(),
            Name = "Test Country",
            Type = Core.Enums.RegionType.Country,
            ParentRegionId = null,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        });
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        // Second root with same (Name, Type, ParentRegionId=null) should fail
        db.Regions.Add(new Core.Entities.Region
        {
            Id = Guid.NewGuid(),
            Name = "Test Country",
            Type = Core.Enums.RegionType.Country,
            ParentRegionId = null,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        });

        await Assert.ThrowsAsync<DbUpdateException>(
            () => db.SaveChangesAsync(TestContext.Current.CancellationToken));
    }
}