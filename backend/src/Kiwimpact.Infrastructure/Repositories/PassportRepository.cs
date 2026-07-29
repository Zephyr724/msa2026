using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;
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
            .GroupJoin(
                _db.QuestImages.Where(image => image.IsCover),
                row => row.quest.Id,
                image => image.QuestId,
                (row, images) => new
                {
                    row.completion,
                    row.quest,
                    row.transaction,
                    coverImage = images
                        .OrderBy(image => image.SortOrder)
                        .ThenBy(image => image.Id)
                        .FirstOrDefault(),
                })
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

        var pageRows = primary
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
        var transactionIds = pageRows
            .Where(row => row.transaction is not null)
            .Select(row => row.transaction!.Id)
            .Distinct()
            .ToList();
        var achievementRows = await _db.UserAchievements
            .AsNoTracking()
            .Where(award =>
                award.UserId == userId
                && award.XpTransactionId != null
                && transactionIds.Contains(award.XpTransactionId.Value))
            .Join(
                _db.Achievements.AsNoTracking(),
                award => award.AchievementId,
                achievement => achievement.Id,
                (award, achievement) => new
                {
                    TransactionId = award.XpTransactionId!.Value,
                    achievement.Name,
                    award.AwardedAt,
                    award.Id,
                })
            .ToListAsync(ct);
        var achievementNamesByTransaction = achievementRows
            .GroupBy(row => row.TransactionId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<string>)group
                    .OrderBy(row => row.AwardedAt)
                    .ThenBy(row => row.Id)
                    .Select(row => row.Name)
                    .ToList());

        var items = pageRows
            .Select(row => new PassportCompletionItem(
                row.completion.Id,
                row.quest.Id,
                row.quest.Title,
                row.quest.Category,
                row.quest.Status,
                row.coverImage is null
                    ? null
                    : new PassportCoverImage(
                        row.coverImage.Id,
                        row.coverImage.ImageUrl,
                        row.coverImage.AltText),
                row.completion.Status,
                row.completion.Method,
                row.completion.CompletedAt,
                row.completion.VerifiedAtUtc,
                row.transaction == null ? null : row.transaction.XpAmount,
                row.transaction is not null
                    && achievementNamesByTransaction.TryGetValue(
                        row.transaction.Id,
                        out var achievementNames)
                    ? achievementNames
                    : []))
            .ToList();

        return (items, totalCount);
    }

    public async Task<PassportSummary?> GetSummaryAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var profile = await _db.UserProfiles
            .AsNoTracking()
            .Include(item => item.HomeCommunityRegion)
            .SingleOrDefaultAsync(item => item.Id == userId, ct);
        if (profile is null) return null;

        var completions = _db.QuestCompletions
            .AsNoTracking()
            .Where(item => item.UserId == userId);
        var verifiedCount = await completions.LongCountAsync(
            item => item.Status == QuestCompletionStatus.Verified, ct);
        var selfReportedCount = await completions.LongCountAsync(
            item => item.Status == QuestCompletionStatus.SelfReported, ct);
        var pendingCount = await completions.LongCountAsync(
            item => item.Status == QuestCompletionStatus.Pending, ct);

        var categoryRows = await _db.XpTransactions
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .Join(
                _db.Quests.AsNoTracking(),
                transaction => transaction.QuestId,
                quest => quest.Id,
                (transaction, quest) => new { transaction, quest.Category })
            .GroupBy(item => item.Category)
            .Select(group => new
            {
                Category = group.Key,
                VerifiedCompletionCount = group.LongCount(),
                VerifiedXp = group.Sum(item => (long)item.transaction.XpAmount),
            })
            .ToListAsync(ct);
        var categoryImpact = categoryRows
            .OrderBy(item => item.Category)
            .Select(item => new PassportCategoryImpact(
                item.Category,
                item.VerifiedCompletionCount,
                item.VerifiedXp))
            .ToList();

        PassportCommunityIdentity? homeCommunity = null;
        if (profile.ShowCommunityOnPassport && profile.HomeCommunityRegion is not null)
        {
            homeCommunity = new PassportCommunityIdentity(
                profile.HomeCommunityRegion.Id,
                profile.HomeCommunityRegion.Name,
                profile.HomeCommunityRegion.Type.ToString(),
                profile.HomeCommunityRegion.ParentRegionId);
        }

        return new PassportSummary(
            profile.DisplayName,
            profile.TotalXp,
            profile.Level,
            ProgressionRules.RankTitleFor(profile.Level),
            homeCommunity,
            verifiedCount,
            selfReportedCount,
            pendingCount,
            categoryImpact);
    }

    public async Task<IReadOnlyList<PassportCommunityParticipation>>
        GetCommunityParticipationAsync(
            Guid userId,
            CancellationToken ct = default)
    {
        var currentCommunityId = await _db.UserProfiles
            .AsNoTracking()
            .Where(item => item.Id == userId)
            .Select(item => item.HomeCommunityRegionId)
            .SingleAsync(ct);

        var contributions = await _db.XpTransactions
            .AsNoTracking()
            .Where(item =>
                item.UserId == userId &&
                item.CommunityRegionIdAtAward != null)
            .Select(item => new
            {
                RegionId = item.CommunityRegionIdAtAward!.Value,
                item.XpAmount,
                item.CreatedAt,
            })
            .ToListAsync(ct);
        if (contributions.Count == 0)
            return [];

        var regionIds = contributions
            .Select(item => item.RegionId)
            .Distinct()
            .ToList();
        var regions = await _db.Regions
            .AsNoTracking()
            .Where(item => regionIds.Contains(item.Id))
            .ToDictionaryAsync(item => item.Id, ct);
        var challenges = await _db.CommunityChallenges
            .AsNoTracking()
            .Where(item => regionIds.Contains(item.LocalAreaRegionId))
            .Select(item => new
            {
                item.Id,
                item.LocalAreaRegionId,
                item.PeriodStart,
                item.PeriodEnd,
            })
            .ToListAsync(ct);
        var challengeAwards = await _db.UserAchievements
            .AsNoTracking()
            .Where(item =>
                item.UserId == userId &&
                item.SourceCommunityChallengeId != null)
            .Join(
                _db.CommunityChallenges.AsNoTracking(),
                award => award.SourceCommunityChallengeId,
                challenge => challenge.Id,
                (award, challenge) => new
                {
                    award.Id,
                    challenge.LocalAreaRegionId,
                })
            .Where(item => regionIds.Contains(item.LocalAreaRegionId))
            .GroupBy(item => item.LocalAreaRegionId)
            .Select(group => new
            {
                RegionId = group.Key,
                Count = group.Count(),
            })
            .ToDictionaryAsync(item => item.RegionId, item => item.Count, ct);

        return contributions
            .GroupBy(item => item.RegionId)
            .Where(group => regions.ContainsKey(group.Key))
            .Select(group =>
            {
                var region = regions[group.Key];
                var contributedChallenges = challenges.Count(challenge =>
                    challenge.LocalAreaRegionId == group.Key &&
                    group.Any(contribution =>
                        contribution.CreatedAt >= challenge.PeriodStart &&
                        contribution.CreatedAt < challenge.PeriodEnd));
                return new PassportCommunityParticipation(
                    new PassportCommunityIdentity(
                        region.Id,
                        region.Name,
                        region.Type.ToString(),
                        region.ParentRegionId),
                    currentCommunityId == group.Key,
                    group.LongCount(),
                    group.Sum(item => (long)item.XpAmount),
                    contributedChallenges,
                    challengeAwards.GetValueOrDefault(group.Key),
                    group.Max(item => item.CreatedAt));
            })
            .OrderByDescending(item => item.IsCurrentCommunity)
            .ThenByDescending(item => item.LatestContributionAtUtc)
            .ThenBy(item => item.Community.Name)
            .ToList();
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
