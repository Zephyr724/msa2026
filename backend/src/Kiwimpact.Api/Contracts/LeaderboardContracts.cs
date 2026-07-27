using Kiwimpact.Core.Services;

namespace Kiwimpact.Api.Contracts
{
    public sealed record LeaderboardRowDto(
        int Rank,
        string DisplayName,
        long TotalXp,
        long VerifiedCompletionCount,
        bool IsCurrentUser);

    public sealed record CollectiveProgressDto(
        long TotalXp,
        long VerifiedCompletionCount);

    public sealed record PeopleLeaderboardDto(
        string Scope,
        string Period,
        int Page,
        int PageSize,
        int TotalCount,
        bool IsPrivacyProtected,
        CollectiveProgressDto? CollectiveProgress,
        IReadOnlyList<LeaderboardRowDto> Rows);

    public sealed record CommunityLeaderboardRowDto(
        int Rank,
        Guid RegionId,
        string RegionName,
        long VerifiedCompletionCount,
        int? ActiveContributors,
        decimal? CompletionsPerContributor,
        bool IsPrivacyProtected);

    public sealed record CommunitiesLeaderboardDto(
        string Scope,
        string Period,
        IReadOnlyList<CommunityLeaderboardRowDto> Rows);
}

namespace Kiwimpact.Api.Mapping
{
    using Kiwimpact.Api.Contracts;

    internal static class LeaderboardContractMappingExtensions
    {
        public static PeopleLeaderboardDto ToDto(this PeopleLeaderboard leaderboard) =>
            new(
                leaderboard.Scope,
                leaderboard.Period,
                leaderboard.Page,
                leaderboard.PageSize,
                leaderboard.TotalCount,
                leaderboard.IsPrivacyProtected,
                leaderboard.CollectiveProgress is null
                    ? null
                    : new CollectiveProgressDto(
                        leaderboard.CollectiveProgress.TotalXp,
                        leaderboard.CollectiveProgress.VerifiedCompletionCount),
                leaderboard.Rows.Select(row => new LeaderboardRowDto(
                    row.Rank,
                    row.DisplayName,
                    row.TotalXp,
                    row.VerifiedCompletionCount,
                    row.IsCurrentUser)).ToList());

        public static CommunitiesLeaderboardDto ToDto(
            this CommunitiesLeaderboard leaderboard) =>
            new(
                leaderboard.Scope,
                leaderboard.Period,
                leaderboard.Rows.Select(row => new CommunityLeaderboardRowDto(
                    row.Rank,
                    row.RegionId,
                    row.RegionName,
                    row.VerifiedCompletionCount,
                    row.ActiveContributors,
                    row.CompletionsPerContributor,
                    row.IsPrivacyProtected)).ToList());
    }
}
