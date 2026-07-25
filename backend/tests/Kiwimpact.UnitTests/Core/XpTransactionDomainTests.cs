using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;

namespace Kiwimpact.UnitTests.Core;

public sealed class XpTransactionDomainTests
{
    private static readonly DateTimeOffset Now =
        new(2026, 7, 25, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public void FactoryCopiesOnlyImmutableCompletionSnapshots()
    {
        var quest = CreateQuest(QuestDifficulty.Medium);
        var participation = CreateParticipation(quest, out var userId);
        var communityId = Guid.NewGuid();
        var completion = QuestCompletion.CreateVerifiedWithCode(
            userId, quest, participation, communityId, Now);

        var xp = XpTransaction.CreateFromVerifiedCompletion(completion);

        Assert.NotEqual(Guid.Empty, xp.Id);
        Assert.Equal(completion.Id, xp.SourceCompletionId);
        Assert.Equal(userId, xp.UserId);
        Assert.Equal(quest.Id, xp.QuestId);
        Assert.Equal(100, xp.XpAmount);
        Assert.Equal(communityId, xp.CommunityRegionIdAtAward);
        Assert.Equal(completion.VerifiedAtUtc, xp.CreatedAt);
    }

    [Fact]
    public void AmountIgnoresMutableQuestDifficultyAndXpAward()
    {
        var quest = CreateQuest(QuestDifficulty.Easy);
        var participation = CreateParticipation(quest, out var userId);
        var completion = QuestCompletion.CreateVerifiedWithCode(
            userId, quest, participation, null, Now);

        // The Quest is mutated after the completion snapshot was captured.
        SetInternal(quest, nameof(Quest.Difficulty), QuestDifficulty.Hard);
        SetInternal(quest, nameof(Quest.XpAward), 9999);

        var xp = XpTransaction.CreateFromVerifiedCompletion(completion);

        Assert.Equal(QuestDifficulty.Easy, completion.RewardDifficultySnapshot);
        Assert.Equal(50, xp.XpAmount);
    }

    [Fact]
    public void NullCommunitySnapshotStaysNull()
    {
        var quest = CreateQuest(QuestDifficulty.Hard);
        var participation = CreateParticipation(quest, out var userId);
        var completion = QuestCompletion.CreateVerifiedWithCode(
            userId, quest, participation, null, Now);

        var xp = XpTransaction.CreateFromVerifiedCompletion(completion);

        Assert.Null(xp.CommunityRegionIdAtAward);
        Assert.Equal(150, xp.XpAmount);
    }

    [Fact]
    public void FactoryRejectsNullCompletion()
    {
        Assert.Throws<ArgumentNullException>(
            () => XpTransaction.CreateFromVerifiedCompletion(null!));
    }

    [Fact]
    public void FactoryRejectsNonVerifiedCompletion()
    {
        var completion = CreateCompletion(QuestDifficulty.Easy, Guid.NewGuid());
        SetInternal(
            completion,
            nameof(QuestCompletion.Status),
            (QuestCompletionStatus)999);

        Assert.Throws<ArgumentException>(
            () => XpTransaction.CreateFromVerifiedCompletion(completion));
    }

    [Fact]
    public void FactoryRejectsNullVerifiedAtUtcAndNeverInventsATimestamp()
    {
        var completion = CreateCompletion(QuestDifficulty.Easy, Guid.NewGuid());
        SetInternal(completion, nameof(QuestCompletion.VerifiedAtUtc), null);

        Assert.Throws<ArgumentException>(
            () => XpTransaction.CreateFromVerifiedCompletion(completion));
    }

    [Fact]
    public void FactoryRejectsEmptyIdentifiers()
    {
        foreach (var property in new[]
        {
            nameof(QuestCompletion.Id),
            nameof(QuestCompletion.UserId),
            nameof(QuestCompletion.QuestId),
        })
        {
            var completion = CreateCompletion(QuestDifficulty.Easy, Guid.NewGuid());
            SetInternal(completion, property, Guid.Empty);

            Assert.Throws<ArgumentException>(
                () => XpTransaction.CreateFromVerifiedCompletion(completion));
        }
    }

    [Fact]
    public void FactoryRejectsUndefinedDifficultySnapshot()
    {
        var completion = CreateCompletion(QuestDifficulty.Easy, Guid.NewGuid());
        SetInternal(
            completion,
            nameof(QuestCompletion.RewardDifficultySnapshot),
            (QuestDifficulty)999);

        Assert.Throws<ArgumentException>(
            () => XpTransaction.CreateFromVerifiedCompletion(completion));
    }

    private static QuestCompletion CreateCompletion(
        QuestDifficulty difficulty,
        Guid? communityId)
    {
        var quest = CreateQuest(difficulty);
        var participation = CreateParticipation(quest, out var userId);
        return QuestCompletion.CreateVerifiedWithCode(
            userId, quest, participation, communityId, Now);
    }

    private static Quest CreateQuest(QuestDifficulty difficulty)
    {
        var now = Now;
        var quest = Quest.CreateOrganizerOwned(
            Guid.NewGuid(),
            new QuestDetails(
                "XP factory test Quest",
                "A Quest used to verify XP transaction domain rules.",
                QuestCategory.RestoreNature,
                RegistrationMode.Native,
                difficulty,
                10,
                now.AddDays(-1),
                now.AddDays(1),
                null,
                null,
                null),
            new QuestCoverImageDetails(
                "/images/quests/xp.svg",
                "XP test cover",
                null,
                null,
                null),
            now.AddDays(-2));
        quest.Publish(now.AddDays(-1));
        return quest;
    }

    private static QuestParticipation CreateParticipation(Quest quest, out Guid userId)
    {
        userId = Guid.NewGuid();
        return QuestParticipation.CreateActive(userId, quest.Id, Now.AddHours(-1));
    }

    private static void SetInternal(object target, string property, object? value) =>
        target.GetType().GetProperty(property)!.SetValue(target, value);
}
