namespace Kiwimpact.Api.Contracts;

public sealed record CoverImageRequest(
    string? ImageUrl,
    string? AltText,
    string? CreatorName,
    string? SourceUrl,
    string? LicenceNote);

public sealed record CreateQuestRequest(
    string? Title,
    string? Description,
    string? Category,
    string? RegistrationMode,
    string? Difficulty,
    int? Capacity,
    DateTimeOffset? StartAtUtc,
    DateTimeOffset? EndAtUtc,
    Guid? LocationRegionId,
    string? LocationDescription,
    string? ExternalSourceUrl,
    CoverImageRequest? CoverImage,
    decimal? Latitude = null,
    decimal? Longitude = null);

public sealed record UpdateQuestRequest(
    string? Title,
    string? Description,
    string? Category,
    string? RegistrationMode,
    string? Difficulty,
    int? Capacity,
    DateTimeOffset? StartAtUtc,
    DateTimeOffset? EndAtUtc,
    Guid? LocationRegionId,
    string? LocationDescription,
    string? ExternalSourceUrl,
    CoverImageRequest? CoverImage,
    uint Version,
    decimal? Latitude = null,
    decimal? Longitude = null);

public sealed record QuestVersionRequest(uint Version);

public sealed record CancelQuestRequest(uint Version, bool ConfirmActiveParticipants = false);

public sealed record QuestManagementListItemDto(
    Guid Id,
    string Title,
    string Status,
    string Category,
    string Difficulty,
    int? Capacity,
    string? StartAtUtc,
    string? EndAtUtc,
    QuestLocationRegionDto? LocationRegion,
    string UpdatedAtUtc,
    uint Version);

public sealed record QuestManagementDetailDto(
    Guid Id,
    string Title,
    string Description,
    string Category,
    string Status,
    string SourceType,
    string? RegistrationMode,
    string Difficulty,
    int XpAward,
    int? Capacity,
    string? StartAtUtc,
    string? EndAtUtc,
    QuestLocationRegionDto? LocationRegion,
    string? LocationDescription,
    string? ExternalSourceUrl,
    string? ExternalSourceStatus,
    string? SourceCheckedAtUtc,
    string? NextCheckDueAtUtc,
    QuestManagementCoverImageDto CoverImage,
    string CreatedAtUtc,
    string UpdatedAtUtc,
    uint Version,
    decimal? Latitude = null,
    decimal? Longitude = null);

public sealed record QuestManagementCoverImageDto(
    Guid Id,
    string ImageUrl,
    string AltText,
    string? CreatorName,
    string? SourceUrl,
    string? LicenceNote);
