using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Services;

public enum QuestParticipationStatus
{
    None,
    Active,
    Cancelled,
}

public enum ParticipationIneligibilityReason
{
    OwnQuest,
    AlreadyParticipating,
    QuestNotPublished,
    RegistrationModeNotSupported,
    QuestEnded,
    CapacityFull,
}

public enum QuestParticipationError
{
    NotFound,
    OwnQuest,
    AlreadyParticipating,
    QuestNotPublished,
    RegistrationModeNotSupported,
    QuestEnded,
    CapacityFull,
    NoActiveParticipation,
    Concurrency,
}

public sealed class QuestParticipationException : Exception
{
    public QuestParticipationException(QuestParticipationError error, string message)
        : base(message)
    {
        Error = error;
    }

    public QuestParticipationError Error { get; }
}

public sealed record MyQuestParticipationState(
    QuestParticipationStatus Status,
    bool CanJoin,
    ParticipationIneligibilityReason? IneligibilityReason,
    bool CapacityFull);

public static class QuestParticipationEligibility
{
    public static MyQuestParticipationState Evaluate(
        Quest quest,
        Guid actorId,
        bool hasActiveParticipation,
        bool hasCancelledParticipation,
        int activeCount,
        DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(quest);
        if (actorId == Guid.Empty)
            throw new ArgumentException("Authenticated user is required.", nameof(actorId));
        if (activeCount < 0)
            throw new ArgumentOutOfRangeException(nameof(activeCount));

        var status = hasActiveParticipation
            ? QuestParticipationStatus.Active
            : hasCancelledParticipation
                ? QuestParticipationStatus.Cancelled
                : QuestParticipationStatus.None;
        var capacityFull = quest.Capacity.HasValue && activeCount >= quest.Capacity.Value;

        ParticipationIneligibilityReason? reason = quest.CreatedByUserId == actorId
            ? ParticipationIneligibilityReason.OwnQuest
            : hasActiveParticipation
                ? ParticipationIneligibilityReason.AlreadyParticipating
                : quest.Status != QuestStatus.Published
                    ? ParticipationIneligibilityReason.QuestNotPublished
                    : quest.RegistrationMode != RegistrationMode.Native
                        ? ParticipationIneligibilityReason.RegistrationModeNotSupported
                        : quest.EndAtUtc.HasValue && quest.EndAtUtc.Value < now.ToUniversalTime()
                            ? ParticipationIneligibilityReason.QuestEnded
                            : capacityFull
                                ? ParticipationIneligibilityReason.CapacityFull
                                : null;

        return new MyQuestParticipationState(
            status,
            reason is null,
            reason,
            capacityFull);
    }
}
