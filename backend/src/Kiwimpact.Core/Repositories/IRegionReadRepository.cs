using Kiwimpact.Core.Entities;

namespace Kiwimpact.Core.Repositories;

public interface IRegionReadRepository
{
    /// <summary>
    /// Returns active LocalArea regions, optionally filtered by case-insensitive search,
    /// ordered by Name ASC then Id ASC.
    /// </summary>
    Task<IReadOnlyList<Region>> GetActiveLocalAreasAsync(string? search, CancellationToken ct = default);

    /// <summary>
    /// Returns active AdministrativeArea regions, optionally filtered by
    /// case-insensitive search, ordered by Name ASC then Id ASC.
    /// Product UI presents this hierarchy level as City.
    /// </summary>
    Task<IReadOnlyList<Region>> GetActiveAdministrativeAreasAsync(
        string? search,
        CancellationToken ct = default);

    /// <summary>
    /// Returns an active region by ID, or null if missing or inactive.
    /// </summary>
    Task<Region?> GetActiveByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Returns active direct children of the given region, ordered by Name ASC then Id ASC.
    /// </summary>
    Task<IReadOnlyList<Region>> GetActiveChildrenAsync(Guid parentId, CancellationToken ct = default);

    /// <summary>
    /// Returns active ancestors from nearest parent to root.
    /// </summary>
    Task<IReadOnlyList<Region>> GetActiveAncestorsAsync(Guid regionId, CancellationToken ct = default);

    /// <summary>
    /// Returns IDs of the given active region and all its active descendants.
    /// </summary>
    Task<IReadOnlyList<Guid>> GetActiveDescendantIdsAsync(Guid regionId, CancellationToken ct = default);
}
