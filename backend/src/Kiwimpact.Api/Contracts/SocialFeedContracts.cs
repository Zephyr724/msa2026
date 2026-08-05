namespace Kiwimpact.Api.Contracts;

public sealed record CreateSocialPostRequest(
    Guid QuestId,
    string Title,
    string Content,
    IReadOnlyList<CreateSocialPostImageRequest>? Images,
    IReadOnlyList<string>? Tags,
    bool IsHidden = false);

public sealed record SetSocialPostVisibilityRequest(bool IsHidden);

public sealed record CreateSocialPostImageRequest(
    string ImageUrl,
    string ImageAltText);

public sealed record SocialPostImageDto(
    string ImageUrl,
    string ImageAltText,
    int SortOrder);

public sealed record SocialPostQuestDto(
    Guid Id,
    string Title,
    string? CoverImageUrl,
    string? LocationDescription,
    string? StartAtUtc);

public sealed record SocialPostDto(
    Guid Id,
    string Title,
    string Content,
    IReadOnlyList<SocialPostImageDto> Images,
    IReadOnlyList<string> Tags,
    SocialPostQuestDto? Quest,
    string AuthorDisplayName,
    string CreatedAtUtc,
    string UpdatedAtUtc,
    int LikeCount,
    int CommentCount,
    bool IsLikedByViewer,
    bool CanDelete,
    bool IsHidden);

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
