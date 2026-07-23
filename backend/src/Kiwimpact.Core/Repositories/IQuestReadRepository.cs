using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Queries;

namespace Kiwimpact.Core.Repositories;

public interface IQuestReadRepository
{
    /// <summary>
    /// Returns a paged result of published Quests matching the query, decorated with
    /// navigation properties needed for DTO mapping.
    /// </summary>
    /// <param name="query">The validated discovery query.</param>
    /// <param name="regionIds">
    /// Optional list of region IDs to filter by (selected Region plus active descendants).
    /// When not null, only Quests whose LocationRegionId is in this set are returned.
    /// When null, no region filter is applied.
    /// </param>
    Task<(IReadOnlyList<Quest> Items, int TotalCount)> GetPublishedPageAsync(
        QuestDiscoveryQuery query, IReadOnlyList<Guid>? regionIds, CancellationToken ct = default);

    /// <summary>
    /// Returns a published Quest by ID with navigation properties, or null if missing or not Published.
    /// </summary>
    Task<Quest?> GetPublishedByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Returns images for a published Quest, ordered by SortOrder ASC then Id ASC.
    /// </summary>
    Task<IReadOnlyList<QuestImage>> GetPublishedImagesAsync(Guid questId, CancellationToken ct = default);
}