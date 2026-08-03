using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;

namespace Kiwimpact.Core.Achievements;

public enum AchievementRuleKind
{
    TotalVerifiedCompletions,
    CategoryVerifiedCompletions,
    AllCategoriesMinimum,
    LongestWeeklyStreak,
    LevelReached,
    CommunityChallengeReward,
}

public enum AchievementCosmeticKind
{
    PassportBorder,
    AvatarFrame,
    BadgeStamp,
}

public sealed record AchievementCosmeticUnlock(
    AchievementCosmeticKind Kind,
    string StyleCode,
    int Priority);

/// <summary>
/// One approved static achievement definition. Ids, codes, rule semantics,
/// categories, and thresholds are immutable; the seed may update only display
/// fields.
/// </summary>
public sealed record AchievementDefinition(
    Guid Id,
    string Code,
    string Name,
    string Description,
    string Category,
    int Threshold,
    AchievementRuleKind RuleKind = AchievementRuleKind.TotalVerifiedCompletions,
    QuestCategory? QuestCategory = null,
    AchievementCosmeticUnlock? CosmeticUnlock = null);

/// <summary>
/// One immutable XP-ledger fact used by the typed evaluator, ordered by
/// (<c>CreatedAt</c>, <c>XpTransactionId</c>) ascending.
/// </summary>
public sealed record AchievementLedgerRow(
    Guid XpTransactionId,
    DateTimeOffset CreatedAt,
    QuestCategory QuestCategory = QuestCategory.RestoreNature,
    int XpAmount = 50);

/// <summary>
/// One award to persist. The XP transaction is the immutable trigger evidence,
/// and <c>AwardedAt</c> is the trigger timestamp rather than processing time.
/// </summary>
public sealed record PendingAchievementAward(
    Guid AchievementId,
    Guid XpTransactionId,
    DateTimeOffset AwardedAt);

/// <summary>
/// Versioned, typed achievement rules. This is intentionally not a user-
/// supplied expression engine: each rule kind maps to one audited evaluator.
/// </summary>
public static class AchievementCatalog
{
    public const int CurrentEvaluationVersion = 2;

    public const string CategoryMilestone = "Milestone";
    public const string CategorySpecialist = "Specialist";
    public const string CategoryExplorer = "Explorer";
    public const string CategoryStreak = "Streak";
    public const string CategoryProgression = "Progression";
    public const string CategoryCommunity = "Community";

    public static readonly AchievementDefinition FirstSteps = new(
        new Guid("b5371794-ccd2-45fb-9a7a-f24ec2692bc2"),
        "verified-completions-1",
        "First Steps",
        "Complete your first verified eco quest.",
        CategoryMilestone,
        1,
        CosmeticUnlock: new(
            AchievementCosmeticKind.AvatarFrame,
            "sprout",
            10));

    public static readonly AchievementDefinition BuildingMomentum = new(
        new Guid("ed2faa73-1947-4b4b-826a-af7384d4ed10"),
        "verified-completions-3",
        "Building Momentum",
        "Reach three verified quest completions.",
        CategoryMilestone,
        3);

    public static readonly AchievementDefinition CommittedContributor = new(
        new Guid("23cb1a76-1cfb-4b53-b71b-cfee48c3f57b"),
        "verified-completions-5",
        "Committed Contributor",
        "Reach five verified quest completions.",
        CategoryMilestone,
        5);

    /// <summary>
    /// All 45 approved definitions in stable product display order.
    /// The three original ids and codes remain unchanged.
    /// </summary>
    public static IReadOnlyList<AchievementDefinition> Definitions { get; } =
    [
        FirstSteps,
        BuildingMomentum,
        CommittedContributor,
        Total(
            "6c14011a-c884-4393-8b33-efc7de868a6e",
            "verified-completions-10",
            "Eco Regular",
            "Reach ten verified quest completions.",
            10),
        Total(
            "8d051bf2-88b5-4533-b108-c1c7e905ee9c",
            "verified-completions-25",
            "Local Force",
            "Reach 25 verified quest completions.",
            25,
            new(AchievementCosmeticKind.PassportBorder, "forest", 20)),
        Total(
            "6ec0f106-1bcb-41a6-a390-30f163655f1b",
            "verified-completions-50",
            "Impact Maker",
            "Reach 50 verified quest completions.",
            50),
        Total(
            "4ee9a479-33bb-472a-ae8b-2675f257ed32",
            "verified-completions-100",
            "Century of Change",
            "Reach 100 verified quest completions.",
            100,
            new(AchievementCosmeticKind.PassportBorder, "kauri", 50)),
        Total(
            "c3d020dc-f400-4316-a3af-7eb6e2326537",
            "verified-completions-250",
            "Kaitiaki Legacy",
            "Reach 250 verified quest completions.",
            250),

        Category(
            "f58f502b-ed5e-4cc0-aa9c-18a0ce6b80ec",
            "restore-nature-3",
            "Habitat Helper",
            "Complete three Restore Nature quests.",
            QuestCategory.RestoreNature,
            3),
        Category(
            "2b098cc9-2660-41a5-acc5-2f5e07a7efff",
            "restore-nature-10",
            "Restoration Ranger",
            "Complete ten Restore Nature quests.",
            QuestCategory.RestoreNature,
            10),
        Category(
            "0535dbaf-ff44-4793-a655-901eade197ce",
            "restore-nature-25",
            "Nature Guardian",
            "Complete 25 Restore Nature quests.",
            QuestCategory.RestoreNature,
            25),
        Category(
            "fa0089a8-f113-40b7-a6ad-cc256ec3c7b8",
            "protect-wildlife-3",
            "Wildlife Ally",
            "Complete three Protect Wildlife quests.",
            QuestCategory.ProtectWildlife,
            3),
        Category(
            "5c13d81f-3154-407f-90d9-09cfb64eff3d",
            "protect-wildlife-10",
            "Species Defender",
            "Complete ten Protect Wildlife quests.",
            QuestCategory.ProtectWildlife,
            10),
        Category(
            "b53625d4-1709-4095-bed2-704b1d2dac72",
            "protect-wildlife-25",
            "Wildlife Kaitiaki",
            "Complete 25 Protect Wildlife quests.",
            QuestCategory.ProtectWildlife,
            25),
        Category(
            "a96f28e4-9ef0-4e11-850a-5c6390117ad4",
            "clean-reduce-waste-3",
            "Cleanup Starter",
            "Complete three Clean & Reduce Waste quests.",
            QuestCategory.CleanReduceWaste,
            3),
        Category(
            "174380f5-cf0e-49d7-b2db-e76c6405e125",
            "clean-reduce-waste-10",
            "Waste Warrior",
            "Complete ten Clean & Reduce Waste quests.",
            QuestCategory.CleanReduceWaste,
            10),
        Category(
            "20f4fc5d-a47e-456f-8f0a-7ede2e9249a9",
            "clean-reduce-waste-25",
            "Circular Champion",
            "Complete 25 Clean & Reduce Waste quests.",
            QuestCategory.CleanReduceWaste,
            25),
        Category(
            "178f9228-2fa0-45e8-91e2-d79b16cd1247",
            "grow-compost-3",
            "Green Thumb",
            "Complete three Grow & Compost quests.",
            QuestCategory.GrowCompost,
            3),
        Category(
            "0f34929b-4089-44b6-80e4-f7228a071379",
            "grow-compost-10",
            "Soil Builder",
            "Complete ten Grow & Compost quests.",
            QuestCategory.GrowCompost,
            10),
        Category(
            "02d796ca-067f-43f2-a622-9779a18eb7dd",
            "grow-compost-25",
            "Compost Champion",
            "Complete 25 Grow & Compost quests.",
            QuestCategory.GrowCompost,
            25),
        Category(
            "5152f860-c7ee-456c-912d-02b6f040c667",
            "observe-measure-3",
            "Citizen Observer",
            "Complete three Observe & Measure quests.",
            QuestCategory.ObserveMeasure,
            3),
        Category(
            "84e9a5b0-4d44-4e47-9a61-324a2b52ecc3",
            "observe-measure-10",
            "Field Researcher",
            "Complete ten Observe & Measure quests.",
            QuestCategory.ObserveMeasure,
            10),
        Category(
            "9c71596d-72c4-4c24-83fd-b60ee7a14292",
            "observe-measure-25",
            "Data for Nature",
            "Complete 25 Observe & Measure quests.",
            QuestCategory.ObserveMeasure,
            25),
        Category(
            "3d5d2e73-d044-498e-9ddd-365aa80ccbd2",
            "learn-share-3",
            "Eco Learner",
            "Complete three Learn & Share quests.",
            QuestCategory.LearnShare,
            3),
        Category(
            "5c65ede5-4d37-44bc-a90d-c08a51b20596",
            "learn-share-10",
            "Knowledge Sharer",
            "Complete ten Learn & Share quests.",
            QuestCategory.LearnShare,
            10),
        Category(
            "89788f26-d8cd-4daf-b81c-3d44b0b4966d",
            "learn-share-25",
            "Community Educator",
            "Complete 25 Learn & Share quests.",
            QuestCategory.LearnShare,
            25),

        AllCategories(
            "0635b766-2f72-44e4-9998-141bd7c269db",
            "all-categories-1",
            "Eco Explorer",
            "Complete at least one quest in every eco category.",
            1,
            new(AchievementCosmeticKind.BadgeStamp, "explorer", 20)),
        AllCategories(
            "1a0ad36e-316c-4bef-821b-b6d0590c9b38",
            "all-categories-5",
            "Well-Rounded Kaitiaki",
            "Complete at least five quests in every eco category.",
            5),
        AllCategories(
            "320c8fe3-1081-45db-9109-404c0dada3e4",
            "all-categories-10",
            "Whole-System Changemaker",
            "Complete at least ten quests in every eco category.",
            10),

        Streak(
            "1498a3a6-63fa-4964-90cb-5a672ee093a6",
            "weekly-streak-2",
            "Keeping the Spark",
            "Record verified impact in two consecutive Auckland weeks.",
            2),
        Streak(
            "b9f660a6-a96c-42ba-a4b1-2ecac05eacfe",
            "weekly-streak-4",
            "Month of Momentum",
            "Record verified impact in four consecutive Auckland weeks.",
            4),
        Streak(
            "317dae82-2848-4385-bf8e-47f7c62cd67d",
            "weekly-streak-8",
            "Steady Impact",
            "Record verified impact in eight consecutive Auckland weeks.",
            8),
        Streak(
            "d25d7e74-ff93-49f4-a53d-14540f97af0a",
            "weekly-streak-12",
            "Season of Action",
            "Record verified impact in 12 consecutive Auckland weeks.",
            12,
            new(AchievementCosmeticKind.AvatarFrame, "ember", 30)),
        Streak(
            "8e51c432-aa3a-40c0-95d1-1f68df0a0d18",
            "weekly-streak-26",
            "Half-Year Hero",
            "Record verified impact in 26 consecutive Auckland weeks.",
            26),
        Streak(
            "8a0f57c0-6a15-4c0a-b646-dee868d85e1b",
            "weekly-streak-52",
            "Year of Impact",
            "Record verified impact in 52 consecutive Auckland weeks.",
            52,
            new(AchievementCosmeticKind.PassportBorder, "aurora", 70)),

        Level(
            "0361d1f4-f2c0-4a9b-9ccc-3ca3d1775b4b",
            "level-5",
            "Rising Contributor",
            "Reach Level 5.",
            5),
        Level(
            "b162297a-4e6d-4597-bffd-a0c029cfdafd",
            "level-10",
            "Scout's Mark",
            "Reach Level 10.",
            10),
        Level(
            "08921609-80f2-4ce6-8093-f0d53b6976b3",
            "level-20",
            "Adventurer's Crest",
            "Reach Level 20.",
            20,
            new(AchievementCosmeticKind.PassportBorder, "ocean", 30)),
        Level(
            "c9ac299d-0650-400e-b5b4-0917c4ad654f",
            "level-30",
            "Ranger's Resolve",
            "Reach Level 30.",
            30),
        Level(
            "f45bc7f1-3504-4e20-b8b7-f71434a3c77d",
            "level-50",
            "Guardian of Impact",
            "Reach Level 50.",
            50,
            new(AchievementCosmeticKind.AvatarFrame, "guardian", 50)),
        Level(
            "d30d4102-d1d7-49e8-aeb8-7d38d3a44005",
            "level-75",
            "Eco Champion",
            "Reach Level 75.",
            75),
        Level(
            "9f43fec2-68ac-4d2f-8a88-5910b9d59951",
            "level-99",
            "Kiwimpact Legend",
            "Reach the Level 99 cap.",
            99,
            new(AchievementCosmeticKind.BadgeStamp, "legend", 100)),

        Community(
            "275cd228-1f7c-446e-afe2-0a8ea124fa2f",
            "community-spark",
            "Community Spark",
            "Help complete a featured community challenge."),
        Community(
            "4862f53d-0316-4fa3-b62a-876b891a264d",
            "community-catalyst",
            "Community Catalyst",
            "Make a defining contribution to a community challenge.",
            new(AchievementCosmeticKind.BadgeStamp, "community", 40)),
        Community(
            "fec69c6c-7f5c-4de9-8d33-8e63d148ab42",
            "community-legacy",
            "Community Legacy",
            "Earn recognition through a landmark community challenge."),
    ];

    public static AchievementDefinition? FindByCode(string? code) =>
        code is null
            ? null
            : Definitions.FirstOrDefault(
                definition => string.Equals(
                    definition.Code,
                    code,
                    StringComparison.Ordinal));

    /// <summary>
    /// Evaluates every active automatic rule over one transactionally stable,
    /// complete ledger snapshot. Community Challenge rewards are deliberately
    /// excluded because their existing finalizer supplies the trigger.
    /// </summary>
    public static IReadOnlyList<PendingAchievementAward>
        EvaluateAutomaticAchievements(
            IReadOnlyList<AchievementDefinition> activeDefinitions,
            IReadOnlySet<Guid> earnedAchievementIds,
            IReadOnlyList<AchievementLedgerRow> orderedSnapshot)
    {
        ArgumentNullException.ThrowIfNull(activeDefinitions);
        ArgumentNullException.ThrowIfNull(earnedAchievementIds);
        ArgumentNullException.ThrowIfNull(orderedSnapshot);
        ValidateSnapshot(orderedSnapshot);

        var awards = new List<PendingAchievementAward>();
        foreach (var definition in activeDefinitions)
        {
            ValidateDefinition(definition);
            if (earnedAchievementIds.Contains(definition.Id) ||
                definition.RuleKind == AchievementRuleKind.CommunityChallengeReward)
            {
                continue;
            }

            var trigger = ResolveTrigger(definition, orderedSnapshot);
            if (trigger is not null)
            {
                awards.Add(new PendingAchievementAward(
                    definition.Id,
                    trigger.XpTransactionId,
                    trigger.CreatedAt));
            }
        }

        return awards;
    }

    /// <summary>
    /// Compatibility wrapper for the original cumulative-only unit contract.
    /// New production callers must provide a complete snapshot to
    /// <see cref="EvaluateAutomaticAchievements"/>.
    /// </summary>
    public static IReadOnlyList<PendingAchievementAward> EvaluateMilestones(
        IReadOnlyList<AchievementDefinition> activeMilestones,
        IReadOnlySet<Guid> earnedAchievementIds,
        int snapshotCount,
        IReadOnlyList<AchievementLedgerRow> orderedSnapshot)
    {
        ArgumentNullException.ThrowIfNull(activeMilestones);
        ArgumentNullException.ThrowIfNull(earnedAchievementIds);
        ArgumentNullException.ThrowIfNull(orderedSnapshot);
        if (snapshotCount < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(snapshotCount),
                "Snapshot count cannot be negative.");
        }
        if (orderedSnapshot.Count > snapshotCount)
        {
            throw new ArgumentException(
                "The ordered snapshot cannot contain more rows than the snapshot count.",
                nameof(orderedSnapshot));
        }

        var eligible = activeMilestones
            .Where(definition =>
                definition.RuleKind == AchievementRuleKind.TotalVerifiedCompletions &&
                definition.Threshold <= snapshotCount)
            .ToArray();
        if (eligible.Length > 0 &&
            orderedSnapshot.Count < eligible.Max(definition => definition.Threshold))
        {
            throw new InvalidOperationException(
                "The snapshot prefix must contain at least the evaluated " +
                "threshold rows for every eligible missing milestone.");
        }

        return EvaluateAutomaticAchievements(
            eligible,
            earnedAchievementIds,
            orderedSnapshot);
    }

    private static AchievementLedgerRow? ResolveTrigger(
        AchievementDefinition definition,
        IReadOnlyList<AchievementLedgerRow> rows)
    {
        return definition.RuleKind switch
        {
            AchievementRuleKind.TotalVerifiedCompletions =>
                rows.Count >= definition.Threshold
                    ? rows[definition.Threshold - 1]
                    : null,
            AchievementRuleKind.CategoryVerifiedCompletions =>
                ResolveCategoryTrigger(
                    rows,
                    definition.QuestCategory!.Value,
                    definition.Threshold),
            AchievementRuleKind.AllCategoriesMinimum =>
                ResolveAllCategoriesTrigger(rows, definition.Threshold),
            AchievementRuleKind.LongestWeeklyStreak =>
                ResolveStreakTrigger(rows, definition.Threshold),
            AchievementRuleKind.LevelReached =>
                ResolveLevelTrigger(rows, definition.Threshold),
            AchievementRuleKind.CommunityChallengeReward => null,
            _ => throw new ArgumentException(
                "Achievement rule kind is undefined.",
                nameof(definition)),
        };
    }

    private static AchievementLedgerRow? ResolveCategoryTrigger(
        IReadOnlyList<AchievementLedgerRow> rows,
        QuestCategory category,
        int threshold)
    {
        var count = 0;
        foreach (var row in rows)
        {
            if (row.QuestCategory != category)
                continue;
            count++;
            if (count == threshold)
                return row;
        }
        return null;
    }

    private static AchievementLedgerRow? ResolveAllCategoriesTrigger(
        IReadOnlyList<AchievementLedgerRow> rows,
        int threshold)
    {
        var categories = Enum.GetValues<QuestCategory>();
        var counts = categories.ToDictionary(category => category, _ => 0);
        foreach (var row in rows)
        {
            counts[row.QuestCategory]++;
            if (counts.Values.All(count => count >= threshold))
                return row;
        }
        return null;
    }

    private static AchievementLedgerRow? ResolveStreakTrigger(
        IReadOnlyList<AchievementLedgerRow> rows,
        int threshold)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland");
        var firstRowByWeek = rows
            .GroupBy(row => AucklandWeekStart(row.CreatedAt, zone))
            .OrderBy(group => group.Key)
            .Select(group => (Week: group.Key, Trigger: group.First()))
            .ToArray();

        var runLength = 0;
        DateOnly? previousWeek = null;
        foreach (var week in firstRowByWeek)
        {
            runLength =
                previousWeek.HasValue &&
                week.Week == previousWeek.Value.AddDays(7)
                    ? runLength + 1
                    : 1;
            if (runLength >= threshold)
                return week.Trigger;
            previousWeek = week.Week;
        }
        return null;
    }

    private static AchievementLedgerRow? ResolveLevelTrigger(
        IReadOnlyList<AchievementLedgerRow> rows,
        int level)
    {
        var requiredXp = ProgressionRules.RequiredXpForLevel(level);
        long totalXp = 0;
        foreach (var row in rows)
        {
            totalXp = checked(totalXp + row.XpAmount);
            if (totalXp >= requiredXp)
                return row;
        }
        return null;
    }

    private static DateOnly AucklandWeekStart(
        DateTimeOffset timestamp,
        TimeZoneInfo zone)
    {
        var date = DateOnly.FromDateTime(
            TimeZoneInfo.ConvertTime(timestamp, zone).DateTime);
        return date.AddDays(-(((int)date.DayOfWeek + 6) % 7));
    }

    private static void ValidateSnapshot(
        IReadOnlyList<AchievementLedgerRow> orderedSnapshot)
    {
        for (var index = 0; index < orderedSnapshot.Count; index++)
        {
            var current = orderedSnapshot[index];
            if (current.XpTransactionId == Guid.Empty)
            {
                throw new ArgumentException(
                    "XP transaction ids are required.",
                    nameof(orderedSnapshot));
            }
            if (current.XpAmount <= 0)
            {
                throw new ArgumentException(
                    "XP amounts must be positive.",
                    nameof(orderedSnapshot));
            }
            if (!Enum.IsDefined(current.QuestCategory))
            {
                throw new ArgumentException(
                    "Quest categories must be defined.",
                    nameof(orderedSnapshot));
            }
            if (index == 0)
                continue;

            var previous = orderedSnapshot[index - 1];
            var outOfOrder =
                current.CreatedAt < previous.CreatedAt ||
                (current.CreatedAt == previous.CreatedAt &&
                 current.XpTransactionId.CompareTo(previous.XpTransactionId) <= 0);
            if (outOfOrder)
            {
                throw new ArgumentException(
                    "The snapshot must be ordered by (CreatedAt, Id) ascending.",
                    nameof(orderedSnapshot));
            }
        }
    }

    private static void ValidateDefinition(AchievementDefinition definition)
    {
        if (definition.Id == Guid.Empty ||
            string.IsNullOrWhiteSpace(definition.Code) ||
            definition.Threshold <= 0)
        {
            throw new ArgumentException(
                "Achievement ids, codes, and positive thresholds are required.",
                nameof(definition));
        }
        if (!Enum.IsDefined(definition.RuleKind))
        {
            throw new ArgumentException(
                "Achievement rule kind is undefined.",
                nameof(definition));
        }
        if (definition.RuleKind ==
                AchievementRuleKind.CategoryVerifiedCompletions &&
            (!definition.QuestCategory.HasValue ||
             !Enum.IsDefined(definition.QuestCategory.Value)))
        {
            throw new ArgumentException(
                "Category achievements require a defined Quest category.",
                nameof(definition));
        }
        if (definition.RuleKind == AchievementRuleKind.LevelReached &&
            (definition.Threshold < 2 ||
             definition.Threshold > ProgressionRules.MaxLevel))
        {
            throw new ArgumentException(
                "Level achievements must target a reachable level.",
                nameof(definition));
        }
    }

    private static AchievementDefinition Total(
        string id,
        string code,
        string name,
        string description,
        int threshold,
        AchievementCosmeticUnlock? cosmetic = null) =>
        new(
            new Guid(id),
            code,
            name,
            description,
            CategoryMilestone,
            threshold,
            CosmeticUnlock: cosmetic);

    private static AchievementDefinition Category(
        string id,
        string code,
        string name,
        string description,
        QuestCategory category,
        int threshold) =>
        new(
            new Guid(id),
            code,
            name,
            description,
            CategorySpecialist,
            threshold,
            AchievementRuleKind.CategoryVerifiedCompletions,
            category);

    private static AchievementDefinition AllCategories(
        string id,
        string code,
        string name,
        string description,
        int threshold,
        AchievementCosmeticUnlock? cosmetic = null) =>
        new(
            new Guid(id),
            code,
            name,
            description,
            CategoryExplorer,
            threshold,
            AchievementRuleKind.AllCategoriesMinimum,
            CosmeticUnlock: cosmetic);

    private static AchievementDefinition Streak(
        string id,
        string code,
        string name,
        string description,
        int threshold,
        AchievementCosmeticUnlock? cosmetic = null) =>
        new(
            new Guid(id),
            code,
            name,
            description,
            CategoryStreak,
            threshold,
            AchievementRuleKind.LongestWeeklyStreak,
            CosmeticUnlock: cosmetic);

    private static AchievementDefinition Level(
        string id,
        string code,
        string name,
        string description,
        int threshold,
        AchievementCosmeticUnlock? cosmetic = null) =>
        new(
            new Guid(id),
            code,
            name,
            description,
            CategoryProgression,
            threshold,
            AchievementRuleKind.LevelReached,
            CosmeticUnlock: cosmetic);

    private static AchievementDefinition Community(
        string id,
        string code,
        string name,
        string description,
        AchievementCosmeticUnlock? cosmetic = null) =>
        new(
            new Guid(id),
            code,
            name,
            description,
            CategoryCommunity,
            1,
            AchievementRuleKind.CommunityChallengeReward,
            CosmeticUnlock: cosmetic);
}
