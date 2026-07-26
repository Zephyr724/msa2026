namespace Kiwimpact.Core.Services;

public enum AchievementReadError
{
    NotFound,
    NotReady,
}

public sealed class AchievementReadException : Exception
{
    public AchievementReadException(AchievementReadError error, string message)
        : base(message)
    {
        Error = error;
    }

    public AchievementReadError Error { get; }
}

public sealed record AchievementCatalogItem(
    Guid Id,
    string Code,
    string Name,
    string Description,
    string? IconUrl,
    string Category);

public sealed record EarnedAchievementItem(
    Guid AchievementId,
    string Code,
    string Name,
    string Description,
    string? IconUrl,
    string Category,
    DateTimeOffset AwardedAt);
