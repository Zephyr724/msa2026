using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Services;

public sealed class QuestCompletionService : IQuestCompletionService
{
    private readonly IQuestCompletionRepository _repository;

    public QuestCompletionService(IQuestCompletionRepository repository)
    {
        _repository = repository;
    }

    public Task<GeneratedCompletionCode> GenerateOrRotateAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.GenerateOrRotateAsync(
            questId, actorId, isAdmin, DateTimeOffset.UtcNow, ct);
    }

    public Task<CompletionCodeStatus> GetCodeStatusAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.GetCodeStatusAsync(questId, actorId, isAdmin, ct);
    }

    public Task<CompletionRedemptionResult> RedeemAsync(
        Guid questId,
        Guid actorId,
        string? submittedCode,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.RedeemAsync(
            questId, actorId, submittedCode, DateTimeOffset.UtcNow, ct);
    }

    public Task<IReadOnlyList<MemberRewardEventRecord>> ListUnseenRewardEventsAsync(
        Guid actorId,
        int take = 10,
        CancellationToken ct = default)
    {
        EnsureActor(actorId);
        if (take is < 1 or > 25)
            throw new ArgumentOutOfRangeException(nameof(take), "Take must be between 1 and 25.");
        return _repository.ListUnseenRewardEventsAsync(actorId, take, ct);
    }

    public Task<MemberRewardEventRecord> MarkRewardEventSeenAsync(
        Guid rewardEventId,
        Guid actorId,
        CancellationToken ct = default)
    {
        EnsureClaimRequest(rewardEventId, actorId);
        return _repository.MarkRewardEventSeenAsync(
            rewardEventId, actorId, DateTimeOffset.UtcNow, ct);
    }

    public Task<MemberRewardEventRecord?> GetQuestRewardEventAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.GetQuestRewardEventAsync(questId, actorId, ct);
    }

    public Task<MyQuestCompletionState> GetStateAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.GetStateAsync(questId, actorId, ct);
    }

    public Task<EvidenceClaimRecord> SubmitClaimAsync(
        Guid questId, Guid actorId, EvidenceClaimInput input,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        ArgumentNullException.ThrowIfNull(input);
        return _repository.SubmitClaimAsync(
            questId, actorId, input, DateTimeOffset.UtcNow, ct);
    }

    public Task<MyQuestCompletionState> SelfReportAsync(
        Guid questId, Guid actorId, DateTimeOffset completedAtUtc,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.SelfReportAsync(
            questId, actorId, completedAtUtc, DateTimeOffset.UtcNow, ct);
    }

    public Task<IReadOnlyList<EvidenceClaimSummary>> ListMyClaimsAsync(
        Guid actorId, QuestCompletionStatus? status, CancellationToken ct = default)
    {
        EnsureActor(actorId);
        return _repository.ListMyClaimsAsync(actorId, status, ct);
    }

    public Task<EvidenceClaimRecord> GetClaimAsync(
        Guid claimId, Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        EnsureClaimRequest(claimId, actorId);
        return _repository.GetClaimAsync(claimId, actorId, isAdmin, ct);
    }

    public Task<EvidenceClaimRecord> UpdateClaimAsync(
        Guid claimId, Guid actorId, EvidenceClaimInput input,
        CancellationToken ct = default)
    {
        EnsureClaimRequest(claimId, actorId);
        ArgumentNullException.ThrowIfNull(input);
        return _repository.UpdateClaimAsync(
            claimId, actorId, input, DateTimeOffset.UtcNow, ct);
    }

    public Task WithdrawClaimAsync(
        Guid claimId, Guid actorId, CancellationToken ct = default)
    {
        EnsureClaimRequest(claimId, actorId);
        return _repository.WithdrawClaimAsync(claimId, actorId, ct);
    }

    public Task<IReadOnlyList<EvidenceClaimSummary>> ListPendingClaimsAsync(
        CancellationToken ct = default) =>
        _repository.ListPendingClaimsAsync(ct);

    public Task<EvidenceClaimRecord> ReviewClaimAsync(
        Guid claimId, Guid reviewerId, bool approve, string? reviewNote,
        CancellationToken ct = default)
    {
        EnsureClaimRequest(claimId, reviewerId);
        return _repository.ReviewClaimAsync(
            claimId, reviewerId, approve, reviewNote, DateTimeOffset.UtcNow, ct);
    }

    private static void EnsureRequest(Guid questId, Guid actorId)
    {
        if (questId == Guid.Empty)
            throw new QuestCompletionException(
                QuestCompletionError.NotFound,
                "Quest not found.");
        if (actorId == Guid.Empty)
            throw new QuestCompletionException(
                QuestCompletionError.Forbidden,
                "Authenticated user is required.");
    }

    private static void EnsureClaimRequest(Guid claimId, Guid actorId)
    {
        if (claimId == Guid.Empty)
            throw new QuestCompletionException(QuestCompletionError.NotFound, "Claim not found.");
        EnsureActor(actorId);
    }

    private static void EnsureActor(Guid actorId)
    {
        if (actorId == Guid.Empty)
            throw new QuestCompletionException(
                QuestCompletionError.Forbidden,
                "Authenticated user is required.");
    }
}
