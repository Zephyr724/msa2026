namespace Kiwimpact.Core.Services;

public interface IAchievementService
{
    Task<IReadOnlyList<AchievementCatalogItem>> GetCatalogAsync(
        CancellationToken ct = default);

    Task<IReadOnlyList<EarnedAchievementItem>> GetMyEarnedAsync(
        Guid actorId,
        CancellationToken ct = default);
}
