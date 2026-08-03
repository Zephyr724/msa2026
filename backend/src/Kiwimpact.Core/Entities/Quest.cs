using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Entities;

public sealed class Quest
{
    public const int MaxTitleLength = 200;
    public const int MaxDescriptionLength = 2000;
    public const int MaxLocationDescriptionLength = 500;
    public const int MaxExternalSourceUrlLength = 2000;

    internal Quest()
    {
        Title = string.Empty;
        Description = string.Empty;
    }

    public Guid Id { get; internal set; }
    public string Title { get; internal set; }
    public string Description { get; internal set; }
    public QuestCategory Category { get; internal set; }
    public QuestStatus Status { get; internal set; }
    public QuestSourceType SourceType { get; internal set; }
    public RegistrationMode? RegistrationMode { get; internal set; }
    public QuestDifficulty Difficulty { get; internal set; }
    public int XpAward { get; internal set; }
    public int? Capacity { get; internal set; }
    public DateTimeOffset? StartAtUtc { get; internal set; }
    public DateTimeOffset? EndAtUtc { get; internal set; }
    public Guid? LocationRegionId { get; internal set; }
    public string? LocationDescription { get; internal set; }
    public decimal? Latitude { get; internal set; }
    public decimal? Longitude { get; internal set; }
    public string? ExternalSourceUrl { get; internal set; }
    public ExternalSourceStatus? ExternalSourceStatus { get; internal set; }
    public DateTimeOffset? SourceCheckedAt { get; internal set; }
    public DateTimeOffset? NextCheckDueAt { get; internal set; }
    public Guid CreatedByUserId { get; internal set; }
    public uint Version { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    // Navigation properties
    public Region? LocationRegion { get; internal set; }
    public ICollection<QuestImage> Images { get; internal set; } = new List<QuestImage>();
    public ICollection<QuestParticipation> Participations { get; internal set; } =
        new List<QuestParticipation>();

    public static Quest CreateOrganizerOwned(
        Guid createdByUserId,
        QuestDetails details,
        QuestCoverImageDetails coverImage,
        DateTimeOffset now)
    {
        if (createdByUserId == Guid.Empty)
            throw new ArgumentException("Authenticated owner is required.", nameof(createdByUserId));

        var normalized = ValidateAndNormalize(details);
        var questId = Guid.NewGuid();
        var timestamp = now.ToUniversalTime();
        var quest = new Quest
        {
            Id = questId,
            Title = normalized.Title,
            Description = normalized.Description,
            Category = normalized.Category,
            Status = QuestStatus.Draft,
            SourceType = QuestSourceType.OrganizerOwned,
            RegistrationMode = normalized.RegistrationMode,
            Difficulty = normalized.Difficulty,
            XpAward = 0,
            Capacity = normalized.Capacity,
            StartAtUtc = normalized.StartAtUtc,
            EndAtUtc = normalized.EndAtUtc,
            LocationRegionId = normalized.LocationRegionId,
            LocationDescription = normalized.LocationDescription,
            Latitude = normalized.Latitude,
            Longitude = normalized.Longitude,
            ExternalSourceUrl = normalized.ExternalSourceUrl,
            CreatedByUserId = createdByUserId,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        };

        // The aggregate is never valid without exactly one initial cover;
        // create both objects before the repository begins tracking it.
        var cover = QuestImage.CreateCover(questId, coverImage);
        cover.Quest = quest;
        quest.Images.Add(cover);
        return quest;
    }

    public void UpdateDetails(
        QuestDetails details,
        QuestCoverImageDetails? coverImage,
        DateTimeOffset now)
    {
        var normalized = ValidateAndNormalize(details);
        Title = normalized.Title;
        Description = normalized.Description;
        Category = normalized.Category;
        RegistrationMode = normalized.RegistrationMode;
        Difficulty = normalized.Difficulty;
        Capacity = normalized.Capacity;
        StartAtUtc = normalized.StartAtUtc;
        EndAtUtc = normalized.EndAtUtc;
        LocationRegionId = normalized.LocationRegionId;
        LocationDescription = normalized.LocationDescription;
        Latitude = normalized.Latitude;
        Longitude = normalized.Longitude;
        ExternalSourceUrl = normalized.ExternalSourceUrl;

        if (coverImage is not null)
        {
            // Deterministic ordering makes legacy data with multiple flagged
            // covers behave consistently while preserving the aggregate.
            var cover = Images
                .Where(image => image.IsCover)
                .OrderBy(image => image.SortOrder)
                .ThenBy(image => image.Id)
                .FirstOrDefault()
                ?? throw new InvalidOperationException("Quest must retain a cover image.");
            cover.UpdateCover(coverImage);
        }

        EnsureServerInvariants();
        UpdatedAt = now.ToUniversalTime();
    }

    public void Publish(DateTimeOffset now)
    {
        if (Status != QuestStatus.Draft)
            throw new InvalidOperationException("Only a Draft Quest can be published.");
        if (!Images.Any(image => image.IsCover))
            throw new InvalidOperationException("Quest requires a cover image before publishing.");

        Status = QuestStatus.Published;
        UpdatedAt = now.ToUniversalTime();
    }

    public void Cancel(DateTimeOffset now)
    {
        if (Status != QuestStatus.Published)
            throw new InvalidOperationException("Only a Published Quest can be cancelled.");

        Status = QuestStatus.Cancelled;
        UpdatedAt = now.ToUniversalTime();
    }

    public void Archive(DateTimeOffset now)
    {
        var timestamp = now.ToUniversalTime();
        // Published Quests remain discoverable through their scheduled end;
        // cancellation is the explicit early path to archival.
        var canArchive = Status == QuestStatus.Cancelled ||
            (Status == QuestStatus.Published && EndAtUtc.HasValue && EndAtUtc.Value < timestamp);
        if (!canArchive)
            throw new InvalidOperationException(
                "Only a Cancelled or ended Published Quest can be archived.");

        Status = QuestStatus.Archived;
        UpdatedAt = timestamp;
    }

    public void EnsureCanDelete()
    {
        if (Status != QuestStatus.Draft)
            throw new InvalidOperationException("Only a Draft Quest can be deleted.");
    }

    private static QuestDetails ValidateAndNormalize(QuestDetails details)
    {
        ArgumentNullException.ThrowIfNull(details);
        if (!Enum.IsDefined(details.Category))
            throw new ArgumentException("Quest category is invalid.");
        if (!Enum.IsDefined(details.RegistrationMode))
            throw new ArgumentException("Registration mode is invalid.");
        if (!Enum.IsDefined(details.Difficulty))
            throw new ArgumentException("Quest difficulty is invalid.");
        if (details.Capacity is < 0)
            throw new ArgumentException("Capacity must be null or at least zero.");

        var start = details.StartAtUtc?.ToUniversalTime();
        var end = details.EndAtUtc?.ToUniversalTime();
        if (start.HasValue && end.HasValue && end.Value <= start.Value)
            throw new ArgumentException("End date must be later than start date.");

        var externalUrl = Optional(
            details.ExternalSourceUrl, MaxExternalSourceUrlLength, "External source URL");
        if (externalUrl is not null && !IsHttpsUrl(externalUrl))
            throw new ArgumentException("External source URL must be an absolute HTTPS URL.");
        if (details.Latitude.HasValue != details.Longitude.HasValue)
            throw new ArgumentException("Latitude and longitude must be supplied together.");
        if (details.Latitude is < -90 or > 90)
            throw new ArgumentException("Latitude must be between -90 and 90.");
        if (details.Longitude is < -180 or > 180)
            throw new ArgumentException("Longitude must be between -180 and 180.");

        return details with
        {
            Title = Required(details.Title, "Title", MaxTitleLength),
            Description = Required(details.Description, "Description", MaxDescriptionLength),
            StartAtUtc = start,
            EndAtUtc = end,
            LocationDescription = Optional(
                details.LocationDescription, MaxLocationDescriptionLength, "Location description"),
            ExternalSourceUrl = externalUrl,
        };
    }

    private void EnsureServerInvariants()
    {
        // Client-editable details must never overwrite ownership, source, or
        // reward fields controlled by the server.
        if (CreatedByUserId == Guid.Empty || !Enum.IsDefined(SourceType) || XpAward < 0)
            throw new InvalidOperationException("Quest server-controlled fields are invalid.");
    }

    private static string Required(string? value, string field, int maximumLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{field} is required.");
        var trimmed = value.Trim();
        if (trimmed.Length > maximumLength)
            throw new ArgumentException($"{field} must be at most {maximumLength} characters.");
        return trimmed;
    }

    private static string? Optional(string? value, int maximumLength, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var trimmed = value.Trim();
        if (trimmed.Length > maximumLength)
            throw new ArgumentException($"{field} must be at most {maximumLength} characters.");
        return trimmed;
    }

    private static bool IsHttpsUrl(string value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;
}
