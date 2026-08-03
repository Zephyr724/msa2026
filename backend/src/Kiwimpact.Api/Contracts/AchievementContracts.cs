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

public sealed record AchievementNationwideStatDto(
    Guid AchievementId,
    int NationwideEarnedCount,
    int NationwideMemberCount,
    decimal EarnedPercentage,
    string Rarity,
    string CalculatedAtUtc);

public sealed record AchievementCosmeticsDto(
    string? PassportBorderStyle,
    string? AvatarFrameStyle,
    IReadOnlyList<string> BadgeStampStyles);

public sealed record AchievementTrophyProfileDto(
    string Tier,
    int RequiredCount,
    string? NextTier,
    int? NextRequiredCount,
    int NationwideEarnedCount,
    int NationwideMemberCount,
    decimal EarnedPercentage,
    string Rarity,
    string CalculatedAtUtc);

public sealed record AchievementProfileDto(
    int EarnedDistinctCount,
    int ActiveAchievementCount,
    AchievementTrophyProfileDto Trophy,
    AchievementCosmeticsDto Cosmetics);
