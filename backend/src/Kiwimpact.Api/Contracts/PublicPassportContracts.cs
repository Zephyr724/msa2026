namespace Kiwimpact.Api.Contracts;

public sealed record UpdatePublicPassportRequest(
    bool IsEnabled,
    IReadOnlyList<Guid>? FeaturedAchievementIds);

public sealed record PublicPassportSettingsDto(
    bool IsEnabled,
    Guid? ShareId,
    IReadOnlyList<Guid> FeaturedAchievementIds);

public sealed record VerifiedStoryContextDto(
    Guid CompletionId,
    Guid QuestId,
    string QuestTitle);

public sealed record PublicPassportAchievementDto(
    Guid AchievementId,
    string Name,
    string Description,
    string? IconUrl,
    string Category,
    int NationwideEarnedCount,
    int NationwideMemberCount,
    decimal EarnedPercentage,
    string Rarity);

public sealed record PublicPassportTrophyDto(
    string Tier,
    int NationwideEarnedCount,
    int NationwideMemberCount,
    decimal EarnedPercentage,
    string Rarity);

public sealed record PublicPassportStoryImageDto(
    string ImageUrl,
    string ImageAltText,
    int SortOrder);

public sealed record PublicPassportStoryDto(
    Guid PostId,
    string Title,
    string Content,
    IReadOnlyList<PublicPassportStoryImageDto> Images,
    IReadOnlyList<string> Tags,
    string QuestTitle,
    string? QuestCoverImageUrl,
    string CreatedAtUtc);

public sealed record PublicPassportDto(
    string DisplayName,
    long VerifiedXp,
    int VerifiedQuestCount,
    int Level,
    string RankTitle,
    PublicPassportTrophyDto Trophy,
    IReadOnlyList<PublicPassportAchievementDto> FeaturedAchievements,
    IReadOnlyList<PublicPassportStoryDto> VerifiedStories);
