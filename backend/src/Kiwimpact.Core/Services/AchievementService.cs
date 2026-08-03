using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class AchievementService : IAchievementService
{
    private readonly IAchievementRepository _repository;

    public AchievementService(IAchievementRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<AchievementCatalogItem>> GetCatalogAsync(
        CancellationToken ct = default) =>
        _repository.GetActiveCatalogAsync(ct);

    public async Task<IReadOnlyList<EarnedAchievementItem>> GetMyEarnedAsync(
        Guid actorId,
        CancellationToken ct = default)
    {
        await EnsurePersonalStateReadyAsync(actorId, ct);

        return await _repository.GetEarnedAsync(actorId, ct);
    }

    public async Task<IReadOnlyList<AchievementNationwideStat>>
        GetNationwideStatsAsync(CancellationToken ct = default)
    {
        if (!await _repository.IsGlobalAchievementEvaluationReadyAsync(ct))
        {
            throw new AchievementReadException(
                AchievementReadError.NotReady,
                "Nationwide achievement statistics are still being calculated.");
        }

        return await _repository.GetNationwideStatsAsync(ct);
    }

    public async Task<AchievementProfile> GetMyAchievementProfileAsync(
        Guid actorId,
        CancellationToken ct = default)
    {
        await EnsurePersonalStateReadyAsync(actorId, ct);
        return await _repository.GetAchievementProfileAsync(actorId, ct)
            ?? throw new AchievementReadException(
                AchievementReadError.NotFound,
                "Profile not found.");
    }

    private async Task EnsurePersonalStateReadyAsync(
        Guid actorId,
        CancellationToken ct)
    {
        if (actorId == Guid.Empty ||
            !await _repository.ProfileExistsAsync(actorId, ct))
        {
            throw new AchievementReadException(
                AchievementReadError.NotFound,
                "Profile not found.");
        }

        if (await _repository.HasRewardPendingCompletionAsync(actorId, ct) ||
            await _repository.HasOutdatedAchievementEvaluationAsync(actorId, ct))
        {
            throw new AchievementReadException(
                AchievementReadError.NotReady,
                "Progression state is not ready yet.");
        }
    }
}
