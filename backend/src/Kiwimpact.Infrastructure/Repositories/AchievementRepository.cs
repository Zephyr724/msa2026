using System.Data;
using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class AchievementRepository : IAchievementRepository
{
    private readonly KiwimpactDbContext _db;

    public AchievementRepository(KiwimpactDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AchievementCatalogItem>> GetActiveCatalogAsync(
        CancellationToken ct = default) =>
        await _db.Achievements
            .AsNoTracking()
            .Where(achievement => achievement.IsActive)
            .OrderBy(achievement => achievement.Code)
            .Select(achievement => new AchievementCatalogItem(
                achievement.Id,
                achievement.Code,
                achievement.Name,
                achievement.Description,
                achievement.IconUrl,
                achievement.Category))
            .ToListAsync(ct);

    public Task<bool> ProfileExistsAsync(
        Guid userId,
        CancellationToken ct = default) =>
        _db.UserProfiles
            .AsNoTracking()
            .AnyAsync(profile => profile.Id == userId, ct);

    public Task<bool> HasRewardPendingCompletionAsync(
        Guid userId,
        CancellationToken ct = default) =>
        _db.QuestCompletions
            .AsNoTracking()
            .AnyAsync(
                completion =>
                    completion.UserId == userId &&
                    completion.Status == QuestCompletionStatus.Verified &&
                    !_db.XpTransactions.Any(transaction =>
                        transaction.SourceCompletionId == completion.Id),
                ct);

    public Task<bool> HasOutdatedAchievementEvaluationAsync(
        Guid userId,
        CancellationToken ct = default) =>
        _db.UserProfiles
            .AsNoTracking()
            .AnyAsync(
                profile =>
                    profile.Id == userId &&
                    profile.AchievementEvaluationVersion <
                        AchievementCatalog.CurrentEvaluationVersion,
                ct);

    public async Task<bool> IsGlobalAchievementEvaluationReadyAsync(
        CancellationToken ct = default)
    {
        var hasStaleProfiles = await _db.UserProfiles
            .AsNoTracking()
            .AnyAsync(
                profile =>
                    profile.AchievementEvaluationVersion <
                        AchievementCatalog.CurrentEvaluationVersion,
                ct);
        if (hasStaleProfiles)
            return false;

        return !await _db.QuestCompletions
            .AsNoTracking()
            .AnyAsync(
                completion =>
                    completion.Status == QuestCompletionStatus.Verified &&
                    !_db.XpTransactions.Any(transaction =>
                        transaction.SourceCompletionId == completion.Id),
                ct);
    }

    public async Task<IReadOnlyList<AchievementNationwideStat>>
        GetNationwideStatsAsync(CancellationToken ct = default)
    {
        await using var snapshot = await _db.Database.BeginTransactionAsync(
            IsolationLevel.RepeatableRead,
            ct);
        var activeAchievementIds = await _db.Achievements
            .AsNoTracking()
            .Where(achievement => achievement.IsActive)
            .OrderBy(achievement => achievement.Code)
            .Select(achievement => achievement.Id)
            .ToListAsync(ct);

        var memberIds = NationwideMemberIds();
        var nationwideMemberCount = await memberIds.CountAsync(ct);
        var counts = await _db.UserAchievements
            .AsNoTracking()
            .Where(award =>
                activeAchievementIds.Contains(award.AchievementId) &&
                memberIds.Contains(award.UserId))
            .GroupBy(award => award.AchievementId)
            .Select(group => new
            {
                AchievementId = group.Key,
                EarnedCount = group
                    .Select(award => award.UserId)
                    .Distinct()
                    .Count(),
            })
            .ToDictionaryAsync(
                row => row.AchievementId,
                row => row.EarnedCount,
                ct);

        var calculatedAt = DateTimeOffset.UtcNow;
        var result = activeAchievementIds
            .Select(achievementId =>
            {
                var earnedCount = counts.GetValueOrDefault(achievementId);
                return new AchievementNationwideStat(
                    achievementId,
                    earnedCount,
                    nationwideMemberCount,
                    AchievementPresentationRules.PercentageFor(
                        earnedCount,
                        nationwideMemberCount),
                    AchievementPresentationRules.RarityFor(
                        earnedCount,
                        nationwideMemberCount),
                    calculatedAt);
            })
            .ToArray();
        await snapshot.CommitAsync(ct);
        return result;
    }

    public async Task<AchievementProfile?> GetAchievementProfileAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        await using var snapshot = await _db.Database.BeginTransactionAsync(
            IsolationLevel.RepeatableRead,
            ct);
        if (!await _db.UserProfiles
                .AsNoTracking()
                .AnyAsync(profile => profile.Id == userId, ct))
        {
            await snapshot.CommitAsync(ct);
            return null;
        }

        var earnedAchievementIds = (await _db.UserAchievements
            .AsNoTracking()
            .Where(award => award.UserId == userId)
            .Select(award => award.AchievementId)
            .Distinct()
            .ToListAsync(ct))
            .ToHashSet();
        var activeRows = await _db.Achievements
            .AsNoTracking()
            .Where(achievement => achievement.IsActive)
            .Select(achievement => new { achievement.Id, achievement.Code })
            .ToListAsync(ct);

        var unlockedCosmetics = AchievementCatalog.Definitions
            .Where(definition =>
                earnedAchievementIds.Contains(definition.Id) &&
                definition.CosmeticUnlock is not null)
            .Select(definition => definition.CosmeticUnlock!)
            .ToArray();
        var passportBorder = HighestPriorityStyle(
            unlockedCosmetics,
            AchievementCosmeticKind.PassportBorder);
        var avatarFrame = HighestPriorityStyle(
            unlockedCosmetics,
            AchievementCosmeticKind.AvatarFrame);
        var badgeStamps = unlockedCosmetics
            .Where(unlock =>
                unlock.Kind == AchievementCosmeticKind.BadgeStamp)
            .OrderByDescending(unlock => unlock.Priority)
            .ThenBy(unlock => unlock.StyleCode, StringComparer.Ordinal)
            .Select(unlock => unlock.StyleCode)
            .Take(3)
            .ToArray();

        var earnedDistinctCount = earnedAchievementIds.Count;
        var trophy = AchievementPresentationRules.TrophyFor(
            earnedDistinctCount);
        var nextTrophy = AchievementPresentationRules.NextTrophyFor(
            earnedDistinctCount);
        var memberIds = NationwideMemberIds();
        var nationwideMemberCount = await memberIds.CountAsync(ct);
        var nationwideReachedCount = 0;
        if (trophy.Tier != AchievementTrophyTier.Locked)
        {
            nationwideReachedCount = await _db.UserAchievements
                .AsNoTracking()
                .Where(award => memberIds.Contains(award.UserId))
                .GroupBy(award => award.UserId)
                .Select(group => new
                {
                    DistinctCount = group
                        .Select(award => award.AchievementId)
                        .Distinct()
                        .Count(),
                })
                .CountAsync(
                    row =>
                        row.DistinctCount >=
                            trophy.RequiredDistinctAchievements,
                    ct);
        }

        var result = new AchievementProfile(
            earnedDistinctCount,
            activeRows.Count,
            new AchievementTrophyProfile(
                trophy.Tier,
                trophy.RequiredDistinctAchievements,
                nextTrophy?.Tier,
                nextTrophy?.RequiredDistinctAchievements,
                nationwideReachedCount,
                nationwideMemberCount,
                AchievementPresentationRules.PercentageFor(
                    nationwideReachedCount,
                    nationwideMemberCount),
                AchievementPresentationRules.RarityFor(
                    nationwideReachedCount,
                    nationwideMemberCount),
                DateTimeOffset.UtcNow),
            new AchievementCosmetics(
                passportBorder,
                avatarFrame,
                badgeStamps));
        await snapshot.CommitAsync(ct);
        return result;
    }

    public async Task<IReadOnlyList<EarnedAchievementItem>> GetEarnedAsync(
        Guid userId,
        CancellationToken ct = default) =>
        await _db.UserAchievements
            .AsNoTracking()
            .Where(award => award.UserId == userId)
            .Join(
                _db.Achievements.Where(achievement => achievement.IsActive),
                award => award.AchievementId,
                achievement => achievement.Id,
                (award, achievement) => new { award, achievement })
            .OrderBy(row => row.award.AwardedAt)
            .ThenBy(row => row.achievement.Code)
            .Select(row => new EarnedAchievementItem(
                row.achievement.Id,
                row.achievement.Code,
                row.achievement.Name,
                row.achievement.Description,
                row.achievement.IconUrl,
                row.achievement.Category,
                row.award.AwardedAt))
            .ToListAsync(ct);

    private IQueryable<Guid> NationwideMemberIds()
    {
        var normalizedMemberRole = AppRoles.Member.ToUpperInvariant();
        return (
            from user in _db.Users.AsNoTracking()
            join profile in _db.UserProfiles.AsNoTracking()
                on user.Id equals profile.Id
            join userRole in _db.UserRoles.AsNoTracking()
                on user.Id equals userRole.UserId
            join role in _db.Roles.AsNoTracking()
                on userRole.RoleId equals role.Id
            where user.EmailConfirmed &&
                  role.NormalizedName == normalizedMemberRole
            select user.Id)
            .Distinct();
    }

    private static string? HighestPriorityStyle(
        IEnumerable<AchievementCosmeticUnlock> unlocks,
        AchievementCosmeticKind kind) =>
        unlocks
            .Where(unlock => unlock.Kind == kind)
            .OrderByDescending(unlock => unlock.Priority)
            .ThenBy(unlock => unlock.StyleCode, StringComparer.Ordinal)
            .Select(unlock => unlock.StyleCode)
            .FirstOrDefault();
}
