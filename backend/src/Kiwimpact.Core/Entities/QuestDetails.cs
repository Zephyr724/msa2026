using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Entities;

public sealed record QuestDetails(
    string Title,
    string Description,
    QuestCategory Category,
    RegistrationMode RegistrationMode,
    QuestDifficulty Difficulty,
    int? Capacity,
    DateTimeOffset? StartAtUtc,
    DateTimeOffset? EndAtUtc,
    Guid? LocationRegionId,
    string? LocationDescription,
    string? ExternalSourceUrl);

public sealed record QuestCoverImageDetails(
    string ImageUrl,
    string AltText,
    string? CreatorName,
    string? SourceUrl,
    string? LicenceNote);
