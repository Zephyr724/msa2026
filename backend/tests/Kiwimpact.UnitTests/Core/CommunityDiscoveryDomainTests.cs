using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;

namespace Kiwimpact.UnitTests.Core;

public sealed class CommunityDiscoveryDomainTests
{
    [Theory]
    [InlineData(-90, -180)]
    [InlineData(90, 180)]
    [InlineData(-36.8509, 174.7645)]
    public void QuestCoordinatesAcceptPairedValuesInRange(
        decimal latitude,
        decimal longitude)
    {
        var quest = CreateQuest(latitude, longitude);

        Assert.Equal(latitude, quest.Latitude);
        Assert.Equal(longitude, quest.Longitude);
    }

    [Fact]
    public void QuestCoordinatesRejectUnpairedValues()
    {
        Assert.Throws<ArgumentException>(() => CreateQuest(-36.85m, null));
    }

    [Theory]
    [InlineData(-90.000001, 174)]
    [InlineData(90.000001, 174)]
    [InlineData(-36, -180.000001)]
    [InlineData(-36, 180.000001)]
    public void QuestCoordinatesRejectOutOfRange(
        decimal latitude,
        decimal longitude)
    {
        Assert.Throws<ArgumentException>(() => CreateQuest(latitude, longitude));
    }

    [Fact]
    public void HomeCommunityFirstSelectionIsFreeThenCooldownApplies()
    {
        var now = new DateTimeOffset(2026, 7, 27, 0, 0, 0, TimeSpan.Zero);
        var profile = UserProfile.Create(Guid.NewGuid(), "Aroha", now);
        var first = Guid.NewGuid();
        profile.UpdateCommunity(first, true, now, TimeSpan.FromDays(30));

        Assert.Equal(first, profile.HomeCommunityRegionId);
        Assert.True(profile.ShowCommunityOnPassport);
        Assert.Throws<InvalidOperationException>(() =>
            profile.UpdateCommunity(
                Guid.NewGuid(),
                true,
                now.AddDays(29),
                TimeSpan.FromDays(30)));

        var second = Guid.NewGuid();
        profile.UpdateCommunity(
            second,
            false,
            now.AddDays(30),
            TimeSpan.FromDays(30));
        Assert.Equal(second, profile.HomeCommunityRegionId);
        Assert.False(profile.ShowCommunityOnPassport);
    }

    [Fact]
    public void WeeklyStreakUsesAucklandCalendarWeeksWithCurrentWeekGrace()
    {
        var now = new DateTimeOffset(2026, 7, 29, 12, 0, 0, TimeSpan.Zero);
        var state = WeeklyStreakCalculator.Calculate(
            [
                new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2026, 7, 14, 12, 0, 0, TimeSpan.Zero),
            ],
            now);

        Assert.Equal(2, state.CurrentWeeks);
        Assert.False(state.HasVerifiedImpactThisWeek);
    }

    [Fact]
    public void CommunityChallengeLocksCompetitiveFieldsAfterContribution()
    {
        var now = new DateTimeOffset(2026, 7, 27, 0, 0, 0, TimeSpan.Zero);
        var challenge = CommunityChallenge.Create(
            Guid.NewGuid(),
            now.AddDays(2),
            now.AddDays(32),
            20,
            null,
            now);

        Assert.Throws<InvalidOperationException>(() =>
            challenge.UpdateCompetitiveFields(
                challenge.LocalAreaRegionId,
                challenge.PeriodStart,
                challenge.PeriodEnd,
                25,
                null,
                1,
                now.AddDays(1)));
    }

    [Theory]
    [InlineData(19, ChallengeStatus.Failed)]
    [InlineData(20, ChallengeStatus.Completed)]
    public void CommunityChallengeFinalizesAgainstDerivedProgress(
        long progress,
        ChallengeStatus expected)
    {
        var start = new DateTimeOffset(2026, 6, 1, 0, 0, 0, TimeSpan.Zero);
        var challenge = CommunityChallenge.Create(
            Guid.NewGuid(),
            start,
            start.AddMonths(1),
            20,
            null,
            start.AddDays(-1));

        challenge.Finalize(progress, start.AddMonths(1));

        Assert.Equal(expected, challenge.Status);
    }

    private static Quest CreateQuest(decimal? latitude, decimal? longitude) =>
        Quest.CreateOrganizerOwned(
            Guid.NewGuid(),
            new QuestDetails(
                "Mapped Quest",
                "A mapped environmental action.",
                QuestCategory.RestoreNature,
                RegistrationMode.Native,
                QuestDifficulty.Easy,
                null,
                null,
                null,
                null,
                "Auckland",
                null,
                latitude,
                longitude),
            new QuestCoverImageDetails(
                "/images/quest.jpg",
                "Quest cover",
                null,
                null,
                null),
            DateTimeOffset.UtcNow);
}
