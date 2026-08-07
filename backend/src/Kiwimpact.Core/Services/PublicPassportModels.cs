using Kiwimpact.Core.Achievements;

namespace Kiwimpact.Core.Services;

public enum PublicPassportError
{
    Validation,
    NotFound,
}

public sealed class PublicPassportException : Exception
{
    public PublicPassportException(PublicPassportError error, string message)
        : base(message) => Error = error;

    public PublicPassportError Error { get; }
}

public sealed record PublicPassportSettings(
    bool IsEnabled,
    Guid? ShareId,
    IReadOnlyList<Guid> FeaturedAchievementIds);

public sealed record VerifiedStoryContext(
    Guid CompletionId,
    Guid QuestId,
    string QuestTitle);

public sealed record PublicPassportAchievement(
    Guid AchievementId,
    string Name,
    string Description,
    string? IconUrl,
    string Category,
    int NationwideEarnedCount,
    int NationwideMemberCount,
    decimal EarnedPercentage,
    AchievementRarity Rarity);

public sealed record PublicPassportTrophy(
    AchievementTrophyTier Tier,
    int NationwideEarnedCount,
    int NationwideMemberCount,
    decimal EarnedPercentage,
    AchievementRarity Rarity);

public sealed record PublicPassportStoryImage(string Url, string AltText, int SortOrder);

public sealed record PublicPassportStory(
    Guid PostId,
    string Title,
    string Content,
    IReadOnlyList<PublicPassportStoryImage> Images,
    IReadOnlyList<string> Tags,
    string QuestTitle,
    string? QuestCoverImageUrl,
    DateTimeOffset CreatedAt);

public sealed record PublicPassportView(
    string DisplayName,
    long VerifiedXp,
    int VerifiedQuestCount,
    int Level,
    string RankTitle,
    PublicPassportTrophy Trophy,
    IReadOnlyList<PublicPassportAchievement> FeaturedAchievements,
    IReadOnlyList<PublicPassportStory> VerifiedStories);
