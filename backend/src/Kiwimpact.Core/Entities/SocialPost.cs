namespace Kiwimpact.Core.Entities;

public sealed class SocialPost
{
    public const int MaxTitleLength = 120;
    public const int MaxContentLength = 2_000;
    public const int MaxImageUrlLength = 2_048;
    public const int MaxImageAltTextLength = 200;
    public const int MaxImages = 9;
    public const int MaxTags = 10;
    public const int MaxTagLength = 30;

    internal SocialPost()
    {
        Title = string.Empty;
        Content = string.Empty;
        Likes = new List<SocialPostLike>();
        Comments = new List<SocialComment>();
        Images = new List<SocialPostImage>();
        Tags = new List<SocialPostTag>();
    }

    public Guid Id { get; internal set; }
    public Guid AuthorUserId { get; internal set; }
    public Guid? QuestId { get; internal set; }
    public string Title { get; internal set; }
    public string Content { get; internal set; }
    // Retained for a safe additive migration of posts created before multi-image support.
    public string? ImageUrl { get; internal set; }
    public string? ImageAltText { get; internal set; }
    public bool IsHidden { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    public ICollection<SocialPostLike> Likes { get; internal set; }
    public ICollection<SocialComment> Comments { get; internal set; }
    public ICollection<SocialPostImage> Images { get; internal set; }
    public ICollection<SocialPostTag> Tags { get; internal set; }
    public Quest? Quest { get; internal set; }

    public static SocialPost Create(
        Guid authorUserId,
        Guid? questId,
        string title,
        string content,
        IReadOnlyList<SocialPostImageDetails> images,
        IReadOnlyList<string> tags,
        bool isHidden,
        DateTimeOffset now)
    {
        if (authorUserId == Guid.Empty)
            throw new ArgumentException("An authenticated author is required.");
        if (questId.HasValue && questId.Value == Guid.Empty)
            throw new ArgumentException("The related Quest identifier is invalid.");

        ArgumentNullException.ThrowIfNull(images);
        ArgumentNullException.ThrowIfNull(tags);
        if (images.Count > MaxImages)
            throw new ArgumentException($"A post can contain at most {MaxImages} images.");
        if (tags.Count > MaxTags)
            throw new ArgumentException($"A post can contain at most {MaxTags} tags.");

        var normalizedTitle = NormalizeRequired(title, MaxTitleLength, "Post title");
        var normalizedContent = NormalizeRequired(
            content,
            MaxContentLength,
            "Post content");

        var timestamp = now.ToUniversalTime();
        var post = new SocialPost
        {
            Id = Guid.NewGuid(),
            AuthorUserId = authorUserId,
            QuestId = questId,
            Title = normalizedTitle,
            Content = normalizedContent,
            IsHidden = isHidden,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        };

        foreach (var (image, index) in images.Select((value, index) => (value, index)))
        {
            var postImage = SocialPostImage.Create(post.Id, image, index);
            postImage.Post = post;
            post.Images.Add(postImage);
        }

        var normalizedTagNames = new HashSet<string>(StringComparer.Ordinal);
        foreach (var tag in tags)
        {
            var postTag = SocialPostTag.Create(post.Id, tag);
            if (!normalizedTagNames.Add(postTag.NormalizedName))
                continue;
            postTag.Post = post;
            post.Tags.Add(postTag);
        }

        return post;
    }

    public void SetVisibility(bool isHidden, DateTimeOffset now)
    {
        IsHidden = isHidden;
        UpdatedAt = now.ToUniversalTime();
    }

    public void Update(
        Guid? questId,
        string title,
        string content,
        IReadOnlyList<SocialPostImageDetails> images,
        IReadOnlyList<string> tags,
        DateTimeOffset now)
    {
        if (questId.HasValue && questId.Value == Guid.Empty)
            throw new ArgumentException("The related Quest identifier is invalid.");

        ArgumentNullException.ThrowIfNull(images);
        ArgumentNullException.ThrowIfNull(tags);
        if (images.Count > MaxImages)
            throw new ArgumentException($"A post can contain at most {MaxImages} images.");
        if (tags.Count > MaxTags)
            throw new ArgumentException($"A post can contain at most {MaxTags} tags.");

        var normalizedTitle = NormalizeRequired(title, MaxTitleLength, "Post title");
        var normalizedContent = NormalizeRequired(content, MaxContentLength, "Post content");
        var nextImages = images
            .Select((image, index) => SocialPostImage.Create(Id, image, index))
            .ToArray();
        var nextTags = new Dictionary<string, SocialPostTag>(StringComparer.Ordinal);
        foreach (var tag in tags)
        {
            var nextTag = SocialPostTag.Create(Id, tag);
            nextTags.TryAdd(nextTag.NormalizedName, nextTag);
        }

        QuestId = questId;
        Title = normalizedTitle;
        Content = normalizedContent;

        var nextImageOrders = nextImages.Select(image => image.SortOrder).ToHashSet();
        foreach (var existing in Images.Where(image => !nextImageOrders.Contains(image.SortOrder)).ToArray())
            Images.Remove(existing);
        foreach (var nextImage in nextImages)
        {
            var existing = Images.SingleOrDefault(image => image.SortOrder == nextImage.SortOrder);
            if (existing is null)
            {
                nextImage.Post = this;
                Images.Add(nextImage);
            }
            else
            {
                existing.Url = nextImage.Url;
                existing.AltText = nextImage.AltText;
            }
        }

        foreach (var existing in Tags.Where(tag => !nextTags.ContainsKey(tag.NormalizedName)).ToArray())
            Tags.Remove(existing);
        foreach (var nextTag in nextTags.Values)
        {
            var existing = Tags.SingleOrDefault(tag => tag.NormalizedName == nextTag.NormalizedName);
            if (existing is null)
            {
                nextTag.Post = this;
                Tags.Add(nextTag);
            }
            else
            {
                existing.Name = nextTag.Name;
            }
        }

        ImageUrl = nextImages.FirstOrDefault()?.Url;
        ImageAltText = nextImages.FirstOrDefault()?.AltText;
        UpdatedAt = now.ToUniversalTime();
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

}

public sealed record SocialPostImageDetails(string Url, string AltText);
