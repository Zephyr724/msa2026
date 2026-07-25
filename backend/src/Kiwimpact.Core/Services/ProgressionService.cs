using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class ProgressionService : IProgressionService
{
    private readonly IXpLedgerRepository _repository;

    public ProgressionService(IXpLedgerRepository repository)
    {
        _repository = repository;
    }

    public async Task<MyProgressionState> GetMyProgressionAsync(
        Guid actorId,
        CancellationToken ct = default)
    {
        if (actorId == Guid.Empty)
            throw new ProgressionException(
                ProgressionError.NotFound,
                "Profile not found.");

        // Readiness gate (application-enforced, evaluated live on every
        // request): while any Verified completion still lacks its XP row —
        // including an unprocessable one — progression state is not yet
        // authoritative and must not be presented as complete.
        if (await _repository.HasRewardPendingCompletionsAsync(ct))
            throw new ProgressionException(
                ProgressionError.NotReady,
                "Progression state is not ready yet.");

        var state = await _repository.FindProgressionAsync(actorId, ct);
        return state ?? throw new ProgressionException(
            ProgressionError.NotFound,
            "Profile not found.");
    }
}
