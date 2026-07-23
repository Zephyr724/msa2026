using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Entities;

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
}
