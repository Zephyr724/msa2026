using Kiwimpact.Core.Entities;

namespace Kiwimpact.Core.Repositories;

public interface IQuestWriteRepository
{
    Task<IReadOnlyList<Quest>> ListManagedAsync(
        Guid actorId, bool isAdmin, CancellationToken ct = default);

    Task<Quest?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<bool> IsRegionActiveAsync(Guid regionId, CancellationToken ct = default);

    void Add(Quest quest);
    void Remove(Quest quest);
    Task SaveChangesAsync(CancellationToken ct = default);
    Task ReloadAsync(Quest quest, CancellationToken ct = default);
}
