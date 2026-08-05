namespace Kiwimpact.Core.Entities;

public sealed class SocialComment
{
    public const int MaxContentLength = 1_000;

    internal SocialComment()
    {
        Content = string.Empty;
        Replies = new List<SocialComment>();
    }

    public Guid Id { get; internal set; }
    public Guid PostId { get; internal set; }
    public Guid AuthorUserId { get; internal set; }
    public Guid? ParentCommentId { get; internal set; }
    public string Content { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }

    public SocialPost? Post { get; internal set; }
    public SocialComment? ParentComment { get; internal set; }
    public ICollection<SocialComment> Replies { get; internal set; }

    public static SocialComment Create(
        Guid postId,
        Guid authorUserId,
        Guid? parentCommentId,
        string content,
        DateTimeOffset now)
    {
        if (postId == Guid.Empty)
            throw new ArgumentException("A post is required.");
        if (authorUserId == Guid.Empty)
            throw new ArgumentException("An authenticated author is required.");
        if (parentCommentId == Guid.Empty)
            throw new ArgumentException("Parent comment identifier is invalid.");
        ArgumentException.ThrowIfNullOrWhiteSpace(content);

        var normalized = content.Trim();
        if (normalized.Length > MaxContentLength)
        {
            throw new ArgumentOutOfRangeException(
                nameof(content),
                $"Comment content must be at most {MaxContentLength} characters.");
        }

        return new SocialComment
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            AuthorUserId = authorUserId,
            ParentCommentId = parentCommentId,
            Content = normalized,
            CreatedAt = now.ToUniversalTime(),
        };
    }

    public void UpdateContent(string content)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);

        var normalized = content.Trim();
        if (normalized.Length > MaxContentLength)
        {
            throw new ArgumentOutOfRangeException(
                nameof(content),
                $"Comment content must be at most {MaxContentLength} characters.");
        }

        Content = normalized;
    }
}
