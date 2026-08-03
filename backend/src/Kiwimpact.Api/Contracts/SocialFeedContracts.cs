namespace Kiwimpact.Api.Contracts;

public sealed record CreateSocialPostRequest(
    string Content,
    string? ImageUrl,
    string? ImageAltText);

public sealed record SocialPostDto(
    Guid Id,
    string Content,
    string? ImageUrl,
    string? ImageAltText,
    string AuthorDisplayName,
    string CreatedAtUtc,
    string UpdatedAtUtc,
    int LikeCount,
    int CommentCount,
    bool IsLikedByViewer);

public sealed record SetSocialLikeDto(int LikeCount, bool IsLikedByViewer);

public sealed record CreateSocialCommentRequest(
    string Content,
    Guid? ParentCommentId);

public sealed record SocialCommentCreatedDto(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Content,
    string AuthorDisplayName,
    string CreatedAtUtc);

public sealed record SocialCommentReplyDto(
    Guid Id,
    Guid PostId,
    Guid ParentCommentId,
    string Content,
    string AuthorDisplayName,
    string CreatedAtUtc);

public sealed record SocialCommentThreadDto(
    Guid Id,
    Guid PostId,
    string Content,
    string AuthorDisplayName,
    string CreatedAtUtc,
    IReadOnlyList<SocialCommentReplyDto> Replies,
    int ReplyCount,
    bool HasMoreReplies);
