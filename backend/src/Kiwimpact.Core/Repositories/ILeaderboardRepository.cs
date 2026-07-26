using Kiwimpact.Core.Services;

namespace Kiwimpact.Core.Repositories;

public interface ILeaderboardRepository
{
    Task<IReadOnlyList<LeaderboardRepositoryRow>> GetTopPeopleNzAllTimeAsync(
        int limit,
        CancellationToken ct = default);
}
