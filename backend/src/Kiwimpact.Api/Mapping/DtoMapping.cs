using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Entities;
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
            quest.XpAward,
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
            quest.XpAward,
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
            quest.XpAward,
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
