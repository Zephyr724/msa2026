using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Achievements;
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

    [Fact]
    public void NationwideStatMapsCountsRarityPercentageAndRoundTripTime()
    {
        var item = new AchievementNationwideStat(
            Guid.NewGuid(),
            7,
            2_000,
            0.35m,
            AchievementRarity.UltraRare,
            AwardedAt);

        var dto = item.ToDto();

        Assert.Equal(item.AchievementId, dto.AchievementId);
        Assert.Equal(7, dto.NationwideEarnedCount);
        Assert.Equal(2_000, dto.NationwideMemberCount);
        Assert.Equal(0.35m, dto.EarnedPercentage);
        Assert.Equal("UltraRare", dto.Rarity);
        Assert.Equal(AwardedAt.ToString("O"), dto.CalculatedAtUtc);
    }

    [Fact]
    public void ProfileMapsNullableNextTierAndCosmeticsExactly()
    {
        var profile = new AchievementProfile(
            45,
            45,
            new AchievementTrophyProfile(
                AchievementTrophyTier.Diamond,
                40,
                null,
                null,
                3,
                2_000,
                0.15m,
                AchievementRarity.UltraRare,
                AwardedAt),
            new AchievementCosmetics(
                "aurora",
                "guardian",
                ["legend", "community", "explorer"]));

        var dto = profile.ToDto();

        Assert.Equal(45, dto.EarnedDistinctCount);
        Assert.Equal(45, dto.ActiveAchievementCount);
        Assert.Equal("Diamond", dto.Trophy.Tier);
        Assert.Equal(40, dto.Trophy.RequiredCount);
        Assert.Null(dto.Trophy.NextTier);
        Assert.Null(dto.Trophy.NextRequiredCount);
        Assert.Equal(3, dto.Trophy.NationwideEarnedCount);
        Assert.Equal(2_000, dto.Trophy.NationwideMemberCount);
        Assert.Equal(0.15m, dto.Trophy.EarnedPercentage);
        Assert.Equal("UltraRare", dto.Trophy.Rarity);
        Assert.Equal(AwardedAt.ToString("O"), dto.Trophy.CalculatedAtUtc);
        Assert.Equal("aurora", dto.Cosmetics.PassportBorderStyle);
        Assert.Equal("guardian", dto.Cosmetics.AvatarFrameStyle);
        Assert.Equal(
            ["legend", "community", "explorer"],
            dto.Cosmetics.BadgeStampStyles);
    }
}
