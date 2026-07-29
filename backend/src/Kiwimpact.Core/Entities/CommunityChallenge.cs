using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Entities;

public sealed class CommunityChallenge
{
    public const string VerifiedCompletionCountTarget = "VerifiedCompletionCount";

    internal CommunityChallenge()
    {
        TargetType = VerifiedCompletionCountTarget;
    }

    public Guid Id { get; internal set; }
    public Guid LocalAreaRegionId { get; internal set; }
    public DateTimeOffset PeriodStart { get; internal set; }
    public DateTimeOffset PeriodEnd { get; internal set; }
    public string TargetType { get; internal set; }
    public int TargetValue { get; internal set; }
    public Guid? RewardAchievementId { get; internal set; }
    public ChallengeStatus Status { get; internal set; }
    public uint Version { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    public Region? LocalAreaRegion { get; internal set; }
    public Achievement? RewardAchievement { get; internal set; }

    public static CommunityChallenge Create(
        Guid localAreaRegionId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        int targetValue,
        Guid? rewardAchievementId,
        DateTimeOffset now)
    {
        Validate(localAreaRegionId, periodStart, periodEnd, targetValue);
        var timestamp = now.ToUniversalTime();
        return new CommunityChallenge
        {
            Id = Guid.NewGuid(),
            LocalAreaRegionId = localAreaRegionId,
            PeriodStart = periodStart.ToUniversalTime(),
            PeriodEnd = periodEnd.ToUniversalTime(),
            TargetValue = targetValue,
            RewardAchievementId = rewardAchievementId,
            Status = ChallengeStatus.Active,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        };
    }

    public void UpdateCompetitiveFields(
        Guid localAreaRegionId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        int targetValue,
        Guid? rewardAchievementId,
        long currentProgress,
        DateTimeOffset now)
    {
        var timestamp = now.ToUniversalTime();
        if (Status != ChallengeStatus.Active)
            throw new InvalidOperationException("Only an Active challenge can be edited.");
        if (timestamp >= PeriodStart || currentProgress > 0)
            // Freezing competitive terms after launch keeps existing
            // contributions measured against the rules members first saw.
            throw new InvalidOperationException(
                "A started or contributed challenge can only be cancelled.");
        if (targetValue < currentProgress)
            throw new InvalidOperationException(
                "Target value cannot be lower than current progress.");
        Validate(localAreaRegionId, periodStart, periodEnd, targetValue);
        LocalAreaRegionId = localAreaRegionId;
        PeriodStart = periodStart.ToUniversalTime();
        PeriodEnd = periodEnd.ToUniversalTime();
        TargetValue = targetValue;
        RewardAchievementId = rewardAchievementId;
        UpdatedAt = timestamp;
    }

    public void Cancel(DateTimeOffset now)
    {
        if (Status != ChallengeStatus.Active)
            throw new InvalidOperationException("Only an Active challenge can be cancelled.");
        Status = ChallengeStatus.Cancelled;
        UpdatedAt = now.ToUniversalTime();
    }

    public void Finalize(long currentProgress, DateTimeOffset now)
    {
        var timestamp = now.ToUniversalTime();
        if (Status != ChallengeStatus.Active || timestamp < PeriodEnd)
            throw new InvalidOperationException("Challenge is not ready to finalize.");
        Status = currentProgress >= TargetValue
            ? ChallengeStatus.Completed
            : ChallengeStatus.Failed;
        UpdatedAt = timestamp;
    }

    private static void Validate(
        Guid localAreaRegionId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        int targetValue)
    {
        if (localAreaRegionId == Guid.Empty)
            throw new ArgumentException("A Local Area is required.");
        if (periodEnd <= periodStart)
            throw new ArgumentException("Challenge end must be later than its start.");
        if (targetValue <= 0)
            throw new ArgumentException("Target value must be positive.");
    }
}
