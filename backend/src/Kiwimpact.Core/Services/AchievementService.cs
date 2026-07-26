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
        if (actorId == Guid.Empty ||
            !await _repository.ProfileExistsAsync(actorId, ct))
        {
            throw new AchievementReadException(
                AchievementReadError.NotFound,
                "Profile not found.");
        }

        if (await _repository.HasRewardPendingCompletionAsync(actorId, ct) ||
            await _repository.HasMissingEarnedMilestoneAsync(actorId, ct))
        {
            throw new AchievementReadException(
                AchievementReadError.NotReady,
                "Progression state is not ready yet.");
        }

        return await _repository.GetEarnedAsync(actorId, ct);
    }
}
