using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Entities;
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
        return new QuestLocationRegionDto(
            region.Id,
            region.Name,
            region.Type.ToString());
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
            quest.StartAtUtc?.ToString("O"),
            quest.EndAtUtc?.ToString("O"),
            quest.LocationRegion is { IsActive: true }
                ? quest.LocationRegion.ToQuestLocation()
                : null,
            quest.LocationDescription,
            coverImage?.ToCoverDto());
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
            quest.StartAtUtc?.ToString("O"),
            quest.EndAtUtc?.ToString("O"),
            quest.LocationRegion is { IsActive: true }
                ? quest.LocationRegion.ToQuestLocation()
                : null,
            quest.LocationDescription,
            coverImage?.ToCoverDto(),
            quest.ExternalSourceUrl,
            quest.SourceCheckedAt?.ToString("O"));
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
            quest.Version);
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
            item.Status.ToString(),
            item.Method.ToString(),
            item.CompletedAtUtc.ToString("O"),
            item.VerifiedAtUtc?.ToString("O"),
            item.XpAmount);
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
        request.CoverImage?.ToCommand());

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
        request.Version);

    private static QuestCoverImageCommand ToCommand(this CoverImageRequest request) => new(
        request.ImageUrl,
        request.AltText,
        request.CreatorName,
        request.SourceUrl,
        request.LicenceNote);
}
