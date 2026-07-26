using Kiwimpact.Core.Achievements;
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

    public async Task<bool> HasMissingEarnedMilestoneAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var activeCatalogRows = await _db.Achievements
            .AsNoTracking()
            .Where(achievement => achievement.IsActive)
            .Select(achievement => new { achievement.Id, achievement.Code })
            .ToListAsync(ct);
        if (activeCatalogRows.Count == 0)
            return false;

        var activeDefinitions = activeCatalogRows
            .Select(row => AchievementCatalog.FindByCode(row.Code))
            .Where(definition => definition is not null)
            .Select(definition => definition!)
            .Where(definition => activeCatalogRows.Any(row =>
                row.Id == definition.Id &&
                row.Code == definition.Code))
            .ToList();
        if (activeDefinitions.Count == 0)
            return false;

        var transactionCount = await _db.XpTransactions
            .AsNoTracking()
            .CountAsync(transaction => transaction.UserId == userId, ct);
        var eligibleIds = activeDefinitions
            .Where(definition => transactionCount >= definition.Threshold)
            .Select(definition => definition.Id)
            .ToList();
        if (eligibleIds.Count == 0)
            return false;

        var earnedIds = await _db.UserAchievements
            .AsNoTracking()
            .Where(award =>
                award.UserId == userId &&
                eligibleIds.Contains(award.AchievementId))
            .Select(award => award.AchievementId)
            .ToListAsync(ct);
        return eligibleIds.Except(earnedIds).Any();
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
}
