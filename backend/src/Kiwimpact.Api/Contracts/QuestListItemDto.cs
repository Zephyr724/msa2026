namespace Kiwimpact.Api.Contracts;

public sealed record QuestListItemDto(
    Guid Id,
    string Title,
    string Description,
    string Category,
    string SourceType,
    string? RegistrationMode,
    string Difficulty,
    int XpAward,
    int? Capacity,
    string? StartAtUtc,
    string? EndAtUtc,
    QuestLocationRegionDto? LocationRegion,
    string? LocationDescription,
    QuestCoverImageDto? CoverImage);
