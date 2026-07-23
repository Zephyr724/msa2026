using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Queries;

public sealed class QuestDiscoveryQuery
{
    public int Page { get; }
    public int PageSize { get; }
    public QuestCategory? Category { get; }
    public QuestSourceType? SourceType { get; }
    public QuestDifficulty? Difficulty { get; }
    public Guid? RegionId { get; }
    public string? Search { get; }
    public QuestSortBy SortBy { get; }
    public SortDirection SortDirection { get; }

    public QuestDiscoveryQuery(
        int page,
        int pageSize,
        QuestCategory? category,
        QuestSourceType? sourceType,
        QuestDifficulty? difficulty,
        Guid? regionId,
        string? search,
        QuestSortBy sortBy,
        SortDirection sortDirection)
    {
        Page = page;
        PageSize = pageSize;
        Category = category;
        SourceType = sourceType;
        Difficulty = difficulty;
        RegionId = regionId;
        Search = search;
        SortBy = sortBy;
        SortDirection = sortDirection;
    }
}

public enum QuestSortBy
{
    StartAt,
    CreatedAt,
    Title
}

public enum SortDirection
{
    Asc,
    Desc
}