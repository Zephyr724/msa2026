using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Services;

public enum PassportError
{
    NotFound,
    NotReady,
}

public sealed class PassportException : Exception
{
    public PassportException(PassportError error, string message)
        : base(message)
    {
        Error = error;
    }

    public PassportError Error { get; }
}

/// <summary>
/// One row of the authenticated user's own Verified completion history.
/// Quest title/category/status are the Quest's current mutable values, not
/// completion-time snapshots. <paramref name="XpAmount"/> is null while the
/// completion's XP transaction has not been written yet.
/// </summary>
public sealed record PassportCompletionItem(
    Guid CompletionId,
    Guid QuestId,
    string QuestTitle,
    QuestCategory QuestCategory,
    QuestStatus QuestStatus,
    PassportCoverImage? CoverImage,
    QuestCompletionStatus Status,
    CompletionMethod Method,
    DateTimeOffset CompletedAtUtc,
    DateTimeOffset? VerifiedAtUtc,
    int? XpAmount,
    IReadOnlyList<string> AchievementNames);

public sealed record PassportCoverImage(
    Guid Id,
    string ImageUrl,
    string AltText);

public sealed record PassportCategoryImpact(
    QuestCategory Category,
    long VerifiedCompletionCount,
    long VerifiedXp);

public sealed record PassportSummary(
    string DisplayName,
    long TotalXp,
    int Level,
    string RankTitle,
    PassportCommunityIdentity? HomeCommunity,
    long VerifiedCompletionCount,
    long SelfReportedCompletionCount,
    long PendingCompletionCount,
    IReadOnlyList<PassportCategoryImpact> CategoryImpact);

public sealed record PassportCommunityIdentity(
    Guid Id,
    string Name,
    string Type,
    Guid? ParentRegionId);

public sealed record PassportCommunityParticipation(
    PassportCommunityIdentity Community,
    bool IsCurrentCommunity,
    long VerifiedCompletionCount,
    long VerifiedXp,
    int ChallengesContributedTo,
    int ChallengeAchievementsEarned,
    DateTimeOffset LatestContributionAtUtc);
