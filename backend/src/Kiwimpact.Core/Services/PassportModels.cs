using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Services;

public enum PassportError
{
    NotFound,
    NotReady,
}

public sealed class PassportException : Exception
{
    public PassportException(PassportError error, string message)
        : base(message)
    {
        Error = error;
    }

    public PassportError Error { get; }
}

/// <summary>
/// One row of the authenticated user's own Verified completion history.
/// Quest title/category/status are the Quest's current mutable values, not
/// completion-time snapshots. <paramref name="XpAmount"/> is null while the
/// completion's XP transaction has not been written yet.
/// </summary>
public sealed record PassportCompletionItem(
    Guid CompletionId,
    Guid QuestId,
    string QuestTitle,
    QuestCategory QuestCategory,
    QuestStatus QuestStatus,
    QuestCompletionStatus Status,
    CompletionMethod Method,
    DateTimeOffset CompletedAtUtc,
    DateTimeOffset VerifiedAtUtc,
    int? XpAmount);
