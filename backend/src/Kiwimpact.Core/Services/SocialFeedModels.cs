namespace Kiwimpact.Core.Services;

public enum SocialFeedError
{
    Validation,
    NotFound,
    InvalidReplyParent,
    ReplyDepthExceeded,
}

public sealed class SocialFeedException : Exception
{
    public SocialFeedException(SocialFeedError error, string message)
        : base(message)
    {
        Error = error;
    }

    public SocialFeedError Error { get; }
}

public sealed record SocialPostItem(
    Guid Id,
    string Content,
    string? ImageUrl,
    string? ImageAltText,
    string AuthorDisplayName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    int LikeCount,
    int CommentCount,
    bool IsLikedByViewer);

public sealed record SocialCommentItem(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Content,
    string AuthorDisplayName,
    DateTimeOffset CreatedAt);

public sealed record SocialCommentThread(
    SocialCommentItem Comment,
    IReadOnlyList<SocialCommentItem> Replies,
    int ReplyCount);

public sealed record SocialLikeState(int LikeCount, bool IsLikedByViewer);
