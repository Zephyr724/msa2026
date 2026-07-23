namespace Kiwimpact.Api.Contracts;

public sealed record QuestImageDto(
    Guid Id,
    string ImageUrl,
    string AltText,
    int SortOrder,
    bool IsCover,
    string? CreatorName,
    string? SourceUrl,
    string? LicenceNote);