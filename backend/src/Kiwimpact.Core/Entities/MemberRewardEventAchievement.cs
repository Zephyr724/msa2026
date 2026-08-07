namespace Kiwimpact.Core.Entities;

public sealed class MemberRewardEventAchievement
{
    public const int MaxCodeLength = 100;
    public const int MaxNameLength = 150;

    internal MemberRewardEventAchievement()
    {
        Code = string.Empty;
        Name = string.Empty;
    }

    public Guid Id { get; internal set; }
    public Guid RewardEventId { get; internal set; }
    public Guid AchievementId { get; internal set; }
    public string Code { get; internal set; }
    public string Name { get; internal set; }
    public int SortOrder { get; internal set; }

    public MemberRewardEvent? RewardEvent { get; internal set; }
    public Achievement? Achievement { get; internal set; }

    public static MemberRewardEventAchievement Create(
        Guid rewardEventId,
        Guid achievementId,
        string code,
        string name,
        int sortOrder)
    {
        if (rewardEventId == Guid.Empty || achievementId == Guid.Empty)
            throw new ArgumentException("Reward event and achievement are required.");
        ArgumentException.ThrowIfNullOrWhiteSpace(code);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (sortOrder < 0)
            throw new ArgumentOutOfRangeException(nameof(sortOrder));
        return new MemberRewardEventAchievement
        {
            Id = Guid.NewGuid(),
            RewardEventId = rewardEventId,
            AchievementId = achievementId,
            Code = code.Trim(),
            Name = name.Trim(),
            SortOrder = sortOrder,
        };
    }
}
