using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class QuestParticipationRepository : IQuestParticipationRepository
{
    private readonly KiwimpactDbContext _db;

    public QuestParticipationRepository(KiwimpactDbContext db)
    {
        _db = db;
    }

    public async Task<QuestParticipation> JoinAsync(
        Guid questId,
        Guid actorId,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        try
        {
            var quest = await _db.Quests
                .FromSqlInterpolated($$"""
                    SELECT q.*, q.xmin
                    FROM "Quests" AS q
                    WHERE q."Id" = {{questId}}
                    FOR UPDATE
                    """)
                .SingleOrDefaultAsync(ct);

            if (quest is null)
                throw Error(QuestParticipationError.NotFound, "Quest not found.");

            if (quest.CreatedByUserId == actorId)
                throw Error(
                    QuestParticipationError.OwnQuest,
                    "You cannot join a Quest you created.");

            if (quest.Status == QuestStatus.Draft)
                throw Error(QuestParticipationError.NotFound, "Quest not found.");

            if (quest.Status != QuestStatus.Published)
                throw Error(
                    QuestParticipationError.QuestNotPublished,
                    "Quest is not published.");

            if (quest.RegistrationMode != RegistrationMode.Native)
                throw Error(
                    QuestParticipationError.RegistrationModeNotSupported,
                    "This Quest does not support Native registration.");

            if (quest.EndAtUtc.HasValue && quest.EndAtUtc.Value < now.ToUniversalTime())
                throw Error(QuestParticipationError.QuestEnded, "Quest has ended.");

            var alreadyActive = await _db.QuestParticipations.AnyAsync(
                participation =>
                    participation.UserId == actorId &&
                    participation.QuestId == questId &&
                    participation.CancelledAt == null,
                ct);
            if (alreadyActive)
                throw Error(
                    QuestParticipationError.AlreadyParticipating,
                    "You are already participating in this Quest.");

            var activeCount = await _db.QuestParticipations.CountAsync(
                participation =>
                    participation.QuestId == questId &&
                    participation.CancelledAt == null,
                ct);
            if (quest.Capacity.HasValue && activeCount >= quest.Capacity.Value)
                throw Error(QuestParticipationError.CapacityFull, "Quest is at capacity.");

            var participation = QuestParticipation.CreateActive(actorId, questId, now);
            _db.QuestParticipations.Add(participation);
            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return participation;
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
            })
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestParticipationError.AlreadyParticipating,
                "You are already participating in this Quest.");
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestParticipationError.Concurrency,
                "Participation changed during this request.");
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<QuestParticipation> CancelAsync(
        Guid questId,
        Guid actorId,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        var quest = await _db.Quests
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == questId, ct);
        if (quest is null || quest.Status == QuestStatus.Draft)
            throw Error(QuestParticipationError.NotFound, "Quest not found.");

        var participation = await _db.QuestParticipations
            .SingleOrDefaultAsync(
                item =>
                    item.QuestId == questId &&
                    item.UserId == actorId &&
                    item.CancelledAt == null,
                ct);
        if (participation is null)
            throw Error(
                QuestParticipationError.NoActiveParticipation,
                "You do not have an active participation to cancel.");

        participation.Cancel(now);
        try
        {
            await _db.SaveChangesAsync(ct);
            return participation;
        }
        catch (DbUpdateConcurrencyException)
        {
            throw Error(
                QuestParticipationError.Concurrency,
                "Participation changed during this request.");
        }
    }

    public async Task<MyQuestParticipationState> GetStateAsync(
        Guid questId,
        Guid actorId,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        var quest = await _db.Quests
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == questId, ct);
        if (quest is null || quest.Status == QuestStatus.Draft)
            throw Error(QuestParticipationError.NotFound, "Quest not found.");

        var hasActiveParticipation = await _db.QuestParticipations
            .AsNoTracking()
            .AnyAsync(
                item =>
                    item.QuestId == questId &&
                    item.UserId == actorId &&
                    item.CancelledAt == null,
                ct);

        var latestCancelledParticipation = await _db.QuestParticipations
            .AsNoTracking()
            .Where(item =>
                item.QuestId == questId &&
                item.UserId == actorId &&
                item.CancelledAt != null)
            .OrderByDescending(item => item.JoinedAt)
            .ThenByDescending(item => item.Id)
            .FirstOrDefaultAsync(ct);

        var activeCount = await _db.QuestParticipations
            .AsNoTracking()
            .CountAsync(
                item => item.QuestId == questId && item.CancelledAt == null,
                ct);

        return QuestParticipationEligibility.Evaluate(
            quest,
            actorId,
            hasActiveParticipation,
            latestCancelledParticipation is not null,
            activeCount,
            now);
    }

    public async Task<IReadOnlyList<QuestParticipation>> ListMineAsync(
        Guid actorId,
        MyQuestParticipationFilter filter,
        CancellationToken ct = default)
    {
        var history = await _db.QuestParticipations
            .AsNoTracking()
            .Where(item => item.UserId == actorId)
            .Include(item => item.Quest)
                .ThenInclude(quest => quest!.Images)
            .Include(item => item.Quest)
                .ThenInclude(quest => quest!.LocationRegion)
            .OrderByDescending(item => item.JoinedAt)
            .ThenByDescending(item => item.Id)
            .ToListAsync(ct);

        var latestByQuest = history
            .GroupBy(item => item.QuestId)
            .Select(group => group
                .OrderByDescending(item => item.JoinedAt)
                .ThenByDescending(item => item.Id)
                .First())
            .Where(item => filter switch
            {
                MyQuestParticipationFilter.Active => item.CancelledAt is null,
                MyQuestParticipationFilter.Cancelled => item.CancelledAt is not null,
                _ => true,
            })
            .OrderByDescending(item => item.JoinedAt)
            .ThenByDescending(item => item.Id)
            .ToArray();

        return latestByQuest;
    }

    private static QuestParticipationException Error(
        QuestParticipationError error,
        string message) => new(error, message);
}
