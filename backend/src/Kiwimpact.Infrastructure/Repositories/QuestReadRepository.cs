using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Queries;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class QuestReadRepository : IQuestReadRepository
{
    private readonly KiwimpactDbContext _db;

    public QuestReadRepository(KiwimpactDbContext db)
    {
        _db = db;
    }

    private IQueryable<Quest> PublishedQuestBase()
    {
        return _db.Quests
            .AsNoTracking()
            .Where(q => q.Status == QuestStatus.Published)
            .Include(q => q.LocationRegion)
            .Include(q => q.Images);
    }

    public async Task<(IReadOnlyList<Quest> Items, int TotalCount)> GetPublishedPageAsync(
        QuestDiscoveryQuery query, IReadOnlyList<Guid>? regionIds, CancellationToken ct = default)
    {
        var baseQuery = PublishedQuestBase();

        // Apply region filter: selected Region plus active descendants
        // null LocationRegionId does not match an active Region filter
        if (regionIds is not null && regionIds.Count > 0)
        {
            baseQuery = baseQuery.Where(q => q.LocationRegionId != null && regionIds.Contains(q.LocationRegionId.Value));
        }

        // Apply category filter
        if (query.Category.HasValue)
            baseQuery = baseQuery.Where(q => q.Category == query.Category.Value);

        // Apply sourceType filter
        if (query.SourceType.HasValue)
            baseQuery = baseQuery.Where(q => q.SourceType == query.SourceType.Value);

        // Apply difficulty filter
        if (query.Difficulty.HasValue)
            baseQuery = baseQuery.Where(q => q.Difficulty == query.Difficulty.Value);

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            baseQuery = baseQuery.Where(q =>
                EF.Functions.ILike(q.Title, $"%{search}%") ||
                EF.Functions.ILike(q.Description, $"%{search}%") ||
                (q.LocationDescription != null && EF.Functions.ILike(q.LocationDescription, $"%{search}%")));
        }

        // Sort
        baseQuery = query.SortBy switch
        {
            QuestSortBy.StartAt => query.SortDirection == SortDirection.Asc
                ? baseQuery.OrderBy(q => q.StartAtUtc.HasValue ? 0 : 1)
                    .ThenBy(q => q.StartAtUtc)
                    .ThenByDescending(q => q.CreatedAt)
                    .ThenBy(q => q.Id)
                : baseQuery.OrderBy(q => q.StartAtUtc.HasValue ? 1 : 0)
                    .ThenByDescending(q => q.StartAtUtc)
                    .ThenByDescending(q => q.CreatedAt)
                    .ThenBy(q => q.Id),

            QuestSortBy.CreatedAt => query.SortDirection == SortDirection.Asc
                ? baseQuery.OrderBy(q => q.CreatedAt).ThenBy(q => q.Id)
                : baseQuery.OrderByDescending(q => q.CreatedAt).ThenBy(q => q.Id),

            QuestSortBy.Title => query.SortDirection == SortDirection.Asc
                ? baseQuery.OrderBy(q => q.Title).ThenBy(q => q.Id)
                : baseQuery.OrderByDescending(q => q.Title).ThenBy(q => q.Id),

            _ => baseQuery.OrderBy(q => q.StartAtUtc.HasValue ? 0 : 1)
                .ThenBy(q => q.StartAtUtc)
                .ThenByDescending(q => q.CreatedAt)
                .ThenBy(q => q.Id)
        };

        var totalCount = await baseQuery.CountAsync(ct);

        var items = await baseQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<Quest?> GetPublishedByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await PublishedQuestBase()
            .FirstOrDefaultAsync(q => q.Id == id, ct);
    }

    public async Task<IReadOnlyList<QuestImage>> GetPublishedImagesAsync(
        Guid questId, CancellationToken ct = default)
    {
        return await _db.QuestImages
            .AsNoTracking()
            .Where(i => i.QuestId == questId && i.Quest.Status == QuestStatus.Published)
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .ToListAsync(ct);
    }
}