namespace Kiwimpact.Core.Services;

public interface ILeaderboardService
{
    Task<PeopleLeaderboard> GetPeopleLeaderboardAsync(
        string? scope,
        string? period,
        string? page,
        string? pageSize,
        CancellationToken ct = default);
}
