using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Idempotent seed for the New Zealand region hierarchy.
///
/// Source: Auckland Council — Local board plans 2026
/// https://akhaveyoursay.aucklandcouncil.govt.nz/local-board-plans-2026
/// Retrieved: 2026-07-22
///
/// The 21 official local boards of Auckland are seeded with deterministic GUIDs.
/// </summary>
public static class RegionSeed
{
    // Deterministic GUIDs based on namespace UUID v5-style derivation for reproducibility.
    // These are hand-picked stable GUIDs so seed IDs never change between runs.

    public static readonly Guid NewZealandId = new("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
    public static readonly Guid AucklandId = new("b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e");

    // Auckland's 21 local boards
    public static readonly Guid AlbertEdenId = new("c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f");
    public static readonly Guid DevonportTakapunaId = new("d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a");
    public static readonly Guid FranklinId = new("e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b");
    public static readonly Guid GreatBarrierId = new("f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c");
    public static readonly Guid HendersonMasseyId = new("a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d");
    public static readonly Guid HibiscusBaysId = new("b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e");
    public static readonly Guid HowickId = new("c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f");
    public static readonly Guid KaipatikiId = new("d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a");
    public static readonly Guid MangereOtahuhuId = new("e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b");
    public static readonly Guid ManurewaId = new("f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c");
    public static readonly Guid MaungakiekieTamakiId = new("a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d");
    public static readonly Guid OrakeiId = new("c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f");
    public static readonly Guid OtaraPapatoetoeId = new("d6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a");
    public static readonly Guid PapakuraId = new("e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b");
    public static readonly Guid PuketapapaId = new("f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c");
    public static readonly Guid RodneyId = new("a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d");
    public static readonly Guid UpperHarbourId = new("b0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e");
    public static readonly Guid WaihekeId = new("c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f");
    public static readonly Guid WaitakereRangesId = new("d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a");
    public static readonly Guid WaitemataId = new("e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b");
    public static readonly Guid WhauId = new("f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c");

    public static async Task SeedAsync(KiwimpactDbContext db)
    {
        var now = new DateTimeOffset(2026, 7, 22, 0, 0, 0, TimeSpan.Zero);

        // New Zealand (Country)
        var nz = await SeedRegion(db, NewZealandId, "New Zealand", RegionType.Country, null, now);

        // Auckland (AdministrativeArea)
        var auckland = await SeedRegion(db, AucklandId, "Auckland", RegionType.AdministrativeArea, NewZealandId, now);

        // Local boards
        await SeedRegion(db, AlbertEdenId, "Albert-Eden", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, DevonportTakapunaId, "Devonport-Takapuna", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, FranklinId, "Franklin", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, GreatBarrierId, "Great Barrier", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, HendersonMasseyId, "Henderson-Massey", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, HibiscusBaysId, "Hibiscus and Bays", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, HowickId, "Howick", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, KaipatikiId, "Kaipātiki", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, MangereOtahuhuId, "Māngere-Ōtāhuhu", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, ManurewaId, "Manurewa", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, MaungakiekieTamakiId, "Maungakiekie-Tāmaki", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, OrakeiId, "Ōrākei", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, OtaraPapatoetoeId, "Ōtara-Papatoetoe", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, PapakuraId, "Papakura", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, PuketapapaId, "Puketāpapa", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, RodneyId, "Rodney", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, UpperHarbourId, "Upper Harbour", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, WaihekeId, "Waiheke", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, WaitakereRangesId, "Waitākere Ranges", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, WaitemataId, "Waitematā", RegionType.LocalArea, AucklandId, now);
        await SeedRegion(db, WhauId, "Whau", RegionType.LocalArea, AucklandId, now);

        await db.SaveChangesAsync();
    }

    private static async Task<Region> SeedRegion(
        KiwimpactDbContext db, Guid id, string name, RegionType type, Guid? parentId, DateTimeOffset now)
    {
        var existing = await db.Regions.FirstOrDefaultAsync(r => r.Id == id);

        // ── Domain validation ────────────────────────────────────────
        // Validate every region before creating or updating it.
        // Passing null as getParentType means Validate won't check the
        // parent's type from the database. The seed creates Regions in
        // hierarchy order (root first), so parent type consistency is
        // enforced by construction and verified by integration tests.
        var errors = Region.Validate(name, type, parentId, getParentType: null);
        if (errors.Count > 0)
        {
            throw new InvalidOperationException(
                $"Region '{name}' (ID {id}) failed validation: {string.Join("; ", errors)}");
        }

        if (existing is not null)
        {
            // Update non-key fields for idempotency
            existing.GetType().GetProperty("Name")?.SetValue(existing, name);
            existing.GetType().GetProperty("Type")?.SetValue(existing, type);
            existing.GetType().GetProperty("ParentRegionId")?.SetValue(existing, parentId);
            existing.GetType().GetProperty("UpdatedAt")?.SetValue(existing, now);
            return existing;
        }

        var region = (Region)Activator.CreateInstance(typeof(Region), nonPublic: true)!;
        region.GetType().GetProperty("Id")?.SetValue(region, id);
        region.GetType().GetProperty("Name")?.SetValue(region, name);
        region.GetType().GetProperty("Type")?.SetValue(region, type);
        region.GetType().GetProperty("ParentRegionId")?.SetValue(region, parentId);
        region.GetType().GetProperty("IsActive")?.SetValue(region, true);
        region.GetType().GetProperty("CreatedAt")?.SetValue(region, now);
        region.GetType().GetProperty("UpdatedAt")?.SetValue(region, now);

        db.Regions.Add(region);
        return region;
    }
}