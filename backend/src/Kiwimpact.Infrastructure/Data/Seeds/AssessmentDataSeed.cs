using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Explicit, bounded assessment showcase seed for deployed review environments.
/// Quest facts and links were checked against the named providers on 2026-08-04.
/// The seed uses project-owned illustrations and never copies provider imagery.
/// It creates no sign-in credential; assessment logins use the separate,
/// secret-driven assessment-account seed.
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

    public static readonly Guid WellingtonCityId =
        new("61000000-0000-4000-8000-000000000001");
    public static readonly Guid ChristchurchCityId =
        new("61000000-0000-4000-8000-000000000002");
    public static readonly Guid TaurangaCityId =
        new("61000000-0000-4000-8000-000000000003");
    public static readonly Guid WaimakaririDistrictId =
        new("61000000-0000-4000-8000-000000000004");

    public static readonly IReadOnlyList<Guid> QuestIds =
    [
        new("8a000001-bcff-4c83-9c8a-bf4da687dd01"),
        new("8a000002-bcff-4c83-9c8a-bf4da687dd02"),
        new("8a000003-bcff-4c83-9c8a-bf4da687dd03"),
        new("8a000004-bcff-4c83-9c8a-bf4da687dd04"),
        new("8a000005-bcff-4c83-9c8a-bf4da687dd05"),
        new("8a000006-bcff-4c83-9c8a-bf4da687dd06"),
        new("8a000007-bcff-4c83-9c8a-bf4da687dd07"),
        new("8a000008-bcff-4c83-9c8a-bf4da687dd08"),
        new("8a000009-bcff-4c83-9c8a-bf4da687dd09"),
        new("8a000010-bcff-4c83-9c8a-bf4da687dd10"),
    ];

    /// <summary>
    /// Ongoing or recurring real activities used only to create fictional,
    /// clearly assessment-scoped Passport history for configured reviewers.
    /// Dated future events are deliberately excluded from seeded completions.
    /// </summary>
    public static readonly IReadOnlyList<Guid> AssessmentHistoryQuestIds =
    [
        QuestIds[3],
        QuestIds[5],
        QuestIds[6],
        QuestIds[7],
        QuestIds[8],
        QuestIds[9],
    ];

    private static readonly DateTimeOffset SeedTimestamp =
        new(2026, 8, 4, 0, 0, 0, TimeSpan.Zero);

    public static async Task SeedAsync(
        KiwimpactDbContext db,
        CancellationToken cancellationToken = default)
    {
        await EnsureDisabledCuratorAsync(db, cancellationToken);
        await EnsureNationwideRegionsAsync(db, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var definitions = Definitions();
        var existingQuests = await db.Quests
            .Where(quest => QuestIds.Contains(quest.Id))
            .Include(quest => quest.Images)
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
            if (existingQuests.TryGetValue(definition.Id, out var existing))
            {
                // Upgrade only the exact five original fictional rows. Any
                // operator-edited row, and every real row on later starts, is
                // left untouched.
                if (IsUnmodifiedLegacyQuest(existing))
                {
                    ApplyDefinition(existing, definition);
                }
                continue;
            }

            db.Quests.Add(CreateQuest(definition));
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static Quest CreateQuest(AssessmentQuestDefinition definition)
    {
        var quest = Quest.CreateOrganizerOwned(
            CuratorUserId,
            ToDetails(definition),
            ToCover(definition),
            SeedTimestamp);
        quest.Id = definition.Id;
        quest.SourceType = QuestSourceType.AdminCuratedExternal;
        quest.XpAward = ProgressionRules.XpForDifficulty(definition.Difficulty);
        quest.ExternalSourceStatus = ExternalSourceStatus.Current;
        quest.SourceCheckedAt = SeedTimestamp;
        quest.NextCheckDueAt = definition.NextCheckDueAt;
        var cover = quest.Images.Single();
        cover.Id = definition.ImageId;
        cover.QuestId = definition.Id;
        quest.Publish(SeedTimestamp);
        return quest;
    }

    private static void ApplyDefinition(
        Quest quest,
        AssessmentQuestDefinition definition)
    {
        quest.Title = definition.Title;
        quest.Description = definition.Description;
        quest.Category = definition.Category;
        quest.Status = QuestStatus.Published;
        quest.SourceType = QuestSourceType.AdminCuratedExternal;
        quest.RegistrationMode = definition.RegistrationMode;
        quest.Difficulty = definition.Difficulty;
        quest.XpAward = ProgressionRules.XpForDifficulty(definition.Difficulty);
        quest.Capacity = null;
        quest.StartAtUtc = definition.StartAtUtc;
        quest.EndAtUtc = definition.EndAtUtc;
        quest.LocationRegionId = definition.RegionId;
        quest.LocationDescription = definition.LocationDescription;
        quest.Latitude = definition.Latitude;
        quest.Longitude = definition.Longitude;
        quest.ExternalSourceUrl = definition.ExternalSourceUrl;
        quest.ExternalSourceStatus = ExternalSourceStatus.Current;
        quest.SourceCheckedAt = SeedTimestamp;
        quest.NextCheckDueAt = definition.NextCheckDueAt;
        quest.UpdatedAt = SeedTimestamp;

        var cover = quest.Images
            .OrderBy(image => image.SortOrder)
            .ThenBy(image => image.Id)
            .FirstOrDefault(image => image.IsCover)
            ?? throw new InvalidOperationException(
                $"Legacy assessment Quest {quest.Id} has no cover image.");
        cover.UpdateCover(ToCover(definition));
    }

    private static QuestDetails ToDetails(AssessmentQuestDefinition definition) =>
        new(
            definition.Title,
            definition.Description,
            definition.Category,
            definition.RegistrationMode,
            definition.Difficulty,
            null,
            definition.StartAtUtc,
            definition.EndAtUtc,
            definition.RegionId,
            definition.LocationDescription,
            definition.ExternalSourceUrl,
            definition.Latitude,
            definition.Longitude);

    private static QuestCoverImageDetails ToCover(
        AssessmentQuestDefinition definition) =>
        new(
            definition.ImageUrl,
            definition.AltText,
            "Kiwimpact",
            null,
            "Project-owned illustration; activity facts link to the official provider page");

    private static bool IsUnmodifiedLegacyQuest(Quest quest)
    {
        var index = QuestIds.ToList().IndexOf(quest.Id);
        if (index is < 0 or > 4)
        {
            return false;
        }

        var legacy = LegacyDefinitions[index];
        return quest.Title == legacy.Title && quest.Description == legacy.Description;
    }

    private static async Task EnsureNationwideRegionsAsync(
        KiwimpactDbContext db,
        CancellationToken cancellationToken)
    {
        await EnsureRegionAsync(
            db,
            WellingtonCityId,
            "Wellington City",
            RegionSeed.NewZealandId,
            cancellationToken);
        await EnsureRegionAsync(
            db,
            ChristchurchCityId,
            "Christchurch City",
            RegionSeed.NewZealandId,
            cancellationToken);
        await EnsureRegionAsync(
            db,
            TaurangaCityId,
            "Tauranga City",
            RegionSeed.NewZealandId,
            cancellationToken);
        await EnsureRegionAsync(
            db,
            WaimakaririDistrictId,
            "Waimakariri District",
            RegionSeed.NewZealandId,
            cancellationToken);
    }

    private static async Task EnsureRegionAsync(
        KiwimpactDbContext db,
        Guid id,
        string name,
        Guid parentId,
        CancellationToken cancellationToken)
    {
        var existing = await db.Regions.SingleOrDefaultAsync(
            region => region.Id == id,
            cancellationToken);
        if (existing is not null)
        {
            if (existing.Name != name ||
                existing.Type != RegionType.AdministrativeArea ||
                existing.ParentRegionId != parentId)
            {
                throw new InvalidOperationException(
                    $"Assessment Region ID {id} collides with a different Region.");
            }
            return;
        }

        var errors = Region.Validate(
            name,
            RegionType.AdministrativeArea,
            parentId,
            _ => RegionType.Country);
        if (errors.Count > 0)
        {
            throw new InvalidOperationException(
                $"Assessment Region '{name}' is invalid: {string.Join("; ", errors)}");
        }

        db.Regions.Add(new Region
        {
            Id = id,
            Name = name,
            Type = RegionType.AdministrativeArea,
            ParentRegionId = parentId,
            IsActive = true,
            CreatedAt = SeedTimestamp,
            UpdatedAt = SeedTimestamp,
        });
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
            "Tūpuna Maunga Community Planting — Maungarei",
            "Join the official Tūpuna Maunga volunteer team to plant natives on Maungarei / Mt Wellington. Check the Auckland Council event page before travelling because provider updates remain authoritative.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            new DateTimeOffset(2026, 8, 7, 22, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 8, 8, 1, 0, 0, TimeSpan.Zero),
            RegionSeed.MaungakiekieTamakiId,
            "Maungarei / Mt Wellington, Gollan Road, Mt Wellington, Auckland, New Zealand",
            -36.889000m,
            174.836000m,
            "https://ourauckland.aucklandcouncil.govt.nz/events/2026/05/tupuna-maunga-community-planting-days/",
            new DateTimeOffset(2026, 8, 6, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/tree-planting.svg",
            "Community volunteers planting native trees"),
        new(
            QuestIds[1],
            new Guid("9a000002-bcff-4c83-9c8a-bf4da687dd02"),
            "Waimakariri Off-road Clean-up 2026",
            "Help Environment Canterbury remove rubbish from the Waimakariri River Regional Park. The official page lists access guidance, supplied equipment, and registration details.",
            QuestCategory.CleanReduceWaste,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            new DateTimeOffset(2026, 8, 8, 21, 0, 0, TimeSpan.Zero),
            null,
            WaimakaririDistrictId,
            "Harrs Road near the Eyre River Ford, Waimakariri District, New Zealand",
            -43.434467m,
            172.508464m,
            "https://www.ecan.govt.nz/your-region/living-here/regional-parks/regional-parks-events/regional-parks-planting-and-clean-up-events",
            new DateTimeOffset(2026, 8, 7, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/coastal-cleanup.svg",
            "Volunteers collecting rubbish in a regional park"),
        new(
            QuestIds[2],
            new Guid("9a000003-bcff-4c83-9c8a-bf4da687dd03"),
            "Sanctuary Wetland Community Planting",
            "Plant at the Sanctuary Wetland with Environment Canterbury and Forest & Bird North Canterbury. The official listing provides the current meeting and registration information.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            new DateTimeOffset(2026, 8, 28, 22, 0, 0, TimeSpan.Zero),
            null,
            WaimakaririDistrictId,
            "The Sanctuary, Templers Island, Waimakariri River Regional Park, New Zealand",
            null,
            null,
            "https://www.ecan.govt.nz/your-region/living-here/regional-parks/regional-parks-events/regional-parks-planting-and-clean-up-events",
            new DateTimeOffset(2026, 8, 18, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/wetland-restoration.svg",
            "Native wetland plants beside a restored waterway"),
        new(
            QuestIds[3],
            new Guid("9a000004-bcff-4c83-9c8a-bf4da687dd04"),
            "Friends of Nepal Reserve Working Bee",
            "Join the recurring Christchurch City Council-listed working bee to remove weeds and help native plants, birds, and insects thrive. Consult the official page for the next monthly session.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            ChristchurchCityId,
            "Nepal Reserve off Westpark Drive, Burnside, Christchurch, New Zealand",
            null,
            null,
            "https://ccc.govt.nz/news-and-events/whats-on/event/friends-of-nepal-reserve-working-bee-burnside",
            new DateTimeOffset(2026, 8, 18, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/heritage-trees.svg",
            "Volunteers caring for native plants in a community reserve"),
        new(
            QuestIds[4],
            new Guid("9a000005-bcff-4c83-9c8a-bf4da687dd05"),
            "DOC Hihi Field Assistant — Tiritiri Matangi",
            "Apply for DOC's 2026/27 hihi field-assistant role supporting feeding stations, nest boxes, observations, and population surveys. This is a multi-stint commitment with eligibility requirements; read the official page before applying.",
            QuestCategory.ProtectWildlife,
            RegistrationMode.External,
            QuestDifficulty.Hard,
            new DateTimeOffset(2026, 10, 8, 11, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2027, 3, 5, 11, 0, 0, TimeSpan.Zero),
            RegionSeed.HibiscusBaysId,
            "Tiritiri Matangi Island, Hauraki Gulf, Auckland, New Zealand",
            -36.603000m,
            174.889000m,
            "https://www.doc.govt.nz/get-involved/volunteer/in-your-region/auckland/tiritiri-matangi-island-hihi-field-assistant/",
            new DateTimeOffset(2026, 8, 12, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/kiwi-habitat.svg",
            "A native bird in protected island habitat"),
        new(
            QuestIds[5],
            new Guid("9a000006-bcff-4c83-9c8a-bf4da687dd06"),
            "Auckland Learn to Compost Workshops",
            "Learn practical cold-composting, worm-farm, or Bokashi skills through Auckland Council-listed sessions running across 2026. Choose a current workshop on the official event listing.",
            QuestCategory.GrowCompost,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            RegionSeed.AucklandId,
            "Multiple Auckland Council library and community venues, Auckland, New Zealand",
            null,
            null,
            "https://ourauckland.aucklandcouncil.govt.nz/events/?page=2&searchArg=waste",
            new DateTimeOffset(2026, 8, 18, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/recycling-workshop.svg",
            "Hands learning to turn food scraps into healthy compost"),
        new(
            QuestIds[6],
            new Guid("9a000007-bcff-4c83-9c8a-bf4da687dd07"),
            "Wellington Backyard Biodiversity",
            "Use Wellington City Council's backyard-biodiversity guidance to support native plants and wildlife, manage pests, or record nature observations. This is a self-paced activity rather than a scheduled event.",
            QuestCategory.ObserveMeasure,
            RegistrationMode.NoneRequired,
            QuestDifficulty.Easy,
            null,
            null,
            WellingtonCityId,
            "Self-paced across Wellington City, New Zealand",
            null,
            null,
            "https://wellington.govt.nz/backyardbiodiversity",
            new DateTimeOffset(2026, 9, 4, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/water-quality.svg",
            "A community member recording a backyard nature observation"),
        new(
            QuestIds[7],
            new Guid("9a000008-bcff-4c83-9c8a-bf4da687dd08"),
            "Tauranga Environmental Volunteering",
            "Connect with Tauranga City Council's volunteer programme for reserve maintenance, native planting, dune care, or rubbish collection. Arrange an appropriate session through the official council contact.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            TaurangaCityId,
            "Environmental reserves across Tauranga City, New Zealand",
            null,
            null,
            "https://www.tauranga.govt.nz/environment/environmental-volunteering",
            new DateTimeOffset(2026, 9, 4, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/bike-path-planting.svg",
            "Community volunteers tending native reserve planting"),
        new(
            QuestIds[8],
            new Guid("9a000009-bcff-4c83-9c8a-bf4da687dd09"),
            "Sustainable Coastlines Community Clean-ups",
            "Find a current community clean-up through Sustainable Coastlines' official New Zealand events directory. Event dates and locations change, so select and register for a live provider listing.",
            QuestCategory.CleanReduceWaste,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            RegionSeed.NewZealandId,
            "Locations vary across Aotearoa New Zealand",
            null,
            null,
            "https://sustainablecoastlines.org/events/",
            new DateTimeOffset(2026, 9, 4, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/beach-survey.svg",
            "Volunteers working together at a coastal clean-up"),
        new(
            QuestIds[9],
            new Guid("9a000010-bcff-4c83-9c8a-bf4da687dd10"),
            "Find Your Conservation Crew",
            "Use DOC's national guide to connect with a conservation group and contribute skills ranging from planting and trapping to organising, fundraising, or sharing knowledge.",
            QuestCategory.LearnShare,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            RegionSeed.NewZealandId,
            "Community conservation groups across Aotearoa New Zealand",
            null,
            null,
            "https://www.doc.govt.nz/always-be-naturing/do-your-bit-for-nature/find-your-conservation-crew/",
            new DateTimeOffset(2026, 9, 4, 0, 0, 0, TimeSpan.Zero),
            "/images/quests/school-education.svg",
            "A conservation group sharing practical skills outdoors"),
    ];

    private static readonly IReadOnlyList<(string Title, string Description)>
        LegacyDefinitions =
    [
        (
            "Kiwimpact Showcase: Stream Cleanup",
            "A fictional assessment quest demonstrating local waste reduction and map discovery. No public event is scheduled."),
        (
            "Kiwimpact Showcase: Native Planting",
            "A fictional assessment quest demonstrating native habitat restoration. No public event is scheduled."),
        (
            "Kiwimpact Showcase: Recycling Workshop",
            "A fictional assessment quest demonstrating practical waste education. No public event is scheduled."),
        (
            "Kiwimpact Showcase: Waterway Observation",
            "A fictional assessment quest demonstrating community environmental observation. No public event is scheduled."),
        (
            "Kiwimpact Showcase: Community Garden",
            "A fictional assessment quest demonstrating local food growing and composting. No public event is scheduled."),
    ];

    private sealed record AssessmentQuestDefinition(
        Guid Id,
        Guid ImageId,
        string Title,
        string Description,
        QuestCategory Category,
        RegistrationMode RegistrationMode,
        QuestDifficulty Difficulty,
        DateTimeOffset? StartAtUtc,
        DateTimeOffset? EndAtUtc,
        Guid RegionId,
        string LocationDescription,
        decimal? Latitude,
        decimal? Longitude,
        string ExternalSourceUrl,
        DateTimeOffset NextCheckDueAt,
        string ImageUrl,
        string AltText);
}
