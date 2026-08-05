namespace Kiwimpact.Core.Services;

public enum SocialFeedError
{
    Validation,
    NotFound,
    Forbidden,
    InvalidReplyParent,
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
    string Title,
    string Content,
    IReadOnlyList<SocialPostImageItem> Images,
    IReadOnlyList<string> Tags,
    SocialPostQuestItem? Quest,
    string AuthorDisplayName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    int LikeCount,
    int CommentCount,
    bool IsLikedByViewer,
    bool CanDelete,
    bool IsHidden);

public sealed record SocialPostImageItem(
    string Url,
    string AltText,
    int SortOrder);

public sealed record SocialPostQuestItem(
    Guid Id,
    string Title,
    string? CoverImageUrl,
    string? LocationDescription,
    DateTimeOffset? StartAtUtc);

public sealed record SocialCommentItem(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Content,
    string AuthorDisplayName,
    DateTimeOffset CreatedAt,
    bool CanEdit);

public sealed record SocialCommentThread(
    SocialCommentItem Comment,
    IReadOnlyList<SocialCommentItem> Replies,
    int ReplyCount);

public sealed record SocialLikeState(int LikeCount, bool IsLikedByViewer);
