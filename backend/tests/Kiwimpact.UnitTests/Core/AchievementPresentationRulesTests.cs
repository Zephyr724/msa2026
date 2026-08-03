using Kiwimpact.Core.Achievements;

namespace Kiwimpact.UnitTests.Core;

public sealed class AchievementPresentationRulesTests
{
    [Theory]
    [InlineData(0, AchievementTrophyTier.Locked)]
    [InlineData(4, AchievementTrophyTier.Locked)]
    [InlineData(5, AchievementTrophyTier.Bronze)]
    [InlineData(9, AchievementTrophyTier.Bronze)]
    [InlineData(10, AchievementTrophyTier.Silver)]
    [InlineData(19, AchievementTrophyTier.Silver)]
    [InlineData(20, AchievementTrophyTier.Gold)]
    [InlineData(29, AchievementTrophyTier.Gold)]
    [InlineData(30, AchievementTrophyTier.Platinum)]
    [InlineData(39, AchievementTrophyTier.Platinum)]
    [InlineData(40, AchievementTrophyTier.Diamond)]
    [InlineData(45, AchievementTrophyTier.Diamond)]
    public void TrophyUsesDistinctAchievementCountThresholds(
        int count,
        AchievementTrophyTier expected)
    {
        Assert.Equal(
            expected,
            AchievementPresentationRules.TrophyFor(count).Tier);
    }

    [Fact]
    public void NextTrophyIsNullAfterDiamond()
    {
        Assert.Null(AchievementPresentationRules.NextTrophyFor(40));
        Assert.Equal(
            AchievementTrophyTier.Bronze,
            AchievementPresentationRules.NextTrophyFor(0)!.Tier);
    }

    [Theory]
    [InlineData(0, 100, AchievementRarity.Unawarded)]
    [InlineData(1, 100, AchievementRarity.UltraRare)]
    [InlineData(2, 100, AchievementRarity.Rare)]
    [InlineData(5, 100, AchievementRarity.Rare)]
    [InlineData(6, 100, AchievementRarity.Uncommon)]
    [InlineData(20, 100, AchievementRarity.Uncommon)]
    [InlineData(21, 100, AchievementRarity.Common)]
    public void RarityUsesApprovedPercentageBoundaries(
        int earned,
        int members,
        AchievementRarity expected)
    {
        Assert.Equal(
            expected,
            AchievementPresentationRules.RarityFor(earned, members));
    }

    [Fact]
    public void PercentageKeepsEnoughPrecisionForLessThanPointZeroOneDisplay()
    {
        Assert.Equal(
            0.005m,
            AchievementPresentationRules.PercentageFor(1, 20_000));
    }
}
