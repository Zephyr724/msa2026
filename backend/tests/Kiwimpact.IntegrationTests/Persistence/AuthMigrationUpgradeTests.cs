using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace Kiwimpact.IntegrationTests.Persistence;

public sealed class AuthMigrationUpgradeTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        .Build();

    public async ValueTask InitializeAsync()
    {
        await _container.StartAsync(TestContext.Current.CancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        await _container.DisposeAsync();
    }

    [Fact]
    public async Task AddUserProfileMigration_AppliesOverSliceOneSchema()
    {
        var services = new ServiceCollection();
        services.AddDbContext<KiwimpactDbContext>(options =>
            options.UseNpgsql(
                _container.GetConnectionString(),
                npgsql => npgsql.MigrationsAssembly(
                    typeof(KiwimpactDbContext).Assembly.FullName)));
        await using var provider = services.BuildServiceProvider();
        await using var scope = provider.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var migrator = db.GetService<IMigrator>();

        await migrator.MigrateAsync(
            "20260722155951_InitialRegionQuestRead",
            TestContext.Current.CancellationToken);
        var beforeUpgrade = await db.Database.SqlQueryRaw<bool>(
                "SELECT to_regclass('public.\"UserProfiles\"') IS NOT NULL AS \"Value\"")
            .SingleAsync(TestContext.Current.CancellationToken);
        Assert.False(beforeUpgrade);

        await migrator.MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);

        var tableExists = await db.Database.SqlQueryRaw<bool>(
                "SELECT to_regclass('public.\"UserProfiles\"') IS NOT NULL AS \"Value\"")
            .SingleAsync(TestContext.Current.CancellationToken);
        Assert.True(tableExists);
    }
}
