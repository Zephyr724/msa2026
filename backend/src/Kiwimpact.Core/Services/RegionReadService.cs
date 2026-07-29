using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class RegionReadService : IRegionReadService
{
    private readonly IRegionReadRepository _repository;

    public RegionReadService(IRegionReadRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<Region>> GetActiveLocalAreasAsync(
        string? search, CancellationToken ct = default)
    {
        return _repository.GetActiveLocalAreasAsync(search, ct);
    }

    public Task<IReadOnlyList<Region>> GetActiveAdministrativeAreasAsync(
        string? search,
        CancellationToken ct = default)
    {
        return _repository.GetActiveAdministrativeAreasAsync(search, ct);
    }

    public Task<Region?> GetActiveRegionAsync(Guid id, CancellationToken ct = default)
    {
        return _repository.GetActiveByIdAsync(id, ct);
    }

    public Task<IReadOnlyList<Region>> GetActiveChildrenAsync(
        Guid id, CancellationToken ct = default)
    {
        return _repository.GetActiveChildrenAsync(id, ct);
    }

    public Task<IReadOnlyList<Region>> GetActiveAncestorsAsync(
        Guid id, CancellationToken ct = default)
    {
        return _repository.GetActiveAncestorsAsync(id, ct);
    }

    public Task<IReadOnlyList<Guid>> GetActiveDescendantIdsAsync(
        Guid id, CancellationToken ct = default)
    {
        return _repository.GetActiveDescendantIdsAsync(id, ct);
    }
}
