using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Entities;

public sealed class QuestCompletion
{
    internal QuestCompletion()
    {
    }

    public Guid Id { get; internal set; }
    public Guid UserId { get; internal set; }
    public Guid QuestId { get; internal set; }
    public Guid? ParticipationId { get; internal set; }
    public CompletionMethod Method { get; internal set; }
    public QuestCompletionStatus Status { get; internal set; }
    public DateTimeOffset CompletedAt { get; internal set; }
    public DateTimeOffset? VerifiedAtUtc { get; internal set; }
    public QuestDifficulty RewardDifficultySnapshot { get; internal set; }
    public Guid? CommunityRegionIdAtCompletion { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }
    public uint Version { get; internal set; }

    public Quest? Quest { get; internal set; }
    public QuestParticipation? Participation { get; internal set; }
    public Region? CommunityRegionAtCompletion { get; internal set; }

    public static QuestCompletion CreateVerifiedWithCode(
        Guid userId,
        Quest quest,
        QuestParticipation participation,
        Guid? communityRegionIdAtCompletion,
        DateTimeOffset now)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("Authenticated user is required.", nameof(userId));
        ArgumentNullException.ThrowIfNull(quest);
        ArgumentNullException.ThrowIfNull(participation);
        if (quest.Id == Guid.Empty)
            throw new ArgumentException("Quest is required.", nameof(quest));
        if (participation.Id == Guid.Empty ||
            participation.UserId != userId ||
            participation.QuestId != quest.Id ||
            participation.CancelledAt.HasValue)
        {
            throw new ArgumentException(
                "An active participation for the authenticated user and Quest is required.",
                nameof(participation));
        }

        var timestamp = now.ToUniversalTime();
        return new QuestCompletion
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            QuestId = quest.Id,
            ParticipationId = participation.Id,
            Method = CompletionMethod.CompletionCode,
            Status = QuestCompletionStatus.Verified,
            CompletedAt = timestamp,
            VerifiedAtUtc = timestamp,
            RewardDifficultySnapshot = quest.Difficulty,
            CommunityRegionIdAtCompletion = communityRegionIdAtCompletion,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        };
    }
}
