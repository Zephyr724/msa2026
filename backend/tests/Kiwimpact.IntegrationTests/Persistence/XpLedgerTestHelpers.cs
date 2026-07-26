using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Security;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.IntegrationTests.Persistence;

/// <summary>
/// Shared graph-seeding helpers for the XP ledger persistence, reconciliation,
/// and concurrency tests.
/// </summary>
internal static class XpLedgerTestHelpers
{
    public static readonly CompletionCodeProtector Protector = new(
        Enumerable.Range(1, 32).Select(value => (byte)value).ToArray());

    public const string NormalizedCode = "ABCDE23456";
    public const string DisplayCode = "ABCDE-23456";

    public static ApplicationUser NewUser(string prefix)
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

    public static UserProfile NewProfile(Guid userId) =>
        UserProfile.Create(userId, "XP tester", DateTimeOffset.UtcNow);

    public static async Task<Region> SeedRegionAsync(KiwimpactDbContext db, string prefix)
    {
        var region = new Region
        {
            Id = Guid.NewGuid(),
            Name = $"{prefix} {Guid.NewGuid():N}",
            Type = RegionType.Country,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        db.Regions.Add(region);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return region;
    }

    public static Quest NewQuest(
        Guid creatorId,
        QuestDifficulty difficulty = QuestDifficulty.Easy)
    {
        var now = DateTimeOffset.UtcNow;
        var quest = Quest.CreateOrganizerOwned(
            creatorId,
            new QuestDetails(
                $"XP ledger {Guid.NewGuid():N}",
                "A Quest used to verify XP ledger behavior.",
                QuestCategory.RestoreNature,
                RegistrationMode.Native,
                difficulty,
                20,
                now.AddDays(-1),
                now.AddDays(1),
                null,
                null,
                null),
            new QuestCoverImageDetails(
                "/images/quests/xp-ledger.svg",
                "XP ledger test cover",
                null,
                null,
                null),
            now.AddDays(-2));
        quest.Publish(now.AddDays(-1));
        return quest;
    }

    public static CompletionCode NewActiveCode(Quest quest, Guid creatorId)
    {
        var now = DateTimeOffset.UtcNow;
        return CompletionCode.Create(
            quest.Id,
            Protector.ComputeHash(quest.Id, NormalizedCode),
            now.AddHours(-1),
            now.AddDays(1),
            creatorId,
            now.AddHours(-1));
    }

    /// <summary>
    /// Seeds a creator, an actor with a profile, a published Quest of the
    /// given difficulty, an active participation, and an active Completion
    /// Code — everything a redemption needs.
    /// </summary>
    public static async Task<RedemptionGraph> SeedRedemptionGraphAsync(
        KiwimpactDbContext db,
        QuestDifficulty difficulty = QuestDifficulty.Easy,
        Guid? communityRegionId = null)
    {
        var creator = NewUser("xp-creator");
        var actor = NewUser("xp-actor");
        var profile = NewProfile(actor.Id);
        profile.HomeCommunityRegionId = communityRegionId;
        var quest = NewQuest(creator.Id, difficulty);
        var participation = QuestParticipation.CreateActive(
            actor.Id, quest.Id, DateTimeOffset.UtcNow.AddHours(-1));
        var code = NewActiveCode(quest, creator.Id);

        db.Set<ApplicationUser>().AddRange(creator, actor);
        db.UserProfiles.Add(profile);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        db.CompletionCodes.Add(code);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return new RedemptionGraph(creator, actor, profile, quest, participation, code);
    }

    /// <summary>
    /// Seeds a Slice-4B-style Verified completion with no XP row: the exact
    /// reconciliation input shape.
    /// </summary>
    public static async Task<QuestCompletion> SeedPendingCompletionAsync(
        KiwimpactDbContext db,
        QuestDifficulty difficulty = QuestDifficulty.Easy,
        Guid? communityRegionId = null,
        DateTimeOffset? verifiedAtUtc = null)
    {
        var graph = await SeedRedemptionGraphAsync(db, difficulty, communityRegionId);
        var completion = QuestCompletion.CreateVerifiedWithCode(
            graph.Actor.Id,
            graph.Quest,
            graph.Participation,
            communityRegionId,
            verifiedAtUtc ?? DateTimeOffset.UtcNow);
        db.QuestCompletions.Add(completion);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return completion;
    }

    public static async Task<int> CountXpRowsAsync(KiwimpactDbContext db, Guid completionId) =>
        await db.XpTransactions.CountAsync(
            transaction => transaction.SourceCompletionId == completionId,
            TestContext.Current.CancellationToken);

    public static QuestCompletionRepository NewQuestCompletionRepository(
        KiwimpactDbContext db) =>
        new(db, Protector, new AchievementAwardService(db));

    public static XpLedgerRepository NewXpLedgerRepository(KiwimpactDbContext db) =>
        new(db, new AchievementAwardService(db));

    /// <summary>
    /// Seeds a pre-6A-style awarded completion: a Verified completion plus a
    /// raw-inserted XP row, deliberately without any achievement award — the
    /// exact historical backfill input shape.
    /// </summary>
    public static async Task<QuestCompletion> SeedLegacyAwardedCompletionAsync(
        KiwimpactDbContext db,
        QuestDifficulty difficulty = QuestDifficulty.Easy,
        DateTimeOffset? verifiedAtUtc = null,
        Guid? communityRegionId = null)
    {
        var completion = await SeedPendingCompletionAsync(
            db, difficulty, communityRegionId, verifiedAtUtc);
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "XpTransactions"
                ("Id", "UserId", "QuestId", "SourceCompletionId", "XpAmount",
                 "CommunityRegionIdAtAward", "CreatedAt")
            VALUES
                ({Guid.NewGuid()}, {completion.UserId}, {completion.QuestId},
                 {completion.Id},
                 {Kiwimpact.Core.Progression.ProgressionRules.XpForDifficulty(difficulty)},
                 {communityRegionId}, {completion.VerifiedAtUtc!.Value})
            """, TestContext.Current.CancellationToken);
        return completion;
    }

    public static async Task<bool> WaitForBlockedSessionsAsync(
        string connectionString,
        string queryFragment,
        int expected,
        TimeSpan timeout)
    {
        var deadline = DateTimeOffset.UtcNow + timeout;
        await using var connection = new Npgsql.NpgsqlConnection(connectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);

        while (DateTimeOffset.UtcNow < deadline)
        {
            await using var command = new Npgsql.NpgsqlCommand("""
                SELECT count(*)
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND state = 'active'
                  AND wait_event_type = 'Lock'
                  AND query LIKE @fragment
                """, connection);
            command.Parameters.AddWithValue("fragment", $"%{queryFragment}%");
            var observed = Convert.ToInt32(
                await command.ExecuteScalarAsync(TestContext.Current.CancellationToken));
            if (observed >= expected)
                return true;
            await Task.Delay(50, TestContext.Current.CancellationToken);
        }

        return false;
    }

    public sealed record RedemptionGraph(
        ApplicationUser Creator,
        ApplicationUser Actor,
        UserProfile Profile,
        Quest Quest,
        QuestParticipation Participation,
        CompletionCode Code);
}
