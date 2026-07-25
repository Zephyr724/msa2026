namespace Kiwimpact.Core.Services;

public enum ProgressionError
{
    NotFound,
    NotReady,
}

public sealed class ProgressionException : Exception
{
    public ProgressionException(ProgressionError error, string message)
        : base(message)
    {
        Error = error;
    }

    public ProgressionError Error { get; }
}

/// <summary>
/// The authenticated user's own server-authoritative progression.
/// <paramref name="RankTitle"/> is derived from the persisted Level at read
/// time and is never persisted.
/// </summary>
public sealed record MyProgressionState(
    long TotalXp,
    int Level,
    string RankTitle);

/// <summary>Outcome of one reconciliation award attempt for one completion.</summary>
public enum XpAwardOutcome
{
    Awarded,
    AlreadyAwarded,
}
