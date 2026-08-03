namespace Kiwimpact.Core.Entities;

public sealed class SocialPost
{
    public const int MaxContentLength = 2_000;
    public const int MaxImageUrlLength = 2_048;
    public const int MaxImageAltTextLength = 200;

    internal SocialPost()
    {
        Content = string.Empty;
        Likes = new List<SocialPostLike>();
        Comments = new List<SocialComment>();
    }

    public Guid Id { get; internal set; }
    public Guid AuthorUserId { get; internal set; }
    public string Content { get; internal set; }
    public string? ImageUrl { get; internal set; }
    public string? ImageAltText { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    public ICollection<SocialPostLike> Likes { get; internal set; }
    public ICollection<SocialComment> Comments { get; internal set; }

    public static SocialPost Create(
        Guid authorUserId,
        string content,
        string? imageUrl,
        string? imageAltText,
        DateTimeOffset now)
    {
        if (authorUserId == Guid.Empty)
            throw new ArgumentException("An authenticated author is required.");

        var normalizedContent = NormalizeRequired(
            content,
            MaxContentLength,
            "Post content");
        var normalizedImageUrl = NormalizeImageUrl(imageUrl);
        var normalizedAltText = NormalizeOptional(imageAltText);

        if (normalizedImageUrl is null && normalizedAltText is not null)
            throw new ArgumentException("Image alternative text requires an image URL.");
        if (normalizedImageUrl is not null && normalizedAltText is null)
            throw new ArgumentException("Image alternative text is required for an image.");
        if (normalizedAltText?.Length > MaxImageAltTextLength)
        {
            throw new ArgumentOutOfRangeException(
                nameof(imageAltText),
                $"Image alternative text must be at most {MaxImageAltTextLength} characters.");
        }

        var timestamp = now.ToUniversalTime();
        return new SocialPost
        {
            Id = Guid.NewGuid(),
            AuthorUserId = authorUserId,
            Content = normalizedContent,
            ImageUrl = normalizedImageUrl,
            ImageAltText = normalizedAltText,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        };
    }

    private static string NormalizeRequired(string value, int maxLength, string label)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        var normalized = value.Trim();
        if (normalized.Length > maxLength)
        {
            throw new ArgumentOutOfRangeException(
                nameof(value),
                $"{label} must be at most {maxLength} characters.");
        }

        return normalized;
    }

    private static string? NormalizeImageUrl(string? value)
    {
        var normalized = NormalizeOptional(value);
        if (normalized is null)
            return null;
        if (normalized.Length > MaxImageUrlLength)
        {
            throw new ArgumentOutOfRangeException(
                nameof(value),
                $"Image URL must be at most {MaxImageUrlLength} characters.");
        }
        if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps ||
            string.IsNullOrWhiteSpace(uri.Host) ||
            !string.IsNullOrEmpty(uri.UserInfo))
        {
            throw new ArgumentException("Image URL must be an absolute HTTPS URL.");
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
