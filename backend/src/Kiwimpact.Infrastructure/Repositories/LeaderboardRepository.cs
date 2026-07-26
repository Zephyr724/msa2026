using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class LeaderboardRepository : ILeaderboardRepository
{
    private readonly KiwimpactDbContext _db;

    public LeaderboardRepository(KiwimpactDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LeaderboardRepositoryRow>>
        GetTopPeopleNzAllTimeAsync(
            int limit,
            CancellationToken ct = default)
    {
        if (limit <= 0)
            throw new ArgumentOutOfRangeException(nameof(limit));

        var aggregates = _db.XpTransactions
            .AsNoTracking()
            .GroupBy(transaction => transaction.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                TotalXp = group.Sum(transaction => (long)transaction.XpAmount),
                VerifiedCompletionCount = group.LongCount(),
            });

        return await aggregates
            .Join(
                _db.UserProfiles.AsNoTracking(),
                aggregate => aggregate.UserId,
                profile => profile.Id,
                (aggregate, profile) => new
                {
                    aggregate.UserId,
                    profile.DisplayName,
                    aggregate.TotalXp,
                    aggregate.VerifiedCompletionCount,
                })
            .OrderByDescending(row => row.TotalXp)
            .ThenByDescending(row => row.VerifiedCompletionCount)
            .ThenBy(row => row.DisplayName.ToLower())
            .ThenBy(row => row.UserId)
            .Take(limit)
            .Select(row => new LeaderboardRepositoryRow(
                row.UserId,
                row.DisplayName,
                row.TotalXp,
                row.VerifiedCompletionCount))
            .ToListAsync(ct);
    }
}
