using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Queries;

namespace Kiwimpact.Core.Services;

public interface IQuestDiscoveryService
{
    Task<(IReadOnlyList<Quest> Items, int TotalCount)> GetPublishedPageAsync(
        int page, int pageSize, string? category, string? sourceType,
        string? difficulty, string? regionId, string? search,
        string? sortBy, string? sortDirection, CancellationToken ct = default);

    Task<Quest?> GetPublishedByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<QuestImage>> GetPublishedImagesAsync(Guid id, CancellationToken ct = default);
}