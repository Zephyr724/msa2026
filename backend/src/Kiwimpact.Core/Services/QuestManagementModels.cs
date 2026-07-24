using Kiwimpact.Core.Entities;

namespace Kiwimpact.Core.Services;

public sealed record QuestCoverImageCommand(
    string? ImageUrl,
    string? AltText,
    string? CreatorName,
    string? SourceUrl,
    string? LicenceNote);

public sealed record CreateQuestCommand(
    string? Title,
    string? Description,
    string? Category,
    string? RegistrationMode,
    string? Difficulty,
    int? Capacity,
    DateTimeOffset? StartAtUtc,
    DateTimeOffset? EndAtUtc,
    Guid? LocationRegionId,
    string? LocationDescription,
    string? ExternalSourceUrl,
    QuestCoverImageCommand? CoverImage);

public sealed record UpdateQuestCommand(
    string? Title,
    string? Description,
    string? Category,
    string? RegistrationMode,
    string? Difficulty,
    int? Capacity,
    DateTimeOffset? StartAtUtc,
    DateTimeOffset? EndAtUtc,
    Guid? LocationRegionId,
    string? LocationDescription,
    string? ExternalSourceUrl,
    QuestCoverImageCommand? CoverImage,
    uint Version);

public enum QuestManagementError
{
    Validation,
    NotFound,
    Forbidden,
    Conflict,
}

public sealed class QuestManagementException : Exception
{
    public QuestManagementException(QuestManagementError error, string message)
        : base(message)
    {
        Error = error;
    }

    public QuestManagementError Error { get; }
}

public sealed class QuestWriteConcurrencyException : Exception
{
    public QuestWriteConcurrencyException(Exception innerException)
        : base("Quest was changed by another request.", innerException)
    {
    }
}

public static class QuestManagementAuthorization
{
    public static bool CanManage(Quest quest, Guid actorId, bool isAdmin) =>
        isAdmin || quest.CreatedByUserId == actorId;
}
