namespace Kiwimpact.Core.Entities;

public sealed class UserProfile
{
    public const int MaxDisplayNameLength = 100;

    internal UserProfile()
    {
        DisplayName = string.Empty;
    }

    public Guid Id { get; internal set; }
    public string DisplayName { get; internal set; }
    public Guid? HomeCommunityRegionId { get; internal set; }
    public bool ShowCommunityOnPassport { get; internal set; }
    public DateTimeOffset? LastCommunityChangeAt { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    public Region? HomeCommunityRegion { get; internal set; }

    public static UserProfile Create(Guid userId, string displayName, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);

        var normalizedDisplayName = displayName.Trim();
        if (normalizedDisplayName.Length > MaxDisplayNameLength)
        {
            throw new ArgumentOutOfRangeException(
                nameof(displayName),
                $"Display name must be at most {MaxDisplayNameLength} characters.");
        }

        return new UserProfile
        {
            Id = userId,
            DisplayName = normalizedDisplayName,
            HomeCommunityRegionId = null,
            ShowCommunityOnPassport = false,
            LastCommunityChangeAt = null,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }
}
