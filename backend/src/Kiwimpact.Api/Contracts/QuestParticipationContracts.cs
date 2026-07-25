namespace Kiwimpact.Api.Contracts;

public sealed record QuestParticipationDto(
    Guid ParticipationId,
    Guid QuestId,
    string Status,
    string JoinedAtUtc,
    string? CancelledAtUtc);

public sealed record MyQuestParticipationDto(
    string Status,
    bool CanJoin,
    string? IneligibilityReason,
    bool CapacityFull);
