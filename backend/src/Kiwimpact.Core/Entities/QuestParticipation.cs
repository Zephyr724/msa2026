namespace Kiwimpact.Core.Entities;

public sealed class QuestParticipation
{
    internal QuestParticipation()
    {
    }

    public Guid Id { get; internal set; }
    public Guid UserId { get; internal set; }
    public Guid QuestId { get; internal set; }
    public DateTimeOffset JoinedAt { get; internal set; }
    public DateTimeOffset? CancelledAt { get; internal set; }
    public uint Version { get; internal set; }

    public Quest? Quest { get; internal set; }

    public static QuestParticipation CreateActive(
        Guid userId,
        Guid questId,
        DateTimeOffset now)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("Authenticated user is required.", nameof(userId));
        if (questId == Guid.Empty)
            throw new ArgumentException("Quest is required.", nameof(questId));

        return new QuestParticipation
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            QuestId = questId,
            JoinedAt = now.ToUniversalTime(),
            CancelledAt = null,
        };
    }

    public void Cancel(DateTimeOffset now)
    {
        if (CancelledAt.HasValue)
            throw new InvalidOperationException("Participation is already cancelled.");

        CancelledAt = now.ToUniversalTime();
    }
}
