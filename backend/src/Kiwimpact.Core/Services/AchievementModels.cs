using Kiwimpact.Core.Achievements;

namespace Kiwimpact.Core.Services;

public enum AchievementReadError
{
    NotFound,
    NotReady,
}

public sealed class AchievementReadException : Exception
{
    public AchievementReadException(AchievementReadError error, string message)
        : base(message)
    {
        Error = error;
    }

    public AchievementReadError Error { get; }
}

public sealed record AchievementCatalogItem(
    Guid Id,
    string Code,
    string Name,
    string Description,
    string? IconUrl,
    string Category);

public sealed record EarnedAchievementItem(
    Guid AchievementId,
    string Code,
    string Name,
    string Description,
    string? IconUrl,
    string Category,
    DateTimeOffset AwardedAt);

public sealed record AchievementNationwideStat(
    Guid AchievementId,
    int NationwideEarnedCount,
    int NationwideMemberCount,
    decimal EarnedPercentage,
    AchievementRarity Rarity,
    DateTimeOffset CalculatedAtUtc);

public sealed record AchievementCosmetics(
    string? PassportBorderStyle,
    string? AvatarFrameStyle,
    IReadOnlyList<string> BadgeStampStyles);

public sealed record AchievementTrophyProfile(
    AchievementTrophyTier Tier,
    int RequiredCount,
    AchievementTrophyTier? NextTier,
    int? NextRequiredCount,
    int NationwideEarnedCount,
    int NationwideMemberCount,
    decimal EarnedPercentage,
    AchievementRarity Rarity,
    DateTimeOffset CalculatedAtUtc);

public sealed record AchievementProfile(
    int EarnedDistinctCount,
    int ActiveAchievementCount,
    AchievementTrophyProfile Trophy,
    AchievementCosmetics Cosmetics);
