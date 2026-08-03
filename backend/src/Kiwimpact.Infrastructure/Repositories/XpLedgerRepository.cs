using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class XpLedgerRepository : IXpLedgerRepository
{
    public const string SourceCompletionConstraint =
        "UX_XpTransactions_SourceCompletionId";

    private readonly KiwimpactDbContext _db;
    private readonly AchievementAwardService _achievementAwards;

    public XpLedgerRepository(
        KiwimpactDbContext db,
        AchievementAwardService achievementAwards)
    {
        _db = db;
        _achievementAwards = achievementAwards;
    }

    public Task<bool> HasRewardPendingCompletionsAsync(CancellationToken ct = default) =>
        _db.QuestCompletions
            .AsNoTracking()
            .AnyAsync(
                completion =>
                    completion.Status == QuestCompletionStatus.Verified &&
                    !_db.XpTransactions.Any(
                        transaction => transaction.SourceCompletionId == completion.Id),
                ct);

    public Task<int> CountUnprocessableRewardPendingAsync(CancellationToken ct = default) =>
        _db.QuestCompletions
            .AsNoTracking()
            .CountAsync(
                completion =>
                    completion.Status == QuestCompletionStatus.Verified &&
                    completion.VerifiedAtUtc == null &&
                    !_db.XpTransactions.Any(
                        transaction => transaction.SourceCompletionId == completion.Id),
                ct);

    public async Task<IReadOnlyList<QuestCompletion>> GetAwardEligibleBatchAsync(
        int batchSize,
        IReadOnlyCollection<Guid> attemptedIds,
        CancellationToken ct = default) =>
        await _db.QuestCompletions
            .AsNoTracking()
            .Where(completion =>
                completion.Status == QuestCompletionStatus.Verified &&
                completion.VerifiedAtUtc != null &&
                !attemptedIds.Contains(completion.Id) &&
                !_db.XpTransactions.Any(
                    transaction => transaction.SourceCompletionId == completion.Id))
            .OrderBy(completion => completion.VerifiedAtUtc)
            .ThenBy(completion => completion.Id)
            .Take(batchSize)
            .ToListAsync(ct);

    public async Task<XpAwardOutcome> AwardVerifiedCompletionAsync(
        QuestCompletion completion,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        try
        {
            var xp = XpTransaction.CreateFromVerifiedCompletion(completion);
            _db.XpTransactions.Add(xp);

            // Flush #1: the XP insert (and its FK KEY SHARE acquisitions on the
            // completion's parent rows) always precedes the profile lock.
            await _db.SaveChangesAsync(ct);

            var profile = await LockUserProfileAsync(xp.UserId, ct)
                ?? throw new InvalidOperationException(
                    "A Verified completion has no user profile row.");
            profile.ApplyXpAward(xp.XpAmount, now);
            await _achievementAwards.StageMissingAutomaticAwardsAsync(
                profile,
                stagedXp: null,
                stagedCategory: null,
                ct);

            // Flush #2: the progression projection and the achievement
            // inserts. One commit covers all writes — the XP row, the
            // profile update, and the awards commit or none do.
            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return XpAwardOutcome.Awarded;
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: SourceCompletionConstraint,
            })
        {
            await transaction.RollbackAsync(ct);
            return XpAwardOutcome.AlreadyAwarded;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<MyProgressionState?> FindProgressionAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var row = await _db.UserProfiles
            .AsNoTracking()
            .Where(profile => profile.Id == userId)
            .Select(profile => new { profile.TotalXp, profile.Level })
            .SingleOrDefaultAsync(ct);
        return row is null
            ? null
            : new MyProgressionState(
                row.TotalXp,
                row.Level,
                ProgressionRules.RankTitleFor(row.Level));
    }

    private Task<UserProfile?> LockUserProfileAsync(Guid userId, CancellationToken ct) =>
        _db.UserProfiles
            .FromSqlInterpolated($$"""
                SELECT p.*
                FROM "UserProfiles" AS p
                WHERE p."Id" = {{userId}}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(ct);
}
