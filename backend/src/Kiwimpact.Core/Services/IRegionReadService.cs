using Kiwimpact.Core.Entities;

namespace Kiwimpact.Core.Services;

public interface IRegionReadService
{
    Task<IReadOnlyList<Region>> GetActiveLocalAreasAsync(string? search, CancellationToken ct = default);
    Task<IReadOnlyList<Region>> GetActiveAdministrativeAreasAsync(
        string? search,
        CancellationToken ct = default);
    Task<Region?> GetActiveRegionAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Region>> GetActiveChildrenAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Region>> GetActiveAncestorsAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Guid>> GetActiveDescendantIdsAsync(Guid id, CancellationToken ct = default);
}
