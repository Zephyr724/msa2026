using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Entities;

/// <summary>
/// Immutable delivery snapshot for one verified completion reward. The event
/// identifier deliberately matches the immutable XP transaction identifier so
/// retries cannot manufacture a second visual reward for the same award.
/// </summary>
public sealed class MemberRewardEvent
{
    public const int MaxQuestTitleLength = 200;
    public const int MaxRankTitleLength = 80;
    public const int MaxCommunityNameLength = 150;
    public const int MaxCelebrationTitleLength = 80;
    public const int MaxCelebrationMessageLength = 280;

    internal MemberRewardEvent()
    {
        QuestTitle = string.Empty;
        PreviousRankTitle = string.Empty;
        RankTitle = string.Empty;
        CelebrationTitle = string.Empty;
        CelebrationMessage = string.Empty;
    }

    public Guid Id { get; internal set; }
    public Guid UserId { get; internal set; }
    public Guid QuestCompletionId { get; internal set; }
    public Guid QuestId { get; internal set; }
    public CompletionMethod VerificationMethod { get; internal set; }
    public string QuestTitle { get; internal set; }
    public int XpAwarded { get; internal set; }
    public long PreviousTotalXp { get; internal set; }
    public long TotalXp { get; internal set; }
    public int PreviousLevel { get; internal set; }
    public int Level { get; internal set; }
    public string PreviousRankTitle { get; internal set; }
    public string RankTitle { get; internal set; }
    public string CelebrationTitle { get; internal set; }
    public string CelebrationMessage { get; internal set; }
    public int PreviousStreakWeeks { get; internal set; }
    public int StreakWeeks { get; internal set; }
    public bool PreviousHasVerifiedImpactThisWeek { get; internal set; }
    public bool HasVerifiedImpactThisWeek { get; internal set; }
    public Guid? CommunityChallengeId { get; internal set; }
    public string? CommunityName { get; internal set; }
    public long? CommunityChallengePreviousProgress { get; internal set; }
    public long? CommunityChallengeProgress { get; internal set; }
    public int? CommunityChallengeTarget { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? SeenAtUtc { get; internal set; }

    public XpTransaction? XpTransaction { get; internal set; }
    public QuestCompletion? QuestCompletion { get; internal set; }
    public Quest? Quest { get; internal set; }
    public ICollection<MemberRewardEventAchievement> UnlockedAchievements { get; } =
        new List<MemberRewardEventAchievement>();

    public static MemberRewardEvent Create(
        XpTransaction xp,
        QuestCompletion completion,
        string questTitle,
        long previousTotalXp,
        int previousLevel,
        string previousRankTitle,
        long totalXp,
        int level,
        string rankTitle,
        int previousStreakWeeks,
        bool previousHasVerifiedImpactThisWeek,
        int streakWeeks,
        bool hasVerifiedImpactThisWeek,
        string celebrationTitle,
        string celebrationMessage,
        CommunityRewardSnapshot? community,
        DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(xp);
        ArgumentNullException.ThrowIfNull(completion);
        ArgumentException.ThrowIfNullOrWhiteSpace(questTitle);
        ArgumentException.ThrowIfNullOrWhiteSpace(previousRankTitle);
        ArgumentException.ThrowIfNullOrWhiteSpace(rankTitle);
        ArgumentException.ThrowIfNullOrWhiteSpace(celebrationTitle);
        ArgumentException.ThrowIfNullOrWhiteSpace(celebrationMessage);
        if (celebrationTitle.Trim().Length > MaxCelebrationTitleLength)
            throw new ArgumentOutOfRangeException(nameof(celebrationTitle));
        if (celebrationMessage.Trim().Length > MaxCelebrationMessageLength)
            throw new ArgumentOutOfRangeException(nameof(celebrationMessage));
        if (xp.Id == Guid.Empty || xp.UserId == Guid.Empty || completion.Id == Guid.Empty)
            throw new ArgumentException("Persisted XP and completion identities are required.");
        if (xp.SourceCompletionId != completion.Id || xp.UserId != completion.UserId)
            throw new ArgumentException("Reward XP must belong to the verified completion.");
        if (completion.Status != QuestCompletionStatus.Verified)
            throw new ArgumentException("Only a verified completion can create a reward event.");
        if (previousTotalXp < 0 || totalXp < previousTotalXp || xp.XpAmount <= 0)
            throw new ArgumentOutOfRangeException(nameof(totalXp));
        if (previousStreakWeeks < 0 || streakWeeks < 0)
            throw new ArgumentOutOfRangeException(nameof(streakWeeks));

        return new MemberRewardEvent
        {
            Id = xp.Id,
            UserId = completion.UserId,
            QuestCompletionId = completion.Id,
            QuestId = completion.QuestId,
            VerificationMethod = completion.Method,
            QuestTitle = questTitle.Trim(),
            XpAwarded = xp.XpAmount,
            PreviousTotalXp = previousTotalXp,
            TotalXp = totalXp,
            PreviousLevel = previousLevel,
            Level = level,
            PreviousRankTitle = previousRankTitle,
            RankTitle = rankTitle,
            PreviousStreakWeeks = previousStreakWeeks,
            StreakWeeks = streakWeeks,
            PreviousHasVerifiedImpactThisWeek = previousHasVerifiedImpactThisWeek,
            HasVerifiedImpactThisWeek = hasVerifiedImpactThisWeek,
            CelebrationTitle = celebrationTitle.Trim(),
            CelebrationMessage = celebrationMessage.Trim(),
            CommunityChallengeId = community?.ChallengeId,
            CommunityName = community?.CommunityName,
            CommunityChallengePreviousProgress = community?.PreviousProgress,
            CommunityChallengeProgress = community?.Progress,
            CommunityChallengeTarget = community?.Target,
            CreatedAt = createdAt.ToUniversalTime(),
        };
    }

    public void MarkSeen(DateTimeOffset seenAt)
    {
        if (SeenAtUtc.HasValue) return;
        var timestamp = seenAt.ToUniversalTime();
        SeenAtUtc = timestamp < CreatedAt ? CreatedAt : timestamp;
    }
}

public sealed record CommunityRewardSnapshot(
    Guid ChallengeId,
    string CommunityName,
    long PreviousProgress,
    long Progress,
    int Target);
