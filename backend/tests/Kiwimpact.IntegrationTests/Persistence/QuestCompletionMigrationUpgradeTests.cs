using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace Kiwimpact.IntegrationTests.Persistence;

public sealed class QuestCompletionMigrationUpgradeTests : IAsyncLifetime
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
    public async Task AddQuestCompletionCodesAppliesOverCurrentParticipationSchema()
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
            "20260724174740_AddQuestParticipation",
            TestContext.Current.CancellationToken);
        Assert.False(await TableExistsAsync(db, "QuestCompletions"));
        Assert.False(await TableExistsAsync(db, "CompletionCodes"));

        await migrator.MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);

        Assert.True(await TableExistsAsync(db, "QuestCompletions"));
        Assert.True(await TableExistsAsync(db, "CompletionCodes"));
        Assert.True(await TableExistsAsync(db, "QuestParticipations"));
    }

    private static Task<bool> TableExistsAsync(KiwimpactDbContext db, string table)
    {
        var relation = $"public.\"{table}\"";
        return db.Database.SqlQuery<bool>($"""
                SELECT to_regclass({relation}) IS NOT NULL AS "Value"
                """)
            .SingleAsync(TestContext.Current.CancellationToken);
    }
}
