namespace Kiwimpact.Core.Services;

public interface IPublicPassportService
{
    Task<PublicPassportSettings> GetSettingsAsync(Guid userId, CancellationToken ct = default);
    Task<PublicPassportSettings> UpdateSettingsAsync(
        Guid userId,
        bool isEnabled,
        IReadOnlyList<Guid> featuredAchievementIds,
        CancellationToken ct = default);
    Task<PublicPassportView> GetPublicAsync(Guid shareId, CancellationToken ct = default);
    Task<VerifiedStoryContext> GetVerifiedStoryContextAsync(
        Guid userId,
        Guid completionId,
        CancellationToken ct = default);
}
