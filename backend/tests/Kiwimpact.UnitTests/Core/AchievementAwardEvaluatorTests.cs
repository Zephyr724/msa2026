using Kiwimpact.Core.Achievements;

namespace Kiwimpact.UnitTests.Core;

public sealed class AchievementAwardEvaluatorTests
{
    private static readonly DateTimeOffset Base = new(2026, 7, 26, 0, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 1)]
    [InlineData(2, 1)]
    [InlineData(3, 2)]
    [InlineData(4, 2)]
    [InlineData(5, 3)]
    [InlineData(6, 3)]
    public void EligibilityAtEveryBoundaryCount(int count, int expectedAwards)
    {
        var awards = Evaluate(count, earned: []);

        Assert.Equal(expectedAwards, awards.Count);
    }

    [Fact]
    public void TriggerIsTheNthRowAndAwardedAtIsTheTriggerTimestamp()
    {
        var snapshot = Rows(6);
        var awards = Evaluate(6, earned: [], snapshot);

        Assert.Equal(3, awards.Count);
        Assert.Equal(AchievementCatalog.FirstSteps.Id, awards[0].AchievementId);
        Assert.Equal(snapshot[0].XpTransactionId, awards[0].XpTransactionId);
        Assert.Equal(snapshot[0].CreatedAt, awards[0].AwardedAt);
        Assert.Equal(AchievementCatalog.BuildingMomentum.Id, awards[1].AchievementId);
        Assert.Equal(snapshot[2].XpTransactionId, awards[1].XpTransactionId);
        Assert.Equal(snapshot[2].CreatedAt, awards[1].AwardedAt);
        Assert.Equal(AchievementCatalog.CommittedContributor.Id, awards[2].AchievementId);
        Assert.Equal(snapshot[4].XpTransactionId, awards[2].XpTransactionId);
        Assert.Equal(snapshot[4].CreatedAt, awards[2].AwardedAt);
    }

    [Fact]
    public void EqualTimestampsAreResolvedByTheIdTieBreak()
    {
        var milestone = new AchievementDefinition(
            Guid.NewGuid(), "test-2", "Two", "Two rows.", "Milestone", 2);
        var sameInstant = Base;
        // Deliberately supply the lexicographically larger id first in the
        // snapshot's total order: (CreatedAt, Id) ascending puts the smaller
        // id at position 1.
        var smaller = new AchievementLedgerRow(
            new Guid("00000000-0000-0000-0000-000000000001"), sameInstant);
        var larger = new AchievementLedgerRow(
            new Guid("00000000-0000-0000-0000-000000000002"), sameInstant);

        var awards = AchievementCatalog.EvaluateMilestones(
            [milestone],
            new HashSet<Guid>(),
            snapshotCount: 2,
            [smaller, larger]);

        var award = Assert.Single(awards);
        Assert.Equal(larger.XpTransactionId, award.XpTransactionId);
        Assert.Equal(sameInstant, award.AwardedAt);
    }

    [Fact]
    public void AlreadyEarnedMilestonesAreExcluded()
    {
        var awards = Evaluate(
            5,
            earned:
            [
                AchievementCatalog.FirstSteps.Id,
                AchievementCatalog.BuildingMomentum.Id,
            ]);

        var award = Assert.Single(awards);
        Assert.Equal(AchievementCatalog.CommittedContributor.Id, award.AchievementId);
    }

    [Fact]
    public void CatchUpAwardsEveryMissingEligibleMilestoneInThresholdOrder()
    {
        var awards = Evaluate(6, earned: []);

        Assert.Equal(
            [
                AchievementCatalog.FirstSteps.Id,
                AchievementCatalog.BuildingMomentum.Id,
                AchievementCatalog.CommittedContributor.Id,
            ],
            awards.Select(award => award.AchievementId));
    }

    [Fact]
    public void InactiveDefinitionsAreSimplyNotPassedByTheCaller()
    {
        // The service filters inactive catalog rows before evaluation; with
        // only two active definitions the third milestone is never awarded.
        var awards = AchievementCatalog.EvaluateMilestones(
            [AchievementCatalog.FirstSteps, AchievementCatalog.BuildingMomentum],
            new HashSet<Guid>(),
            snapshotCount: 6,
            Rows(6));

        Assert.Equal(2, awards.Count);
        Assert.DoesNotContain(
            awards,
            award => award.AchievementId == AchievementCatalog.CommittedContributor.Id);
    }

    [Fact]
    public void FullyEarnedUserProducesNoAwards()
    {
        var awards = Evaluate(
            6,
            earned:
            [
                AchievementCatalog.FirstSteps.Id,
                AchievementCatalog.BuildingMomentum.Id,
                AchievementCatalog.CommittedContributor.Id,
            ]);

        Assert.Empty(awards);
    }

    [Fact]
    public void TruncatedPrefixIsAcceptedWhenItCoversEveryEvaluatedThreshold()
    {
        // The service passes Take(maxThreshold) rows; with a snapshot count
        // beyond the highest threshold the prefix is shorter than the count.
        var awards = AchievementCatalog.EvaluateMilestones(
            AchievementCatalog.Definitions,
            new HashSet<Guid>(),
            snapshotCount: 7,
            Rows(5));

        Assert.Equal(3, awards.Count);
    }

    [Fact]
    public void TooShortPrefixForAnEligibleMilestoneIsAContractFailure()
    {
        Assert.Throws<InvalidOperationException>(() =>
            AchievementCatalog.EvaluateMilestones(
                AchievementCatalog.Definitions,
                new HashSet<Guid>(),
                snapshotCount: 5,
                Rows(2)));
    }

    [Fact]
    public void UnorderedSnapshotIsRejected()
    {
        var rows = Rows(2);
        Assert.Throws<ArgumentException>(() =>
            AchievementCatalog.EvaluateMilestones(
                AchievementCatalog.Definitions,
                new HashSet<Guid>(),
                snapshotCount: 2,
                [rows[1], rows[0]]));
    }

    [Fact]
    public void SnapshotLongerThanTheCountIsRejected()
    {
        Assert.Throws<ArgumentException>(() =>
            AchievementCatalog.EvaluateMilestones(
                AchievementCatalog.Definitions,
                new HashSet<Guid>(),
                snapshotCount: 1,
                Rows(2)));
    }

    [Fact]
    public void NegativeCountIsRejected()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            AchievementCatalog.EvaluateMilestones(
                AchievementCatalog.Definitions,
                new HashSet<Guid>(),
                snapshotCount: -1,
                []));
    }

    [Fact]
    public void NonPositiveThresholdIsRejected()
    {
        var invalid = new AchievementDefinition(
            Guid.NewGuid(), "test-0", "Zero", "Zero rows.", "Milestone", 0);
        Assert.Throws<ArgumentException>(() =>
            AchievementCatalog.EvaluateMilestones(
                [invalid],
                new HashSet<Guid>(),
                snapshotCount: 1,
                Rows(1)));
    }

    private static IReadOnlyList<PendingAchievementAward> Evaluate(
        int count,
        IReadOnlyCollection<Guid> earned,
        IReadOnlyList<AchievementLedgerRow>? snapshot = null) =>
        AchievementCatalog.EvaluateMilestones(
            AchievementCatalog.Definitions,
            earned.ToHashSet(),
            count,
            snapshot ?? Rows(count));

    private static List<AchievementLedgerRow> Rows(int count) =>
        Enumerable.Range(0, count)
            .Select(index => new AchievementLedgerRow(
                Guid.NewGuid(),
                Base.AddMinutes(index)))
            .ToList();
}
