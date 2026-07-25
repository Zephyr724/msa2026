using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Services;

namespace Kiwimpact.Core.Repositories;

public interface IXpLedgerRepository
{
    /// <summary>
    /// Reward-pending accounting boundary: true while any Verified completion
    /// lacks an XP transaction. No timestamp filter — unprocessable rows stay
    /// inside the boundary.
    /// </summary>
    Task<bool> HasRewardPendingCompletionsAsync(CancellationToken ct = default);

    /// <summary>
    /// Reward-pending rows that can never be processed (Verified with a null
    /// verification timestamp). Counted, never attempted.
    /// </summary>
    Task<int> CountUnprocessableRewardPendingAsync(CancellationToken ct = default);

    /// <summary>
    /// Award-eligible batch: reward-pending and non-null verification
    /// timestamp, excluding IDs already attempted in this pass, ordered by
    /// (VerifiedAtUtc, Id).
    /// </summary>
    Task<IReadOnlyList<QuestCompletion>> GetAwardEligibleBatchAsync(
        int batchSize,
        IReadOnlyCollection<Guid> attemptedIds,
        CancellationToken ct = default);

    /// <summary>
    /// Awards exactly one XP transaction for one Verified completion and
    /// applies the checked progression update in one transaction. The XP
    /// insert is flushed before the profile row is locked FOR UPDATE
    /// (mandatory lock ordering). A duplicate source-completion insert is the
    /// benign already-awarded outcome.
    /// </summary>
    Task<XpAwardOutcome> AwardVerifiedCompletionAsync(
        QuestCompletion completion,
        DateTimeOffset now,
        CancellationToken ct = default);

    Task<MyProgressionState?> FindProgressionAsync(
        Guid userId,
        CancellationToken ct = default);
}
