namespace Kiwimpact.Core.Services;

using Kiwimpact.Core.Enums;

public interface IQuestCompletionService
{
    Task<GeneratedCompletionCode> GenerateOrRotateAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    Task<CompletionCodeStatus> GetCodeStatusAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    Task<CompletionRedemptionResult> RedeemAsync(
        Guid questId,
        Guid actorId,
        string? submittedCode,
        CancellationToken ct = default);

    Task<IReadOnlyList<MemberRewardEventRecord>> ListUnseenRewardEventsAsync(
        Guid actorId,
        int take = 10,
        CancellationToken ct = default);

    Task<MemberRewardEventRecord> MarkRewardEventSeenAsync(
        Guid rewardEventId,
        Guid actorId,
        CancellationToken ct = default);

    Task<MemberRewardEventRecord?> GetQuestRewardEventAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default);

    Task<MyQuestCompletionState> GetStateAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default);

    Task<EvidenceClaimRecord> SubmitClaimAsync(
        Guid questId, Guid actorId, EvidenceClaimInput input,
        CancellationToken ct = default);
    Task<MyQuestCompletionState> SelfReportAsync(
        Guid questId, Guid actorId, DateTimeOffset completedAtUtc,
        CancellationToken ct = default);
    Task<IReadOnlyList<EvidenceClaimSummary>> ListMyClaimsAsync(
        Guid actorId, QuestCompletionStatus? status, CancellationToken ct = default);
    Task<EvidenceClaimRecord> GetClaimAsync(
        Guid claimId, Guid actorId, bool isAdmin, CancellationToken ct = default);
    Task<EvidenceClaimRecord> UpdateClaimAsync(
        Guid claimId, Guid actorId, EvidenceClaimInput input,
        CancellationToken ct = default);
    Task WithdrawClaimAsync(
        Guid claimId, Guid actorId, CancellationToken ct = default);
    Task<IReadOnlyList<EvidenceClaimSummary>> ListPendingClaimsAsync(
        CancellationToken ct = default);
    Task<EvidenceClaimRecord> ReviewClaimAsync(
        Guid claimId, Guid reviewerId, bool approve, string? reviewNote,
        CancellationToken ct = default);
}
