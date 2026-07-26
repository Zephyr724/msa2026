namespace Kiwimpact.Api.Contracts;

public sealed record AchievementCatalogItemDto(
    Guid Id,
    string Code,
    string Name,
    string Description,
    string? IconUrl,
    string Category);

public sealed record EarnedAchievementItemDto(
    Guid AchievementId,
    string Code,
    string Name,
    string Description,
    string? IconUrl,
    string Category,
    string AwardedAt);
