using Kiwimpact.Core.Queries;

namespace Kiwimpact.Core.Services;

public interface ISocialFeedService
{
    Task<PagedResult<SocialPostItem>> ListPostsAsync(
        string? search,
        int page,
        int pageSize,
        Guid? viewerUserId,
        CancellationToken ct = default);

    Task<SocialPostItem> CreatePostAsync(
        Guid authorUserId,
        string content,
        string? imageUrl,
        string? imageAltText,
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
        CancellationToken ct = default);

    Task<SocialCommentItem> CreateCommentAsync(
        Guid postId,
        Guid authorUserId,
        Guid? parentCommentId,
        string content,
        CancellationToken ct = default);
}
