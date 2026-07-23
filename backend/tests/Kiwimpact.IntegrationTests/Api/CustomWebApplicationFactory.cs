using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Testcontainers.PostgreSql;

namespace Kiwimpact.IntegrationTests.Api;

/// <summary>
/// Custom WebApplicationFactory that replaces the PostgreSQL connection
/// with a Testcontainers instance and applies migrations + seed on startup.
/// </summary>
public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        .Build();

    public async ValueTask InitializeAsync()
    {
        await _dbContainer.StartAsync(TestContext.Current.CancellationToken);
    }

    /// <summary>
    /// Disposes the container then delegates to the base async disposal path.
    /// Does NOT call base.Dispose() to avoid the recursive DisposeAsync→Dispose→DisposeAsync cycle.
    /// </summary>
    public override async ValueTask DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
        await base.DisposeAsync();
    }

    /// <summary>
    /// Synchronous fallback. Container disposal is handled in DisposeAsync;
    /// this path only delegates to the base and must not perform async work.
    /// </summary>
    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            // Container already disposed via DisposeAsync; no async work here.
        }
        base.Dispose(disposing);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext registration and replace with test container.
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<KiwimpactDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<KiwimpactDbContext>(options =>
                options.UseNpgsql(_dbContainer.GetConnectionString(),
                    npgsql => npgsql.MigrationsAssembly(typeof(KiwimpactDbContext).Assembly.FullName)));

            // Apply migrations at startup.
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            db.Database.Migrate();
        });
    }

    /// <summary>
    /// Seeds Regions (23 rows) into the test database.
    /// </summary>
    public async Task SeedRegionsAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await RegionSeed.SeedAsync(db);
    }

    /// <summary>
    /// Seeds Regions and Demo Quests (18 quests) into the test database.
    /// </summary>
    public async Task SeedAllAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await RegionSeed.SeedAsync(db);
        await DemoQuestSeed.SeedAsync(db);
    }
}