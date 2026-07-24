namespace Kiwimpact.Core.Entities;

public sealed class QuestImage
{
    public const int MaxUrlLength = 2000;
    public const int MaxAltTextLength = 300;
    public const int MaxCreatorNameLength = 200;
    public const int MaxLicenceNoteLength = 500;

    internal QuestImage()
    {
        ImageUrl = string.Empty;
        AltText = string.Empty;
    }

    public Guid Id { get; internal set; }
    public Guid QuestId { get; internal set; }
    public string ImageUrl { get; internal set; }
    public string AltText { get; internal set; }
    public int SortOrder { get; internal set; }
    public bool IsCover { get; internal set; }
    public string? CreatorName { get; internal set; }
    public string? SourceUrl { get; internal set; }
    public string? LicenceNote { get; internal set; }

    // Navigation properties
    public Quest Quest { get; internal set; } = null!;

    internal static QuestImage CreateCover(Guid questId, QuestCoverImageDetails details)
    {
        var normalized = ValidateAndNormalize(details);
        return new QuestImage
        {
            Id = Guid.NewGuid(),
            QuestId = questId,
            ImageUrl = normalized.ImageUrl,
            AltText = normalized.AltText,
            SortOrder = 0,
            IsCover = true,
            CreatorName = normalized.CreatorName,
            SourceUrl = normalized.SourceUrl,
            LicenceNote = normalized.LicenceNote,
        };
    }

    internal void UpdateCover(QuestCoverImageDetails details)
    {
        var normalized = ValidateAndNormalize(details);
        ImageUrl = normalized.ImageUrl;
        AltText = normalized.AltText;
        SortOrder = 0;
        IsCover = true;
        CreatorName = normalized.CreatorName;
        SourceUrl = normalized.SourceUrl;
        LicenceNote = normalized.LicenceNote;
    }

    private static QuestCoverImageDetails ValidateAndNormalize(QuestCoverImageDetails details)
    {
        ArgumentNullException.ThrowIfNull(details);

        var imageUrl = Required(details.ImageUrl, "Cover image URL", MaxUrlLength);
        if (!IsHttpsUrl(imageUrl) &&
            (!imageUrl.StartsWith("/", StringComparison.Ordinal) ||
             imageUrl.StartsWith("//", StringComparison.Ordinal)))
        {
            throw new ArgumentException(
                "Cover image URL must be an absolute HTTPS URL or root-relative asset reference.");
        }

        var sourceUrl = Optional(details.SourceUrl, MaxUrlLength, "Cover source URL");
        if (sourceUrl is not null && !IsHttpsUrl(sourceUrl))
            throw new ArgumentException("Cover source URL must be an absolute HTTPS URL.");

        return details with
        {
            ImageUrl = imageUrl,
            AltText = Required(details.AltText, "Cover alt text", MaxAltTextLength),
            CreatorName = Optional(details.CreatorName, MaxCreatorNameLength, "Cover creator name"),
            SourceUrl = sourceUrl,
            LicenceNote = Optional(details.LicenceNote, MaxLicenceNoteLength, "Cover licence note"),
        };
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
        Uri.TryCreate(value, UriKind.Absolute, out var uri) &&
        uri.Scheme == Uri.UriSchemeHttps;
}
