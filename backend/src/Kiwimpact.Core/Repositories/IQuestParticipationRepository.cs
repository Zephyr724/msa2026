using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Services;

namespace Kiwimpact.Core.Repositories;

public interface IQuestParticipationRepository
{
    Task<QuestParticipation> JoinAsync(
        Guid questId,
        Guid actorId,
        DateTimeOffset now,
        CancellationToken ct = default);

    Task<QuestParticipation> CancelAsync(
        Guid questId,
        Guid actorId,
        DateTimeOffset now,
        CancellationToken ct = default);

    Task<MyQuestParticipationState> GetStateAsync(
        Guid questId,
        Guid actorId,
        DateTimeOffset now,
        CancellationToken ct = default);
}
