namespace Kiwimpact.Core.Services;

public interface ILeaderboardService
{
    Task<PeopleLeaderboard> GetPeopleLeaderboardAsync(
        Guid? actorId,
        string? scope,
        string? period,
        string? page,
        string? pageSize,
        CancellationToken ct = default);

    Task<CommunitiesLeaderboard> GetCommunitiesLeaderboardAsync(
        string? scope,
        string? period,
        CancellationToken ct = default);
}
