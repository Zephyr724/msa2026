namespace Kiwimpact.Api.Contracts;

using System.ComponentModel.DataAnnotations;
using Kiwimpact.Core.Entities;

public sealed record RedeemCompletionCodeRequest(string? Code);

public sealed record GeneratedCompletionCodeDto(
    string Code,
    string ValidFromUtc,
    string? ValidToUtc);

public sealed record CompletionCodeStatusDto(
    bool IsConfigured,
    string? ValidFromUtc,
    string? ValidToUtc,
    string? CreatedAtUtc);

public sealed record MyQuestCompletionDto(
    string Status,
    string? Method,
    string? CompletedAtUtc,
    string? VerifiedAtUtc);

public sealed record CompletionRewardAchievementDto(
    Guid AchievementId,
    string Code,
    string Name);

public sealed record CompletionRewardStreakDto(
    int PreviousWeeks,
    bool PreviousHasVerifiedImpactThisWeek,
    int Weeks,
    bool HasVerifiedImpactThisWeek);

public sealed record CompletionRewardCommunityChallengeDto(
    Guid ChallengeId,
    string CommunityName,
    long PreviousProgress,
    long Progress,
    int Target);

public sealed record CompletionRewardDto(
    Guid RewardEventId,
    Guid QuestCompletionId,
    Guid QuestId,
    string QuestTitle,
    string CelebrationTitle,
    string CelebrationMessage,
    string VerificationMethod,
    int XpAwarded,
    long PreviousTotalXp,
    long TotalXp,
    int PreviousLevel,
    int Level,
    string PreviousRankTitle,
    string RankTitle,
    CompletionRewardStreakDto Streak,
    CompletionRewardCommunityChallengeDto? CommunityChallenge,
    IReadOnlyList<CompletionRewardAchievementDto> UnlockedAchievements,
    string CreatedAtUtc,
    string? SeenAtUtc);

public sealed record RedeemCompletionResultDto(
    MyQuestCompletionDto Completion,
    CompletionRewardDto Reward);

public sealed record RewardEventInboxDto(
    IReadOnlyList<CompletionRewardDto> Items);

public sealed class EvidenceClaimRequest
{
    [Required, MaxLength(EvidenceClaimDetail.MaxDescriptionLength)]
    public string Description { get; init; } = string.Empty;

    [MaxLength(EvidenceClaimDetail.MaxEvidenceUrlLength), Url]
    public string? EvidenceUrl { get; init; }

    [Range(typeof(bool), "true", "true")]
    public bool UserDeclaration { get; init; }

    public DateTimeOffset CompletedAtUtc { get; init; }
}

public sealed class SelfReportRequest
{
    public DateTimeOffset CompletedAtUtc { get; init; }
}

public sealed class ReviewEvidenceClaimRequest
{
    public bool Approve { get; init; }

    [MaxLength(EvidenceClaimDetail.MaxReviewNoteLength)]
    public string? ReviewNote { get; init; }
}

public sealed record EvidenceClaimSummaryDto(
    Guid ClaimId,
    Guid UserId,
    Guid QuestId,
    string QuestTitle,
    string Status,
    string CompletedAtUtc,
    string CreatedAtUtc,
    string? ReviewedAtUtc);

public sealed record EvidenceClaimDto(
    Guid ClaimId,
    Guid UserId,
    Guid QuestId,
    string QuestTitle,
    string Status,
    string CompletedAtUtc,
    string CreatedAtUtc,
    string? Description,
    string? EvidenceUrl,
    bool UserDeclaration,
    string? ReviewNote,
    Guid? ReviewedByUserId,
    string? ReviewedAtUtc,
    string? EvidencePurgedAtUtc);
