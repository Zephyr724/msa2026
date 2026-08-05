namespace Kiwimpact.Core.Entities;

public sealed class SocialPostImage
{
    internal SocialPostImage()
    {
        Url = string.Empty;
        AltText = string.Empty;
    }

    public Guid PostId { get; internal set; }
    public int SortOrder { get; internal set; }
    public string Url { get; internal set; }
    public string AltText { get; internal set; }
    public SocialPost? Post { get; internal set; }

    internal static SocialPostImage Create(
        Guid postId,
        SocialPostImageDetails details,
        int sortOrder)
    {
        ArgumentNullException.ThrowIfNull(details);
        var url = details.Url?.Trim() ?? string.Empty;
        var altText = details.AltText?.Trim() ?? string.Empty;
        if (url.Length == 0)
            throw new ArgumentException("Image URL is required.");
        if (url.Length > SocialPost.MaxImageUrlLength)
            throw new ArgumentException($"Image URL must be at most {SocialPost.MaxImageUrlLength} characters.");
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps ||
            string.IsNullOrWhiteSpace(uri.Host) ||
            !string.IsNullOrEmpty(uri.UserInfo))
        {
            throw new ArgumentException("Image URL must be an absolute HTTPS URL.");
        }
        if (altText.Length == 0)
            throw new ArgumentException("Image alternative text is required.");
        if (altText.Length > SocialPost.MaxImageAltTextLength)
        {
            throw new ArgumentException(
                $"Image alternative text must be at most {SocialPost.MaxImageAltTextLength} characters.");
        }
        if (sortOrder < 0 || sortOrder >= SocialPost.MaxImages)
            throw new ArgumentOutOfRangeException(nameof(sortOrder));

        return new SocialPostImage
        {
            PostId = postId,
            SortOrder = sortOrder,
            Url = url,
            AltText = altText,
        };
    }
}
