using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Explicit, bounded assessment showcase seed for deployed review environments.
/// Quest facts and links were checked against the named providers on 2026-08-05.
/// New city-coverage rows use credited Pexels stock photography and explicitly
/// distinguish those illustrative images from provider event documentation.
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
    private const string ProjectIllustrationLicenceNote =
        "Project-owned illustration; activity facts link to the official provider page";
    private const string PexelsLicenceNote =
        "Pexels stock photo; free to use under the Pexels licence (checked 2026-08-05). " +
        "Illustrative image, not documentation of the listed activity.";

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
    public static readonly Guid HamiltonCityId =
        new("61000000-0000-4000-8000-000000000005");
    public static readonly Guid DunedinCityId =
        new("61000000-0000-4000-8000-000000000006");
    public static readonly Guid NelsonCityId =
        new("61000000-0000-4000-8000-000000000007");
    public static readonly Guid PalmerstonNorthCityId =
        new("61000000-0000-4000-8000-000000000008");

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
        new("8a000011-bcff-4c83-9c8a-bf4da687dd11"),
        new("8a000012-bcff-4c83-9c8a-bf4da687dd12"),
        new("8a000013-bcff-4c83-9c8a-bf4da687dd13"),
        new("8a000014-bcff-4c83-9c8a-bf4da687dd14"),
        new("8a000015-bcff-4c83-9c8a-bf4da687dd15"),
        new("8a000016-bcff-4c83-9c8a-bf4da687dd16"),
        new("8a000017-bcff-4c83-9c8a-bf4da687dd17"),
        new("8a000018-bcff-4c83-9c8a-bf4da687dd18"),
        new("8a000019-bcff-4c83-9c8a-bf4da687dd19"),
        new("8a000020-bcff-4c83-9c8a-bf4da687dd20"),
        new("8a000021-bcff-4c83-9c8a-bf4da687dd21"),
        new("8a000022-bcff-4c83-9c8a-bf4da687dd22"),
        new("8a000023-bcff-4c83-9c8a-bf4da687dd23"),
        new("8a000024-bcff-4c83-9c8a-bf4da687dd24"),
        new("8a000025-bcff-4c83-9c8a-bf4da687dd25"),
        new("8a000026-bcff-4c83-9c8a-bf4da687dd26"),
        new("8a000027-bcff-4c83-9c8a-bf4da687dd27"),
        new("8a000028-bcff-4c83-9c8a-bf4da687dd28"),
        new("8a000029-bcff-4c83-9c8a-bf4da687dd29"),
        new("8a000030-bcff-4c83-9c8a-bf4da687dd30"),
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
        new(2026, 8, 5, 0, 0, 0, TimeSpan.Zero);

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
            definition.ImageCreatorName,
            definition.ImageSourceUrl,
            definition.ImageLicenceNote);

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
        await EnsureRegionAsync(
            db,
            HamiltonCityId,
            "Hamilton City",
            RegionSeed.NewZealandId,
            cancellationToken);
        await EnsureRegionAsync(
            db,
            DunedinCityId,
            "Dunedin City",
            RegionSeed.NewZealandId,
            cancellationToken);
        await EnsureRegionAsync(
            db,
            NelsonCityId,
            "Nelson City",
            RegionSeed.NewZealandId,
            cancellationToken);
        await EnsureRegionAsync(
            db,
            PalmerstonNorthCityId,
            "Palmerston North City",
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
        new(
            QuestIds[10],
            new Guid("9a000011-bcff-4c83-9c8a-bf4da687dd11"),
            "Ark in the Park Volunteer Field Team",
            "Join Forest & Bird and Auckland Council's Ark in the Park project for pest control, native-bird monitoring, kōkako nest protection, or other trained field work in the Waitākere Ranges. Check the provider's current induction and track guidance before attending.",
            QuestCategory.ProtectWildlife,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            RegionSeed.WaitakereRangesId,
            "Waitākere Ranges Regional Park, Auckland, New Zealand",
            null,
            null,
            "https://arkinthepark.org.nz/get-involved/",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(32881359),
            "A volunteer using binoculars to observe wildlife",
            "Brad Weaver",
            "https://www.pexels.com/photo/young-man-birdwatching-with-binoculars-outdoors-32881359/",
            PexelsLicenceNote),
        new(
            QuestIds[11],
            new Guid("9a000012-bcff-4c83-9c8a-bf4da687dd12"),
            "Urban Ark Neighbourhood Conservation",
            "Choose a central Auckland Urban Ark group and help with backyard trapping, reserve weeding, native planting, or stream restoration. The directory explains each group's focus and how to make contact.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            RegionSeed.AucklandId,
            "Central Tāmaki Makaurau / Auckland, New Zealand",
            null,
            null,
            "https://urbanark.nz/get-involved/",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(37094095),
            "A person observing a natural area beside a conservation fence",
            "Peter Dyllong",
            "https://www.pexels.com/photo/man-observing-landscape-beside-fence-in-nature-37094095/",
            PexelsLicenceNote),
        new(
            QuestIds[12],
            new Guid("9a000013-bcff-4c83-9c8a-bf4da687dd13"),
            "ZEALANDIA Sanctuary Volunteer Teams",
            "Apply to support ZEALANDIA Te Māra a Tāne in roles such as track maintenance, fence checking, restorative gardening, or ranger assistance. Current vacancies, commitment expectations, training, and eligibility remain on the sanctuary's official page.",
            QuestCategory.ProtectWildlife,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            WellingtonCityId,
            "ZEALANDIA Te Māra a Tāne, Waiapu Road, Karori, Wellington, New Zealand",
            -41.290900m,
            174.753300m,
            "https://www.visitzealandia.com/support-us/volunteer/",
            new DateTimeOffset(2026, 9, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(12319269),
            "A group walking together on a forest track",
            "Ali Alcántara",
            "https://www.pexels.com/photo/people-hiking-in-mountains-12319269/",
            PexelsLicenceNote),
        new(
            QuestIds[13],
            new Guid("9a000014-bcff-4c83-9c8a-bf4da687dd14"),
            "Predator Free Wellington Community Ranger",
            "Register interest in Predator Free Wellington's trained Community Ranger programme to help install and check predator-control devices in local green spaces. Volunteers can contribute from several hours a month to several hours a week.",
            QuestCategory.ProtectWildlife,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            WellingtonCityId,
            "Predator-control project areas across Wellington City, New Zealand",
            null,
            null,
            "https://www.pfw.org.nz/support-us/volunteer-with-us/",
            new DateTimeOffset(2026, 9, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(36729403),
            "Two people navigating a forest with a map and binoculars",
            "Vitaly Gariev",
            "https://www.pexels.com/photo/exploring-nature-with-map-and-binoculars-36729403/",
            PexelsLicenceNote),
        new(
            QuestIds[14],
            new Guid("9a000015-bcff-4c83-9c8a-bf4da687dd15"),
            "Ōtari-Wilton's Bush Volunteer Network",
            "Choose an official Ōtari-Wilton's Bush volunteer role, including Kaiwharawhara restoration, forest weeding, garden maintenance, guiding, hosting, or RAMBO trapping. Follow the Trust's enquiry process for the current schedule.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            WellingtonCityId,
            "Ōtari-Wilton's Bush, 150 Wilton Road, Wellington, New Zealand",
            -41.267500m,
            174.749300m,
            "https://wellingtongardens.nz/our-gardens/otari-wiltons-bush",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(7656745),
            "A volunteer supporting a newly planted tree",
            "Thirdman",
            "https://www.pexels.com/photo/volunteer-man-planting-tree-in-the-ground-7656745/",
            PexelsLicenceNote),
        new(
            QuestIds[15],
            new Guid("9a000016-bcff-4c83-9c8a-bf4da687dd16"),
            "Pūharakekenui / Styx Field Restoration",
            "Join Styx Living Laboratory Trust field volunteers for native planting, plant protection, hand weeding, and predator-trap-line maintenance. The recurring programme provides current meeting details and induction contacts.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            ChristchurchCityId,
            "Pūharakekenui / Styx catchment, Christchurch, New Zealand",
            null,
            null,
            "https://www.thestyx.org.nz/volunteer",
            new DateTimeOffset(2026, 9, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(7656721),
            "Two volunteers planting trees in an open green space",
            "Thirdman",
            "https://www.pexels.com/photo/volunteers-on-tree-planting-7656721/",
            PexelsLicenceNote),
        new(
            QuestIds[16],
            new Guid("9a000017-bcff-4c83-9c8a-bf4da687dd17"),
            "Styx Catchment Bird Monitoring",
            "Help Styx Living Laboratory Trust record water-bird species along moving transects at Styx Mill Conservation Reserve and 303 Radcliffe Road Reserve. Instruction is provided, so new bird monitors do not need prior experience.",
            QuestCategory.ObserveMeasure,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            ChristchurchCityId,
            "Styx Mill and Radcliffe Road reserves, Christchurch, New Zealand",
            null,
            null,
            "https://www.thestyx.org.nz/volunteer",
            new DateTimeOffset(2026, 9, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(33261712),
            "Water birds among reeds in a wetland habitat",
            "Kutay Orkun Durukan",
            "https://www.pexels.com/photo/birds-on-a-tranquil-wetland-scene-with-reeds-33261712/",
            PexelsLicenceNote),
        new(
            QuestIds[17],
            new Guid("9a000018-bcff-4c83-9c8a-bf4da687dd18"),
            "Styx Community Water Quality Monitoring",
            "Join inducted Styx volunteers using SHMAK kits to monitor water quality in the Pūharakekenui catchment. The recurring results contribute to Christchurch City Council's annual surface-water quality reporting.",
            QuestCategory.ObserveMeasure,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            ChristchurchCityId,
            "Styx Living Laboratory Trust Lab, 130 Hussey Road, Christchurch, New Zealand",
            -43.461300m,
            172.617700m,
            "https://www.thestyx.org.nz/volunteer",
            new DateTimeOffset(2026, 9, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(10822517),
            "A field researcher assessing water quality",
            "Amar Preciado",
            "https://www.pexels.com/photo/man-in-white-shirt-and-a-name-tag-walking-in-water-10822517/",
            PexelsLicenceNote),
        new(
            QuestIds[18],
            new Guid("9a000019-bcff-4c83-9c8a-bf4da687dd19"),
            "Hamilton Nature in the City Planting",
            "Sign up for one-off community planting days or regular restoration through Hamilton City Council's Nature in the City programme. Current opportunities support the city's long-term native vegetation and biodiversity goals.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            HamiltonCityId,
            "Nature in the City sites across Hamilton Kirikiriroa, New Zealand",
            null,
            null,
            "https://hamilton.govt.nz/strategies-plans-and-projects/projects/nature-in-the-city/",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(5029923),
            "A group planting a young tree together",
            "Anna Shvets",
            "https://www.pexels.com/photo/people-planting-plant-together-5029923/",
            PexelsLicenceNote),
        new(
            QuestIds[19],
            new Guid("9a000020-bcff-4c83-9c8a-bf4da687dd20"),
            "Explore Hamilton's Nature in the City Trails",
            "Download Hamilton City Council's Nature in the City app and choose from ten self-guided tours through local natural areas. This is a self-paced way to learn about the city's gullies, reserves, native plants, and wildlife.",
            QuestCategory.LearnShare,
            RegistrationMode.NoneRequired,
            QuestDifficulty.Easy,
            null,
            null,
            HamiltonCityId,
            "Self-guided natural-area tours across Hamilton Kirikiriroa, New Zealand",
            null,
            null,
            "https://hamilton.govt.nz/strategies-plans-and-projects/projects/nature-in-the-city/",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(36729400),
            "Two people exploring a forest with a map and binoculars",
            "Vitaly Gariev",
            "https://www.pexels.com/photo/young-couple-hiking-in-forest-with-map-and-binoculars-36729400/",
            PexelsLicenceNote),
        new(
            QuestIds[20],
            new Guid("9a000021-bcff-4c83-9c8a-bf4da687dd21"),
            "Hamilton Kids in Nature",
            "Schools can register for Hamilton City Council's multi-session Kids in Nature programme. Tamariki take part in restoration planting and releasing, then learn through modules such as predator control, seed collecting, clean-ups, insects, and bats.",
            QuestCategory.LearnShare,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            HamiltonCityId,
            "Participating schools and restoration plots across Hamilton, New Zealand",
            null,
            null,
            "https://hamilton.govt.nz/strategies-plans-and-projects/projects/nature-in-the-city/kids-in-nature",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(36713464),
            "Young volunteers working together in a green space",
            "Vitaly Gariev",
            "https://www.pexels.com/photo/young-volunteers-cleaning-park-in-summer-36713464/",
            PexelsLicenceNote),
        new(
            QuestIds[21],
            new Guid("9a000022-bcff-4c83-9c8a-bf4da687dd22"),
            "Bay of Plenty Coast Care",
            "Volunteer with the council-supported Coast Care partnership on beach clean-ups, native dune planting, weed and pest management, fencing, or other coastal restoration work from Waihī Beach through the Bay of Plenty.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            TaurangaCityId,
            "Coastal sites around Tauranga and the Bay of Plenty, New Zealand",
            null,
            null,
            "https://www.tauranga.govt.nz/council/working-with-organisations/coast-care",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(28662953),
            "Volunteers planting on a sandy coastal site",
            "Tường Chopper",
            "https://www.pexels.com/photo/tree-planting-activity-in-phan-thi-t-vietnam-28662953/",
            PexelsLicenceNote),
        new(
            QuestIds[22],
            new Guid("9a000023-bcff-4c83-9c8a-bf4da687dd23"),
            "Tauranga Community Litter and Stream Clean-up",
            "Organise a local litter or stream clean-up with support from Tauranga City Council. Use the official waste-reduction page to ask about supplies, safe planning, and current community opportunities.",
            QuestCategory.CleanReduceWaste,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            TaurangaCityId,
            "Community and stream sites across Tauranga City, New Zealand",
            null,
            null,
            "https://www.tauranga.govt.nz/Services/Rubbish-and-recycling/Reducing-our-waste/Get-involved-in-reducing-our-citys-waste",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(9037222),
            "A group of volunteers collecting rubbish beside the water",
            "Ron Lach",
            "https://www.pexels.com/photo/people-cleaning-the-beach-9037222/",
            PexelsLicenceNote),
        new(
            QuestIds[23],
            new Guid("9a000024-bcff-4c83-9c8a-bf4da687dd24"),
            "Tauranga Waste-Reduction Workshops",
            "Choose a current Tauranga City Council-supported workshop, community event, or online course covering practical waste reduction such as worm farming, composting, or reusable alternatives. Confirm the live listing before registering.",
            QuestCategory.GrowCompost,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            TaurangaCityId,
            "Workshop venues and online sessions serving Tauranga City, New Zealand",
            null,
            null,
            "https://www.tauranga.govt.nz/Services/Rubbish-and-recycling/Reducing-our-waste/Get-involved-in-reducing-our-citys-waste",
            new DateTimeOffset(2026, 9, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(9475362),
            "Food scraps being collected for home composting",
            "Greta Hoffman",
            "https://www.pexels.com/photo/a-person-putting-ingredients-on-a-stainless-bucket-9475362/",
            PexelsLicenceNote),
        new(
            QuestIds[24],
            new Guid("9a000025-bcff-4c83-9c8a-bf4da687dd25"),
            "Orokonui Ecosanctuary Volunteer Teams",
            "Register interest in Orokonui Ecosanctuary roles such as track maintenance, weed control, predator-fence monitoring, pest monitoring, education, or visitor support. Check current recruitment availability with the sanctuary.",
            QuestCategory.ProtectWildlife,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            DunedinCityId,
            "Orokonui Ecosanctuary, Blueskin Road, Waitati, Dunedin, New Zealand",
            -45.772000m,
            170.604000m,
            "https://orokonui.nz/volunteers/",
            new DateTimeOffset(2026, 9, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(33406827),
            "A conservation volunteer in a tree-filled outdoor setting",
            "Zenobia Abudu-Abrams",
            "https://www.pexels.com/photo/outdoor-portrait-of-a-conservation-volunteer-resting-33406827/",
            PexelsLicenceNote),
        new(
            QuestIds[25],
            new Guid("9a000026-bcff-4c83-9c8a-bf4da687dd26"),
            "Save the Otago Peninsula Working Bees",
            "Join Save The Otago Peninsula's recurring Smiths Creek restoration working bees. Dunedin City Council lists weekday and weekend sessions with tasks suitable for different abilities; contact the group before travelling.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            DunedinCityId,
            "Smiths Creek restoration area, Otago Peninsula, Dunedin, New Zealand",
            null,
            null,
            "https://www.dunedin.govt.nz/community-facilities/parks-and-reserves/volunteer-in-dunedin/conservation-groups-otago-peninsula",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(17226557),
            "Reeds and native habitat in a wetland landscape",
            "Tom Fisk",
            "https://www.pexels.com/photo/reeds-growing-on-wetland-17226557/",
            PexelsLicenceNote),
        new(
            QuestIds[26],
            new Guid("9a000027-bcff-4c83-9c8a-bf4da687dd27"),
            "Yellow-eyed Penguin Coastal Habitat Workdays",
            "Connect with the Yellow-eyed Penguin Trust through Dunedin City Council's conservation-group directory to help clear, plant, and maintain coastal penguin habitat and support predator control. Confirm the next workday with the provider.",
            QuestCategory.ProtectWildlife,
            RegistrationMode.External,
            QuestDifficulty.Medium,
            null,
            null,
            DunedinCityId,
            "Coastal habitat sites around Dunedin and the Otago Peninsula, New Zealand",
            null,
            null,
            "https://www.dunedin.govt.nz/community-facilities/parks-and-reserves/volunteer-in-dunedin/conservation-groups-otago-peninsula",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(4712004),
            "Coastal dune grass growing in sandy wildlife habitat",
            "Karola G",
            "https://www.pexels.com/photo/grass-growing-in-sand-on-the-beach-4712004/",
            PexelsLicenceNote),
        new(
            QuestIds[27],
            new Guid("9a000028-bcff-4c83-9c8a-bf4da687dd28"),
            "Nelson Adopt a Spot",
            "Join Nelson City Council's Adopt a Spot programme as an individual, whānau, school, or community group and commit to caring for a chosen area of council land through locally appropriate restoration work.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            NelsonCityId,
            "Adopt a Spot sites across Nelson City, New Zealand",
            null,
            null,
            "https://www.nelson.govt.nz/6environment/what-you-can-do",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(36713477),
            "A volunteer collecting litter in a green public space",
            "Vitaly Gariev",
            "https://www.pexels.com/photo/young-volunteer-cleaning-litter-in-natural-park-36713477/",
            PexelsLicenceNote),
        new(
            QuestIds[28],
            new Guid("9a000029-bcff-4c83-9c8a-bf4da687dd29"),
            "Nelson Backyard Trapping and Nature Records",
            "Use Nelson City Council's environmental action hub to join a community trapping group, set up responsible backyard predator control, or contribute local wildlife observations to citizen science. Choose the pathway that fits your home and experience.",
            QuestCategory.ObserveMeasure,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            NelsonCityId,
            "Backyards and community conservation areas across Nelson City, New Zealand",
            null,
            null,
            "https://www.nelson.govt.nz/6environment/what-you-can-do",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(2954927),
            "A person using binoculars to observe an open natural area",
            "Elle Hughes",
            "https://www.pexels.com/photo/man-holding-binoculars-2954927/",
            PexelsLicenceNote),
        new(
            QuestIds[29],
            new Guid("9a000030-bcff-4c83-9c8a-bf4da687dd30"),
            "Palmerston North Green Corridors",
            "Join Palmerston North's Green Corridors volunteers for a planting day, a monthly working bee, or ongoing care of an adopted local park. Contact the council project officer for current opportunities and site details.",
            QuestCategory.RestoreNature,
            RegistrationMode.External,
            QuestDifficulty.Easy,
            null,
            null,
            PalmerstonNorthCityId,
            "Green Corridor and park sites across Palmerston North, New Zealand",
            null,
            null,
            "https://www.pncc.govt.nz/Community/Community-projects-and-programmes/Green-Corridors",
            new DateTimeOffset(2026, 10, 5, 0, 0, 0, TimeSpan.Zero),
            PexelsImageUrl(5029853),
            "Several people holding young green plants together",
            "Anna Shvets",
            "https://www.pexels.com/photo/hands-holding-green-plants-5029853/",
            PexelsLicenceNote),
    ];

    private static string PexelsImageUrl(long photoId) =>
        $"https://images.pexels.com/photos/{photoId}/pexels-photo-{photoId}.jpeg" +
        "?auto=compress&cs=tinysrgb&w=1600";

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
        string AltText,
        string ImageCreatorName = "Kiwimpact",
        string? ImageSourceUrl = null,
        string ImageLicenceNote = ProjectIllustrationLicenceNote);
}
