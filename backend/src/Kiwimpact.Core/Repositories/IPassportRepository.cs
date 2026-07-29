using Kiwimpact.Core.Services;

namespace Kiwimpact.Core.Repositories;

public interface IPassportRepository
{
    /// <summary>Existence proof for the bounded missing-profile 404.</summary>
    Task<bool> ProfileExistsAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Caller-scoped unprocessable-row check: true while the caller owns any
    /// Verified completion with a null verification timestamp.
    /// </summary>
    Task<bool> HasNullTimestampVerifiedCompletionAsync(
        Guid userId,
        CancellationToken ct = default);

    /// <summary>
    /// One page of the caller's Verified + CompletionCode completion history,
    /// ordered by VerifiedAtUtc descending with explicit nulls-last
    /// semantics, then Id ascending. Quest fields are the Quest's current
    /// values; XpAmount joins the XP transaction on its source completion
    /// and is null while no XP row exists.
    /// </summary>
    Task<(IReadOnlyList<PassportCompletionItem> Items, int TotalCount)>
        GetCompletionPageAsync(
            Guid userId,
            int page,
            int pageSize,
            CancellationToken ct = default);

    Task<PassportSummary?> GetSummaryAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<IReadOnlyList<PassportCommunityParticipation>>
        GetCommunityParticipationAsync(
            Guid userId,
            CancellationToken ct = default);
}
