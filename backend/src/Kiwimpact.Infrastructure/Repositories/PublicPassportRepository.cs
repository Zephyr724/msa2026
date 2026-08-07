using System.Data;
using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class PublicPassportRepository : IPublicPassportRepository
{
    private const int MaxPublicStories = 6;
    private readonly KiwimpactDbContext _db;

    public PublicPassportRepository(KiwimpactDbContext db) => _db = db;

    public async Task<PublicPassportSettings?> GetSettingsAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var profile = await _db.UserProfiles
            .AsNoTracking()
            .Where(item => item.Id == userId)
            .Select(item => new { item.IsPublicPassportEnabled, item.PublicPassportShareId })
            .SingleOrDefaultAsync(ct);
        if (profile is null)
            return null;

        var featured = await _db.FeaturedPassportAchievements
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderBy(item => item.SortOrder)
            .Select(item => item.AchievementId)
            .ToListAsync(ct);
        return new PublicPassportSettings(
            profile.IsPublicPassportEnabled,
            profile.PublicPassportShareId,
            featured);
    }

    public async Task<PublicPassportSettings?> UpdateSettingsAsync(
        Guid userId,
        bool isEnabled,
        IReadOnlyList<Guid> featuredAchievementIds,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM \"UserProfiles\" WHERE \"Id\" = {userId} FOR UPDATE",
            ct);

        var profile = await _db.UserProfiles.SingleOrDefaultAsync(item => item.Id == userId, ct);
        if (profile is null)
        {
            await transaction.RollbackAsync(ct);
            return null;
        }

        var earnedIds = await _db.UserAchievements
            .AsNoTracking()
            .Where(award =>
                award.UserId == userId &&
                featuredAchievementIds.Contains(award.AchievementId) &&
                _db.Achievements.Any(achievement =>
                    achievement.Id == award.AchievementId && achievement.IsActive))
            .Select(award => award.AchievementId)
            .Distinct()
            .ToListAsync(ct);
        if (earnedIds.Count != featuredAchievementIds.Count)
        {
            throw new PublicPassportException(
                PublicPassportError.Validation,
                "Only earned, active achievements can be featured.");
        }

        var existing = await _db.FeaturedPassportAchievements
            .Where(item => item.UserId == userId)
            .ToListAsync(ct);
        _db.FeaturedPassportAchievements.RemoveRange(existing);
        _db.FeaturedPassportAchievements.AddRange(featuredAchievementIds.Select(
            (achievementId, index) => FeaturedPassportAchievement.Create(
                userId,
                achievementId,
                index,
                now)));
        profile.UpdatePublicPassportVisibility(isEnabled, now);
        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return new PublicPassportSettings(
            profile.IsPublicPassportEnabled,
            profile.PublicPassportShareId,
            featuredAchievementIds.ToArray());
    }

    public async Task<VerifiedStoryContext?> GetVerifiedStoryContextAsync(
        Guid userId,
        Guid completionId,
        CancellationToken ct = default) =>
        await _db.QuestCompletions
            .AsNoTracking()
            .Where(completion =>
                completion.Id == completionId &&
                completion.UserId == userId &&
                completion.Status == QuestCompletionStatus.Verified)
            .Join(
                _db.Quests.AsNoTracking(),
                completion => completion.QuestId,
                quest => quest.Id,
                (completion, quest) => new VerifiedStoryContext(
                    completion.Id,
                    quest.Id,
                    quest.Title))
            .SingleOrDefaultAsync(ct);

    public async Task<PublicPassportView?> GetPublicAsync(
        Guid shareId,
        CancellationToken ct = default)
    {
        await using var snapshot = await _db.Database.BeginTransactionAsync(
            IsolationLevel.RepeatableRead,
            ct);
        var owner = await _db.UserProfiles
            .AsNoTracking()
            .Where(profile =>
                profile.IsPublicPassportEnabled &&
                profile.PublicPassportShareId == shareId)
            .Select(profile => new
            {
                profile.Id,
                profile.DisplayName,
                profile.TotalXp,
                profile.Level,
            })
            .SingleOrDefaultAsync(ct);
        if (owner is null)
        {
            await snapshot.CommitAsync(ct);
            return null;
        }

        var verifiedQuestCount = await _db.QuestCompletions
            .AsNoTracking()
            .CountAsync(completion =>
                completion.UserId == owner.Id &&
                completion.Status == QuestCompletionStatus.Verified,
                ct);
        var memberIds = NationwideMemberIds();
        var nationwideMemberCount = await memberIds.CountAsync(ct);
        var earnedDistinctCount = await _db.UserAchievements
            .AsNoTracking()
            .Where(award => award.UserId == owner.Id)
            .Select(award => award.AchievementId)
            .Distinct()
            .CountAsync(ct);
        var trophyDefinition = AchievementPresentationRules.TrophyFor(earnedDistinctCount);
        var nationwideTrophyCount = trophyDefinition.Tier == AchievementTrophyTier.Locked
            ? 0
            : await _db.UserAchievements
                .AsNoTracking()
                .Where(award => memberIds.Contains(award.UserId))
                .GroupBy(award => award.UserId)
                .Select(group => group.Select(award => award.AchievementId).Distinct().Count())
                .CountAsync(count => count >= trophyDefinition.RequiredDistinctAchievements, ct);
        var trophy = new PublicPassportTrophy(
            trophyDefinition.Tier,
            nationwideTrophyCount,
            nationwideMemberCount,
            AchievementPresentationRules.PercentageFor(
                nationwideTrophyCount,
                nationwideMemberCount),
            AchievementPresentationRules.RarityFor(
                nationwideTrophyCount,
                nationwideMemberCount));

        var featuredRows = await _db.FeaturedPassportAchievements
            .AsNoTracking()
            .Where(item => item.UserId == owner.Id)
            .Join(
                _db.Achievements.AsNoTracking().Where(achievement => achievement.IsActive),
                item => item.AchievementId,
                achievement => achievement.Id,
                (item, achievement) => new { item.SortOrder, achievement })
            .OrderBy(row => row.SortOrder)
            .Take(FeaturedPassportAchievement.MaxFeaturedAchievements)
            .ToListAsync(ct);
        var featured = new List<PublicPassportAchievement>(featuredRows.Count);
        foreach (var row in featuredRows)
        {
            var earnedCount = await _db.UserAchievements
                .AsNoTracking()
                .Where(award =>
                    award.AchievementId == row.achievement.Id &&
                    memberIds.Contains(award.UserId))
                .Select(award => award.UserId)
                .Distinct()
                .CountAsync(ct);
            featured.Add(new PublicPassportAchievement(
                row.achievement.Id,
                row.achievement.Name,
                row.achievement.Description,
                row.achievement.IconUrl,
                row.achievement.Category,
                earnedCount,
                nationwideMemberCount,
                AchievementPresentationRules.PercentageFor(earnedCount, nationwideMemberCount),
                AchievementPresentationRules.RarityFor(earnedCount, nationwideMemberCount)));
        }

        var storyRows = await _db.SocialPosts
            .AsNoTracking()
            .Where(post =>
                post.AuthorUserId == owner.Id &&
                !post.IsHidden &&
                post.SourceCompletionId.HasValue)
            .OrderByDescending(post => post.CreatedAt)
            .ThenByDescending(post => post.Id)
            .Take(MaxPublicStories)
            .Select(post => new
            {
                post.Id,
                post.Title,
                post.Content,
                post.QuestId,
                QuestTitle = _db.Quests
                    .Where(quest => quest.Id == post.QuestId)
                    .Select(quest => quest.Title)
                    .First(),
                QuestCoverImageUrl = _db.QuestImages
                    .Where(image => image.QuestId == post.QuestId && image.IsCover)
                    .OrderBy(image => image.SortOrder)
                    .ThenBy(image => image.Id)
                    .Select(image => image.ImageUrl)
                    .FirstOrDefault(),
                post.CreatedAt,
            })
            .ToListAsync(ct);
        var storyIds = storyRows.Select(row => row.Id).ToArray();
        var imageRows = await _db.SocialPostImages
            .AsNoTracking()
            .Where(image => storyIds.Contains(image.PostId))
            .OrderBy(image => image.SortOrder)
            .Select(image => new
            {
                image.PostId,
                Item = new PublicPassportStoryImage(image.Url, image.AltText, image.SortOrder),
            })
            .ToListAsync(ct);
        var imagesByPost = imageRows
            .GroupBy(row => row.PostId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<PublicPassportStoryImage>)group.Select(row => row.Item).ToArray());
        var tagRows = await _db.SocialPostTags
            .AsNoTracking()
            .Where(tag => storyIds.Contains(tag.PostId))
            .OrderBy(tag => tag.NormalizedName)
            .Select(tag => new { tag.PostId, tag.Name })
            .ToListAsync(ct);
        var tagsByPost = tagRows
            .GroupBy(row => row.PostId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<string>)group.Select(row => row.Name).ToArray());
        var stories = storyRows.Select(row => new PublicPassportStory(
            row.Id,
            row.Title,
            row.Content,
            imagesByPost.GetValueOrDefault(row.Id, []),
            tagsByPost.GetValueOrDefault(row.Id, []),
            row.QuestTitle,
            row.QuestCoverImageUrl,
            row.CreatedAt)).ToArray();

        var result = new PublicPassportView(
            owner.DisplayName,
            owner.TotalXp,
            verifiedQuestCount,
            owner.Level,
            ProgressionRules.RankTitleFor(owner.Level),
            trophy,
            featured,
            stories);
        await snapshot.CommitAsync(ct);
        return result;
    }

    private IQueryable<Guid> NationwideMemberIds()
    {
        var normalizedMemberRole = AppRoles.Member.ToUpperInvariant();
        return (
            from user in _db.Users.AsNoTracking()
            join profile in _db.UserProfiles.AsNoTracking() on user.Id equals profile.Id
            join userRole in _db.UserRoles.AsNoTracking() on user.Id equals userRole.UserId
            join role in _db.Roles.AsNoTracking() on userRole.RoleId equals role.Id
            where user.EmailConfirmed && role.NormalizedName == normalizedMemberRole
            select user.Id).Distinct();
    }
}
