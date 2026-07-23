using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Queries;
using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class QuestDiscoveryService : IQuestDiscoveryService
{
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 12;
    private const int MaxPageSize = 50;
    private const int MaxSearchLength = 100;

    private readonly IQuestReadRepository _repository;
    private readonly IRegionReadRepository _regionRepository;

    public QuestDiscoveryService(IQuestReadRepository repository, IRegionReadRepository regionRepository)
    {
        _repository = repository;
        _regionRepository = regionRepository;
    }

    public async Task<(IReadOnlyList<Quest> Items, int TotalCount)> GetPublishedPageAsync(
        int page, int pageSize, string? category, string? sourceType,
        string? difficulty, string? regionId, string? search,
        string? sortBy, string? sortDirection, CancellationToken ct = default)
    {
        // Validate pagination — reject invalid values, do not normalize
        if (page < 1)
            throw new ArgumentOutOfRangeException(nameof(page), "Page must be >= 1.");
        if (pageSize < 1)
            throw new ArgumentOutOfRangeException(nameof(pageSize), "Page size must be >= 1.");
        if (pageSize > MaxPageSize)
            throw new ArgumentOutOfRangeException(nameof(pageSize), $"Page size must be <= {MaxPageSize}.");

        // Parse enums (case-insensitive); null means not provided
        QuestCategory? parsedCategory = TryParseEnum<QuestCategory>(category);
        QuestSourceType? parsedSourceType = TryParseEnum<QuestSourceType>(sourceType);
        QuestDifficulty? parsedDifficulty = TryParseEnum<QuestDifficulty>(difficulty);

        // Validate search
        string? trimmedSearch = search?.Trim();
        if (trimmedSearch is { Length: 0 })
            trimmedSearch = null;
        if (trimmedSearch is { Length: > MaxSearchLength })
            throw new ArgumentException($"Search must be at most {MaxSearchLength} characters.", nameof(search));

        // Validate regionId
        Guid? parsedRegionId = null;
        if (!string.IsNullOrWhiteSpace(regionId))
        {
            if (!Guid.TryParse(regionId, out var rid))
                throw new ArgumentException("Invalid region ID format.", nameof(regionId));
            // Verify Region exists and is active
            var region = await _regionRepository.GetActiveByIdAsync(rid, ct);
            if (region is null)
                throw new ArgumentException("Region not found or inactive.", nameof(regionId));
            parsedRegionId = rid;
        }

        // Validate sort — reject numeric representations
        QuestSortBy parsedSortBy = QuestSortBy.StartAt;
        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            if (long.TryParse(sortBy, out _) || ulong.TryParse(sortBy, out _))
                throw new ArgumentException($"Invalid sortBy value '{sortBy}'. Numeric values are not accepted. Supported: {string.Join(", ", Enum.GetNames<QuestSortBy>())}", nameof(sortBy));
            if (!Enum.TryParse<QuestSortBy>(sortBy, ignoreCase: true, out parsedSortBy) || !Enum.IsDefined(parsedSortBy))
                throw new ArgumentException($"Invalid sortBy value '{sortBy}'. Supported: {string.Join(", ", Enum.GetNames<QuestSortBy>())}", nameof(sortBy));
        }

        SortDirection parsedSortDirection = SortDirection.Asc;
        if (!string.IsNullOrWhiteSpace(sortDirection))
        {
            if (long.TryParse(sortDirection, out _) || ulong.TryParse(sortDirection, out _))
                throw new ArgumentException($"Invalid sortDirection value '{sortDirection}'. Numeric values are not accepted. Supported: Asc, Desc", nameof(sortDirection));
            if (!Enum.TryParse<SortDirection>(sortDirection, ignoreCase: true, out parsedSortDirection) || !Enum.IsDefined(parsedSortDirection))
                throw new ArgumentException($"Invalid sortDirection value '{sortDirection}'. Supported: Asc, Desc", nameof(sortDirection));
        }

        // Expand region filter to include selected Region plus active descendants
        IReadOnlyList<Guid>? regionIds = null;
        if (parsedRegionId.HasValue)
        {
            regionIds = await _regionRepository.GetActiveDescendantIdsAsync(parsedRegionId.Value, ct);
        }

        var query = new QuestDiscoveryQuery(
            page, pageSize, parsedCategory, parsedSourceType, parsedDifficulty,
            parsedRegionId, trimmedSearch, parsedSortBy, parsedSortDirection);

        return await _repository.GetPublishedPageAsync(query, regionIds, ct);
    }

    public async Task<Quest?> GetPublishedByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _repository.GetPublishedByIdAsync(id, ct);
    }

    public async Task<IReadOnlyList<QuestImage>> GetPublishedImagesAsync(Guid id, CancellationToken ct = default)
    {
        return await _repository.GetPublishedImagesAsync(id, ct);
    }

    private static T? TryParseEnum<T>(string? value) where T : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        // Reject numeric enum representations such as "0", "1", "999", "-1".
        if (long.TryParse(value, out _) || ulong.TryParse(value, out _))
            throw new ArgumentException(
                $"Invalid value '{value}'. Numeric values are not accepted. Supported: {string.Join(", ", Enum.GetNames<T>())}");

        if (!Enum.TryParse<T>(value, ignoreCase: true, out var result) || !Enum.IsDefined(result))
            throw new ArgumentException(
                $"Invalid value '{value}'. Supported: {string.Join(", ", Enum.GetNames<T>())}");

        return result;
    }
}