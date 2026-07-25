using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Security;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Persistence;

public sealed class QuestCompletionPersistenceTests
    : IClassFixture<TestDatabaseFixture>
{
    private static readonly CompletionCodeProtector Protector = new(
        Enumerable.Range(1, 32).Select(value => (byte)value).ToArray());
    private readonly TestDatabaseFixture _fixture;

    public QuestCompletionPersistenceTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task VerifiedCompletionPartialUniqueIndexHasApprovedDefinitionAndBehavior()
    {
        using var scope = await _fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedGraphAsync(db);
        var completion = CreateCompletion(graph);
        db.QuestCompletions.Add(completion);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        var definition = await IndexDefinitionAsync(
            db,
            "UX_QuestCompletions_UserId_QuestId_Verified");
        Assert.Contains("UNIQUE INDEX", definition);
        Assert.Contains("(\"UserId\", \"QuestId\")", definition);
        Assert.Contains("WHERE ((\"Status\")::text = 'Verified'::text)", definition);

        var exception = await Assert.ThrowsAsync<PostgresException>(() =>
            db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "QuestCompletions"
                    ("Id", "UserId", "QuestId", "ParticipationId", "Method", "Status",
                     "CompletedAt", "VerifiedAtUtc", "RewardDifficultySnapshot",
                     "CommunityRegionIdAtCompletion", "CreatedAt", "UpdatedAt")
                VALUES
                    ({Guid.NewGuid()}, {graph.Participant.Id}, {graph.Quest.Id},
                     {graph.Participation.Id}, 'CompletionCode', 'Verified',
                     {DateTimeOffset.UtcNow}, {DateTimeOffset.UtcNow}, 'Easy', NULL,
                     {DateTimeOffset.UtcNow}, {DateTimeOffset.UtcNow})
                """, TestContext.Current.CancellationToken));
        Assert.Equal(PostgresErrorCodes.UniqueViolation, exception.SqlState);
        Assert.Equal(
            "UX_QuestCompletions_UserId_QuestId_Verified",
            exception.ConstraintName);
    }

    [Fact]
    public async Task ActiveCodePartialUniqueIndexAndValidityCheckAreDatabaseBackstops()
    {
        using var scope = await _fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedGraphAsync(db);
        var now = DateTimeOffset.UtcNow;
        var active = CreateCode(graph, "ABCDE23456", now, now.AddDays(1));
        db.CompletionCodes.Add(active);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        var activeIndex = await IndexDefinitionAsync(
            db,
            "UX_CompletionCodes_QuestId_Active");
        var lookupIndex = await IndexDefinitionAsync(
            db,
            "IX_CompletionCodes_QuestId_IsActive_IsRevoked");
        Assert.Contains("UNIQUE INDEX", activeIndex);
        Assert.Contains("(\"QuestId\")", activeIndex);
        Assert.Contains("WHERE (\"IsActive\" AND (NOT \"IsRevoked\"))", activeIndex);
        Assert.Contains("(\"QuestId\", \"IsActive\", \"IsRevoked\")", lookupIndex);

        var duplicate = CreateCode(graph, "FGHJK6789A", now, now.AddDays(1));
        db.CompletionCodes.Add(duplicate);
        var unique = await Assert.ThrowsAsync<DbUpdateException>(() =>
            db.SaveChangesAsync(TestContext.Current.CancellationToken));
        var uniquePostgres = Assert.IsType<PostgresException>(unique.InnerException);
        Assert.Equal(PostgresErrorCodes.UniqueViolation, uniquePostgres.SqlState);
        Assert.Equal("UX_CompletionCodes_QuestId_Active", uniquePostgres.ConstraintName);
        db.Entry(duplicate).State = EntityState.Detached;

        var check = await Assert.ThrowsAsync<PostgresException>(() =>
            db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "CompletionCodes"
                    ("Id", "QuestId", "CodeHash", "ValidFrom", "ValidTo", "IsActive",
                     "IsRevoked", "CreatedByUserId", "CreatedAt")
                VALUES
                    ({Guid.NewGuid()}, {graph.Quest.Id}, {"x"}, {now}, {now}, FALSE,
                     TRUE, {graph.Creator.Id}, {now})
                """, TestContext.Current.CancellationToken));
        Assert.Equal(PostgresErrorCodes.CheckViolation, check.SqlState);
        Assert.Equal("CK_CompletionCodes_ValidityWindow", check.ConstraintName);

        active.Revoke();
        db.CompletionCodes.Add(CreateCode(graph, "FGHJK6789A", now, null));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, await db.CompletionCodes.CountAsync(
            code => code.QuestId == graph.Quest.Id && code.IsActive && !code.IsRevoked,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task DeleteBehaviorsKeepCompletionHistoryAndProtectReferencedRows()
    {
        using var scope = await _fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedGraphAsync(db, withCommunity: true);
        var completion = CreateCompletion(graph);
        db.QuestCompletions.Add(completion);
        db.CompletionCodes.Add(CreateCode(
            graph,
            "ABCDE23456",
            DateTimeOffset.UtcNow,
            null));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        await db.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM \"QuestParticipations\" WHERE \"Id\" = {graph.Participation.Id}",
            TestContext.Current.CancellationToken);
        db.ChangeTracker.Clear();
        var retained = await db.QuestCompletions.SingleAsync(
            item => item.Id == completion.Id,
            TestContext.Current.CancellationToken);
        Assert.Null(retained.ParticipationId);

        foreach (var command in new[]
        {
            $"DELETE FROM \"Quests\" WHERE \"Id\" = '{graph.Quest.Id}'",
            $"DELETE FROM \"AspNetUsers\" WHERE \"Id\" = '{graph.Participant.Id}'",
            $"DELETE FROM \"AspNetUsers\" WHERE \"Id\" = '{graph.Creator.Id}'",
            $"DELETE FROM \"Regions\" WHERE \"Id\" = '{graph.CommunityId}'",
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
    public async Task QuestCompletionUsesXminWhileCompletionCodeHasNoConcurrencyColumn()
    {
        using var scope = await _fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedGraphAsync(db);
        var completion = CreateCompletion(graph);
        db.QuestCompletions.Add(completion);
        db.CompletionCodes.Add(CreateCode(
            graph,
            "ABCDE23456",
            DateTimeOffset.UtcNow,
            null));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        var initialVersion = completion.Version;

        var entityType = db.Model.FindEntityType(typeof(QuestCompletion));
        var version = entityType?.FindProperty(nameof(QuestCompletion.Version));
        Assert.NotNull(version);
        Assert.True(version.IsConcurrencyToken);
        Assert.Equal(ValueGenerated.OnAddOrUpdate, version.ValueGenerated);
        Assert.Equal("xmin", version.GetColumnName());

        completion.UpdatedAt = completion.UpdatedAt.AddMinutes(1);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        Assert.NotEqual(0u, initialVersion);
        Assert.NotEqual(initialVersion, completion.Version);

        var completionCodeEntity = db.Model.FindEntityType(typeof(CompletionCode));
        Assert.DoesNotContain(
            completionCodeEntity!.GetProperties(),
            property => property.IsConcurrencyToken);
        var forbiddenColumns = await db.Database.SqlQuery<string>($"""
                SELECT column_name AS "Value"
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'CompletionCodes'
                  AND lower(column_name) IN ('plaintext', 'salt', 'updatedat', 'version', 'xmin')
                """)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Empty(forbiddenColumns);
    }

    [Fact]
    public async Task SchemaContainsNoXpTransactionAndCompletionHasOnlyApprovedIndexes()
    {
        using var scope = await _fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        var xpTable = await db.Database.SqlQueryRaw<bool>(
                "SELECT to_regclass('public.\"XpTransactions\"') IS NOT NULL AS \"Value\"")
            .SingleAsync(TestContext.Current.CancellationToken);
        Assert.False(xpTable);

        var completionIndexes = await db.Database.SqlQuery<string>($"""
                SELECT indexname AS "Value"
                FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'QuestCompletions'
                ORDER BY indexname
                """)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Contains("IX_QuestCompletions_ParticipationId", completionIndexes);
        Assert.Contains("UX_QuestCompletions_UserId_QuestId_Verified", completionIndexes);
        Assert.DoesNotContain(
            completionIndexes,
            name => name.Contains("Evidence", StringComparison.OrdinalIgnoreCase) ||
                name.Contains("SelfReported", StringComparison.OrdinalIgnoreCase));
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

    private static QuestCompletion CreateCompletion(CompletionGraph graph) =>
        QuestCompletion.CreateVerifiedWithCode(
            graph.Participant.Id,
            graph.Quest,
            graph.Participation,
            graph.CommunityId,
            DateTimeOffset.UtcNow);

    private static CompletionCode CreateCode(
        CompletionGraph graph,
        string normalizedCode,
        DateTimeOffset validFrom,
        DateTimeOffset? validTo) =>
        CompletionCode.Create(
            graph.Quest.Id,
            Protector.ComputeHash(graph.Quest.Id, normalizedCode),
            validFrom,
            validTo,
            graph.Creator.Id,
            validFrom);

    private static async Task<CompletionGraph> SeedGraphAsync(
        KiwimpactDbContext db,
        bool withCommunity = false)
    {
        var creator = NewUser("completion-creator");
        var participant = NewUser("completion-participant");
        db.Set<ApplicationUser>().AddRange(creator, participant);

        Guid? communityId = null;
        if (withCommunity)
        {
            var community = new Region
            {
                Id = Guid.NewGuid(),
                Name = $"Completion Community {Guid.NewGuid():N}",
                Type = RegionType.Country,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            communityId = community.Id;
            db.Regions.Add(community);
        }
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        var now = DateTimeOffset.UtcNow;
        var quest = Quest.CreateOrganizerOwned(
            creator.Id,
            new QuestDetails(
                $"Completion persistence {Guid.NewGuid():N}",
                "A Quest for completion persistence guarantees.",
                QuestCategory.RestoreNature,
                RegistrationMode.Native,
                QuestDifficulty.Easy,
                10,
                now.AddDays(-1),
                now.AddDays(1),
                null,
                null,
                null),
            new QuestCoverImageDetails(
                "/images/quests/completion.svg",
                "Completion persistence cover",
                null,
                null,
                null),
            now.AddDays(-2));
        quest.Publish(now.AddDays(-1));
        var participation = QuestParticipation.CreateActive(
            participant.Id,
            quest.Id,
            now.AddHours(-1));
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return new CompletionGraph(
            creator,
            participant,
            quest,
            participation,
            communityId);
    }

    private static ApplicationUser NewUser(string prefix)
    {
        var value = $"{prefix}-{Guid.NewGuid():N}@example.test";
        return new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = value,
            NormalizedUserName = value.ToUpperInvariant(),
            Email = value,
            NormalizedEmail = value.ToUpperInvariant(),
            SecurityStamp = Guid.NewGuid().ToString("N"),
            ConcurrencyStamp = Guid.NewGuid().ToString("N"),
        };
    }

    private sealed record CompletionGraph(
        ApplicationUser Creator,
        ApplicationUser Participant,
        Quest Quest,
        QuestParticipation Participation,
        Guid? CommunityId);
}
