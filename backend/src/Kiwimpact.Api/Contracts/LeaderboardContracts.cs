using Kiwimpact.Core.Services;

namespace Kiwimpact.Api.Contracts
{
    public sealed record LeaderboardRowDto(
        int Rank,
        string DisplayName,
        long TotalXp,
        long VerifiedCompletionCount);

    public sealed record PeopleLeaderboardDto(
        string Scope,
        string Period,
        IReadOnlyList<LeaderboardRowDto> Rows);
}

namespace Kiwimpact.Api.Mapping
{
    using Kiwimpact.Api.Contracts;

    internal static class LeaderboardContractMappingExtensions
    {
        public static PeopleLeaderboardDto ToDto(this PeopleLeaderboard leaderboard)
        {
            return new PeopleLeaderboardDto(
                leaderboard.Scope,
                leaderboard.Period,
                leaderboard.Rows
                    .Select(row => new LeaderboardRowDto(
                        row.Rank,
                        row.DisplayName,
                        row.TotalXp,
                        row.VerifiedCompletionCount))
                    .ToList());
        }
    }
}
