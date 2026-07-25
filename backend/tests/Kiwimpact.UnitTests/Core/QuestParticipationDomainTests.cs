using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Core;

public sealed class QuestParticipationDomainTests
{
    private static readonly DateTimeOffset Now =
        new(2026, 7, 25, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public void CreateAndCancel_NormalizeTimestampsAndRetainHistoryForRejoin()
    {
        var userId = Guid.NewGuid();
        var questId = Guid.NewGuid();
        var joined = QuestParticipation.CreateActive(
            userId,
            questId,
            Now.ToOffset(TimeSpan.FromHours(12)));

        joined.Cancel(Now.AddHours(1).ToOffset(TimeSpan.FromHours(12)));
        var rejoined = QuestParticipation.CreateActive(userId, questId, Now.AddHours(2));

        Assert.Equal(TimeSpan.Zero, joined.JoinedAt.Offset);
        Assert.Equal(TimeSpan.Zero, joined.CancelledAt?.Offset);
        Assert.NotEqual(joined.Id, rejoined.Id);
        Assert.NotNull(joined.CancelledAt);
        Assert.Null(rejoined.CancelledAt);
    }

    [Fact]
    public void Cancel_AlreadyCancelled_Throws()
    {
        var participation = QuestParticipation.CreateActive(
            Guid.NewGuid(), Guid.NewGuid(), Now);
        participation.Cancel(Now);

        Assert.Throws<InvalidOperationException>(() => participation.Cancel(Now.AddMinutes(1)));
    }

    [Fact]
    public void Eligibility_UsesAcceptedPrecedence()
    {
        var creatorId = Guid.NewGuid();
        var quest = CreateQuest(creatorId, RegistrationMode.External, capacity: 0);

        var result = QuestParticipationEligibility.Evaluate(
            quest,
            creatorId,
            hasActiveParticipation: true,
            hasCancelledParticipation: true,
            activeCount: 1,
            Now.AddDays(2));

        Assert.Equal(QuestParticipationStatus.Active, result.Status);
        Assert.False(result.CanJoin);
        Assert.Equal(ParticipationIneligibilityReason.OwnQuest, result.IneligibilityReason);
        Assert.True(result.CapacityFull);
    }

    [Fact]
    public void Eligibility_DuplicateActivePrecedesOtherQuestRules()
    {
        var quest = CreateQuest(Guid.NewGuid(), RegistrationMode.External);
        quest.Publish(Now);
        quest.Cancel(Now);

        var result = Evaluate(quest, hasActive: true);

        Assert.Equal(ParticipationIneligibilityReason.AlreadyParticipating, result.IneligibilityReason);
    }

    [Fact]
    public void Eligibility_NonPublishedPrecedesModeEndAndCapacity()
    {
        var quest = CreateQuest(
            Guid.NewGuid(), RegistrationMode.External, capacity: 0, endAt: Now.AddMinutes(-1));

        var result = Evaluate(quest);

        Assert.Equal(ParticipationIneligibilityReason.QuestNotPublished, result.IneligibilityReason);
    }

    [Fact]
    public void Eligibility_UnsupportedModePrecedesEndAndCapacity()
    {
        var quest = CreateQuest(
            Guid.NewGuid(), RegistrationMode.External, capacity: 0, endAt: Now.AddMinutes(-1));
        quest.Publish(Now.AddDays(-1));

        var result = Evaluate(quest);

        Assert.Equal(
            ParticipationIneligibilityReason.RegistrationModeNotSupported,
            result.IneligibilityReason);
    }

    [Fact]
    public void Eligibility_EndedPrecedesCapacity()
    {
        var quest = CreateQuest(
            Guid.NewGuid(), RegistrationMode.Native, capacity: 0, endAt: Now.AddMinutes(-1));
        quest.Publish(Now.AddDays(-1));

        var result = Evaluate(quest);

        Assert.Equal(ParticipationIneligibilityReason.QuestEnded, result.IneligibilityReason);
    }

    [Theory]
    [InlineData(0, 0, true)]
    [InlineData(1, 1, true)]
    [InlineData(2, 1, false)]
    public void Eligibility_EnforcesFiniteCapacity(int capacity, int activeCount, bool full)
    {
        var quest = CreateQuest(Guid.NewGuid(), RegistrationMode.Native, capacity);
        quest.Publish(Now);

        var result = Evaluate(quest, activeCount: activeCount);

        Assert.Equal(full, result.CapacityFull);
        Assert.Equal(
            full ? ParticipationIneligibilityReason.CapacityFull : null,
            result.IneligibilityReason);
    }

    [Fact]
    public void Eligibility_NullCapacityIsUnlimitedAndStartDateDoesNotBlockJoin()
    {
        var quest = CreateQuest(
            Guid.NewGuid(),
            RegistrationMode.Native,
            capacity: null,
            startAt: Now.AddDays(5),
            endAt: Now.AddDays(6));
        quest.Publish(Now);

        var result = Evaluate(quest, activeCount: int.MaxValue);

        Assert.True(result.CanJoin);
        Assert.Null(result.IneligibilityReason);
        Assert.False(result.CapacityFull);
    }

    [Theory]
    [InlineData("Organizer")]
    [InlineData("Admin")]
    public void OrganizerAndAdmin_AreEligibleForAnotherCreatorsQuest(string role)
    {
        _ = role;
        var quest = CreateQuest(Guid.NewGuid(), RegistrationMode.Native);
        quest.Publish(Now);

        var result = Evaluate(quest, actorId: Guid.NewGuid());

        Assert.True(result.CanJoin);
    }

    [Theory]
    [InlineData("Member")]
    [InlineData("Organizer")]
    [InlineData("Admin")]
    public void RolePermission_NeverBypassesCreatorOwnership(string role)
    {
        _ = role;
        var creatorId = Guid.NewGuid();
        var quest = CreateQuest(creatorId, RegistrationMode.Native, capacity: 0);
        quest.Publish(Now);

        var result = Evaluate(quest, actorId: creatorId);

        Assert.Equal(ParticipationIneligibilityReason.OwnQuest, result.IneligibilityReason);
        Assert.True(result.CapacityFull);
    }

    [Fact]
    public void Eligibility_ReportsCancelledHistoryAndAllowsRejoin()
    {
        var quest = CreateQuest(Guid.NewGuid(), RegistrationMode.Native);
        quest.Publish(Now);

        var result = Evaluate(quest, hasCancelled: true);

        Assert.Equal(QuestParticipationStatus.Cancelled, result.Status);
        Assert.True(result.CanJoin);
    }

    private static MyQuestParticipationState Evaluate(
        Quest quest,
        Guid? actorId = null,
        bool hasActive = false,
        bool hasCancelled = false,
        int activeCount = 0) =>
        QuestParticipationEligibility.Evaluate(
            quest,
            actorId ?? Guid.NewGuid(),
            hasActive,
            hasCancelled,
            activeCount,
            Now);

    private static Quest CreateQuest(
        Guid creatorId,
        RegistrationMode registrationMode,
        int? capacity = null,
        DateTimeOffset? startAt = null,
        DateTimeOffset? endAt = null)
    {
        return Quest.CreateOrganizerOwned(
            creatorId,
            new QuestDetails(
                "Participation test Quest",
                "A focused Quest for participation domain tests.",
                QuestCategory.RestoreNature,
                registrationMode,
                QuestDifficulty.Easy,
                capacity,
                startAt,
                endAt,
                null,
                null,
                registrationMode == RegistrationMode.External
                    ? "https://example.test/quest"
                    : null),
            new QuestCoverImageDetails(
                "/images/quests/test.svg",
                "Test Quest cover",
                null,
                null,
                null),
            Now.AddDays(-1));
    }
}
