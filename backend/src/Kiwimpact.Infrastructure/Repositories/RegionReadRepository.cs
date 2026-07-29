using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class RegionReadRepository : IRegionReadRepository
{
    private readonly KiwimpactDbContext _db;

    public RegionReadRepository(KiwimpactDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Region>> GetActiveLocalAreasAsync(
        string? search, CancellationToken ct = default)
    {
        return await GetActiveByTypeAsync(RegionType.LocalArea, search, ct);
    }

    public async Task<IReadOnlyList<Region>> GetActiveAdministrativeAreasAsync(
        string? search,
        CancellationToken ct = default)
    {
        return await GetActiveByTypeAsync(RegionType.AdministrativeArea, search, ct);
    }

    private async Task<IReadOnlyList<Region>> GetActiveByTypeAsync(
        RegionType type,
        string? search,
        CancellationToken ct)
    {
        var query = _db.Regions
            .AsNoTracking()
            .Where(r => r.IsActive && r.Type == type);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmed = search.Trim();
            query = query.Where(r => EF.Functions.ILike(r.Name, $"%{trimmed}%"));
        }

        return await query
            .OrderBy(r => r.Name)
            .ThenBy(r => r.Id)
            .ToListAsync(ct);
    }

    public async Task<Region?> GetActiveByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Regions
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id && r.IsActive, ct);
    }

    public async Task<IReadOnlyList<Region>> GetActiveChildrenAsync(
        Guid parentId, CancellationToken ct = default)
    {
        return await _db.Regions
            .AsNoTracking()
            .Where(r => r.ParentRegionId == parentId && r.IsActive)
            .OrderBy(r => r.Name)
            .ThenBy(r => r.Id)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Region>> GetActiveAncestorsAsync(
        Guid regionId, CancellationToken ct = default)
    {
        // Use raw SQL for recursive CTE to get ancestors ordered nearest-parent-to-root.
        // The CTE depth column tracks traversal order; ordering by depth DESC yields
        // the nearest parent first, then grandparents, ending at the root.
        // Only the seven Region entity columns are selected in the final output so
        // EF Core's FromSqlRaw can map them correctly.
        var ancestors = await _db.Regions
            .FromSqlRaw(@"
                WITH RECURSIVE ancestor_cte AS (
                    SELECT r.""Id"", r.""Name"", r.""Type"", r.""ParentRegionId"", r.""IsActive"", r.""CreatedAt"", r.""UpdatedAt"", 0 AS depth FROM ""Regions"" r WHERE r.""Id"" = {0} AND r.""IsActive"" = TRUE
                    UNION ALL
                    SELECT p.""Id"", p.""Name"", p.""Type"", p.""ParentRegionId"", p.""IsActive"", p.""CreatedAt"", p.""UpdatedAt"", a.depth + 1 FROM ""Regions"" p
                    INNER JOIN ancestor_cte a ON p.""Id"" = a.""ParentRegionId""
                    WHERE p.""IsActive"" = TRUE
                )
                SELECT ""Id"", ""Name"", ""Type"", ""ParentRegionId"", ""IsActive"", ""CreatedAt"", ""UpdatedAt"" FROM ancestor_cte WHERE ""Id"" <> {0}
                ORDER BY depth ASC
            ", regionId)
            .AsNoTracking()
            .ToListAsync(ct);

        return ancestors;
    }

    public async Task<IReadOnlyList<Guid>> GetActiveDescendantIdsAsync(
        Guid regionId, CancellationToken ct = default)
    {
        var ids = await _db.Database
            .SqlQuery<Guid>($@"
                WITH RECURSIVE descendant_cte AS (
                    SELECT r.""Id"" FROM ""Regions"" r WHERE r.""Id"" = {regionId} AND r.""IsActive"" = TRUE
                    UNION ALL
                    SELECT c.""Id"" FROM ""Regions"" c
                    INNER JOIN descendant_cte d ON c.""ParentRegionId"" = d.""Id""
                    WHERE c.""IsActive"" = TRUE
                )
                SELECT ""Id"" FROM descendant_cte
            ")
            .ToListAsync(ct);

        return ids;
    }
}
