using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Kiwimpact.IntegrationTests.Persistence;

/// <summary>
/// Migration tests for the achievement history and the additive richer-
/// achievements migration. Each test runs against its own isolated database
/// inside the container so clean-schema, upgrade, and destructive Down()
/// observations never share state.
/// </summary>
public sealed class AchievementMigrationUpgradeTests : IAsyncLifetime
{
    private const string PreAchievementsMigration =
        "20260725144430_AddXpLedgerAndProgression";
    private const string DirectPreviousMigration =
        "20260726233101_AddCommunityDiscovery";
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
    public async Task CleanSchemaMigrationCreatesExactAchievementShape()
    {
        var connectionString = await CreateIsolatedDatabaseAsync();
        try
        {
            await using var db = CreateDbContext(connectionString);
            await db.GetService<IMigrator>()
                .MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);

            Assert.True(await TableExistsAsync(db, "Achievements"));
            Assert.True(await TableExistsAsync(db, "UserAchievements"));
            AssertColumn(
                await ColumnShapesAsync(db, "QuestCompletions"),
                "QuestCategorySnapshot",
                "character varying",
                false);
            AssertColumn(
                await ColumnShapesAsync(db, "UserProfiles"),
                "AchievementEvaluationVersion",
                "integer",
                false,
                "2");
            Assert.Contains(
                "IX_UserProfiles_AchievementEvaluationVersion",
                await IndexNamesAsync(db, "UserProfiles"));
            Assert.Contains(
                "CK_UserProfiles_AchievementEvaluationVersion_NonNegative",
                await ConstraintNamesAsync(db, "UserProfiles", "c"));
            Assert.Contains(
                "IX_QuestCompletions_UserId_CategorySnapshot_VerifiedAtUtc",
                await IndexNamesAsync(db, "QuestCompletions"));

            var achievementColumns = await ColumnShapesAsync(db, "Achievements");
            AssertColumn(achievementColumns, "Id", "uuid", false);
            AssertColumn(achievementColumns, "Code", "character varying", false);
            AssertColumn(achievementColumns, "Name", "character varying", false);
            AssertColumn(achievementColumns, "Description", "character varying", false);
            AssertColumn(achievementColumns, "IconUrl", "character varying", true);
            AssertColumn(achievementColumns, "Category", "character varying", false);
            AssertColumn(achievementColumns, "IsActive", "boolean", false, "true");
            AssertColumn(achievementColumns, "CreatedAt", "timestamp with time zone", false);
            Assert.Equal(8, achievementColumns.Count);

            var awardColumns = await ColumnShapesAsync(db, "UserAchievements");
            AssertColumn(awardColumns, "Id", "uuid", false);
            AssertColumn(awardColumns, "UserId", "uuid", false);
            AssertColumn(awardColumns, "AchievementId", "uuid", false);
            AssertColumn(awardColumns, "AwardedAt", "timestamp with time zone", false);
            AssertColumn(awardColumns, "XpTransactionId", "uuid", true);
            AssertColumn(
                awardColumns,
                "SourceCommunityChallengeId",
                "uuid",
                true);
            Assert.Equal(6, awardColumns.Count);

            var achievementIndexes = await IndexNamesAsync(db, "Achievements");
            Assert.Equal(2, achievementIndexes.Count);
            Assert.Contains("PK_Achievements", achievementIndexes);
            Assert.Contains("UX_Achievements_Code", achievementIndexes);

            var awardIndexes = await IndexNamesAsync(db, "UserAchievements");
            Assert.Equal(6, awardIndexes.Count);
            Assert.Contains("PK_UserAchievements", awardIndexes);
            Assert.Contains("UX_UserAchievements_Milestone", awardIndexes);
            Assert.Contains("UX_UserAchievements_CommunityChallenge", awardIndexes);
            Assert.Contains("IX_UserAchievements_AchievementId", awardIndexes);
            Assert.Contains("IX_UserAchievements_XpTransactionId", awardIndexes);
            Assert.Contains(
                "IX_UserAchievements_SourceCommunityChallengeId",
                awardIndexes);

            Assert.Equal(
                "RESTRICT",
                await DeleteRuleAsync(db, "FK_UserAchievements_AspNetUsers_UserId"));
            Assert.Equal(
                "RESTRICT",
                await DeleteRuleAsync(db, "FK_UserAchievements_Achievements_AchievementId"));
            Assert.Equal(
                "RESTRICT",
                await DeleteRuleAsync(db, "FK_UserAchievements_XpTransactions_XpTransactionId"));
            Assert.Equal(
                "RESTRICT",
                await DeleteRuleAsync(
                    db,
                    "FK_UserAchievements_CommunityChallenges_SourceCommunityChallen~"));
        }
        finally
        {
            await DropDatabaseAsync(connectionString);
        }
    }

    [Fact]
    public async Task UpgradeFromMerged5BSchemaIsAdditiveAndLeavesExistingRowsUntouched()
    {
        var connectionString = await CreateIsolatedDatabaseAsync();
        try
        {
            await using var db = CreateDbContext(connectionString);
            var migrator = db.GetService<IMigrator>();
            await migrator.MigrateAsync(
                cancellationToken: TestContext.Current.CancellationToken);
            var graph = await SeedAwardedGraphAsync(db);

            await migrator.MigrateAsync(
                PreAchievementsMigration,
                TestContext.Current.CancellationToken);

            Assert.False(await TableExistsAsync(db, "Achievements"));
            Assert.False(await TableExistsAsync(db, "UserAchievements"));

            Assert.Equal(1, await db.XpTransactions.CountAsync(
                TestContext.Current.CancellationToken));

            await migrator.MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);

            Assert.True(await TableExistsAsync(db, "Achievements"));
            Assert.True(await TableExistsAsync(db, "UserAchievements"));
            // The migration is schema-only: existing rows are byte-identical
            // and no award backfill happened inside the migration.
            Assert.Equal(1, await db.XpTransactions.CountAsync(
                TestContext.Current.CancellationToken));
            Assert.Equal(graph.CompletionId, await db.QuestCompletions
                .Select(completion => completion.Id)
                .SingleAsync(TestContext.Current.CancellationToken));
            Assert.Equal(0, await db.UserAchievements.CountAsync(
                TestContext.Current.CancellationToken));
            Assert.Equal(0, await db.Achievements.CountAsync(
                TestContext.Current.CancellationToken));
            Assert.Equal(
                QuestCategory.RestoreNature,
                await db.QuestCompletions
                    .Where(completion => completion.Id == graph.CompletionId)
                    .Select(completion => completion.QuestCategorySnapshot)
                    .SingleAsync(TestContext.Current.CancellationToken));
            Assert.Equal(
                0,
                await db.UserProfiles
                    .Where(profile => profile.Id == graph.UserId)
                    .Select(profile => profile.AchievementEvaluationVersion)
                    .SingleAsync(TestContext.Current.CancellationToken));
        }
        finally
        {
            await DropDatabaseAsync(connectionString);
        }
    }

    [Fact]
    public async Task DirectUpgradeBackfillsSnapshotsAndDirectDownPreservesAchievementData()
    {
        var connectionString = await CreateIsolatedDatabaseAsync();
        try
        {
            await using var db = CreateDbContext(connectionString);
            var migrator = db.GetService<IMigrator>();
            await migrator.MigrateAsync(
                cancellationToken: TestContext.Current.CancellationToken);
            var graph = await SeedAwardedGraphAsync(db);
            await AchievementSeed.SeedAndValidateAsync(
                db,
                TestContext.Current.CancellationToken);
            var xp = await db.XpTransactions.SingleAsync(
                TestContext.Current.CancellationToken);
            db.UserAchievements.Add(UserAchievement.CreateFromMilestone(
                graph.UserId,
                new Kiwimpact.Core.Achievements.PendingAchievementAward(
                    Kiwimpact.Core.Achievements.AchievementCatalog.FirstSteps.Id,
                    xp.Id,
                    xp.CreatedAt)));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);

            await migrator.MigrateAsync(
                DirectPreviousMigration,
                TestContext.Current.CancellationToken);

            Assert.True(await TableExistsAsync(db, "Achievements"));
            Assert.True(await TableExistsAsync(db, "UserAchievements"));
            Assert.Equal(
                1,
                await db.UserAchievements.CountAsync(
                    TestContext.Current.CancellationToken));
            Assert.DoesNotContain(
                await ColumnShapesAsync(db, "QuestCompletions"),
                column => column.Name == "QuestCategorySnapshot");
            Assert.DoesNotContain(
                await ColumnShapesAsync(db, "UserProfiles"),
                column => column.Name == "AchievementEvaluationVersion");

            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE \"Quests\" SET \"Category\" = {QuestCategory.LearnShare.ToString()} WHERE \"Id\" = {graph.QuestId}",
                TestContext.Current.CancellationToken);

            await migrator.MigrateAsync(
                cancellationToken: TestContext.Current.CancellationToken);
            db.ChangeTracker.Clear();

            Assert.Equal(
                QuestCategory.LearnShare,
                await db.QuestCompletions
                    .Where(completion => completion.Id == graph.CompletionId)
                    .Select(completion => completion.QuestCategorySnapshot)
                    .SingleAsync(TestContext.Current.CancellationToken));
            Assert.Equal(
                0,
                await db.UserProfiles
                    .Where(profile => profile.Id == graph.UserId)
                    .Select(profile => profile.AchievementEvaluationVersion)
                    .SingleAsync(TestContext.Current.CancellationToken));
            Assert.Equal(
                1,
                await db.UserAchievements.CountAsync(
                    TestContext.Current.CancellationToken));
        }
        finally
        {
            await DropDatabaseAsync(connectionString);
        }
    }

    [Fact]
    public async Task DownDropsBothAchievementTablesAndKeepsTheLedgerGraph()
    {
        var connectionString = await CreateIsolatedDatabaseAsync();
        try
        {
            await using var db = CreateDbContext(connectionString);
            var migrator = db.GetService<IMigrator>();
            await migrator.MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);

            var graph = await SeedAwardedGraphAsync(db);
            await AchievementSeed.SeedAndValidateAsync(
                db, TestContext.Current.CancellationToken);
            var xp = await db.XpTransactions.SingleAsync(
                TestContext.Current.CancellationToken);
            db.UserAchievements.Add(UserAchievement.CreateFromMilestone(
                graph.UserId,
                new Kiwimpact.Core.Achievements.PendingAchievementAward(
                    Kiwimpact.Core.Achievements.AchievementCatalog.FirstSteps.Id,
                    xp.Id,
                    xp.CreatedAt)));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
            Assert.Equal(1, await db.UserAchievements.CountAsync(
                TestContext.Current.CancellationToken));

            await migrator.MigrateAsync(
                PreAchievementsMigration,
                TestContext.Current.CancellationToken);

            Assert.False(await TableExistsAsync(db, "Achievements"));
            Assert.False(await TableExistsAsync(db, "UserAchievements"));
            Assert.True(await TableExistsAsync(db, "XpTransactions"));
            Assert.Equal(1, await db.XpTransactions.CountAsync(
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

    private static async Task<AwardGraph> SeedAwardedGraphAsync(KiwimpactDbContext db)
    {
        var now = DateTimeOffset.UtcNow;
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "ach-migration@example.test",
            NormalizedUserName = "ACH-MIGRATION@EXAMPLE.TEST",
            Email = "ach-migration@example.test",
            NormalizedEmail = "ACH-MIGRATION@EXAMPLE.TEST",
            SecurityStamp = Guid.NewGuid().ToString("N"),
            ConcurrencyStamp = Guid.NewGuid().ToString("N"),
        };
        var profile = UserProfile.Create(user.Id, "Achievement migration tester", now);
        var quest = Quest.CreateOrganizerOwned(
            user.Id,
            new QuestDetails(
                $"Achievement migration Quest {Guid.NewGuid():N}",
                "A Quest used by the achievement migration observations.",
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
                "/images/quests/achievement-migration.svg",
                "Achievement migration test cover",
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
        return new AwardGraph(user.Id, quest.Id, completion.Id);
    }

    private sealed record AwardGraph(
        Guid UserId,
        Guid QuestId,
        Guid CompletionId);

    private async Task<string> CreateIsolatedDatabaseAsync()
    {
        var name = $"ach_mig_{Guid.NewGuid():N}";
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

    private static async Task<List<string>> ConstraintNamesAsync(
        KiwimpactDbContext db,
        string table,
        string type)
    {
        return await db.Database.SqlQuery<string>($"""
                SELECT conname AS "Value"
                FROM pg_constraint
                WHERE conrelid = {"public.\"" + table + "\""}::regclass
                  AND contype::text = {type}
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
