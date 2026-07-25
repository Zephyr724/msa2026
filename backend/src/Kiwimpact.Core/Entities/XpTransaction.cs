using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;

namespace Kiwimpact.Core.Entities;

/// <summary>
/// Immutable server-owned XP ledger row. Exactly one row per Verified
/// completion; amounts and attribution come only from the completion's
/// immutable snapshots. Rows are never updated or deleted by application code.
/// </summary>
public sealed class XpTransaction
{
    internal XpTransaction()
    {
    }

    public Guid Id { get; internal set; }
    public Guid UserId { get; internal set; }
    public Guid QuestId { get; internal set; }
    public Guid SourceCompletionId { get; internal set; }
    public int XpAmount { get; internal set; }
    public Guid? CommunityRegionIdAtAward { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }

    public static XpTransaction CreateFromVerifiedCompletion(QuestCompletion completion)
    {
        ArgumentNullException.ThrowIfNull(completion);
        if (completion.Status != QuestCompletionStatus.Verified)
            throw new ArgumentException(
                "Only a Verified completion can produce an XP transaction.",
                nameof(completion));
        if (!completion.VerifiedAtUtc.HasValue)
            throw new ArgumentException(
                "A Verified completion must carry its verification timestamp; " +
                "an award timestamp is never invented.",
                nameof(completion));
        if (completion.Id == Guid.Empty ||
            completion.UserId == Guid.Empty ||
            completion.QuestId == Guid.Empty)
        {
            throw new ArgumentException(
                "Completion, user, and Quest identifiers are required.",
                nameof(completion));
        }

        var amount = ProgressionRules.XpForDifficulty(completion.RewardDifficultySnapshot);
        return new XpTransaction
        {
            Id = Guid.NewGuid(),
            UserId = completion.UserId,
            QuestId = completion.QuestId,
            SourceCompletionId = completion.Id,
            XpAmount = amount,
            CommunityRegionIdAtAward = completion.CommunityRegionIdAtCompletion,
            CreatedAt = completion.VerifiedAtUtc.Value,
        };
    }
}
