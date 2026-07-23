using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace Kiwimpact.IntegrationTests.Persistence;

/// <summary>
/// Shared PostgreSQL container fixture for persistence and seed tests.
/// Applies migrations and seeds regions once per test class.
/// Each test class gets its own container instance.
/// </summary>
public sealed class TestDatabaseFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        .Build();

    public string ConnectionString => _dbContainer.GetConnectionString();

    public async ValueTask InitializeAsync()
    {
        await _dbContainer.StartAsync(TestContext.Current.CancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
    }

    /// <summary>
    /// Creates a new ServiceProvider with a DbContext backed by the container.
    /// </summary>
    public ServiceProvider CreateServiceProvider()
    {
        var collection = new ServiceCollection();
        collection.AddDbContext<KiwimpactDbContext>(options =>
            options.UseNpgsql(ConnectionString,
                npgsql => npgsql.MigrationsAssembly(typeof(KiwimpactDbContext).Assembly.FullName)));
        return collection.BuildServiceProvider();
    }

    /// <summary>
    /// Creates a scope, migrates the database, and seeds Regions.
    /// Returns the scope (caller must dispose).
    /// </summary>
    public async Task<IServiceScope> CreateSeededScopeAsync()
    {
        var sp = CreateServiceProvider();
        var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await db.Database.MigrateAsync(TestContext.Current.CancellationToken);
        await RegionSeed.SeedAsync(db);

        return scope;
    }

    /// <summary>
    /// Creates a scope, migrates the database, seeds Regions and DemoQuests.
    /// Returns the scope (caller must dispose).
    /// </summary>
    public async Task<IServiceScope> CreateFullySeededScopeAsync()
    {
        var sp = CreateServiceProvider();
        var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        await db.Database.MigrateAsync(TestContext.Current.CancellationToken);
        await RegionSeed.SeedAsync(db);
        await DemoQuestSeed.SeedAsync(db);

        return scope;
    }
}