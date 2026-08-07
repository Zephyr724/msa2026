using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;
using Kiwimpact.Core.Services;

namespace Kiwimpact.Api.Mapping;

internal static class DtoMapping
{
    public static RegionSummaryDto ToSummary(this Region region)
    {
        return new RegionSummaryDto(
            region.Id,
            region.Name,
            region.Type.ToString(),
            region.ParentRegionId);
    }

    public static QuestImageDto ToDto(this QuestImage image)
    {
        return new QuestImageDto(
            image.Id,
            image.ImageUrl,
            image.AltText,
            image.SortOrder,
            image.IsCover,
            image.CreatorName,
            image.SourceUrl,
            image.LicenceNote);
    }

    private static QuestLocationRegionDto ToQuestLocation(this Region region)
    {
        // The API flattens the stored region hierarchy so clients can present
        // Local Area, city, and country labels without reconstructing parents.
        var administrativeAreaName = region.Type switch
        {
            RegionType.AdministrativeArea => region.Name,
            RegionType.LocalArea => region.ParentRegion?.Name,
            _ => null,
        };
        var countryName = region.Type switch
        {
            RegionType.Country => region.Name,
            RegionType.AdministrativeArea => region.ParentRegion?.Name,
            RegionType.LocalArea => region.ParentRegion?.ParentRegion?.Name,
            _ => null,
        };

        return new QuestLocationRegionDto(
            region.Id,
            region.Name,
            region.Type.ToString(),
            administrativeAreaName,
            countryName);
    }

    private static int? AvailableSpots(this Quest quest)
    {
        if (!quest.Capacity.HasValue)
            return null;

        // Cancelled rows remain audit history but release their place.
        var activeParticipants = quest.Participations.Count(
            participation => !participation.CancelledAt.HasValue);
        return Math.Max(quest.Capacity.Value - activeParticipants, 0);
    }

    private static QuestCoverImageDto ToCoverDto(this QuestImage image)
    {
        return new QuestCoverImageDto(
            image.Id,
            image.ImageUrl,
            image.AltText);
    }

    public static QuestListItemDto ToListItem(this Quest quest)
    {
        var coverImage = quest.Images
            .FirstOrDefault(i => i.IsCover);

        return new QuestListItemDto(
            quest.Id,
            quest.Title,
            quest.Description,
            quest.Category.ToString(),
            quest.SourceType.ToString(),
            quest.RegistrationMode?.ToString(),
            quest.Difficulty.ToString(),
            ProgressionRules.XpForDifficulty(quest.Difficulty),
            quest.Capacity,
            quest.AvailableSpots(),
            quest.StartAtUtc?.ToString("O"),
            quest.EndAtUtc?.ToString("O"),
            // Inactive regions are retained internally for history but are not
            // advertised as current public discovery locations.
            quest.LocationRegion is { IsActive: true }
                ? quest.LocationRegion.ToQuestLocation()
                : null,
            quest.LocationDescription,
            coverImage?.ToCoverDto(),
            quest.Latitude,
            quest.Longitude);
    }

    public static QuestDetailDto ToDetail(this Quest quest)
    {
        var coverImage = quest.Images
            .FirstOrDefault(i => i.IsCover);

        return new QuestDetailDto(
            quest.Id,
            quest.Title,
            quest.Description,
            quest.Category.ToString(),
            quest.SourceType.ToString(),
            quest.RegistrationMode?.ToString(),
            quest.Difficulty.ToString(),
            ProgressionRules.XpForDifficulty(quest.Difficulty),
            quest.Capacity,
            quest.AvailableSpots(),
            quest.StartAtUtc?.ToString("O"),
            quest.EndAtUtc?.ToString("O"),
            quest.LocationRegion is { IsActive: true }
                ? quest.LocationRegion.ToQuestLocation()
                : null,
            quest.LocationDescription,
            coverImage?.ToCoverDto(),
            quest.ExternalSourceUrl,
            quest.SourceCheckedAt?.ToString("O"),
            quest.Latitude,
            quest.Longitude);
    }

    public static QuestManagementListItemDto ToManagementListItem(this Quest quest)
    {
        return new QuestManagementListItemDto(
            quest.Id,
            quest.Title,
            quest.Status.ToString(),
            quest.Category.ToString(),
            quest.Difficulty.ToString(),
            quest.Capacity,
            quest.StartAtUtc?.ToString("O"),
            quest.EndAtUtc?.ToString("O"),
            quest.LocationRegion?.ToQuestLocation(),
            quest.UpdatedAt.ToString("O"),
            quest.Version);
    }

    public static QuestManagementDetailDto ToManagementDetail(this Quest quest)
    {
        var cover = quest.Images
            .Where(image => image.IsCover)
            .OrderBy(image => image.SortOrder)
            .ThenBy(image => image.Id)
            .FirstOrDefault()
            ?? throw new InvalidOperationException("Managed Quest is missing its cover image.");

        return new QuestManagementDetailDto(
            quest.Id,
            quest.Title,
            quest.Description,
            quest.Category.ToString(),
            quest.Status.ToString(),
            quest.SourceType.ToString(),
            quest.RegistrationMode?.ToString(),
            quest.Difficulty.ToString(),
            ProgressionRules.XpForDifficulty(quest.Difficulty),
            quest.Capacity,
            quest.StartAtUtc?.ToString("O"),
            quest.EndAtUtc?.ToString("O"),
            quest.LocationRegion?.ToQuestLocation(),
            quest.LocationDescription,
            quest.ExternalSourceUrl,
            quest.ExternalSourceStatus?.ToString(),
            quest.SourceCheckedAt?.ToString("O"),
            quest.NextCheckDueAt?.ToString("O"),
            new QuestManagementCoverImageDto(
                cover.Id,
                cover.ImageUrl,
                cover.AltText,
                cover.CreatorName,
                cover.SourceUrl,
                cover.LicenceNote),
            quest.CreatedAt.ToString("O"),
            quest.UpdatedAt.ToString("O"),
            quest.Version,
            quest.Latitude,
            quest.Longitude);
    }

    public static QuestParticipationDto ToDto(this QuestParticipation participation)
    {
        return new QuestParticipationDto(
            participation.Id,
            participation.QuestId,
            participation.CancelledAt.HasValue ? "Cancelled" : "Active",
            participation.JoinedAt.ToString("O"),
            participation.CancelledAt?.ToString("O"));
    }

    public static MyQuestParticipationDto ToDto(this MyQuestParticipationState state)
    {
        return new MyQuestParticipationDto(
            state.Status.ToString(),
            state.CanJoin,
            state.IneligibilityReason?.ToString(),
            state.CapacityFull);
    }

    public static MyQuestParticipationListItemDto ToListDto(
        this QuestParticipation participation)
    {
        var quest = participation.Quest
            ?? throw new InvalidOperationException(
                "My Quests participation is missing its Quest.");

        return new MyQuestParticipationListItemDto(
            participation.Id,
            participation.CancelledAt.HasValue ? "Cancelled" : "Active",
            participation.JoinedAt.ToString("O"),
            participation.CancelledAt?.ToString("O"),
            quest.ToListItem());
    }

    public static GeneratedCompletionCodeDto ToDto(this GeneratedCompletionCode generated)
    {
        return new GeneratedCompletionCodeDto(
            generated.Code,
            generated.ValidFromUtc.ToString("O"),
            generated.ValidToUtc?.ToString("O"));
    }

    public static CompletionCodeStatusDto ToDto(this CompletionCodeStatus status)
    {
        return new CompletionCodeStatusDto(
            status.IsConfigured,
            status.ValidFromUtc?.ToString("O"),
            status.ValidToUtc?.ToString("O"),
            status.CreatedAtUtc?.ToString("O"));
    }

    public static MyQuestCompletionDto ToDto(this MyQuestCompletionState state)
    {
        return new MyQuestCompletionDto(
            state.Status.ToString(),
            state.Method?.ToString(),
            state.CompletedAtUtc?.ToString("O"),
            state.VerifiedAtUtc?.ToString("O"));
    }

    public static RedeemCompletionResultDto ToDto(
        this CompletionRedemptionResult result)
    {
        return new RedeemCompletionResultDto(
            result.Completion.ToDto(),
            result.Reward.ToDto());
    }

    public static CompletionRewardDto ToDto(this MemberRewardEventRecord reward) =>
        new(
            reward.RewardEventId,
            reward.QuestCompletionId,
            reward.QuestId,
            reward.QuestTitle,
            reward.CelebrationTitle,
            reward.CelebrationMessage,
            reward.VerificationMethod.ToString(),
            reward.XpAwarded,
            reward.PreviousProgression.TotalXp,
            reward.CurrentProgression.TotalXp,
            reward.PreviousProgression.Level,
            reward.CurrentProgression.Level,
            reward.PreviousProgression.RankTitle,
            reward.CurrentProgression.RankTitle,
            new CompletionRewardStreakDto(
                reward.Streak.PreviousWeeks,
                reward.Streak.PreviousHasVerifiedImpactThisWeek,
                reward.Streak.Weeks,
                reward.Streak.HasVerifiedImpactThisWeek),
            reward.CommunityChallenge is null
                ? null
                : new CompletionRewardCommunityChallengeDto(
                    reward.CommunityChallenge.ChallengeId,
                    reward.CommunityChallenge.CommunityName,
                    reward.CommunityChallenge.PreviousProgress,
                    reward.CommunityChallenge.Progress,
                    reward.CommunityChallenge.Target),
            reward.UnlockedAchievements
                .Select(achievement => new CompletionRewardAchievementDto(
                    achievement.AchievementId,
                    achievement.Code,
                    achievement.Name))
                .ToArray(),
            reward.CreatedAtUtc.ToUniversalTime().ToString("O"),
            reward.SeenAtUtc?.ToUniversalTime().ToString("O"));

    public static MyProgressionDto ToDto(this MyProgressionState state)
    {
        return new MyProgressionDto(
            state.TotalXp,
            state.Level,
            state.RankTitle);
    }

    public static PassportCompletionItemDto ToDto(this PassportCompletionItem item)
    {
        return new PassportCompletionItemDto(
            item.CompletionId,
            item.QuestId,
            item.QuestTitle,
            item.QuestCategory.ToString(),
            item.QuestStatus.ToString(),
            item.CoverImage is null
                ? null
                : new QuestCoverImageDto(
                    item.CoverImage.Id,
                    item.CoverImage.ImageUrl,
                    item.CoverImage.AltText),
            item.Status.ToString(),
            item.Method.ToString(),
            item.CompletedAtUtc.ToString("O"),
            item.VerifiedAtUtc?.ToString("O"),
            item.XpAmount,
            item.AchievementNames);
    }

    public static AchievementCatalogItemDto ToDto(this AchievementCatalogItem item)
    {
        return new AchievementCatalogItemDto(
            item.Id,
            item.Code,
            item.Name,
            item.Description,
            item.IconUrl,
            item.Category);
    }

    public static EarnedAchievementItemDto ToDto(this EarnedAchievementItem item)
    {
        return new EarnedAchievementItemDto(
            item.AchievementId,
            item.Code,
            item.Name,
            item.Description,
            item.IconUrl,
            item.Category,
            item.AwardedAt.ToString("O"));
    }

    public static AchievementNationwideStatDto ToDto(
        this AchievementNationwideStat item)
    {
        return new AchievementNationwideStatDto(
            item.AchievementId,
            item.NationwideEarnedCount,
            item.NationwideMemberCount,
            item.EarnedPercentage,
            item.Rarity.ToString(),
            item.CalculatedAtUtc.ToString("O"));
    }

    public static AchievementProfileDto ToDto(this AchievementProfile profile)
    {
        return new AchievementProfileDto(
            profile.EarnedDistinctCount,
            profile.ActiveAchievementCount,
            new AchievementTrophyProfileDto(
                profile.Trophy.Tier.ToString(),
                profile.Trophy.RequiredCount,
                profile.Trophy.NextTier?.ToString(),
                profile.Trophy.NextRequiredCount,
                profile.Trophy.NationwideEarnedCount,
                profile.Trophy.NationwideMemberCount,
                profile.Trophy.EarnedPercentage,
                profile.Trophy.Rarity.ToString(),
                profile.Trophy.CalculatedAtUtc.ToString("O")),
            new AchievementCosmeticsDto(
                profile.Cosmetics.PassportBorderStyle,
                profile.Cosmetics.AvatarFrameStyle,
                profile.Cosmetics.BadgeStampStyles));
    }

    public static CreateQuestCommand ToCommand(this CreateQuestRequest request) => new(
        request.Title,
        request.Description,
        request.Category,
        request.RegistrationMode,
        request.Difficulty,
        request.Capacity,
        request.StartAtUtc,
        request.EndAtUtc,
        request.LocationRegionId,
        request.LocationDescription,
        request.ExternalSourceUrl,
        request.CoverImage?.ToCommand(),
        request.Latitude,
        request.Longitude);

    public static UpdateQuestCommand ToCommand(this UpdateQuestRequest request) => new(
        request.Title,
        request.Description,
        request.Category,
        request.RegistrationMode,
        request.Difficulty,
        request.Capacity,
        request.StartAtUtc,
        request.EndAtUtc,
        request.LocationRegionId,
        request.LocationDescription,
        request.ExternalSourceUrl,
        request.CoverImage?.ToCommand(),
        request.Version,
        request.Latitude,
        request.Longitude);

    private static QuestCoverImageCommand ToCommand(this CoverImageRequest request) => new(
        request.ImageUrl,
        request.AltText,
        request.CreatorName,
        request.SourceUrl,
        request.LicenceNote);
}
