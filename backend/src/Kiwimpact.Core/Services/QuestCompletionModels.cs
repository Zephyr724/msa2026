using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Services;

public enum QuestCompletionError
{
    NotFound,
    Forbidden,
    OwnQuest,
    CancelledOrArchived,
    QuestNotPublished,
    UnsupportedQuest,
    NoActiveParticipation,
    AlreadyCompleted,
    InvalidCompletionCode,
    PendingClaimExists,
    SelfReportExists,
    ClaimAlreadyReviewed,
    InvalidEvidence,
    EmptyValidityWindow,
    Concurrency,
}

public sealed class QuestCompletionException : Exception
{
    public QuestCompletionException(QuestCompletionError error, string message)
        : base(message)
    {
        Error = error;
    }

    public QuestCompletionError Error { get; }
}

public sealed record GeneratedCompletionCode(
    string Code,
    DateTimeOffset ValidFromUtc,
    DateTimeOffset? ValidToUtc);

public sealed record CompletionCodeStatus(
    bool IsConfigured,
    DateTimeOffset? ValidFromUtc,
    DateTimeOffset? ValidToUtc,
    DateTimeOffset? CreatedAtUtc);

public enum MyQuestCompletionStatus
{
    None,
    Pending,
    Verified,
    Rejected,
    SelfReported,
}

public sealed record MyQuestCompletionState(
    MyQuestCompletionStatus Status,
    CompletionMethod? Method,
    DateTimeOffset? CompletedAtUtc,
    DateTimeOffset? VerifiedAtUtc)
{
    public static MyQuestCompletionState None { get; } =
        new(MyQuestCompletionStatus.None, null, null, null);

    public static MyQuestCompletionState FromCompletion(QuestCompletion completion)
    {
        ArgumentNullException.ThrowIfNull(completion);
        var status = completion.Status switch
        {
            QuestCompletionStatus.Pending => MyQuestCompletionStatus.Pending,
            QuestCompletionStatus.Verified => MyQuestCompletionStatus.Verified,
            QuestCompletionStatus.Rejected => MyQuestCompletionStatus.Rejected,
            QuestCompletionStatus.SelfReported => MyQuestCompletionStatus.SelfReported,
            _ => throw new ArgumentOutOfRangeException(nameof(completion)),
        };
        return new MyQuestCompletionState(
            status,
            completion.Method,
            completion.CompletedAt,
            completion.VerifiedAtUtc);
    }
}

public sealed record EvidenceClaimInput(
    string? Description,
    string? EvidenceUrl,
    bool UserDeclaration,
    DateTimeOffset CompletedAtUtc);

public sealed record EvidenceClaimRecord(
    Guid ClaimId,
    Guid UserId,
    Guid QuestId,
    string QuestTitle,
    QuestCompletionStatus Status,
    DateTimeOffset CompletedAtUtc,
    DateTimeOffset CreatedAtUtc,
    string? Description,
    string? EvidenceUrl,
    bool UserDeclaration,
    string? ReviewNote,
    Guid? ReviewedByUserId,
    DateTimeOffset? ReviewedAtUtc,
    DateTimeOffset? EvidencePurgedAtUtc);

public sealed record EvidenceClaimSummary(
    Guid ClaimId,
    Guid UserId,
    Guid QuestId,
    string QuestTitle,
    QuestCompletionStatus Status,
    DateTimeOffset CompletedAtUtc,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ReviewedAtUtc);

public sealed record CompletionCodeValidity(
    DateTimeOffset ValidFromUtc,
    DateTimeOffset? ValidToUtc)
{
    public static CompletionCodeValidity Derive(
        DateTimeOffset? questStartAtUtc,
        DateTimeOffset? questEndAtUtc,
        DateTimeOffset generatedAtUtc)
    {
        var generated = generatedAtUtc.ToUniversalTime();
        var start = questStartAtUtc?.ToUniversalTime();
        // A code generated before the Quest starts remains dormant until the
        // activity window opens; rotating later makes it valid immediately.
        var validFrom = start.HasValue && start.Value > generated ? start.Value : generated;
        // The seven-day grace period lets organizers verify attendees shortly
        // after an activity ends without leaving codes permanently valid.
        var validTo = questEndAtUtc?.ToUniversalTime().AddDays(7);
        if (validTo.HasValue && validFrom >= validTo.Value)
            throw new QuestCompletionException(
                QuestCompletionError.EmptyValidityWindow,
                "The Completion Code validity window is empty.");
        return new CompletionCodeValidity(validFrom, validTo);
    }
}

public static class QuestCompletionEligibility
{
    public static void EnsureRedemptionQuest(Quest quest, Guid actorId)
    {
        ArgumentNullException.ThrowIfNull(quest);
        if (quest.CreatedByUserId == actorId)
            throw Error(QuestCompletionError.OwnQuest, "You cannot complete a Quest you created.");
        if (quest.Status == QuestStatus.Draft)
            // Conceal unpublished Quest existence from non-management flows.
            throw Error(QuestCompletionError.NotFound, "Quest not found.");
        if (quest.Status is QuestStatus.Cancelled or QuestStatus.Archived)
            throw Error(
                QuestCompletionError.CancelledOrArchived,
                "Cancelled or archived Quests cannot be completed.");
        if (quest.Status != QuestStatus.Published ||
            quest.SourceType != QuestSourceType.OrganizerOwned ||
            quest.RegistrationMode != RegistrationMode.Native)
        {
            throw Error(
                QuestCompletionError.UnsupportedQuest,
                "This Quest does not support Completion Code redemption.");
        }
    }

    public static void EnsureCodeManagementQuest(Quest quest)
    {
        ArgumentNullException.ThrowIfNull(quest);
        if (quest.Status is QuestStatus.Cancelled or QuestStatus.Archived)
            throw Error(
                QuestCompletionError.CancelledOrArchived,
                "Cancelled or archived Quests cannot have Completion Codes.");
        if (quest.Status != QuestStatus.Published)
            throw Error(
                QuestCompletionError.QuestNotPublished,
                "Quest must be published before generating a Completion Code.");
        if (quest.SourceType != QuestSourceType.OrganizerOwned ||
            quest.RegistrationMode != RegistrationMode.Native)
        {
            throw Error(
                QuestCompletionError.UnsupportedQuest,
                "This Quest does not support Completion Codes.");
        }
    }

    private static QuestCompletionException Error(
        QuestCompletionError error,
        string message) => new(error, message);
}
