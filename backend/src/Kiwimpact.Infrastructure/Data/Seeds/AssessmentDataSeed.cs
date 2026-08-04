using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Explicit, bounded assessment showcase seed for deployed review environments.
/// It creates five fictional published Quests and a disabled ownership identity.
/// It never creates a password, role, claim, external login, or token.
/// Existing seed-owned Quests are left unchanged so a later startup cannot
/// overwrite reviewer or operator edits.
/// </summary>
public static class AssessmentDataSeed
{
    private const string CuratorUserName = "assessment-showcase-curator";
    private const string CuratorNormalizedUserName = "ASSESSMENT-SHOWCASE-CURATOR";
    private const string CuratorEmail = "assessment-showcase-curator@kiwimpact.invalid";
    private const string CuratorNormalizedEmail =
        "ASSESSMENT-SHOWCASE-CURATOR@KIWIMPACT.INVALID";

    public static readonly Guid CuratorUserId =
        new("7b857fa7-e38f-4a5f-b380-fdc9c2185c57");

    public static readonly IReadOnlyList<Guid> QuestIds =
    [
        new("8a000001-bcff-4c83-9c8a-bf4da687dd01"),
        new("8a000002-bcff-4c83-9c8a-bf4da687dd02"),
        new("8a000003-bcff-4c83-9c8a-bf4da687dd03"),
        new("8a000004-bcff-4c83-9c8a-bf4da687dd04"),
        new("8a000005-bcff-4c83-9c8a-bf4da687dd05"),
    ];

    private static readonly DateTimeOffset SeedTimestamp =
        new(2026, 8, 4, 0, 0, 0, TimeSpan.Zero);

    public static async Task SeedAsync(
        KiwimpactDbContext db,
        CancellationToken cancellationToken = default)
    {
        await EnsureDisabledCuratorAsync(db, cancellationToken);

        var definitions = Definitions();
        var existingQuests = await db.Quests
            .Where(quest => QuestIds.Contains(quest.Id))
            .ToDictionaryAsync(quest => quest.Id, cancellationToken);

        var ownershipCollision = existingQuests.Values
            .FirstOrDefault(quest => quest.CreatedByUserId != CuratorUserId);
        if (ownershipCollision is not null)
        {
            throw new InvalidOperationException(
                $"Assessment Quest ID {ownershipCollision.Id} is already owned by another user.");
        }

        foreach (var definition in definitions)
        {
            if (existingQuests.ContainsKey(definition.Id))
                continue;

            var quest = Quest.CreateOrganizerOwned(
                CuratorUserId,
                new QuestDetails(
                    definition.Title,
                    definition.Description,
                    definition.Category,
                    RegistrationMode.Native,
                    definition.Difficulty,
                    definition.Capacity,
                    null,
                    null,
                    definition.RegionId,
                    definition.LocationDescription,
                    null,
                    definition.Latitude,
                    definition.Longitude),
                new QuestCoverImageDetails(
                    definition.ImageUrl,
                    definition.AltText,
                    "Kiwimpact",
                    null,
                    "Project-owned assessment illustration"),
                SeedTimestamp);

            quest.Id = definition.Id;
            quest.XpAward = definition.XpAward;
            var cover = quest.Images.Single();
            cover.Id = definition.ImageId;
            cover.QuestId = definition.Id;
            quest.Publish(SeedTimestamp);
            db.Quests.Add(quest);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureDisabledCuratorAsync(
        KiwimpactDbContext db,
        CancellationToken cancellationToken)
    {
        var reservedIdentityUsers = await db.Set<ApplicationUser>()
            .Where(user =>
                user.Id == CuratorUserId ||
                user.NormalizedUserName == CuratorNormalizedUserName ||
                user.NormalizedEmail == CuratorNormalizedEmail)
            .ToListAsync(cancellationToken);
        var collision = reservedIdentityUsers
            .FirstOrDefault(user => user.Id != CuratorUserId);
        if (collision is not null)
        {
            throw new InvalidOperationException(
                "The assessment curator username or email is already reserved by another user.");
        }

        var curator = reservedIdentityUsers
            .SingleOrDefault(user => user.Id == CuratorUserId);
        if (curator is null)
        {
            db.Set<ApplicationUser>().Add(new ApplicationUser
            {
                Id = CuratorUserId,
                UserName = CuratorUserName,
                NormalizedUserName = CuratorNormalizedUserName,
                Email = CuratorEmail,
                NormalizedEmail = CuratorNormalizedEmail,
                EmailConfirmed = false,
                PasswordHash = null,
                SecurityStamp = null,
                ConcurrencyStamp = null,
                LockoutEnabled = true,
                AccessFailedCount = 0,
            });
            return;
        }

        if (curator.NormalizedUserName != CuratorNormalizedUserName ||
            curator.NormalizedEmail != CuratorNormalizedEmail ||
            curator.PasswordHash is not null ||
            curator.EmailConfirmed)
        {
            throw new InvalidOperationException(
                "The assessment curator identity does not match its disabled seed contract.");
        }

        var hasAuthenticationArtifacts =
            await db.Set<IdentityUserRole<Guid>>()
                .AnyAsync(item => item.UserId == CuratorUserId, cancellationToken) ||
            await db.Set<IdentityUserClaim<Guid>>()
                .AnyAsync(item => item.UserId == CuratorUserId, cancellationToken) ||
            await db.Set<IdentityUserLogin<Guid>>()
                .AnyAsync(item => item.UserId == CuratorUserId, cancellationToken) ||
            await db.Set<IdentityUserToken<Guid>>()
                .AnyAsync(item => item.UserId == CuratorUserId, cancellationToken);
        if (hasAuthenticationArtifacts)
        {
            throw new InvalidOperationException(
                "The assessment curator must not have roles, claims, logins, or tokens.");
        }
    }

    private static IReadOnlyList<AssessmentQuestDefinition> Definitions() =>
    [
        new(
            QuestIds[0],
            new Guid("9a000001-bcff-4c83-9c8a-bf4da687dd01"),
            "Kiwimpact Showcase: Stream Cleanup",
            "A fictional assessment quest demonstrating local waste reduction and map discovery. No public event is scheduled.",
            QuestCategory.CleanReduceWaste,
            QuestDifficulty.Easy,
            50,
            30,
            RegionSeed.HendersonMasseyId,
            "Assessment marker near Ōpanuku Reserve, Henderson, Auckland",
            -36.874700m,
            174.628500m,
            "/images/quests/stream-cleanup.svg",
            "Illustration of volunteers collecting litter beside a stream"),
        new(
            QuestIds[1],
            new Guid("9a000002-bcff-4c83-9c8a-bf4da687dd02"),
            "Kiwimpact Showcase: Native Planting",
            "A fictional assessment quest demonstrating native habitat restoration. No public event is scheduled.",
            QuestCategory.RestoreNature,
            QuestDifficulty.Medium,
            100,
            40,
            RegionSeed.DevonportTakapunaId,
            "Assessment marker near Takapuna, Auckland",
            -36.787000m,
            174.773000m,
            "/images/quests/tree-planting.svg",
            "Illustration of community members planting native trees"),
        new(
            QuestIds[2],
            new Guid("9a000003-bcff-4c83-9c8a-bf4da687dd03"),
            "Kiwimpact Showcase: Recycling Workshop",
            "A fictional assessment quest demonstrating practical waste education. No public event is scheduled.",
            QuestCategory.LearnShare,
            QuestDifficulty.Easy,
            50,
            25,
            RegionSeed.AlbertEdenId,
            "Assessment marker near Mount Albert, Auckland",
            -36.884000m,
            174.720000m,
            "/images/quests/recycling-workshop.svg",
            "Illustration of hands sorting recyclable materials"),
        new(
            QuestIds[3],
            new Guid("9a000004-bcff-4c83-9c8a-bf4da687dd04"),
            "Kiwimpact Showcase: Waterway Observation",
            "A fictional assessment quest demonstrating community environmental observation. No public event is scheduled.",
            QuestCategory.ObserveMeasure,
            QuestDifficulty.Medium,
            100,
            20,
            RegionSeed.HowickId,
            "Assessment marker near Howick Beach, Auckland",
            -36.894000m,
            174.932000m,
            "/images/quests/water-quality.svg",
            "Illustration of water quality testing equipment"),
        new(
            QuestIds[4],
            new Guid("9a000005-bcff-4c83-9c8a-bf4da687dd05"),
            "Kiwimpact Showcase: Community Garden",
            "A fictional assessment quest demonstrating local food growing and composting. No public event is scheduled.",
            QuestCategory.GrowCompost,
            QuestDifficulty.Medium,
            100,
            20,
            RegionSeed.ManurewaId,
            "Assessment marker near central Manurewa, Auckland",
            -37.020000m,
            174.895000m,
            "/images/quests/community-garden.svg",
            "Illustration of a community tending raised garden beds"),
    ];

    private sealed record AssessmentQuestDefinition(
        Guid Id,
        Guid ImageId,
        string Title,
        string Description,
        QuestCategory Category,
        QuestDifficulty Difficulty,
        int XpAward,
        int Capacity,
        Guid RegionId,
        string LocationDescription,
        decimal Latitude,
        decimal Longitude,
        string ImageUrl,
        string AltText);
}
