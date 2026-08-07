namespace Kiwimpact.Core.Entities;

public sealed class FeaturedPassportAchievement
{
    public const int MaxFeaturedAchievements = 5;

    internal FeaturedPassportAchievement()
    {
    }

    public Guid UserId { get; internal set; }
    public Guid AchievementId { get; internal set; }
    public int SortOrder { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }

    public static FeaturedPassportAchievement Create(
        Guid userId,
        Guid achievementId,
        int sortOrder,
        DateTimeOffset now)
    {
        if (userId == Guid.Empty || achievementId == Guid.Empty)
            throw new ArgumentException("User and achievement are required.");
        if (sortOrder < 0 || sortOrder >= MaxFeaturedAchievements)
            throw new ArgumentOutOfRangeException(nameof(sortOrder));

        return new FeaturedPassportAchievement
        {
            UserId = userId,
            AchievementId = achievementId,
            SortOrder = sortOrder,
            CreatedAt = now.ToUniversalTime(),
        };
    }
}
