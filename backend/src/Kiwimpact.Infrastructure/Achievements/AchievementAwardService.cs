using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Achievements;

/// <summary>
/// Shared write-side evaluation for live awards, XP reconciliation, and
/// historical backfill. Every caller holds the user's profile row lock, then
/// this service re-reads the full immutable XP ledger and earned awards before
/// staging missing automatic achievements and advancing the evaluation
/// version in the same transaction.
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
    /// Stages every missing automatic award. The caller owns the transaction,
    /// MUST hold <paramref name="profile"/>'s row lock, and commits the staged
    /// awards and version update together.
    /// </summary>
    /// <param name="stagedXp">
    /// A live XP row that has not yet been flushed. Null when all XP is already
    /// query-visible on the current connection.
    /// </param>
    /// <param name="stagedCategory">
    /// The staged completion's immutable category. Required exactly when
    /// <paramref name="stagedXp"/> is supplied.
    /// </param>
    public async Task<IReadOnlyList<AchievementDefinition>>
        StageMissingAutomaticAwardsAsync(
        UserProfile profile,
        XpTransaction? stagedXp,
        QuestCategory? stagedCategory,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(profile);
        if (profile.Id == Guid.Empty)
            throw new ArgumentException("A persisted profile is required.", nameof(profile));
        if ((stagedXp is null) != (stagedCategory is null))
        {
            throw new ArgumentException(
                "Staged XP and its immutable category must be supplied together.",
                nameof(stagedCategory));
        }
        if (stagedXp is not null && stagedXp.UserId != profile.Id)
        {
            throw new ArgumentException(
                "The staged XP row must belong to the locked profile.",
                nameof(stagedXp));
        }

        var activeDefinitions = await GetActiveAutomaticDefinitionsAsync(ct);

        // Re-read after the profile lock. Unique indexes remain invariant
        // backstops rather than normal concurrency control.
        var earned = (await _db.UserAchievements
            .AsNoTracking()
            .Where(award => award.UserId == profile.Id)
            .Select(award => award.AchievementId)
            .ToListAsync(ct))
            .ToHashSet();

        var snapshot = await _db.XpTransactions
            .AsNoTracking()
            .Where(transaction => transaction.UserId == profile.Id)
            .Join(
                _db.QuestCompletions.AsNoTracking(),
                transaction => transaction.SourceCompletionId,
                completion => completion.Id,
                (transaction, completion) => new
                {
                    transaction.Id,
                    transaction.CreatedAt,
                    transaction.XpAmount,
                    completion.QuestCategorySnapshot,
                })
            .OrderBy(row => row.CreatedAt)
            .ThenBy(row => row.Id)
            .Select(row => new AchievementLedgerRow(
                row.Id,
                row.CreatedAt,
                row.QuestCategorySnapshot,
                row.XpAmount))
            .ToListAsync(ct);

        if (stagedXp is not null)
        {
            snapshot.Add(new AchievementLedgerRow(
                stagedXp.Id,
                stagedXp.CreatedAt,
                stagedCategory!.Value,
                stagedXp.XpAmount));
            snapshot.Sort(static (left, right) =>
            {
                var byTime = left.CreatedAt.CompareTo(right.CreatedAt);
                return byTime != 0
                    ? byTime
                    : left.XpTransactionId.CompareTo(right.XpTransactionId);
            });
        }

        var awards = AchievementCatalog.EvaluateAutomaticAchievements(
            activeDefinitions,
            earned,
            snapshot);
        foreach (var award in awards)
        {
            _db.UserAchievements.Add(
                UserAchievement.CreateFromMilestone(profile.Id, award));
        }

        profile.MarkAchievementsEvaluated(
            AchievementCatalog.CurrentEvaluationVersion);
        var definitionsById = activeDefinitions.ToDictionary(
            definition => definition.Id);
        return awards
            .Select(award => definitionsById[award.AchievementId])
            .ToArray();
    }

    /// <summary>
    /// Version-indexed candidate discovery. Every stale profile is evaluated
    /// once, including profiles with no XP, so global rarity readiness has a
    /// complete and auditable boundary.
    /// </summary>
    public async Task<BackfillCandidateScan> FindBackfillCandidatesAsync(
        int batchSize,
        IReadOnlyCollection<Guid> attemptedIds,
        CancellationToken ct = default)
    {
        if (batchSize <= 0)
            throw new ArgumentOutOfRangeException(nameof(batchSize));
        ArgumentNullException.ThrowIfNull(attemptedIds);

        var candidates = await _db.UserProfiles
            .AsNoTracking()
            .Where(profile =>
                profile.AchievementEvaluationVersion <
                    AchievementCatalog.CurrentEvaluationVersion &&
                !attemptedIds.Contains(profile.Id))
            .OrderBy(profile => profile.Id)
            .Select(profile => profile.Id)
            .Take(batchSize)
            .ToListAsync(ct);

        return candidates.Count == 0
            ? new BackfillCandidateScan([], [])
            : new BackfillCandidateScan(candidates, candidates);
    }

    /// <summary>
    /// Evaluates one stale profile inside an isolated transaction:
    /// profile FOR UPDATE → post-lock snapshot → awards and version → commit.
    /// </summary>
    public async Task<int> AwardBackfillUserAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("A user is required.", nameof(userId));

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var profile = await LockUserProfileAsync(userId, ct)
                ?? throw new InvalidOperationException(
                    "An achievement backfill candidate has no profile row.");
            var staged = await StageMissingAutomaticAwardsAsync(
                profile,
                stagedXp: null,
                stagedCategory: null,
                ct);
            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return staged.Count;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    private async Task<IReadOnlyList<AchievementDefinition>>
        GetActiveAutomaticDefinitionsAsync(CancellationToken ct)
    {
        var activeRows = await _db.Achievements
            .AsNoTracking()
            .Where(achievement => achievement.IsActive)
            .Select(achievement => new { achievement.Code, achievement.Id })
            .ToListAsync(ct);
        var activeIdsByCode = activeRows.ToDictionary(
            row => row.Code,
            row => row.Id,
            StringComparer.Ordinal);

        return AchievementCatalog.Definitions
            .Where(definition =>
                definition.RuleKind !=
                    AchievementRuleKind.CommunityChallengeReward &&
                activeIdsByCode.TryGetValue(
                    definition.Code,
                    out var activeId) &&
                activeId == definition.Id)
            .ToArray();
    }

    private Task<UserProfile?> LockUserProfileAsync(
        Guid userId,
        CancellationToken ct) =>
        _db.UserProfiles
            .FromSqlInterpolated($$"""
                SELECT p.*
                FROM "UserProfiles" AS p
                WHERE p."Id" = {{userId}}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(ct);
}
