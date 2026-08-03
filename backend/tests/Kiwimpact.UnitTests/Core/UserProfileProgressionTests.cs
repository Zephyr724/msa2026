using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Entities;

namespace Kiwimpact.UnitTests.Core;

public sealed class UserProfileProgressionTests
{
    private static readonly DateTimeOffset Now =
        new(2026, 7, 25, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public void NewProfileStartsAtZeroXpAndLevelOne()
    {
        var profile = UserProfile.Create(Guid.NewGuid(), "Tester", Now);

        Assert.Equal(0, profile.TotalXp);
        Assert.Equal(1, profile.Level);
        Assert.Equal(
            AchievementCatalog.CurrentEvaluationVersion,
            profile.AchievementEvaluationVersion);
    }

    [Fact]
    public void AchievementEvaluationVersionAdvancesMonotonicallyToCurrent()
    {
        var profile = UserProfile.Create(Guid.NewGuid(), "Tester", Now);
        SetInternal(profile, nameof(UserProfile.AchievementEvaluationVersion), 0);

        profile.MarkAchievementsEvaluated(1);
        Assert.Equal(1, profile.AchievementEvaluationVersion);

        profile.MarkAchievementsEvaluated(
            AchievementCatalog.CurrentEvaluationVersion);
        Assert.Equal(
            AchievementCatalog.CurrentEvaluationVersion,
            profile.AchievementEvaluationVersion);
    }

    [Fact]
    public void AchievementEvaluationVersionRejectsRegressionAndFutureVersions()
    {
        var profile = UserProfile.Create(Guid.NewGuid(), "Tester", Now);

        Assert.Throws<ArgumentOutOfRangeException>(
            () => profile.MarkAchievementsEvaluated(
                AchievementCatalog.CurrentEvaluationVersion - 1));
        Assert.Throws<ArgumentOutOfRangeException>(
            () => profile.MarkAchievementsEvaluated(
                AchievementCatalog.CurrentEvaluationVersion + 1));
        Assert.Equal(
            AchievementCatalog.CurrentEvaluationVersion,
            profile.AchievementEvaluationVersion);
    }

    [Fact]
    public void ApplyXpAwardAccumulatesRecomputesLevelAndSetsUpdatedAt()
    {
        var profile = UserProfile.Create(Guid.NewGuid(), "Tester", Now);
        var later = Now.AddMinutes(5);

        profile.ApplyXpAward(50, later);
        Assert.Equal(50, profile.TotalXp);
        Assert.Equal(2, profile.Level);
        Assert.Equal(later, profile.UpdatedAt);

        profile.ApplyXpAward(150, later.AddMinutes(5));
        Assert.Equal(200, profile.TotalXp);
        Assert.Equal(4, profile.Level);
        Assert.Equal(later.AddMinutes(5), profile.UpdatedAt);
    }

    [Fact]
    public void ApplyXpAwardComputesTheLevelFromTheNewTotalItself()
    {
        // One award can skip several levels: Level is recomputed from the new
        // total, never incremented and never supplied by a caller.
        var profile = UserProfile.Create(Guid.NewGuid(), "Tester", Now);

        profile.ApplyXpAward(150, Now);

        Assert.Equal(150, profile.TotalXp);
        Assert.Equal(3, profile.Level);
    }

    [Fact]
    public void ApplyXpAwardCapsLevelAtNinetyNineWhileTotalKeepsAccruing()
    {
        var profile = UserProfile.Create(Guid.NewGuid(), "Tester", Now);
        SetInternal(profile, nameof(UserProfile.TotalXp), 51940L);
        SetInternal(profile, nameof(UserProfile.Level), 99);

        profile.ApplyXpAward(150, Now.AddMinutes(1));

        Assert.Equal(51940 + 150, profile.TotalXp);
        Assert.Equal(99, profile.Level);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-150)]
    public void ApplyXpAwardRejectsNonPositiveAmounts(int amount)
    {
        var profile = UserProfile.Create(Guid.NewGuid(), "Tester", Now);

        Assert.Throws<ArgumentOutOfRangeException>(
            () => profile.ApplyXpAward(amount, Now));
        Assert.Equal(0, profile.TotalXp);
        Assert.Equal(1, profile.Level);
    }

    [Fact]
    public void ApplyXpAwardRejectsANegativeResult()
    {
        var profile = UserProfile.Create(Guid.NewGuid(), "Tester", Now);
        SetInternal(profile, nameof(UserProfile.TotalXp), -100L);

        Assert.Throws<InvalidOperationException>(
            () => profile.ApplyXpAward(50, Now));
        Assert.Equal(-100, profile.TotalXp);
    }

    [Fact]
    public void ApplyXpAwardOverflowThrowsAndLeavesStateUnchanged()
    {
        var profile = UserProfile.Create(Guid.NewGuid(), "Tester", Now);
        SetInternal(profile, nameof(UserProfile.TotalXp), long.MaxValue);
        SetInternal(profile, nameof(UserProfile.Level), 99);
        var updatedAt = profile.UpdatedAt;

        Assert.Throws<OverflowException>(
            () => profile.ApplyXpAward(50, Now.AddMinutes(1)));

        Assert.Equal(long.MaxValue, profile.TotalXp);
        Assert.Equal(99, profile.Level);
        Assert.Equal(updatedAt, profile.UpdatedAt);
    }

    private static void SetInternal(object target, string property, object? value) =>
        target.GetType().GetProperty(property)!.SetValue(target, value);
}
