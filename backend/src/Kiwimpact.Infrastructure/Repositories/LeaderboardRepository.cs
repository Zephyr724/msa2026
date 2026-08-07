using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class LeaderboardRepository : ILeaderboardRepository
{
    private readonly KiwimpactDbContext _db;

    public LeaderboardRepository(KiwimpactDbContext db)
    {
        _db = db;
    }

    public Task<Guid?> GetHomeCommunityIdAsync(
        Guid userId,
        CancellationToken ct = default) =>
        _db.UserProfiles
            .AsNoTracking()
            .Where(profile => profile.Id == userId)
            .Select(profile => profile.HomeCommunityRegionId)
            .SingleOrDefaultAsync(ct);

    public async Task<PeopleLeaderboardRepositoryResult> GetPeopleAsync(
        Guid? communityRegionId,
        bool aucklandOnly,
        DateTimeOffset? fromUtc,
        int skip,
        int take,
        Guid? actorId,
        CancellationToken ct = default)
    {
        var transactions = _db.XpTransactions.AsNoTracking();
        if (fromUtc.HasValue)
            transactions = transactions.Where(item => item.CreatedAt >= fromUtc.Value);
        if (communityRegionId.HasValue)
        {
            // Community identity is captured when XP is awarded so later
            // profile changes do not rewrite historical leaderboard credit.
            transactions = transactions.Where(
                item => item.CommunityRegionIdAtAward == communityRegionId.Value);
        }
        else if (aucklandOnly)
        {
            transactions = transactions.Where(item =>
                item.CommunityRegionIdAtAward.HasValue &&
                _db.Regions.Any(region =>
                    region.Id == item.CommunityRegionIdAtAward.Value &&
                    region.ParentRegionId == RegionSeed.AucklandId));
        }

        var aggregates = transactions
            .GroupBy(item => item.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                TotalXp = group.Sum(item => (long)item.XpAmount),
                CompletionCount = group.LongCount(),
            });
        var rankedProjection = aggregates
            .Join(
                _db.UserProfiles.AsNoTracking(),
                aggregate => aggregate.UserId,
                profile => profile.Id,
                (aggregate, profile) => new
                {
                    aggregate.UserId,
                    profile.DisplayName,
                    aggregate.TotalXp,
                    aggregate.CompletionCount,
                });
        var ordered = rankedProjection
            .OrderByDescending(row => row.TotalXp)
            .ThenByDescending(row => row.CompletionCount)
            // Stable tie-breakers keep pagination deterministic across reads.
            .ThenBy(row => row.DisplayName.ToLower())
            .ThenBy(row => row.UserId);
        var participantCount = await rankedProjection.CountAsync(ct);
        var totalXp = await rankedProjection.SumAsync(
            item => (long?)item.TotalXp, ct) ?? 0;
        var completionCount = await rankedProjection.SumAsync(
            item => (long?)item.CompletionCount, ct) ?? 0;
        var rows = await ordered
            .Skip(skip)
            .Take(take)
            .Select(row => new LeaderboardRepositoryRow(
                row.UserId,
                row.DisplayName,
                row.TotalXp,
                row.CompletionCount))
            .ToListAsync(ct);
        LeaderboardRepositoryCurrentUser? currentUser = null;
        if (actorId.HasValue)
        {
            // This ID-only projection deliberately reuses the visible-row
            // ordering. The member's rank therefore remains authoritative
            // outside the requested page and at every deterministic tie.
            var orderedIds = await ordered
                .Select(row => row.UserId)
                .ToListAsync(ct);
            var actorIndex = orderedIds.IndexOf(actorId.Value);
            if (actorIndex >= 0)
            {
                var actorRow = await rankedProjection
                    .Where(row => row.UserId == actorId.Value)
                    .Select(row => new LeaderboardRepositoryRow(
                        row.UserId,
                        row.DisplayName,
                        row.TotalXp,
                        row.CompletionCount))
                    .SingleAsync(ct);
                currentUser = new LeaderboardRepositoryCurrentUser(
                    actorIndex + 1,
                    actorRow);
            }
        }
        return new PeopleLeaderboardRepositoryResult(
            rows,
            participantCount,
            totalXp,
            completionCount,
            currentUser);
    }

    public async Task<IReadOnlyList<CommunityLeaderboardRepositoryRow>>
        GetCommunitiesAsync(
            bool aucklandOnly,
            DateTimeOffset? fromUtc,
            CancellationToken ct = default)
    {
        var transactions = _db.XpTransactions
            .AsNoTracking()
            .Where(item => item.CommunityRegionIdAtAward.HasValue);
        if (fromUtc.HasValue)
            transactions = transactions.Where(item => item.CreatedAt >= fromUtc.Value);

        var localAreas = _db.Regions
            .AsNoTracking()
            .Where(region => region.IsActive && region.Type == RegionType.LocalArea);
        if (aucklandOnly)
        {
            // The Auckland view ranks Local Areas directly.
            localAreas = localAreas.Where(
                region => region.ParentRegionId == RegionSeed.AucklandId);

            return await transactions
                .Join(
                    localAreas,
                    transaction => transaction.CommunityRegionIdAtAward,
                    region => region.Id,
                    (transaction, region) => new { transaction, region })
                .GroupBy(item => new { item.region.Id, item.region.Name })
                .Select(group => new CommunityLeaderboardRepositoryRow(
                    group.Key.Id,
                    group.Key.Name,
                    group.LongCount(),
                    group.Select(item => item.transaction.UserId).Distinct().Count()))
                .ToListAsync(ct);
        }

        var cities = _db.Regions
            .AsNoTracking()
            .Where(region =>
                region.IsActive &&
                region.Type == RegionType.AdministrativeArea &&
                region.ParentRegionId == RegionSeed.NewZealandId);

        // The nationwide view rolls Local Area contributions up to their
        // parent administrative area before ranking communities.
        return await transactions
            .Join(
                localAreas,
                transaction => transaction.CommunityRegionIdAtAward,
                localArea => localArea.Id,
                (transaction, localArea) => new { transaction, localArea })
            .Join(
                cities,
                item => item.localArea.ParentRegionId,
                city => city.Id,
                (item, city) => new { item.transaction, city })
            .GroupBy(item => new { item.city.Id, item.city.Name })
            .Select(group => new CommunityLeaderboardRepositoryRow(
                group.Key.Id,
                group.Key.Name,
                group.LongCount(),
                group.Select(item => item.transaction.UserId).Distinct().Count()))
            .ToListAsync(ct);
    }
}
