using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Enums;

namespace Kiwimpact.UnitTests.Core;

public sealed class AchievementAutomaticEvaluatorTests
{
    private static readonly DateTimeOffset Base =
        new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void EveryTotalAndCategoryDefinitionHonorsItsExactBoundary()
    {
        foreach (var definition in AchievementCatalog.Definitions.Where(
                     item => item.RuleKind is
                         AchievementRuleKind.TotalVerifiedCompletions or
                         AchievementRuleKind.CategoryVerifiedCompletions))
        {
            var category = definition.QuestCategory
                ?? QuestCategory.RestoreNature;
            var below = Enumerable.Range(1, definition.Threshold - 1)
                .Select(index => Row(index, category))
                .ToArray();
            Assert.Empty(Evaluate(definition, below));

            var atBoundary = below
                .Append(Row(definition.Threshold, category))
                .ToArray();
            var award = Assert.Single(Evaluate(definition, atBoundary));
            Assert.Equal(atBoundary[^1].XpTransactionId, award.XpTransactionId);
        }
    }

    [Fact]
    public void EveryBreadthDefinitionHonorsItsExactAllCategoryBoundary()
    {
        foreach (var definition in AchievementCatalog.Definitions.Where(
                     item =>
                         item.RuleKind ==
                         AchievementRuleKind.AllCategoriesMinimum))
        {
            var rows = new List<AchievementLedgerRow>();
            var index = 1;
            var categories = Enum.GetValues<QuestCategory>();
            foreach (var category in categories)
            {
                var count = category == categories[^1]
                    ? definition.Threshold - 1
                    : definition.Threshold;
                for (var occurrence = 0; occurrence < count; occurrence++)
                    rows.Add(Row(index++, category));
            }
            Assert.Empty(Evaluate(definition, rows));

            rows.Add(Row(index, categories[^1]));
            var award = Assert.Single(Evaluate(definition, rows));
            Assert.Equal(rows[^1].XpTransactionId, award.XpTransactionId);
        }
    }

    [Fact]
    public void EveryStreakDefinitionHonorsItsExactDistinctWeekBoundary()
    {
        var firstMonday = new DateOnly(2025, 1, 6);
        foreach (var definition in AchievementCatalog.Definitions.Where(
                     item =>
                         item.RuleKind ==
                         AchievementRuleKind.LongestWeeklyStreak))
        {
            var below = Enumerable.Range(0, definition.Threshold - 1)
                .Select(index => AucklandRow(
                    index + 1,
                    firstMonday.AddDays(index * 7)))
                .ToArray();
            Assert.Empty(Evaluate(definition, below));

            var atBoundary = below
                .Append(AucklandRow(
                    definition.Threshold,
                    firstMonday.AddDays((definition.Threshold - 1) * 7)))
                .ToArray();
            var award = Assert.Single(Evaluate(definition, atBoundary));
            Assert.Equal(atBoundary[^1].XpTransactionId, award.XpTransactionId);
        }
    }

    [Fact]
    public void EveryLevelDefinitionHonorsItsExactXpBoundary()
    {
        foreach (var definition in AchievementCatalog.Definitions.Where(
                     item =>
                         item.RuleKind ==
                         AchievementRuleKind.LevelReached))
        {
            var requiredXp =
                Kiwimpact.Core.Progression.ProgressionRules
                    .RequiredXpForLevel(definition.Threshold);
            Assert.Empty(Evaluate(
                definition,
                [Row(1, xp: checked((int)requiredXp - 1))]));

            var award = Assert.Single(Evaluate(
                definition,
                [Row(1, xp: checked((int)requiredXp))]));
            Assert.Equal(Row(1).XpTransactionId, award.XpTransactionId);
        }
    }

    [Fact]
    public void CategoryRuleUsesTheImmutableCategoryAndNthMatchingRow()
    {
        var definition = Definition(
            AchievementRuleKind.CategoryVerifiedCompletions,
            threshold: 3,
            QuestCategory.ProtectWildlife);
        var rows = new[]
        {
            Row(1, QuestCategory.ProtectWildlife),
            Row(2, QuestCategory.RestoreNature),
            Row(3, QuestCategory.ProtectWildlife),
            Row(4, QuestCategory.ProtectWildlife),
        };

        var award = Assert.Single(Evaluate(definition, rows));

        Assert.Equal(rows[3].XpTransactionId, award.XpTransactionId);
        Assert.Equal(rows[3].CreatedAt, award.AwardedAt);
    }

    [Fact]
    public void BreadthRuleTriggersWhenTheLastCategoryReachesItsMinimum()
    {
        var definition = Definition(
            AchievementRuleKind.AllCategoriesMinimum,
            threshold: 1);
        var rows = Enum.GetValues<QuestCategory>()
            .Select((category, index) => Row(index + 1, category))
            .ToArray();

        var award = Assert.Single(Evaluate(definition, rows));

        Assert.Equal(rows[^1].XpTransactionId, award.XpTransactionId);
    }

    [Fact]
    public void StreakRuleFindsTheFirstHistoricalRunAcrossAucklandWeeks()
    {
        var definition = Definition(
            AchievementRuleKind.LongestWeeklyStreak,
            threshold: 3);
        var rows = new[]
        {
            AucklandRow(1, 2026, 1, 5),
            AucklandRow(2, 2026, 1, 19),
            AucklandRow(3, 2026, 1, 26),
            AucklandRow(4, 2026, 2, 2),
            AucklandRow(5, 2026, 2, 9),
        };

        var award = Assert.Single(Evaluate(definition, rows));

        // The first week is separated by a gap. The Jan 19, Jan 26, and
        // Feb 2 run reaches three on row four.
        Assert.Equal(rows[3].XpTransactionId, award.XpTransactionId);
    }

    [Fact]
    public void StreakCountsOneFactPerWeekAndCrossesAucklandDst()
    {
        var definition = Definition(
            AchievementRuleKind.LongestWeeklyStreak,
            threshold: 3);
        var rows = new[]
        {
            AucklandRow(1, new DateOnly(2026, 9, 21)),
            AucklandRow(2, new DateOnly(2026, 9, 22)),
            AucklandRow(3, new DateOnly(2026, 9, 28)),
            AucklandRow(4, new DateOnly(2026, 10, 5)),
        };

        var award = Assert.Single(Evaluate(definition, rows));

        Assert.Equal(rows[3].XpTransactionId, award.XpTransactionId);
    }

    [Fact]
    public void LevelRuleUsesCumulativeAuthoritativeXp()
    {
        var definition = Definition(
            AchievementRuleKind.LevelReached,
            threshold: 5);
        var rows = new[]
        {
            Row(1, xp: 50),
            Row(2, xp: 50),
            Row(3, xp: 50),
            Row(4, xp: 50),
            Row(5, xp: 50),
        };

        var award = Assert.Single(Evaluate(definition, rows));

        // Level 5 requires 240 XP, so the fifth 50-XP fact is the trigger.
        Assert.Equal(rows[4].XpTransactionId, award.XpTransactionId);
    }

    [Fact]
    public void CommunityChallengeRulesAreNeverAutomaticallyEvaluated()
    {
        var definition = Definition(
            AchievementRuleKind.CommunityChallengeReward,
            threshold: 1);

        Assert.Empty(Evaluate(definition, [Row(1)]));
    }

    [Fact]
    public void AlreadyEarnedDefinitionIsNotAwardedAgain()
    {
        var definition = Definition(
            AchievementRuleKind.TotalVerifiedCompletions,
            threshold: 1);

        var awards = AchievementCatalog.EvaluateAutomaticAchievements(
            [definition],
            new HashSet<Guid> { definition.Id },
            [Row(1)]);

        Assert.Empty(awards);
    }

    [Fact]
    public void SnapshotRequiresStrictTimestampAndIdOrder()
    {
        var definition = Definition(
            AchievementRuleKind.TotalVerifiedCompletions,
            threshold: 1);
        var first = Row(1);
        var second = Row(2);

        Assert.Throws<ArgumentException>(() =>
            Evaluate(definition, [second, first]));
    }

    private static IReadOnlyList<PendingAchievementAward> Evaluate(
        AchievementDefinition definition,
        IReadOnlyList<AchievementLedgerRow> rows) =>
        AchievementCatalog.EvaluateAutomaticAchievements(
            [definition],
            new HashSet<Guid>(),
            rows);

    private static AchievementDefinition Definition(
        AchievementRuleKind kind,
        int threshold,
        QuestCategory? category = null) =>
        new(
            Guid.NewGuid(),
            $"test-{kind}-{threshold}",
            "Test",
            "Test definition.",
            "Test",
            threshold,
            kind,
            category);

    private static AchievementLedgerRow Row(
        int index,
        QuestCategory category = QuestCategory.RestoreNature,
        int xp = 50) =>
        new(
            Guid.Parse($"00000000-0000-0000-0000-{index:x12}"),
            Base.AddMinutes(index),
            category,
            xp);

    private static AchievementLedgerRow AucklandRow(
        int index,
        int year,
        int month,
        int day)
        => AucklandRow(index, new DateOnly(year, month, day));

    private static AchievementLedgerRow AucklandRow(
        int index,
        DateOnly localDate)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland");
        var local = localDate.ToDateTime(
            new TimeOnly(
            12,
            0,
            0),
            DateTimeKind.Unspecified);
        var utc = TimeZoneInfo.ConvertTimeToUtc(local, zone);
        return new AchievementLedgerRow(
            Guid.Parse($"10000000-0000-0000-0000-{index:x12}"),
            new DateTimeOffset(utc),
            QuestCategory.RestoreNature,
            50);
    }
}
