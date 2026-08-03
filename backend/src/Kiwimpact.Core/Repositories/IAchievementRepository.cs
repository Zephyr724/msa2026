using Kiwimpact.Core.Services;

namespace Kiwimpact.Core.Repositories;

public interface IAchievementRepository
{
    Task<IReadOnlyList<AchievementCatalogItem>> GetActiveCatalogAsync(
        CancellationToken ct = default);

    Task<bool> ProfileExistsAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<bool> HasRewardPendingCompletionAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<bool> HasOutdatedAchievementEvaluationAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<bool> IsGlobalAchievementEvaluationReadyAsync(
        CancellationToken ct = default);

    Task<IReadOnlyList<AchievementNationwideStat>> GetNationwideStatsAsync(
        CancellationToken ct = default);

    Task<AchievementProfile?> GetAchievementProfileAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<IReadOnlyList<EarnedAchievementItem>> GetEarnedAsync(
        Guid userId,
        CancellationToken ct = default);
}
