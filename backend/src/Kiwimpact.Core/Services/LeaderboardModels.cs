namespace Kiwimpact.Core.Services;

public enum LeaderboardError
{
    InvalidParameters,
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

public sealed record RankedLeaderboardRow(
    int Rank,
    string DisplayName,
    long TotalXp,
    long VerifiedCompletionCount);

public sealed record PeopleLeaderboard(
    string Scope,
    string Period,
    IReadOnlyList<RankedLeaderboardRow> Rows);
