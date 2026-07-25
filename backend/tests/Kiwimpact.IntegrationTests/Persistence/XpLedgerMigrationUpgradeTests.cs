using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Kiwimpact.IntegrationTests.Persistence;

/// <summary>
/// Migration tests for the additive XP ledger and progression migration.
/// Each test runs against its own isolated database inside the container so
/// clean-schema, upgrade, and destructive Down() observations never share
/// state.
/// </summary>
public sealed class XpLedgerMigrationUpgradeTests : IAsyncLifetime
{
    private const string PreviousMigration = "20260725063439_AddQuestCompletionCodes";
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
    public async Task CleanSchemaMigrationCreatesExactLedgerAndProgressionShape()
    {
        var connectionString = await CreateIsolatedDatabaseAsync();
        try
        {
            await using var db = CreateDbContext(connectionString);
            await db.GetService<IMigrator>()
                .MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);

            Assert.True(await TableExistsAsync(db, "XpTransactions"));

            var columns = await ColumnShapesAsync(db, "XpTransactions");
            AssertColumn(columns, "Id", "uuid", false);
            AssertColumn(columns, "UserId", "uuid", false);
            AssertColumn(columns, "QuestId", "uuid", false);
            AssertColumn(columns, "SourceCompletionId", "uuid", false);
            AssertColumn(columns, "XpAmount", "integer", false);
            AssertColumn(columns, "CommunityRegionIdAtAward", "uuid", true);
            AssertColumn(columns, "CreatedAt", "timestamp with time zone", false);
            Assert.Equal(7, columns.Count);

            var profileColumns = await ColumnShapesAsync(db, "UserProfiles");
            AssertColumn(profileColumns, "TotalXp", "bigint", false, "0");
            AssertColumn(profileColumns, "Level", "integer", false, "1");

            var checkConstraints = await ConstraintNamesAsync(db, "XpTransactions", "c");
            Assert.Contains("CK_XpTransactions_XpAmount_Positive", checkConstraints);
            var profileChecks = await ConstraintNamesAsync(db, "UserProfiles", "c");
            Assert.Contains("CK_UserProfiles_TotalXp_NonNegative", profileChecks);
            Assert.Contains("CK_UserProfiles_Level_Range", profileChecks);

            var indexes = await IndexNamesAsync(db, "XpTransactions");
            Assert.Contains("UX_XpTransactions_SourceCompletionId", indexes);
            Assert.Contains("IX_XpTransactions_UserId_CreatedAt", indexes);
            Assert.Contains("IX_XpTransactions_CommunityRegionIdAtAward_CreatedAt", indexes);
            Assert.DoesNotContain(indexes, name => name.Contains("QuestId", StringComparison.Ordinal));

            Assert.Equal(
                "RESTRICT",
                await DeleteRuleAsync(db, "FK_XpTransactions_AspNetUsers_UserId"));
            Assert.Equal(
                "RESTRICT",
                await DeleteRuleAsync(db, "FK_XpTransactions_Quests_QuestId"));
            Assert.Equal(
                "RESTRICT",
                await DeleteRuleAsync(db, "FK_XpTransactions_QuestCompletions_SourceCompletionId"));
            Assert.Equal(
                "RESTRICT",
                await DeleteRuleAsync(db, "FK_XpTransactions_Regions_CommunityRegionIdAtAward"));
        }
        finally
        {
            await DropDatabaseAsync(connectionString);
        }
    }

    [Fact]
    public async Task UpgradeFromMerged4BSchemaIsAdditiveAndBackfillsProfileDefaults()
    {
        var connectionString = await CreateIsolatedDatabaseAsync();
        try
        {
            await using var db = CreateDbContext(connectionString);
            var migrator = db.GetService<IMigrator>();
            await migrator.MigrateAsync(
                PreviousMigration,
                TestContext.Current.CancellationToken);

            Assert.False(await TableExistsAsync(db, "XpTransactions"));
            var preColumns = await ColumnShapesAsync(db, "UserProfiles");
            Assert.DoesNotContain(preColumns, column => column.Name == "TotalXp");
            Assert.DoesNotContain(preColumns, column => column.Name == "Level");

            var userId = Guid.NewGuid();
            var now = DateTimeOffset.UtcNow;
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "AspNetUsers"
                    ("Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
                     "EmailConfirmed", "PhoneNumberConfirmed", "TwoFactorEnabled",
                     "LockoutEnabled", "AccessFailedCount")
                VALUES ({userId}, {"upgrade@example.test"}, {"UPGRADE@EXAMPLE.TEST"},
                        {"upgrade@example.test"}, {"UPGRADE@EXAMPLE.TEST"},
                        FALSE, FALSE, FALSE, TRUE, 0)
                """, TestContext.Current.CancellationToken);
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "UserProfiles"
                    ("Id", "DisplayName", "ShowCommunityOnPassport", "CreatedAt", "UpdatedAt")
                VALUES ({userId}, {"Upgrade tester"}, FALSE, {now}, {now})
                """, TestContext.Current.CancellationToken);

            await migrator.MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);

            Assert.True(await TableExistsAsync(db, "XpTransactions"));
            var backfilled = await db.Database.SqlQuery<BackfilledProfile>($"""
                SELECT "TotalXp", "Level"
                FROM "UserProfiles"
                WHERE "Id" = {userId}
                """)
                .SingleAsync(TestContext.Current.CancellationToken);
            Assert.Equal(0, backfilled.TotalXp);
            Assert.Equal(1, backfilled.Level);
        }
        finally
        {
            await DropDatabaseAsync(connectionString);
        }
    }

    [Fact]
    public async Task DownDropsLedgerAndProgressionColumnsOnIsolatedCopiedDatabase()
    {
        var connectionString = await CreateIsolatedDatabaseAsync();
        try
        {
            await using var db = CreateDbContext(connectionString);
            var migrator = db.GetService<IMigrator>();
            await migrator.MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);

            // Seed one full award graph so Down() is observed to be destructive
            // to ledger data, not merely to an empty table.
            var graph = await SeedAwardedGraphAsync(db);
            Assert.Equal(1, await db.XpTransactions.CountAsync(
                TestContext.Current.CancellationToken));

            await migrator.MigrateAsync(
                PreviousMigration,
                TestContext.Current.CancellationToken);

            Assert.False(await TableExistsAsync(db, "XpTransactions"));
            var profileColumns = await ColumnShapesAsync(db, "UserProfiles");
            Assert.DoesNotContain(profileColumns, column => column.Name == "TotalXp");
            Assert.DoesNotContain(profileColumns, column => column.Name == "Level");
            Assert.True(await TableExistsAsync(db, "QuestCompletions"));
            Assert.Equal(1, await db.QuestCompletions.CountAsync(
                TestContext.Current.CancellationToken));
            Assert.Equal(graph.CompletionId, await db.QuestCompletions
                .Select(completion => completion.Id)
                .SingleAsync(TestContext.Current.CancellationToken));
        }
        finally
        {
            await DropDatabaseAsync(connectionString);
        }
    }

    private async Task<AwardGraph> SeedAwardedGraphAsync(KiwimpactDbContext db)
    {
        var now = DateTimeOffset.UtcNow;
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "down@example.test",
            NormalizedUserName = "DOWN@EXAMPLE.TEST",
            Email = "down@example.test",
            NormalizedEmail = "DOWN@EXAMPLE.TEST",
            SecurityStamp = Guid.NewGuid().ToString("N"),
            ConcurrencyStamp = Guid.NewGuid().ToString("N"),
        };
        var profile = UserProfile.Create(user.Id, "Down tester", now);
        var quest = Quest.CreateOrganizerOwned(
            user.Id,
            new QuestDetails(
                "Down migration Quest",
                "A Quest used by the destructive Down() observation.",
                QuestCategory.RestoreNature,
                RegistrationMode.Native,
                QuestDifficulty.Medium,
                10,
                now.AddDays(-1),
                now.AddDays(1),
                null,
                null,
                null),
            new QuestCoverImageDetails(
                "/images/quests/down.svg",
                "Down test cover",
                null,
                null,
                null),
            now.AddDays(-2));
        quest.Publish(now.AddDays(-1));
        var participation = QuestParticipation.CreateActive(user.Id, quest.Id, now.AddHours(-1));
        var completion = QuestCompletion.CreateVerifiedWithCode(
            user.Id, quest, participation, null, now);
        var xp = XpTransaction.CreateFromVerifiedCompletion(completion);
        db.Set<ApplicationUser>().Add(user);
        db.UserProfiles.Add(profile);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        db.QuestCompletions.Add(completion);
        db.XpTransactions.Add(xp);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return new AwardGraph(completion.Id);
    }

    private sealed record AwardGraph(Guid CompletionId);

    private sealed record BackfilledProfile(long TotalXp, int Level);

    private async Task<string> CreateIsolatedDatabaseAsync()
    {
        var name = $"xp_mig_{Guid.NewGuid():N}";
        await using var connection = new NpgsqlConnection(_container.GetConnectionString());
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = new NpgsqlCommand(
            $"""CREATE DATABASE "{name}" """,
            connection);
        await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
        return new NpgsqlConnectionStringBuilder(_container.GetConnectionString())
        {
            Database = name,
        }.ConnectionString;
    }

    private async Task DropDatabaseAsync(string connectionString)
    {
        var name = new NpgsqlConnectionStringBuilder(connectionString).Database;
        await using var connection = new NpgsqlConnection(_container.GetConnectionString());
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = new NpgsqlCommand(
            $"""DROP DATABASE IF EXISTS "{name}" WITH (FORCE) """,
            connection);
        await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
    }

    private static KiwimpactDbContext CreateDbContext(string connectionString) =>
        new(new DbContextOptionsBuilder<KiwimpactDbContext>()
            .UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsAssembly(
                    typeof(KiwimpactDbContext).Assembly.FullName))
            .Options);

    private static Task<bool> TableExistsAsync(KiwimpactDbContext db, string table)
    {
        var relation = $"public.\"{table}\"";
        return db.Database.SqlQuery<bool>($"""
                SELECT to_regclass({relation}) IS NOT NULL AS "Value"
                """)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    private static async Task<List<ColumnShape>> ColumnShapesAsync(
        KiwimpactDbContext db,
        string table)
    {
        return await db.Database.SqlQuery<ColumnShape>($"""
                SELECT column_name AS "Name",
                       data_type AS "DataType",
                       is_nullable AS "IsNullable",
                       column_default AS "Default"
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = {table}
                ORDER BY column_name
                """)
            .ToListAsync(TestContext.Current.CancellationToken);
    }

    private static void AssertColumn(
        IReadOnlyCollection<ColumnShape> columns,
        string name,
        string dataType,
        bool nullable,
        string? expectedDefault = null)
    {
        var column = Assert.Single(columns, candidate => candidate.Name == name);
        Assert.Equal(dataType, column.DataType);
        Assert.Equal(nullable ? "YES" : "NO", column.IsNullable);
        if (expectedDefault is not null)
            Assert.Equal(expectedDefault, column.Default);
    }

    private static async Task<List<string>> ConstraintNamesAsync(
        KiwimpactDbContext db,
        string table,
        string type)
    {
        return await db.Database.SqlQuery<string>($"""
                SELECT conname AS "Value"
                FROM pg_constraint
                WHERE conrelid = {"public.\"" + table + "\""}::regclass
                  AND contype = {type}
                """)
            .ToListAsync(TestContext.Current.CancellationToken);
    }

    private static async Task<List<string>> IndexNamesAsync(
        KiwimpactDbContext db,
        string table)
    {
        return await db.Database.SqlQuery<string>($"""
                SELECT indexname AS "Value"
                FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = {table}
                """)
            .ToListAsync(TestContext.Current.CancellationToken);
    }

    private static async Task<string> DeleteRuleAsync(KiwimpactDbContext db, string constraint)
    {
        return await db.Database.SqlQuery<string>($"""
                SELECT rc.delete_rule AS "Value"
                FROM information_schema.referential_constraints rc
                WHERE rc.constraint_schema = 'public' AND rc.constraint_name = {constraint}
                """)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    private sealed record ColumnShape(
        string Name,
        string DataType,
        string IsNullable,
        string? Default);
}
