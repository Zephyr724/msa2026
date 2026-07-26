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
    public EvidenceClaimDetail? EvidenceClaimDetail { get; internal set; }

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

    public static QuestCompletion CreateEvidenceClaim(
        Guid userId,
        Quest quest,
        Guid? participationId,
        Guid? communityRegionIdAtCompletion,
        DateTimeOffset completedAt,
        DateTimeOffset now)
    {
        EnsureClaimIdentity(userId, quest);
        var timestamp = now.ToUniversalTime();
        return new QuestCompletion
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            QuestId = quest.Id,
            ParticipationId = participationId,
            Method = CompletionMethod.EvidenceClaim,
            Status = QuestCompletionStatus.Pending,
            CompletedAt = completedAt.ToUniversalTime(),
            RewardDifficultySnapshot = quest.Difficulty,
            CommunityRegionIdAtCompletion = communityRegionIdAtCompletion,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        };
    }

    public static QuestCompletion CreateSelfReported(
        Guid userId,
        Quest quest,
        Guid? participationId,
        DateTimeOffset completedAt,
        DateTimeOffset now)
    {
        EnsureClaimIdentity(userId, quest);
        var timestamp = now.ToUniversalTime();
        return new QuestCompletion
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            QuestId = quest.Id,
            ParticipationId = participationId,
            Method = CompletionMethod.SelfReported,
            Status = QuestCompletionStatus.SelfReported,
            CompletedAt = completedAt.ToUniversalTime(),
            RewardDifficultySnapshot = quest.Difficulty,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        };
    }

    public void UpdatePendingClaim(DateTimeOffset completedAt, DateTimeOffset now)
    {
        EnsurePendingClaim();
        CompletedAt = completedAt.ToUniversalTime();
        UpdatedAt = now.ToUniversalTime();
    }

    public void ApproveEvidenceClaim(DateTimeOffset now)
    {
        EnsurePendingClaim();
        var timestamp = now.ToUniversalTime();
        Status = QuestCompletionStatus.Verified;
        VerifiedAtUtc = timestamp;
        UpdatedAt = timestamp;
    }

    public void RejectEvidenceClaim(DateTimeOffset now)
    {
        EnsurePendingClaim();
        Status = QuestCompletionStatus.Rejected;
        UpdatedAt = now.ToUniversalTime();
    }

    private void EnsurePendingClaim()
    {
        if (Method != CompletionMethod.EvidenceClaim ||
            Status != QuestCompletionStatus.Pending)
        {
            throw new InvalidOperationException("Only a pending evidence claim can be changed.");
        }
    }

    private static void EnsureClaimIdentity(Guid userId, Quest quest)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("Authenticated user is required.", nameof(userId));
        ArgumentNullException.ThrowIfNull(quest);
        if (quest.Id == Guid.Empty)
            throw new ArgumentException("Quest is required.", nameof(quest));
    }
}
