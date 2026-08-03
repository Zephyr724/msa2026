namespace Kiwimpact.Core.Achievements;

public enum AchievementRarity
{
    Unawarded,
    UltraRare,
    Rare,
    Uncommon,
    Common,
}

public enum AchievementTrophyTier
{
    Locked,
    Bronze,
    Silver,
    Gold,
    Platinum,
    Diamond,
}

public sealed record AchievementTrophyDefinition(
    AchievementTrophyTier Tier,
    int RequiredDistinctAchievements);

public static class AchievementPresentationRules
{
    public static IReadOnlyList<AchievementTrophyDefinition> TrophyDefinitions { get; } =
    [
        new(AchievementTrophyTier.Locked, 0),
        new(AchievementTrophyTier.Bronze, 5),
        new(AchievementTrophyTier.Silver, 10),
        new(AchievementTrophyTier.Gold, 20),
        new(AchievementTrophyTier.Platinum, 30),
        new(AchievementTrophyTier.Diamond, 40),
    ];

    public static AchievementRarity RarityFor(
        int nationwideEarnedCount,
        int nationwideMemberCount)
    {
        if (nationwideEarnedCount < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(nationwideEarnedCount));
        }
        if (nationwideMemberCount < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(nationwideMemberCount));
        }
        if (nationwideEarnedCount > nationwideMemberCount)
        {
            throw new ArgumentException(
                "Earned count cannot exceed the nationwide member count.",
                nameof(nationwideEarnedCount));
        }
        if (nationwideEarnedCount == 0 || nationwideMemberCount == 0)
            return AchievementRarity.Unawarded;

        var percentage =
            (decimal)nationwideEarnedCount / nationwideMemberCount * 100m;
        return percentage switch
        {
            <= 1m => AchievementRarity.UltraRare,
            <= 5m => AchievementRarity.Rare,
            <= 20m => AchievementRarity.Uncommon,
            _ => AchievementRarity.Common,
        };
    }

    public static decimal PercentageFor(
        int nationwideEarnedCount,
        int nationwideMemberCount)
    {
        _ = RarityFor(nationwideEarnedCount, nationwideMemberCount);
        if (nationwideMemberCount == 0)
            return 0m;
        return decimal.Round(
            (decimal)nationwideEarnedCount / nationwideMemberCount * 100m,
            4,
            MidpointRounding.AwayFromZero);
    }

    public static AchievementTrophyDefinition TrophyFor(
        int distinctAchievementCount)
    {
        if (distinctAchievementCount < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(distinctAchievementCount));
        }

        return TrophyDefinitions
            .Last(definition =>
                definition.RequiredDistinctAchievements <=
                distinctAchievementCount);
    }

    public static AchievementTrophyDefinition? NextTrophyFor(
        int distinctAchievementCount)
    {
        if (distinctAchievementCount < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(distinctAchievementCount));
        }

        return TrophyDefinitions.FirstOrDefault(definition =>
            definition.RequiredDistinctAchievements > distinctAchievementCount);
    }
}
