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
        var baseQuery = _db.QuestCompletions
            .AsNoTracking()
            .Where(completion =>
                completion.UserId == userId &&
                completion.Status == QuestCompletionStatus.Verified &&
                completion.Method == CompletionMethod.CompletionCode);

        var totalCount = await baseQuery.CountAsync(ct);

        var rows = await baseQuery
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
            // Explicit nulls-last on the descending timestamp: PostgreSQL
            // ORDER BY ... DESC defaults to NULLS FIRST, so the leading
            // non-null marker key keeps timestamped rows first.
            .OrderByDescending(row => row.completion.VerifiedAtUtc != null)
            .ThenByDescending(row => row.completion.VerifiedAtUtc)
            .ThenBy(row => row.completion.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = rows
            .Select(row => new PassportCompletionItem(
                row.completion.Id,
                row.quest.Id,
                row.quest.Title,
                row.quest.Category,
                row.quest.Status,
                row.completion.Status,
                row.completion.Method,
                row.completion.CompletedAt,
                // Non-null by construction: the service answers the bounded
                // 503 before composing a page for any caller with a
                // null-timestamp Verified completion.
                row.completion.VerifiedAtUtc!.Value,
                row.transaction == null ? null : row.transaction.XpAmount))
            .ToList();

        return (items, totalCount);
    }
}
