namespace Kiwimpact.Api.Contracts;

public sealed record QuestDetailDto(
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
    QuestCoverImageDto? CoverImage,
    string? ExternalSourceUrl,
    string? SourceCheckedAt);
