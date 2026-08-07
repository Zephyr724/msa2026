namespace Kiwimpact.Core.Services;

public enum LeaderboardError
{
    InvalidParameters,
    Unauthorized,
    NotReady,
}

public sealed class LeaderboardException : Exception
{
    public LeaderboardException(LeaderboardError error, string message)
        : base(message)
    {
        Error = error;
    }

    public LeaderboardError Error { get; }
}

public sealed record LeaderboardRepositoryRow(
    Guid UserId,
    string DisplayName,
    long TotalXp,
    long VerifiedCompletionCount);

public sealed record PeopleLeaderboardRepositoryResult(
    IReadOnlyList<LeaderboardRepositoryRow> Rows,
    int ParticipantCount,
    long TotalXp,
    long VerifiedCompletionCount,
    LeaderboardRepositoryCurrentUser? CurrentUser);

public sealed record LeaderboardRepositoryCurrentUser(
    int Rank,
    LeaderboardRepositoryRow Row);

public sealed record RankedLeaderboardRow(
    int Rank,
    string DisplayName,
    long TotalXp,
    long VerifiedCompletionCount,
    bool IsCurrentUser);

public sealed record CollectiveProgress(
    long TotalXp,
    long VerifiedCompletionCount);

public sealed record CurrentUserLeaderboardPosition(
    int Rank,
    int ActiveMemberCount,
    long TotalXp,
    long VerifiedCompletionCount,
    int SurpassedMemberCount,
    decimal Percentile,
    bool HasReachedScopeUpgradeThreshold);

public sealed record PeopleLeaderboard(
    string Scope,
    string Period,
    int Page,
    int PageSize,
    int TotalCount,
    bool IsPrivacyProtected,
    CollectiveProgress? CollectiveProgress,
    CurrentUserLeaderboardPosition? CurrentUser,
    IReadOnlyList<RankedLeaderboardRow> Rows);

public sealed record CommunityLeaderboardRepositoryRow(
    Guid RegionId,
    string RegionName,
    long VerifiedCompletionCount,
    int ActiveContributors);

public sealed record RankedCommunityLeaderboardRow(
    int Rank,
    Guid RegionId,
    string RegionName,
    long VerifiedCompletionCount,
    int? ActiveContributors,
    decimal? CompletionsPerContributor,
    bool IsPrivacyProtected);

public sealed record CommunitiesLeaderboard(
    string Scope,
    string Period,
    IReadOnlyList<RankedCommunityLeaderboardRow> Rows);
