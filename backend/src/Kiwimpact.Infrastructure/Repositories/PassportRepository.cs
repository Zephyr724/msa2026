using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class PassportRepository : IPassportRepository
{
    private readonly KiwimpactDbContext _db;

    public PassportRepository(KiwimpactDbContext db)
    {
        _db = db;
    }

    public Task<bool> ProfileExistsAsync(Guid userId, CancellationToken ct = default) =>
        _db.UserProfiles
            .AsNoTracking()
            .AnyAsync(profile => profile.Id == userId, ct);

    public Task<bool> HasNullTimestampVerifiedCompletionAsync(
        Guid userId,
        CancellationToken ct = default) =>
        _db.QuestCompletions
            .AsNoTracking()
            .AnyAsync(
                completion =>
                    completion.UserId == userId &&
                    completion.Status == QuestCompletionStatus.Verified &&
                    completion.VerifiedAtUtc == null,
                ct);

    public async Task<(IReadOnlyList<PassportCompletionItem> Items, int TotalCount)>
        GetCompletionPageAsync(
            Guid userId,
            int page,
            int pageSize,
            CancellationToken ct = default)
    {
        var rows = await _db.QuestCompletions
            .AsNoTracking()
            .Where(completion => completion.UserId == userId)
            .Join(
                _db.Quests,
                completion => completion.QuestId,
                quest => quest.Id,
                (completion, quest) => new { completion, quest })
            .GroupJoin(
                _db.XpTransactions,
                row => row.completion.Id,
                transaction => transaction.SourceCompletionId,
                (row, transactions) => new { row.completion, row.quest, transactions })
            .SelectMany(
                row => row.transactions.DefaultIfEmpty(),
                (row, transaction) => new { row.completion, row.quest, transaction })
            .ToListAsync(ct);

        var primary = rows
            .GroupBy(row => row.completion.QuestId)
            .Select(group => group
                .OrderBy(row => Precedence(row.completion.Status))
                .ThenByDescending(row => row.completion.CreatedAt)
                .ThenBy(row => row.completion.Id)
                .First())
            .OrderByDescending(row =>
                row.completion.VerifiedAtUtc ?? row.completion.CreatedAt)
            .ThenBy(row => row.completion.Id)
            .ToList();
        var totalCount = primary.Count;

        var items = primary
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(row => new PassportCompletionItem(
                row.completion.Id,
                row.quest.Id,
                row.quest.Title,
                row.quest.Category,
                row.quest.Status,
                row.completion.Status,
                row.completion.Method,
                row.completion.CompletedAt,
                row.completion.VerifiedAtUtc,
                row.transaction == null ? null : row.transaction.XpAmount))
            .ToList();

        return (items, totalCount);
    }

    private static int Precedence(QuestCompletionStatus status) => status switch
    {
        QuestCompletionStatus.Verified => 0,
        QuestCompletionStatus.Pending => 1,
        QuestCompletionStatus.SelfReported => 2,
        QuestCompletionStatus.Rejected => 3,
        _ => 4,
    };
}
