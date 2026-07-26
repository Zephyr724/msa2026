using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Achievements;

/// <summary>
/// Write-side milestone award evaluation shared by every XP-creation path
/// (live redemption, XP reconciliation, and the historical backfill). Every
/// entry point implements the approved idempotency protocol: the caller holds
/// the user's profile <c>FOR UPDATE</c> row lock, existing awards are
/// re-read after the lock, and only missing awards are staged. The
/// <c>UX_UserAchievements_UserId_AchievementId</c> unique index is an
/// invariant backstop only — never normal control flow; an unexpected unique
/// violation aborts and rolls back the caller's whole transaction.
///
/// Trigger resolution uses the transactionally stable ledger snapshot visible
/// under that lock: committed rows plus the staged row where applicable,
/// ordered by (CreatedAt, Id). Persisted awards are immutable; a later
/// backdated or equal-timestamp ledger row never rewrites them.
/// </summary>
public sealed class AchievementAwardService
{
    private readonly KiwimpactDbContext _db;

    public AchievementAwardService(KiwimpactDbContext db)
    {
        _db = db;
    }

    public sealed record BackfillCandidateScan(
        IReadOnlyList<Guid> ScannedUserIds,
        IReadOnlyList<Guid> EligibleUserIds);

    /// <summary>
    /// Stages the active milestone awards the user is eligible for but has
    /// not earned, on the caller's DbContext. The caller MUST hold the user's
    /// profile row lock before calling and commits (or rolls back) the staged
    /// rows with its own flush.
    /// </summary>
    /// <param name="stagedXp">
    /// The not-yet-flushed XP row of a live redemption; null when the new
    /// row is already committed (reconciliation flush #1, backfill).
    /// </param>
    /// <returns>The number of staged awards.</returns>
    public async Task<int> StageMissingMilestoneAwardsAsync(
        Guid userId,
        XpTransaction? stagedXp,
        CancellationToken ct = default)
    {
        var activeMilestones = await GetActiveMilestoneDefinitionsAsync(ct);
        if (activeMilestones.Count == 0)
            return 0;

        // Post-lock re-read: the idempotency protocol. Whatever is visible
        // here is treated as already awarded; the unique index is only the
        // invariant backstop for anything outside the lock protocol.
        var earned = (await _db.UserAchievements
            .AsNoTracking()
            .Where(award => award.UserId == userId)
            .Select(award => award.AchievementId)
            .ToListAsync(ct)).ToHashSet();

        var missing = activeMilestones
            .Where(definition => !earned.Contains(definition.Id))
            .ToList();
        if (missing.Count == 0)
            return 0;

        var committedCount = await _db.XpTransactions
            .AsNoTracking()
            .CountAsync(transaction => transaction.UserId == userId, ct);
        var snapshotCount = committedCount + (stagedXp is null ? 0 : 1);
        if (snapshotCount < missing.Min(definition => definition.Threshold))
            return 0;

        var maxThreshold = activeMilestones.Max(definition => definition.Threshold);
        var snapshot = await _db.XpTransactions
            .AsNoTracking()
            .Where(transaction => transaction.UserId == userId)
            .OrderBy(transaction => transaction.CreatedAt)
            .ThenBy(transaction => transaction.Id)
            .Take(maxThreshold)
            .Select(transaction => new AchievementLedgerRow(
                transaction.Id,
                transaction.CreatedAt))
            .ToListAsync(ct);
        if (stagedXp is not null)
        {
            snapshot.Add(new AchievementLedgerRow(stagedXp.Id, stagedXp.CreatedAt));
            snapshot.Sort(static (left, right) =>
            {
                var byTime = left.CreatedAt.CompareTo(right.CreatedAt);
                return byTime != 0
                    ? byTime
                    : left.XpTransactionId.CompareTo(right.XpTransactionId);
            });
        }

        var awards = AchievementCatalog.EvaluateMilestones(
            activeMilestones,
            earned,
            snapshotCount,
            snapshot);
        foreach (var award in awards)
            _db.UserAchievements.Add(UserAchievement.CreateFromMilestone(userId, award));
        return awards.Count;
    }

    /// <summary>
    /// Backfill candidate discovery. PostgreSQL filters to users with at
    /// least one eligible-but-missing active milestone before applying the
    /// deterministic order and batch limit. Read-only: a pass with nothing
    /// missing acquires no row locks and writes nothing.
    /// </summary>
    public async Task<BackfillCandidateScan> FindBackfillCandidatesAsync(
        int batchSize,
        IReadOnlyCollection<Guid> attemptedIds,
        CancellationToken ct = default)
    {
        var activeMilestones = await GetActiveMilestoneDefinitionsAsync(ct);
        if (activeMilestones.Count == 0)
            return new BackfillCandidateScan([], []);

        IQueryable<Guid>? candidateQuery = null;
        foreach (var milestone in activeMilestones)
        {
            var achievementId = milestone.Id;
            var threshold = milestone.Threshold;
            var milestoneCandidates = _db.XpTransactions
                .AsNoTracking()
                .GroupBy(transaction => transaction.UserId)
                .Where(group => group.Count() >= threshold)
                .Select(group => group.Key)
                .Where(userId => !_db.UserAchievements.Any(award =>
                    award.UserId == userId &&
                    award.AchievementId == achievementId));

            candidateQuery = candidateQuery is null
                ? milestoneCandidates
                : candidateQuery.Union(milestoneCandidates);
        }

        var candidates = await candidateQuery!
            .Where(userId => !attemptedIds.Contains(userId))
            .OrderBy(userId => userId)
            .Take(batchSize)
            .ToListAsync(ct);
        if (candidates.Count == 0)
            return new BackfillCandidateScan([], []);

        return new BackfillCandidateScan(candidates, candidates);
    }

    /// <summary>
    /// Awards one user's missing milestones inside its own per-user
    /// transaction (the backfill path): profile <c>FOR UPDATE</c> lock →
    /// post-lock re-read → locked committed snapshot → one flush. Any failure
    /// — including an unexpected unique violation from the backstop — rolls
    /// back the whole transaction and propagates; an aborted transaction is
    /// never reported as awarded.
    /// </summary>
    /// <returns>The number of awards committed.</returns>
    public async Task<int> AwardBackfillUserAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            if (!await LockUserProfileAsync(userId, ct))
                throw new InvalidOperationException(
                    "A user with XP transactions has no profile row.");

            var staged = await StageMissingMilestoneAwardsAsync(userId, null, ct);
            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return staged;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    /// <summary>
    /// Active milestone definitions: the static rule definitions joined to
    /// seeded catalog rows by code, requiring identity agreement. Startup
    /// validation guarantees the mapping; the id check is defensive so a
    /// drifted row can never redirect an award.
    /// </summary>
    private async Task<IReadOnlyList<AchievementDefinition>> GetActiveMilestoneDefinitionsAsync(
        CancellationToken ct)
    {
        var activeRows = await _db.Achievements
            .AsNoTracking()
            .Where(achievement => achievement.IsActive)
            .Select(achievement => new { achievement.Code, achievement.Id })
            .ToListAsync(ct);

        var definitions = new List<AchievementDefinition>();
        foreach (var row in activeRows)
        {
            var definition = AchievementCatalog.FindByCode(row.Code);
            if (definition is not null && definition.Id == row.Id)
                definitions.Add(definition);
        }

        return definitions;
    }

    private async Task<bool> LockUserProfileAsync(Guid userId, CancellationToken ct) =>
        await _db.Database.SqlQuery<Guid>($"""
                SELECT p."Id" AS "Value"
                FROM "UserProfiles" AS p
                WHERE p."Id" = {userId}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(ct) != Guid.Empty;
}
