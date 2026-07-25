using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;

namespace Kiwimpact.UnitTests.Core;

public sealed class ProgressionRulesTests
{
    [Theory]
    [InlineData(QuestDifficulty.Easy, 50)]
    [InlineData(QuestDifficulty.Medium, 100)]
    [InlineData(QuestDifficulty.Hard, 150)]
    public void XpForDifficultyMapsExactAcceptedAmounts(
        QuestDifficulty difficulty,
        int expected)
    {
        Assert.Equal(expected, ProgressionRules.XpForDifficulty(difficulty));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(3)]
    [InlineData(999)]
    public void XpForDifficultyRejectsUndefinedValues(int undefined)
    {
        Assert.Throws<ArgumentException>(
            () => ProgressionRules.XpForDifficulty((QuestDifficulty)undefined));
    }

    [Theory]
    [InlineData(2, 45L)]
    [InlineData(3, 100L)]
    [InlineData(4, 165L)]
    [InlineData(5, 240L)]
    [InlineData(9, 640L)]
    [InlineData(10, 765L)]
    [InlineData(11, 900L)]
    [InlineData(98, 50925L)]
    [InlineData(99, 51940L)]
    public void RequiredXpForLevelMatchesTheAcceptedFormula(int level, long expected)
    {
        Assert.Equal(expected, ProgressionRules.RequiredXpForLevel(level));
        Assert.Equal(5L * (level - 1) * (level + 7), expected);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(100)]
    public void RequiredXpForLevelRejectsOutOfRangeLevels(int level)
    {
        Assert.Throws<ArgumentOutOfRangeException>(
            () => ProgressionRules.RequiredXpForLevel(level));
    }

    [Theory]
    [InlineData(0L, 1)]
    [InlineData(44L, 1)]
    [InlineData(45L, 2)]
    [InlineData(46L, 2)]
    [InlineData(99L, 2)]
    [InlineData(100L, 3)]
    [InlineData(764L, 9)]
    [InlineData(765L, 10)]
    [InlineData(51939L, 98)]
    [InlineData(51940L, 99)]
    [InlineData(100000L, 99)]
    [InlineData(long.MaxValue, 99)]
    public void ComputeLevelFindsTheLargestLevelAtOrBelowTotal(long totalXp, int expected)
    {
        Assert.Equal(expected, ProgressionRules.ComputeLevel(totalXp));
    }

    [Fact]
    public void ComputeLevelNeverExceedsNinetyNineWhileXpKeepsAccruing()
    {
        var capped = ProgressionRules.ComputeLevel(ProgressionRules.RequiredXpForLevel(99));
        Assert.Equal(ProgressionRules.MaxLevel, capped);
        Assert.Equal(
            ProgressionRules.MaxLevel,
            ProgressionRules.ComputeLevel(ProgressionRules.RequiredXpForLevel(99) + 150));
        Assert.Equal(
            ProgressionRules.MaxLevel,
            ProgressionRules.ComputeLevel(long.MaxValue));
    }

    [Fact]
    public void ComputeLevelRejectsNegativeTotals()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ProgressionRules.ComputeLevel(-1));
        Assert.Throws<ArgumentOutOfRangeException>(
            () => ProgressionRules.ComputeLevel(long.MinValue));
    }

    [Theory]
    [InlineData(1, "Novice")]
    [InlineData(9, "Novice")]
    [InlineData(10, "Scout")]
    [InlineData(19, "Scout")]
    [InlineData(20, "Adventurer")]
    [InlineData(29, "Adventurer")]
    [InlineData(30, "Ranger")]
    [InlineData(39, "Ranger")]
    [InlineData(40, "Pathfinder")]
    [InlineData(49, "Pathfinder")]
    [InlineData(50, "Guardian")]
    [InlineData(59, "Guardian")]
    [InlineData(60, "Vanguard")]
    [InlineData(69, "Vanguard")]
    [InlineData(70, "Champion")]
    [InlineData(79, "Champion")]
    [InlineData(80, "Hero")]
    [InlineData(89, "Hero")]
    [InlineData(90, "Legend")]
    [InlineData(98, "Legend")]
    [InlineData(99, "Kiwimpact Legend")]
    public void RankTitleForCoversEveryAcceptedBandBoundary(int level, string expected)
    {
        Assert.Equal(expected, ProgressionRules.RankTitleFor(level));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(100)]
    public void RankTitleForRejectsOutOfRangeLevels(int level)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ProgressionRules.RankTitleFor(level));
    }
}
