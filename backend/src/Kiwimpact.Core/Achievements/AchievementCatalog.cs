namespace Kiwimpact.Core.Achievements;

/// <summary>
/// One approved static achievement definition. Ids, codes, categories, and
/// thresholds are immutable; the seed may update only the display fields.
/// </summary>
public sealed record AchievementDefinition(
    Guid Id,
    string Code,
    string Name,
    string Description,
    string Category,
    int Threshold);

/// <summary>
/// One row of the ledger snapshot used for trigger resolution, ordered by
/// (<c>CreatedAt</c>, <c>XpTransactionId</c>) ascending.
/// </summary>
public sealed record AchievementLedgerRow(Guid XpTransactionId, DateTimeOffset CreatedAt);

/// <summary>
/// One milestone award to persist: the resolved immutable trigger and the
/// award-effective timestamp (<c>= trigger.CreatedAt</c>).
/// </summary>
public sealed record PendingAchievementAward(
    Guid AchievementId,
    Guid XpTransactionId,
    DateTimeOffset AwardedAt);

/// <summary>
/// Approved Slice 6A catalog: exactly three cumulative verified-rewarded-
/// completion milestones at counts 1, 3, and 5. Eligibility derives only from
/// committed <c>XpTransaction</c> rows — there are no criteria columns and no
/// generic rules engine. This file also holds the pure milestone evaluator so
/// definitions, rules, and evaluation stay one cohesive, fully unit-testable
/// concept.
/// </summary>
public static class AchievementCatalog
{
    public const string CategoryMilestone = "Milestone";

    public static readonly AchievementDefinition FirstSteps = new(
        new Guid("b5371794-ccd2-45fb-9a7a-f24ec2692bc2"),
        "verified-completions-1",
        "First Steps",
        "Complete your first verified eco quest.",
        CategoryMilestone,
        1);

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

    /// <summary>All approved definitions, ordered by threshold ascending.</summary>
    public static IReadOnlyList<AchievementDefinition> Definitions { get; } =
    [
        FirstSteps,
        BuildingMomentum,
        CommittedContributor,
    ];

    public static AchievementDefinition? FindByCode(string? code) =>
        code is null
            ? null
            : Definitions.FirstOrDefault(
                definition => string.Equals(
                    definition.Code, code, StringComparison.Ordinal));

    /// <summary>
    /// Pure milestone evaluation over one transactionally stable ledger
    /// snapshot. Returns every active milestone the snapshot entitles the user
    /// to that is not already earned, in threshold order. The trigger for
    /// threshold N is the Nth row of the snapshot ordered by
    /// (<c>CreatedAt</c>, <c>XpTransactionId</c>) ascending — a total order,
    /// so equal timestamps are resolved deterministically.
    /// </summary>
    /// <param name="activeMilestones">
    /// Definitions whose catalog row exists and is active (the caller joins
    /// the static definitions to the seeded catalog).
    /// </param>
    /// <param name="earnedAchievementIds">
    /// Achievement ids the user has already earned, re-read by the caller
    /// after acquiring the profile lock.
    /// </param>
    /// <param name="snapshotCount">
    /// Total number of rows in the snapshot (committed rows plus the staged
    /// row where applicable).
    /// </param>
    /// <param name="orderedSnapshot">
    /// The snapshot prefix ordered by (<c>CreatedAt</c>, <c>Id</c>)
    /// ascending. Must contain at least as many rows as the highest
    /// threshold being evaluated.
    /// </param>
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
            throw new ArgumentOutOfRangeException(
                nameof(snapshotCount), "Snapshot count cannot be negative.");
        if (orderedSnapshot.Count > snapshotCount)
            throw new ArgumentException(
                "The ordered snapshot cannot contain more rows than the snapshot count.",
                nameof(orderedSnapshot));
        for (var index = 1; index < orderedSnapshot.Count; index++)
        {
            var previous = orderedSnapshot[index - 1];
            var current = orderedSnapshot[index];
            var outOfOrder =
                current.CreatedAt < previous.CreatedAt ||
                (current.CreatedAt == previous.CreatedAt &&
                 current.XpTransactionId.CompareTo(previous.XpTransactionId) <= 0);
            if (outOfOrder)
                throw new ArgumentException(
                    "The snapshot must be ordered by (CreatedAt, Id) ascending.",
                    nameof(orderedSnapshot));
        }

        var awards = new List<PendingAchievementAward>();
        foreach (var milestone in activeMilestones.OrderBy(m => m.Threshold))
        {
            if (milestone.Threshold <= 0)
                throw new ArgumentException(
                    "Milestone thresholds must be positive.",
                    nameof(activeMilestones));
            if (snapshotCount < milestone.Threshold ||
                earnedAchievementIds.Contains(milestone.Id))
                continue;
            if (orderedSnapshot.Count < milestone.Threshold)
                throw new InvalidOperationException(
                    "The snapshot prefix must contain at least the evaluated " +
                    "threshold rows for every eligible missing milestone.");

            var trigger = orderedSnapshot[milestone.Threshold - 1];
            awards.Add(new PendingAchievementAward(
                milestone.Id,
                trigger.XpTransactionId,
                trigger.CreatedAt));
        }

        return awards;
    }
}
