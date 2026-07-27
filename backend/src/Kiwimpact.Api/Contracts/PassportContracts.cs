namespace Kiwimpact.Api.Contracts;

public sealed record PassportCompletionItemDto(
    Guid CompletionId,
    Guid QuestId,
    string QuestTitle,
    string QuestCategory,
    string QuestStatus,
    string Status,
    string Method,
    string CompletedAtUtc,
    string? VerifiedAtUtc,
    int? XpAmount);

public sealed record PassportCategoryImpactDto(
    string Category,
    long VerifiedCompletionCount,
    long VerifiedXp);

public sealed record PassportSummaryDto(
    string DisplayName,
    long TotalXp,
    int Level,
    string RankTitle,
    RegionSummaryDto? HomeCommunity,
    long VerifiedCompletionCount,
    long SelfReportedCompletionCount,
    long PendingCompletionCount,
    IReadOnlyList<PassportCategoryImpactDto> CategoryImpact);

public sealed record PassportCommunityParticipationDto(
    RegionSummaryDto Community,
    bool IsCurrentCommunity,
    long VerifiedCompletionCount,
    long VerifiedXp,
    int ChallengesContributedTo,
    int ChallengeAchievementsEarned,
    string LatestContributionAtUtc);
