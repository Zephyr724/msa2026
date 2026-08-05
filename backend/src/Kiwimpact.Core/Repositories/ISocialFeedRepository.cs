using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Queries;
using Kiwimpact.Core.Services;

namespace Kiwimpact.Core.Repositories;

public interface ISocialFeedRepository
{
    Task<PagedResult<SocialPostItem>> ListPostsAsync(
        string? search,
        int page,
        int pageSize,
        Guid? viewerUserId,
        CancellationToken ct = default);

    Task<SocialPostItem> AddPostAsync(
        SocialPost post,
        Guid viewerUserId,
        CancellationToken ct = default);

    Task DeletePostAsync(
        Guid postId,
        Guid actorUserId,
        CancellationToken ct = default);

    Task<SocialPostItem> SetPostVisibilityAsync(
        Guid postId,
        Guid actorUserId,
        bool isHidden,
        DateTimeOffset now,
        CancellationToken ct = default);

    Task<SocialLikeState> SetLikeAsync(
        Guid postId,
        Guid userId,
        bool isLiked,
        DateTimeOffset now,
        CancellationToken ct = default);

    Task<PagedResult<SocialCommentThread>> ListCommentsAsync(
        Guid postId,
        int page,
        int pageSize,
        Guid? viewerUserId,
        CancellationToken ct = default);

    Task<SocialCommentItem> AddCommentAsync(
        Guid postId,
        Guid authorUserId,
        Guid? parentCommentId,
        string content,
        DateTimeOffset now,
        CancellationToken ct = default);
}
