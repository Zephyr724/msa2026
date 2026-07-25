using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class QuestCompletionService : IQuestCompletionService
{
    private readonly IQuestCompletionRepository _repository;

    public QuestCompletionService(IQuestCompletionRepository repository)
    {
        _repository = repository;
    }

    public Task<GeneratedCompletionCode> GenerateOrRotateAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.GenerateOrRotateAsync(
            questId, actorId, isAdmin, DateTimeOffset.UtcNow, ct);
    }

    public Task<CompletionCodeStatus> GetCodeStatusAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.GetCodeStatusAsync(questId, actorId, isAdmin, ct);
    }

    public Task<MyQuestCompletionState> RedeemAsync(
        Guid questId,
        Guid actorId,
        string? submittedCode,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.RedeemAsync(
            questId, actorId, submittedCode, DateTimeOffset.UtcNow, ct);
    }

    public Task<MyQuestCompletionState> GetStateAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default)
    {
        EnsureRequest(questId, actorId);
        return _repository.GetStateAsync(questId, actorId, ct);
    }

    private static void EnsureRequest(Guid questId, Guid actorId)
    {
        if (questId == Guid.Empty)
            throw new QuestCompletionException(
                QuestCompletionError.NotFound,
                "Quest not found.");
        if (actorId == Guid.Empty)
            throw new QuestCompletionException(
                QuestCompletionError.Forbidden,
                "Authenticated user is required.");
    }
}
