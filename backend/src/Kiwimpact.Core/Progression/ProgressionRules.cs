using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Progression;

/// <summary>
/// Pure server-authoritative XP, level, and rank-title rules.
/// No database access; every input is guarded.
/// </summary>
public static class ProgressionRules
{
    public const int MaxLevel = 99;
    public const int MinLevel = 1;

    public static int XpForDifficulty(QuestDifficulty difficulty) => difficulty switch
    {
        QuestDifficulty.Easy => 50,
        QuestDifficulty.Medium => 100,
        QuestDifficulty.Hard => 150,
        _ => throw new ArgumentException(
            "Quest difficulty is undefined.", nameof(difficulty)),
    };

    /// <summary>
    /// Cumulative total XP required to reach <paramref name="level"/>:
    /// XP(L) = 5 × (L - 1) × (L + 7). Level 1 begins at 0 XP.
    /// </summary>
    public static long RequiredXpForLevel(int level)
    {
        if (level < 2 || level > MaxLevel)
            throw new ArgumentOutOfRangeException(
                nameof(level),
                $"Level must be between 2 and {MaxLevel}.");

        return 5L * (level - 1) * (level + 7);
    }

    /// <summary>
    /// The largest level in 1..99 whose cumulative threshold is not above
    /// <paramref name="totalXp"/>. XP keeps accruing after the Level 99 cap;
    /// the level itself never exceeds 99.
    /// </summary>
    public static int ComputeLevel(long totalXp)
    {
        if (totalXp < 0)
            throw new ArgumentOutOfRangeException(
                nameof(totalXp),
                "Total XP cannot be negative.");

        var level = MinLevel;
        for (var candidate = 2; candidate <= MaxLevel; candidate++)
        {
            if (RequiredXpForLevel(candidate) > totalXp)
                break;
            level = candidate;
        }

        return level;
    }

    public static string RankTitleFor(int level)
    {
        if (level < MinLevel || level > MaxLevel)
            throw new ArgumentOutOfRangeException(
                nameof(level),
                $"Level must be between {MinLevel} and {MaxLevel}.");

        return level switch
        {
            MaxLevel => "Kiwimpact Legend",
            >= 90 => "Legend",
            >= 80 => "Hero",
            >= 70 => "Champion",
            >= 60 => "Vanguard",
            >= 50 => "Guardian",
            >= 40 => "Pathfinder",
            >= 30 => "Ranger",
            >= 20 => "Adventurer",
            >= 10 => "Scout",
            _ => "Novice",
        };
    }
}
