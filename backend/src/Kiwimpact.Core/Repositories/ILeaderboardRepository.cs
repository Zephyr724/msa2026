using Kiwimpact.Core.Services;

namespace Kiwimpact.Core.Repositories;

public interface ILeaderboardRepository
{
    Task<Guid?> GetHomeCommunityIdAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<PeopleLeaderboardRepositoryResult> GetPeopleAsync(
        Guid? communityRegionId,
        bool aucklandOnly,
        DateTimeOffset? fromUtc,
        int skip,
        int take,
        CancellationToken ct = default);

    Task<IReadOnlyList<CommunityLeaderboardRepositoryRow>> GetCommunitiesAsync(
        bool aucklandOnly,
        DateTimeOffset? fromUtc,
        CancellationToken ct = default);
}
