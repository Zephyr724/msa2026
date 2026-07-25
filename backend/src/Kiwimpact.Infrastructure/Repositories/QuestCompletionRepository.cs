using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Security;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class QuestCompletionRepository : IQuestCompletionRepository
{
    public const string VerifiedCompletionConstraint =
        "UX_QuestCompletions_UserId_QuestId_Verified";
    public const string ActiveCodeConstraint = "UX_CompletionCodes_QuestId_Active";

    private readonly KiwimpactDbContext _db;
    private readonly CompletionCodeProtector _protector;

    public QuestCompletionRepository(
        KiwimpactDbContext db,
        CompletionCodeProtector protector)
    {
        _db = db;
        _protector = protector;
    }

    public async Task<GeneratedCompletionCode> GenerateOrRotateAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        try
        {
            var quest = await LockQuestAsync(questId, ct)
                ?? throw Error(QuestCompletionError.NotFound, "Quest not found.");
            EnsureManagementAccess(quest, actorId, isAdmin);
            QuestCompletionEligibility.EnsureCodeManagementQuest(quest);

            var validity = CompletionCodeValidity.Derive(
                quest.StartAtUtc,
                quest.EndAtUtc,
                now);
            var normalizedCode = _protector.GenerateNormalizedCode();
            var codeHash = _protector.ComputeHash(questId, normalizedCode);

            var activeCode = await _db.CompletionCodes.SingleOrDefaultAsync(
                code =>
                    code.QuestId == questId &&
                    code.IsActive &&
                    !code.IsRevoked,
                ct);
            activeCode?.Revoke();

            var replacement = CompletionCode.Create(
                questId,
                codeHash,
                validity.ValidFromUtc,
                validity.ValidToUtc,
                actorId,
                now);
            _db.CompletionCodes.Add(replacement);

            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return new GeneratedCompletionCode(
                CompletionCodeProtector.FormatForDisplay(normalizedCode),
                replacement.ValidFrom,
                replacement.ValidTo);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: ActiveCodeConstraint,
            })
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestCompletionError.Concurrency,
                "Completion Code configuration changed during this request.");
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestCompletionError.Concurrency,
                "Completion Code configuration changed during this request.");
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<CompletionCodeStatus> GetCodeStatusAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var quest = await _db.Quests
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == questId, ct)
            ?? throw Error(QuestCompletionError.NotFound, "Quest not found.");
        EnsureManagementAccess(quest, actorId, isAdmin);

        var active = await _db.CompletionCodes
            .AsNoTracking()
            .Where(code =>
                code.QuestId == questId &&
                code.IsActive &&
                !code.IsRevoked)
            .OrderByDescending(code => code.CreatedAt)
            .ThenByDescending(code => code.Id)
            .SingleOrDefaultAsync(ct);

        return active is null
            ? new CompletionCodeStatus(false, null, null, null)
            : new CompletionCodeStatus(
                true,
                active.ValidFrom,
                active.ValidTo,
                active.CreatedAt);
    }

    public async Task<MyQuestCompletionState> RedeemAsync(
        Guid questId,
        Guid actorId,
        string? submittedCode,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        try
        {
            var quest = await LockQuestAsync(questId, ct)
                ?? throw Error(QuestCompletionError.NotFound, "Quest not found.");
            QuestCompletionEligibility.EnsureRedemptionQuest(quest, actorId);

            var participation = await _db.QuestParticipations.SingleOrDefaultAsync(
                item =>
                    item.UserId == actorId &&
                    item.QuestId == questId &&
                    item.CancelledAt == null,
                ct);
            if (participation is null)
                throw Error(
                    QuestCompletionError.NoActiveParticipation,
                    "An active Quest participation is required.");

            var existing = await _db.QuestCompletions
                .AsNoTracking()
                .AnyAsync(
                    item =>
                        item.UserId == actorId &&
                        item.QuestId == questId &&
                        item.Status == QuestCompletionStatus.Verified,
                    ct);
            if (existing)
                throw Error(
                    QuestCompletionError.AlreadyCompleted,
                    "You have already completed this Quest.");

            var timestamp = now.ToUniversalTime();
            var activeCode = await _db.CompletionCodes
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    code =>
                        code.QuestId == questId &&
                        code.IsActive &&
                        !code.IsRevoked &&
                        code.ValidFrom <= timestamp &&
                        (!code.ValidTo.HasValue || code.ValidTo.Value > timestamp),
                    ct);

            var verified = _protector.Verify(
                questId,
                submittedCode,
                activeCode?.CodeHash);
            if (activeCode is null || !verified)
                throw Error(
                    QuestCompletionError.InvalidCompletionCode,
                    "The completion code is invalid.");

            var profile = await LockUserProfileAsync(actorId, ct)
                ?? throw new InvalidOperationException(
                    "The authenticated user has no profile row.");
            var completion = QuestCompletion.CreateVerifiedWithCode(
                actorId,
                quest,
                participation,
                profile.HomeCommunityRegionId,
                timestamp);
            var xp = XpTransaction.CreateFromVerifiedCompletion(completion);
            profile.ApplyXpAward(xp.XpAmount, timestamp);
            _db.QuestCompletions.Add(completion);
            _db.XpTransactions.Add(xp);

            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return MyQuestCompletionState.FromCompletion(completion);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: VerifiedCompletionConstraint,
            })
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestCompletionError.AlreadyCompleted,
                "You have already completed this Quest.");
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestCompletionError.Concurrency,
                "Completion state changed during this request.");
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<MyQuestCompletionState> GetStateAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default)
    {
        var questExists = await _db.Quests
            .AsNoTracking()
            .AnyAsync(
                quest => quest.Id == questId && quest.Status != QuestStatus.Draft,
                ct);
        if (!questExists)
            throw Error(QuestCompletionError.NotFound, "Quest not found.");

        var completion = await _db.QuestCompletions
            .AsNoTracking()
            .Where(item =>
                item.UserId == actorId &&
                item.QuestId == questId &&
                item.Status == QuestCompletionStatus.Verified)
            .SingleOrDefaultAsync(ct);
        return completion is null
            ? MyQuestCompletionState.None
            : MyQuestCompletionState.FromCompletion(completion);
    }

    private Task<Quest?> LockQuestAsync(Guid questId, CancellationToken ct) =>
        _db.Quests
            .FromSqlInterpolated($$"""
                SELECT q.*, q.xmin
                FROM "Quests" AS q
                WHERE q."Id" = {{questId}}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(ct);

    private Task<UserProfile?> LockUserProfileAsync(Guid userId, CancellationToken ct) =>
        _db.UserProfiles
            .FromSqlInterpolated($$"""
                SELECT p.*
                FROM "UserProfiles" AS p
                WHERE p."Id" = {{userId}}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(ct);

    private static void EnsureManagementAccess(Quest quest, Guid actorId, bool isAdmin)
    {
        if (quest.Status == QuestStatus.Draft && quest.CreatedByUserId != actorId && !isAdmin)
            throw Error(QuestCompletionError.NotFound, "Quest not found.");
        if (!isAdmin && quest.CreatedByUserId != actorId)
            throw Error(QuestCompletionError.Forbidden, "You do not own this Quest.");
    }

    private static QuestCompletionException Error(
        QuestCompletionError error,
        string message) => new(error, message);
}
