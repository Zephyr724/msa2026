using Kiwimpact.Core.Entities;

namespace Kiwimpact.Core.Services;

public interface IQuestParticipationService
{
    Task<QuestParticipation> JoinAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default);

    Task<QuestParticipation> CancelAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default);

    Task<MyQuestParticipationState> GetStateAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default);
}
