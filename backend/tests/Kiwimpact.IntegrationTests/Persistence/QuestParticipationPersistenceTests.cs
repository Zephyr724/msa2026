using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Persistence;

public sealed class QuestParticipationPersistenceTests
    : IClassFixture<TestDatabaseFixture>
{
    private readonly TestDatabaseFixture _fixture;

    public QuestParticipationPersistenceTests(TestDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task ActiveUniqueIndex_HasAcceptedColumnsPredicateAndBehavior()
    {
        using var scope = await _fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedGraphAsync(db);
        var now = DateTimeOffset.UtcNow;
        var active = QuestParticipation.CreateActive(graph.ParticipantId, graph.QuestId, now);
        db.QuestParticipations.Add(active);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        var definition = await IndexDefinitionAsync(
            db,
            "UX_QuestParticipations_UserId_QuestId_Active");
        Assert.Contains("(\"UserId\", \"QuestId\")", definition);
        Assert.Contains("UNIQUE INDEX", definition);
        Assert.Contains("WHERE (\"CancelledAt\" IS NULL)", definition);

        var duplicateId = Guid.NewGuid();
        var exception = await Assert.ThrowsAsync<PostgresException>(() =>
            db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "QuestParticipations"
                    ("Id", "UserId", "QuestId", "JoinedAt", "CancelledAt")
                VALUES
                    ({duplicateId}, {graph.ParticipantId}, {graph.QuestId}, {now}, NULL)
                """, TestContext.Current.CancellationToken));
        Assert.Equal(PostgresErrorCodes.UniqueViolation, exception.SqlState);

        active.Cancel(now.AddMinutes(1));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        db.QuestParticipations.Add(
            QuestParticipation.CreateActive(graph.ParticipantId, graph.QuestId, now.AddMinutes(2)));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        Assert.Equal(
            2,
            await db.QuestParticipations.CountAsync(
                item => item.UserId == graph.ParticipantId && item.QuestId == graph.QuestId,
                TestContext.Current.CancellationToken));
        Assert.Equal(
            1,
            await db.QuestParticipations.CountAsync(
                item =>
                    item.UserId == graph.ParticipantId &&
                    item.QuestId == graph.QuestId &&
                    item.CancelledAt == null,
                TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task CapacityIndex_HasAcceptedQuestColumnAndActivePredicate()
    {
        using var scope = await _fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        var definition = await IndexDefinitionAsync(
            db,
            "IX_QuestParticipations_QuestId_Active");

        Assert.Contains("(\"QuestId\")", definition);
        Assert.Contains("WHERE (\"CancelledAt\" IS NULL)", definition);
        Assert.DoesNotContain("\"UserId\"", definition);
    }

    [Fact]
    public async Task RestrictRelationshipsRejectQuestAndParticipantUserDeletesAndKeepHistory()
    {
        using var scope = await _fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedGraphAsync(db);
        var history = QuestParticipation.CreateActive(
            graph.ParticipantId,
            graph.QuestId,
            DateTimeOffset.UtcNow);
        history.Cancel(DateTimeOffset.UtcNow.AddMinutes(1));
        db.QuestParticipations.Add(history);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        var questDelete = await Assert.ThrowsAsync<PostgresException>(() =>
            db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"Quests\" WHERE \"Id\" = {graph.QuestId}",
                TestContext.Current.CancellationToken));
        Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, questDelete.SqlState);
        Assert.Equal(
            1,
            await db.QuestParticipations.CountAsync(
                item => item.Id == history.Id,
                TestContext.Current.CancellationToken));

        var userDelete = await Assert.ThrowsAsync<PostgresException>(() =>
            db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"AspNetUsers\" WHERE \"Id\" = {graph.ParticipantId}",
                TestContext.Current.CancellationToken));
        Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, userDelete.SqlState);
        Assert.Equal(
            1,
            await db.QuestParticipations.CountAsync(
                item => item.Id == history.Id,
                TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task VersionMapsToStoreGeneratedXminAndChangesOnUpdate()
    {
        using var scope = await _fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var graph = await SeedGraphAsync(db);
        var participation = QuestParticipation.CreateActive(
            graph.ParticipantId,
            graph.QuestId,
            DateTimeOffset.UtcNow);
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        var initialVersion = participation.Version;

        var entityType = db.Model.FindEntityType(typeof(QuestParticipation));
        var version = entityType?.FindProperty(nameof(QuestParticipation.Version));
        Assert.NotNull(version);
        Assert.True(version.IsConcurrencyToken);
        Assert.Equal(ValueGenerated.OnAddOrUpdate, version.ValueGenerated);
        Assert.Equal(
            "xmin",
            version.GetColumnName(StoreObjectIdentifier.Table("QuestParticipations", null)));

        var normalColumnExists = await db.Database.SqlQueryRaw<bool>("""
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'QuestParticipations'
                      AND column_name = 'Version') AS "Value"
                """)
            .SingleAsync(TestContext.Current.CancellationToken);
        Assert.False(normalColumnExists);
        Assert.NotEqual(0u, initialVersion);

        participation.Cancel(DateTimeOffset.UtcNow.AddMinutes(1));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        Assert.NotEqual(initialVersion, participation.Version);
    }

    private static async Task<string> IndexDefinitionAsync(
        KiwimpactDbContext db,
        string indexName)
    {
        return await db.Database.SqlQuery<string>($"""
                SELECT indexdef AS "Value"
                FROM pg_indexes
                WHERE schemaname = 'public' AND indexname = {indexName}
                """)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    private static async Task<ParticipationGraph> SeedGraphAsync(KiwimpactDbContext db)
    {
        var creator = NewUser("creator");
        var participant = NewUser("participant");
        db.Set<ApplicationUser>().AddRange(creator, participant);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        var now = DateTimeOffset.UtcNow;
        var quest = Quest.CreateOrganizerOwned(
            creator.Id,
            new QuestDetails(
                $"Persistence {Guid.NewGuid():N}",
                "A Quest for participation persistence guarantees.",
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
                "/images/quests/test.svg",
                "Persistence test cover",
                null,
                null,
                null),
            now.AddDays(-2));
        quest.Publish(now.AddDays(-1));
        db.Quests.Add(quest);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return new ParticipationGraph(quest.Id, participant.Id);
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

    private sealed record ParticipationGraph(Guid QuestId, Guid ParticipantId);
}
