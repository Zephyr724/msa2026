using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Queries;

namespace Kiwimpact.Core.Services;

public interface ISocialFeedService
{
    Task<PagedResult<SocialPostItem>> ListPostsAsync(
        string? search,
        int page,
        int pageSize,
        Guid? viewerUserId,
        bool mine,
        CancellationToken ct = default);

    Task<SocialPostItem> GetPostAsync(
        Guid postId,
        Guid? viewerUserId,
        CancellationToken ct = default);

    Task<SocialPostItem> CreatePostAsync(
        Guid authorUserId,
        Guid? questId,
        string title,
        string content,
        IReadOnlyList<SocialPostImageDetails> images,
        IReadOnlyList<string> tags,
        bool isHidden,
        CancellationToken ct = default);

    Task<SocialPostItem> UpdatePostAsync(
        Guid postId,
        Guid actorUserId,
        Guid? questId,
        string title,
        string content,
        IReadOnlyList<SocialPostImageDetails> images,
        IReadOnlyList<string> tags,
        CancellationToken ct = default);

    Task DeletePostAsync(
        Guid postId,
        Guid actorUserId,
        CancellationToken ct = default);

    Task<SocialPostItem> SetPostVisibilityAsync(
        Guid postId,
        Guid actorUserId,
        bool isHidden,
        CancellationToken ct = default);

    Task<SocialLikeState> SetLikeAsync(
        Guid postId,
        Guid userId,
        bool isLiked,
        CancellationToken ct = default);

    Task<PagedResult<SocialCommentThread>> ListCommentsAsync(
        Guid postId,
        int page,
        int pageSize,
        Guid? viewerUserId,
        CancellationToken ct = default);

    Task<SocialCommentItem> CreateCommentAsync(
        Guid postId,
        Guid authorUserId,
        Guid? parentCommentId,
        string content,
        CancellationToken ct = default);

    Task<SocialCommentItem> UpdateCommentAsync(
        Guid postId,
        Guid commentId,
        Guid actorUserId,
        string content,
        CancellationToken ct = default);
}
