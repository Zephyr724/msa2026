using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Development-only idempotent demo Quest seed.
/// Creates 18 fictional Quests (15 Published, 3 non-Published: Draft, Cancelled, Archived).
///
/// Deterministic development curator: dev-seed-curator
/// ID: cf3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f
/// Email: dev-seed-curator@kiwimpact.invalid
/// PasswordHash: null (no password, disabled for sign-in)
/// No role, claim, login, or token rows are created.
/// </summary>
public static class DemoQuestSeed
{
    public static readonly Guid CuratorUserId = new("cf3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f");

    public static async Task SeedAsync(KiwimpactDbContext db)
    {
        // Ensure dev curator exists (no roles, claims, logins, or tokens)
        var existing = await db.Set<ApplicationUser>()
            .FirstOrDefaultAsync(u => u.Id == CuratorUserId);
        if (existing is null)
        {
            var curator = new ApplicationUser
            {
                Id = CuratorUserId,
                UserName = "dev-seed-curator",
                NormalizedUserName = "DEV-SEED-CURATOR",
                Email = "dev-seed-curator@kiwimpact.invalid",
                NormalizedEmail = "DEV-SEED-CURATOR@KIWIMPACT.INVALID",
                EmailConfirmed = false,
                PasswordHash = null,
                SecurityStamp = null,
                ConcurrencyStamp = null,
                LockoutEnabled = true,
                AccessFailedCount = 0
            };
            db.Set<ApplicationUser>().Add(curator);
            // Defer SaveChanges — seed transaction commits curator + Quests + images atomically.
        }

        var now = new DateTimeOffset(2026, 7, 22, 0, 0, 0, TimeSpan.Zero);

        // ---------- Published Quests (15) ----------

        await Seed(db, Q("11111111-1111-4111-8111-111111111101",
            "Community Stream Cleanup", "Help clean up our local stream and protect native wildlife.",
            QuestCategory.CleanReduceWaste, QuestStatus.Published, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Easy, 50, 30, now.AddDays(7), now.AddDays(7).AddHours(3),
            RegionSeed.HendersonMasseyId,
            "Opanuku Reserve, 1A Henderson Valley Road, Henderson, Auckland 0612, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/stream-cleanup.svg",
            "Volunteers collecting litter beside a stream", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-111111111102",
            "Native Tree Planting Day", "Plant native trees to restore the local ecosystem.",
            QuestCategory.RestoreNature, QuestStatus.Published, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Medium, 100, 50, now.AddDays(14), now.AddDays(14).AddHours(4),
            RegionSeed.DevonportTakapunaId,
            "Takapuna Beach Reserve, 37 The Strand, Takapuna, Auckland 0622, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/tree-planting.svg",
            "Community members planting native trees together", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-111111111103",
            "Recycling Workshop", "Learn how to recycle effectively in your community.",
            QuestCategory.CleanReduceWaste, QuestStatus.Published, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Easy, 30, 25, now.AddDays(3), now.AddDays(3).AddHours(2),
            RegionSeed.AlbertEdenId,
            "Mount Albert Community and Leisure Centre, 773 New North Road, Mount Albert, Auckland 1025, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/recycling-workshop.svg",
            "Hands sorting recyclable materials at a workshop", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-111111111104",
            "Kiwi Bird Habitat Protection", "Protect kiwi bird habitats by removing invasive species.",
            QuestCategory.ProtectWildlife, QuestStatus.Published, QuestSourceType.AdminCuratedExternal,
            RegistrationMode.External, QuestDifficulty.Hard, 200, 15, now.AddDays(21), now.AddDays(21).AddHours(8),
            RegionSeed.FranklinId,
            "Hūnua Ranges Regional Park, Falls Road, Hūnua, Auckland 2583, New Zealand",
            "https://example-ngo.org/kiwi-habitat", ExternalSourceStatus.Current, now, now.AddDays(90),
            now,
            "/images/quests/kiwi-habitat.svg",
            "A kiwi bird in its protected native forest habitat", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-111111111105",
            "Water Quality Monitoring", "Monitor and report water quality in local waterways.",
            QuestCategory.ObserveMeasure, QuestStatus.Published, QuestSourceType.AdminCuratedExternal,
            RegistrationMode.NoneRequired, QuestDifficulty.Medium, 80, 20, null, null,
            RegionSeed.HowickId,
            "Howick Beach, Marine Parade, Howick, Auckland 2014, New Zealand",
            "https://example-council.govt.nz/water-monitoring", ExternalSourceStatus.NeedsReview, null, null,
            now,
            "/images/quests/water-quality.svg",
            "Testing water quality with scientific equipment", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-111111111106",
            "School Environmental Education", "Teach primary school children about environmental care.",
            QuestCategory.LearnShare, QuestStatus.Published, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Easy, 40, 10, now.AddDays(5), now.AddDays(5).AddHours(3),
            RegionSeed.KaipatikiId,
            "Glenfield Primary School, 101 Chivalry Road, Glenfield, Auckland 0629, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/school-education.svg",
            "Students learning about composting and waste reduction", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-111111111107",
            "Coastal Cleanup Challenge", "Join the Great Barrier community coastal cleanup.",
            QuestCategory.CleanReduceWaste, QuestStatus.Published, QuestSourceType.PlatformEcoChallenge,
            RegistrationMode.Native, QuestDifficulty.Hard, 150, null, now.AddDays(10), now.AddDays(10).AddHours(6),
            RegionSeed.GreatBarrierId,
            "Tryphena Beach, Great Barrier Island / Aotea, Auckland 0991, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/coastal-cleanup.svg",
            "View of beautiful Great Barrier Island coastline", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-111111111108",
            "Māngere Bike Path Planting", "Plant native shrubs along the Māngere bike path.",
            QuestCategory.RestoreNature, QuestStatus.Published, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Easy, 45, 40, now.AddDays(2), now.AddDays(2).AddHours(3),
            RegionSeed.MangereOtahuhuId,
            "Māngere Town Centre, 93 Bader Drive, Māngere, Auckland 2022, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/bike-path-planting.svg",
            "Native shrubs along a community bike path", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-111111111109",
            "Manurewa Community Garden", "Create a sustainable community garden in Manurewa.",
            QuestCategory.GrowCompost, QuestStatus.Published, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Medium, 75, 20, null, null,
            RegionSeed.ManurewaId,
            "Manurewa Sports Centre, 180 Weymouth Road, Manurewa, Auckland 2103, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/community-garden.svg",
            "Community members tending vegetables in raised beds", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-11111111110A",
            "Tāmaki Wetland Restoration", "Restore the Maungakiekie-Tāmaki wetland ecosystem.",
            QuestCategory.ProtectWildlife, QuestStatus.Published, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Hard, 250, 10, now.AddDays(30), now.AddDays(30).AddHours(8),
            RegionSeed.MaungakiekieTamakiId,
            "Panmure Basin, Lagoon Drive, Panmure, Auckland 1072, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/wetland-restoration.svg",
            "Native birds at a restored wetland area", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-11111111110B",
            "Auckland Citywide Bird Count", "Count and identify birds across Auckland backyards and parks.",
            QuestCategory.ObserveMeasure, QuestStatus.Published, QuestSourceType.PlatformEcoChallenge,
            RegistrationMode.NoneRequired, QuestDifficulty.Easy, 50, null, now.AddDays(14), now.AddDays(28),
            RegionSeed.AucklandId, "Across Auckland, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/beach-survey.svg",
            "Bird watcher with binoculars in an urban park", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-11111111110C",
            "Backyard Biodiversity Challenge", "Document the native plants and insects in your own backyard.",
            QuestCategory.ObserveMeasure, QuestStatus.Published, QuestSourceType.PlatformEcoChallenge,
            RegistrationMode.NoneRequired, QuestDifficulty.Easy, 25, null, now.AddDays(1), now.AddDays(30),
            null, "Your backyard or a local park in Auckland, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/heritage-trees.svg",
            "Close-up of a native plant with a butterfly perched on its leaf", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-11111111110D",
            "Ōtara Youth Eco Club", "Mentor youth on environmental stewardship in Ōtara-Papatoetoe.",
            QuestCategory.LearnShare, QuestStatus.Published, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Easy, 55, 30, now.AddDays(6), now.AddDays(6).AddHours(3),
            RegionSeed.OtaraPapatoetoeId,
            "Te Puke ō Tara Community Centre, 20 Newbury Street, Ōtara, Auckland 2023, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/youth-eco-club.svg",
            "Young students working in a greenhouse together", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-11111111110E",
            "Papakura Waste Audit", "Audit community waste to improve recycling rates.",
            QuestCategory.CleanReduceWaste, QuestStatus.Published, QuestSourceType.AdminCuratedExternal,
            RegistrationMode.External, QuestDifficulty.Medium, 70, 12, now.AddDays(8), now.AddDays(8).AddHours(4),
            RegionSeed.PapakuraId,
            "Papakura Transfer Station, 25 Inlet Road, Takanini, Auckland 2112, New Zealand",
            "https://example-council.govt.nz/waste-audit", ExternalSourceStatus.SourceRemoved, now.AddDays(-90), null,
            now,
            "/images/quests/waste-audit.svg",
            "Sorted waste categories in clear labelled bins", "Kiwimpact", null, "Project-owned demo illustration"));

        await Seed(db, Q("11111111-1111-4111-8111-11111111110F",
            "Mt Roskill Stream Planting", "Plant native flax along Puketāpapa streams.",
            QuestCategory.RestoreNature, QuestStatus.Published, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Easy, 45, 35, null, null,
            RegionSeed.PuketapapaId,
            "Mount Roskill War Memorial Park, 13 May Road, Mount Roskill, Auckland 1041, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/stream-planting.svg",
            "Harakeke (flax) planted alongside a flowing stream", "Kiwimpact", null, "Project-owned demo illustration"));

        // ---------- Non-Published visibility cases (3) ----------

        // Draft
        await Seed(db, Q("11111111-1111-4111-8111-111111111110",
            "Rodney Coast Draft Plan", "Draft plan for Rodney coastal restoration (internal draft).",
            QuestCategory.ProtectWildlife, QuestStatus.Draft, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Medium, 100, 20, null, null,
            RegionSeed.RodneyId, "Wenderholm Regional Park, 37 Schischka Road, Waiwera 0873, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/draft-quest.svg",
            "Coastal landscape in Rodney district", "Kiwimpact", null, "Project-owned demo illustration"));

        // Cancelled
        await Seed(db, Q("11111111-1111-4111-8111-111111111111",
            "Upper Harbour Cancelled Event", "Previously scheduled planting day (cancelled).",
            QuestCategory.RestoreNature, QuestStatus.Cancelled, QuestSourceType.OrganizerOwned,
            RegistrationMode.Native, QuestDifficulty.Easy, 30, 25, now.AddDays(-30), now.AddDays(-30).AddHours(3),
            RegionSeed.UpperHarbourId, "Hobsonville Point Park, Buckley Avenue, Hobsonville, Auckland 0618, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/cancelled-quest.svg",
            "Park area at Hobsonville Point", "Kiwimpact", null, "Project-owned demo illustration"));

        // Archived
        await Seed(db, Q("11111111-1111-4111-8111-111111111112",
            "Waiheke Archived Survey", "2025 citizen science survey results (archived).",
            QuestCategory.ObserveMeasure, QuestStatus.Archived, QuestSourceType.PlatformEcoChallenge,
            RegistrationMode.NoneRequired, QuestDifficulty.Medium, 60, 8, now.AddDays(-90), now.AddDays(-90).AddHours(2),
            RegionSeed.WaihekeId, "Oneroa Beach, The Esplanade, Oneroa, Waiheke Island 1081, New Zealand",
            null, null, null, null,
            now,
            "/images/quests/archived-quest.svg",
            "Waiheke Island beach with clear waters", "Kiwimpact", null, "Project-owned demo illustration"));

        await db.SaveChangesAsync();
    }

    private static QuestParams Q(string id, string title, string desc,
        QuestCategory cat, QuestStatus status, QuestSourceType srcType,
        RegistrationMode? regMode, QuestDifficulty diff, int xp,
        int? cap, DateTimeOffset? startAt, DateTimeOffset? endAt,
        Guid? regionId, string? locDesc,
        string? extUrl, ExternalSourceStatus? extStatus, DateTimeOffset? checkedAt, DateTimeOffset? nextDue,
        DateTimeOffset now,
        string imgUrl, string altText, string creator, string? srcUrl, string? licence)
    {
        return new QuestParams(
            new Guid(id), title, desc, cat, status, srcType, regMode, diff, xp, cap,
            startAt, endAt, regionId, locDesc, extUrl, extStatus, checkedAt, nextDue, now,
            imgUrl, altText, creator, srcUrl, licence);
    }

    private static async Task Seed(KiwimpactDbContext db, QuestParams p)
    {
        var coordinates = CoordinatesFor(p.RegionId);
        var existing = await db.Quests.FirstOrDefaultAsync(q => q.Id == p.Id);
        if (existing is not null)
        {
            existing.Title = p.Title;
            existing.Description = p.Description;
            existing.Category = p.Category;
            existing.Status = p.Status;
            existing.SourceType = p.SourceType;
            existing.RegistrationMode = p.RegistrationMode;
            existing.Difficulty = p.Difficulty;
            existing.XpAward = p.Xp;
            existing.Capacity = p.Capacity;
            existing.StartAtUtc = p.StartAt;
            existing.EndAtUtc = p.EndAt;
            existing.LocationRegionId = p.RegionId;
            existing.LocationDescription = p.LocationDescription;
            existing.Latitude = coordinates?.Latitude;
            existing.Longitude = coordinates?.Longitude;
            existing.ExternalSourceUrl = p.ExtUrl;
            existing.ExternalSourceStatus = p.ExtStatus;
            existing.SourceCheckedAt = p.CheckedAt;
            existing.NextCheckDueAt = p.NextDue;
            existing.UpdatedAt = p.Now;
            return;
        }

        db.Quests.Add(new Quest
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            Category = p.Category,
            Status = p.Status,
            SourceType = p.SourceType,
            RegistrationMode = p.RegistrationMode,
            Difficulty = p.Difficulty,
            XpAward = p.Xp,
            Capacity = p.Capacity,
            StartAtUtc = p.StartAt,
            EndAtUtc = p.EndAt,
            LocationRegionId = p.RegionId,
            LocationDescription = p.LocationDescription,
            Latitude = coordinates?.Latitude,
            Longitude = coordinates?.Longitude,
            ExternalSourceUrl = p.ExtUrl,
            ExternalSourceStatus = p.ExtStatus,
            SourceCheckedAt = p.CheckedAt,
            NextCheckDueAt = p.NextDue,
            CreatedByUserId = CuratorUserId,
            CreatedAt = p.Now,
            UpdatedAt = p.Now
        });

        // Cover image — derive deterministic image GUID by replacing "1111" with "2111"
        var imageId = Guid.Parse(p.Id.ToString().Replace("1111", "2111"));
        if (await db.QuestImages.FirstOrDefaultAsync(i => i.Id == imageId) is null)
        {
            db.QuestImages.Add(new QuestImage
            {
                Id = imageId,
                QuestId = p.Id,
                ImageUrl = p.ImageUrl,
                AltText = p.AltText,
                SortOrder = 0,
                IsCover = true,
                CreatorName = p.CreatorName,
                SourceUrl = p.SourceImageUrl,
                LicenceNote = p.LicenceNote
            });
        }
    }

    private static (decimal Latitude, decimal Longitude)? CoordinatesFor(Guid? regionId) =>
        regionId switch
        {
            var id when id == RegionSeed.HendersonMasseyId => (-36.874700m, 174.628500m),
            var id when id == RegionSeed.DevonportTakapunaId => (-36.787000m, 174.773000m),
            var id when id == RegionSeed.AlbertEdenId => (-36.884000m, 174.720000m),
            var id when id == RegionSeed.FranklinId => (-37.069000m, 175.100000m),
            var id when id == RegionSeed.HowickId => (-36.894000m, 174.932000m),
            var id when id == RegionSeed.KaipatikiId => (-36.781000m, 174.722000m),
            var id when id == RegionSeed.GreatBarrierId => (-36.257000m, 175.489000m),
            var id when id == RegionSeed.MangereOtahuhuId => (-36.968000m, 174.798000m),
            var id when id == RegionSeed.ManurewaId => (-37.020000m, 174.895000m),
            var id when id == RegionSeed.MaungakiekieTamakiId => (-36.889000m, 174.836000m),
            var id when id == RegionSeed.OtaraPapatoetoeId => (-36.962000m, 174.874000m),
            var id when id == RegionSeed.PapakuraId => (-37.065000m, 174.943000m),
            _ => null,
        };

    private sealed record QuestParams(
        Guid Id, string Title, string Description,
        QuestCategory Category, QuestStatus Status, QuestSourceType SourceType,
        RegistrationMode? RegistrationMode, QuestDifficulty Difficulty, int Xp,
        int? Capacity, DateTimeOffset? StartAt, DateTimeOffset? EndAt,
        Guid? RegionId, string? LocationDescription,
        string? ExtUrl, ExternalSourceStatus? ExtStatus, DateTimeOffset? CheckedAt, DateTimeOffset? NextDue,
        DateTimeOffset Now,
        string ImageUrl, string AltText, string CreatorName, string? SourceImageUrl, string? LicenceNote);
}
