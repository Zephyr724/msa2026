namespace Kiwimpact.Api.Contracts;

public sealed record CommunityChallengeDto(
    Guid Id,
    RegionSummaryDto LocalArea,
    string PeriodStartUtc,
    string PeriodEndUtc,
    string TargetType,
    int TargetValue,
    Guid? RewardAchievementId,
    string Status,
    long CurrentProgress,
    decimal ProgressPercentage,
    bool IsPrivacyProtected,
    int? ActiveContributors,
    uint Version);

public sealed record CommunityChallengeProgressDto(
    Guid ChallengeId,
    int TargetValue,
    long CurrentProgress,
    decimal ProgressPercentage,
    bool IsPrivacyProtected,
    int? ActiveContributors);

public sealed record UpsertCommunityChallengeRequest(
    Guid LocalAreaRegionId,
    DateTimeOffset PeriodStartUtc,
    DateTimeOffset PeriodEndUtc,
    int TargetValue,
    Guid? RewardAchievementId,
    uint Version = 0);

public sealed record CommunityChallengeVersionRequest(uint Version);

public sealed record CommunityChallengeMutationResultDto(
    Guid Id,
    uint Version);
