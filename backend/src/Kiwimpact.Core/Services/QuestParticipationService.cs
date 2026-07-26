using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class QuestParticipationService : IQuestParticipationService
{
    private readonly IQuestParticipationRepository _repository;

    public QuestParticipationService(IQuestParticipationRepository repository)
    {
        _repository = repository;
    }

    public Task<QuestParticipation> JoinAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.JoinAsync(questId, actorId, DateTimeOffset.UtcNow, ct);
    }

    public Task<QuestParticipation> CancelAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.CancelAsync(questId, actorId, DateTimeOffset.UtcNow, ct);
    }

    public Task<MyQuestParticipationState> GetStateAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.GetStateAsync(questId, actorId, DateTimeOffset.UtcNow, ct);
    }

    public Task<IReadOnlyList<QuestParticipation>> ListMineAsync(
        Guid actorId,
        MyQuestParticipationFilter filter,
        CancellationToken ct = default)
    {
        if (actorId == Guid.Empty)
            throw new QuestParticipationException(
                QuestParticipationError.NotFound,
                "Authenticated user not found.");
        if (!Enum.IsDefined(filter))
            throw new ArgumentOutOfRangeException(nameof(filter));

        return _repository.ListMineAsync(actorId, filter, ct);
    }

    private static void EnsureRequest(Guid questId, Guid actorId)
    {
        if (questId == Guid.Empty)
            throw new QuestParticipationException(
                QuestParticipationError.NotFound,
                "Quest not found.");
        if (actorId == Guid.Empty)
            throw new QuestParticipationException(
                QuestParticipationError.NotFound,
                "Authenticated user not found.");
    }
}
