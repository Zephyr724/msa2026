using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Entities;

namespace Kiwimpact.UnitTests.Core;

public sealed class UserAchievementDomainTests
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly PendingAchievementAward ValidAward = new(
        AchievementCatalog.FirstSteps.Id,
        Guid.NewGuid(),
        new DateTimeOffset(2026, 7, 26, 1, 2, 3, TimeSpan.Zero));

    [Fact]
    public void ValidConstructionSetsEveryField()
    {
        var award = UserAchievement.CreateFromMilestone(UserId, ValidAward);

        Assert.NotEqual(Guid.Empty, award.Id);
        Assert.Equal(UserId, award.UserId);
        Assert.Equal(ValidAward.AchievementId, award.AchievementId);
        Assert.Equal(ValidAward.XpTransactionId, award.XpTransactionId);
        Assert.Equal(ValidAward.AwardedAt, award.AwardedAt);
    }

    [Fact]
    public void EmptyUserIdIsRejected()
    {
        Assert.Throws<ArgumentException>(() =>
            UserAchievement.CreateFromMilestone(Guid.Empty, ValidAward));
    }

    [Fact]
    public void EmptyAchievementIdIsRejected()
    {
        var award = ValidAward with { AchievementId = Guid.Empty };
        Assert.Throws<ArgumentException>(() =>
            UserAchievement.CreateFromMilestone(UserId, award));
    }

    [Fact]
    public void EmptyTriggerTransactionIdIsRejected()
    {
        var award = ValidAward with { XpTransactionId = Guid.Empty };
        Assert.Throws<ArgumentException>(() =>
            UserAchievement.CreateFromMilestone(UserId, award));
    }

    [Fact]
    public void MissingAwardTimestampIsRejected()
    {
        var award = ValidAward with { AwardedAt = default };
        Assert.Throws<ArgumentException>(() =>
            UserAchievement.CreateFromMilestone(UserId, award));
    }

    [Fact]
    public void NonUtcTimestampIsNormalizedToUtc()
    {
        var local = new DateTimeOffset(2026, 7, 26, 13, 0, 0, TimeSpan.FromHours(12));
        var award = UserAchievement.CreateFromMilestone(
            UserId, ValidAward with { AwardedAt = local });

        Assert.Equal(TimeSpan.Zero, award.AwardedAt.Offset);
        Assert.Equal(local.ToUniversalTime(), award.AwardedAt);
    }
}
