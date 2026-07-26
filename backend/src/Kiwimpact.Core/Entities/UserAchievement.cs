using Kiwimpact.Core.Achievements;

namespace Kiwimpact.Core.Entities;

/// <summary>
/// Immutable record that a user earned one achievement. Rows are insert-only
/// and are never updated or deleted by application code. For Slice 6A the
/// staged schema deliberately omits the accepted long-term
/// <c>SourceCommunityChallengeId</c> (Community Challenge is Deferred); every
/// 6A award is a milestone award whose <see cref="XpTransactionId"/> is the
/// resolved triggering ledger row.
/// </summary>
public sealed class UserAchievement
{
    internal UserAchievement()
    {
    }

    public Guid Id { get; internal set; }
    public Guid UserId { get; internal set; }
    public Guid AchievementId { get; internal set; }
    public DateTimeOffset AwardedAt { get; internal set; }
    public Guid? XpTransactionId { get; internal set; }

    /// <summary>
    /// Creates one milestone award whose trigger was resolved from the locked
    /// ledger snapshot. <see cref="AwardedAt"/> is the trigger's
    /// award-effective timestamp (<c>XpTransaction.CreatedAt</c>), never
    /// processing time, and the record is immutable once persisted.
    /// </summary>
    public static UserAchievement CreateFromMilestone(
        Guid userId,
        PendingAchievementAward award)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("An authenticated user is required.", nameof(userId));
        if (award.AchievementId == Guid.Empty)
            throw new ArgumentException("An achievement is required.", nameof(award));
        if (award.XpTransactionId == Guid.Empty)
            throw new ArgumentException(
                "The triggering XP transaction is required for a milestone award.",
                nameof(award));
        if (award.AwardedAt == default)
            throw new ArgumentException(
                "An award timestamp is required; it is never invented.",
                nameof(award));

        return new UserAchievement
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AchievementId = award.AchievementId,
            AwardedAt = award.AwardedAt.ToUniversalTime(),
            XpTransactionId = award.XpTransactionId,
        };
    }
}
