using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Api;

public sealed class AchievementMappingTests
{
    private static readonly DateTimeOffset AwardedAt =
        new(2026, 7, 26, 9, 8, 7, 654, TimeSpan.Zero);

    [Fact]
    public void CatalogItemMapsTheExactValuesAndPreservesNullIcon()
    {
        var item = new AchievementCatalogItem(
            Guid.NewGuid(),
            "verified-completions-1",
            "First Steps",
            "Complete your first verified eco quest.",
            null,
            "Milestone");

        var dto = item.ToDto();

        Assert.Equal(item.Id, dto.Id);
        Assert.Equal(item.Code, dto.Code);
        Assert.Equal(item.Name, dto.Name);
        Assert.Equal(item.Description, dto.Description);
        Assert.Null(dto.IconUrl);
        Assert.Equal(item.Category, dto.Category);
    }

    [Fact]
    public void EarnedItemMapsAwardedAtInRoundTripFormat()
    {
        var item = new EarnedAchievementItem(
            Guid.NewGuid(),
            "verified-completions-3",
            "Building Momentum",
            "Reach three verified quest completions.",
            null,
            "Milestone",
            AwardedAt);

        var dto = item.ToDto();

        Assert.Equal(item.AchievementId, dto.AchievementId);
        Assert.Equal(item.Code, dto.Code);
        Assert.Equal(item.Name, dto.Name);
        Assert.Equal(item.Description, dto.Description);
        Assert.Null(dto.IconUrl);
        Assert.Equal(item.Category, dto.Category);
        Assert.Equal(AwardedAt.ToString("O"), dto.AwardedAt);
        Assert.Equal("2026-07-26T09:08:07.6540000+00:00", dto.AwardedAt);
    }
}
