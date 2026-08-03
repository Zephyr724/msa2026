using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Progression;

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
    public long TotalXp { get; internal set; }
    public int Level { get; internal set; } = ProgressionRules.MinLevel;
    public int AchievementEvaluationVersion { get; internal set; } =
        AchievementCatalog.CurrentEvaluationVersion;
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    public Region? HomeCommunityRegion { get; internal set; }

    public static UserProfile Create(Guid userId, string displayName, DateTimeOffset now)
    {
        var normalizedDisplayName = NormalizeDisplayName(displayName);

        return new UserProfile
        {
            Id = userId,
            DisplayName = normalizedDisplayName,
            HomeCommunityRegionId = null,
            ShowCommunityOnPassport = false,
            LastCommunityChangeAt = null,
            TotalXp = 0,
            Level = ProgressionRules.MinLevel,
            AchievementEvaluationVersion =
                AchievementCatalog.CurrentEvaluationVersion,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    public void UpdateDisplayName(string displayName, DateTimeOffset now)
    {
        DisplayName = NormalizeDisplayName(displayName);
        UpdatedAt = now.ToUniversalTime();
    }

    /// <summary>
    /// Applies one XP award inside the award transaction. The addition is
    /// checked: overflow raises <see cref="OverflowException"/> as an
    /// invariant failure instead of wrapping, and the award rolls back. The
    /// Level is always recomputed from the checked new total via
    /// <see cref="ProgressionRules.ComputeLevel"/> — never incremented and
    /// never supplied by a caller.
    /// </summary>
    public void ApplyXpAward(int xpAmount, DateTimeOffset now)
    {
        if (xpAmount <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(xpAmount),
                "XP amount must be positive.");

        var newTotal = checked(TotalXp + xpAmount);
        if (newTotal < 0)
            throw new InvalidOperationException("Total XP cannot become negative.");

        TotalXp = newTotal;
        Level = ProgressionRules.ComputeLevel(newTotal);
        UpdatedAt = now.ToUniversalTime();
    }

    public void MarkAchievementsEvaluated(int evaluationVersion)
    {
        if (evaluationVersion < AchievementEvaluationVersion ||
            evaluationVersion > AchievementCatalog.CurrentEvaluationVersion)
        {
            throw new ArgumentOutOfRangeException(
                nameof(evaluationVersion),
                "Achievement evaluation versions must advance monotonically " +
                "and cannot exceed the running catalog version.");
        }

        AchievementEvaluationVersion = evaluationVersion;
    }

    public void UpdateCommunity(
        Guid? homeCommunityRegionId,
        bool showCommunityOnPassport,
        DateTimeOffset now,
        TimeSpan changeCooldown)
    {
        var timestamp = now.ToUniversalTime();
        var selectionChanged = HomeCommunityRegionId != homeCommunityRegionId;
        if (selectionChanged &&
            HomeCommunityRegionId.HasValue &&
            LastCommunityChangeAt.HasValue &&
            timestamp < LastCommunityChangeAt.Value + changeCooldown)
        {
            throw new InvalidOperationException(
                "Home Community can be changed once every 30 days.");
        }

        if (selectionChanged)
        {
            HomeCommunityRegionId = homeCommunityRegionId;
            LastCommunityChangeAt = timestamp;
        }

        ShowCommunityOnPassport =
            homeCommunityRegionId.HasValue && showCommunityOnPassport;
        UpdatedAt = timestamp;
    }

    private static string NormalizeDisplayName(string displayName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);

        var normalizedDisplayName = displayName.Trim();
        if (normalizedDisplayName.Length > MaxDisplayNameLength)
        {
            throw new ArgumentOutOfRangeException(
                nameof(displayName),
                $"Display name must be at most {MaxDisplayNameLength} characters.");
        }

        return normalizedDisplayName;
    }
}
