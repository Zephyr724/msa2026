using Kiwimpact.Core.Services;

namespace Kiwimpact.Core.Repositories;

public interface IPublicPassportRepository
{
    Task<PublicPassportSettings?> GetSettingsAsync(Guid userId, CancellationToken ct = default);
    Task<PublicPassportSettings?> UpdateSettingsAsync(
        Guid userId,
        bool isEnabled,
        IReadOnlyList<Guid> featuredAchievementIds,
        DateTimeOffset now,
        CancellationToken ct = default);
    Task<PublicPassportView?> GetPublicAsync(Guid shareId, CancellationToken ct = default);
    Task<VerifiedStoryContext?> GetVerifiedStoryContextAsync(
        Guid userId,
        Guid completionId,
        CancellationToken ct = default);
}
