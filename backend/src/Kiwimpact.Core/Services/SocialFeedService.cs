using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Queries;
using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class SocialFeedService : ISocialFeedService
{
    public const int MaxSearchLength = 100;
    public const int MaxPageNumber = 10_000;
    public const int MaxPageSize = 24;
    public const int MaxCommentPageSize = 20;
    public const int MaxReplyPreviewSize = 20;

    private readonly ISocialFeedRepository _repository;

    public SocialFeedService(ISocialFeedRepository repository)
    {
        _repository = repository;
    }

    public Task<PagedResult<SocialPostItem>> ListPostsAsync(
        string? search,
        int page,
        int pageSize,
        Guid? viewerUserId,
        bool mine,
        CancellationToken ct = default)
    {
        ValidatePage(page, pageSize, MaxPageSize);
        var normalizedSearch = string.IsNullOrWhiteSpace(search) ? null : search.Trim();
        if (normalizedSearch?.Length > MaxSearchLength)
        {
            throw Error(
                SocialFeedError.Validation,
                $"Search must be at most {MaxSearchLength} characters.");
        }

        return _repository.ListPostsAsync(
            normalizedSearch,
            page,
            pageSize,
            viewerUserId,
            mine,
            ct);
    }

    public Task<SocialPostItem> GetPostAsync(
        Guid postId,
        Guid? viewerUserId,
        CancellationToken ct = default)
    {
        if (postId == Guid.Empty)
            throw Error(SocialFeedError.NotFound, "Post not found.");
        return _repository.GetPostAsync(postId, viewerUserId, ct);
    }

    public Task<SocialPostItem> CreatePostAsync(
        Guid authorUserId,
        Guid? questId,
        string title,
        string content,
        IReadOnlyList<SocialPostImageDetails> images,
        IReadOnlyList<string> tags,
        bool isHidden,
        CancellationToken ct = default)
    {
        try
        {
            var post = SocialPost.Create(
                authorUserId,
                questId,
                title,
                content,
                images,
                tags,
                isHidden,
                DateTimeOffset.UtcNow);
            return _repository.AddPostAsync(post, authorUserId, ct);
        }
        catch (ArgumentException exception)
        {
            throw Error(SocialFeedError.Validation, exception.Message);
        }
    }

    public Task<SocialPostItem> SetPostVisibilityAsync(
        Guid postId,
        Guid actorUserId,
        bool isHidden,
        CancellationToken ct = default)
    {
        ValidateIdentifiers(postId, actorUserId);
        return _repository.SetPostVisibilityAsync(
            postId,
            actorUserId,
            isHidden,
            DateTimeOffset.UtcNow,
            ct);
    }

    public async Task<SocialPostItem> UpdatePostAsync(
        Guid postId,
        Guid actorUserId,
        Guid? questId,
        string title,
        string content,
        IReadOnlyList<SocialPostImageDetails> images,
        IReadOnlyList<string> tags,
        CancellationToken ct = default)
    {
        ValidateIdentifiers(postId, actorUserId);
        try
        {
            return await _repository.UpdatePostAsync(
                postId,
                actorUserId,
                questId,
                title,
                content,
                images,
                tags,
                DateTimeOffset.UtcNow,
                ct);
        }
        catch (ArgumentException exception)
        {
            throw Error(SocialFeedError.Validation, exception.Message);
        }
    }

    public Task DeletePostAsync(
        Guid postId,
        Guid actorUserId,
        CancellationToken ct = default)
    {
        ValidateIdentifiers(postId, actorUserId);
        return _repository.DeletePostAsync(postId, actorUserId, ct);
    }

    public Task<SocialLikeState> SetLikeAsync(
        Guid postId,
        Guid userId,
        bool isLiked,
        CancellationToken ct = default)
    {
        ValidateIdentifiers(postId, userId);
        return _repository.SetLikeAsync(
            postId,
            userId,
            isLiked,
            DateTimeOffset.UtcNow,
            ct);
    }

    public Task<PagedResult<SocialCommentThread>> ListCommentsAsync(
        Guid postId,
        int page,
        int pageSize,
        Guid? viewerUserId,
        CancellationToken ct = default)
    {
        if (postId == Guid.Empty)
            throw Error(SocialFeedError.NotFound, "Post not found.");
        ValidatePage(page, pageSize, MaxCommentPageSize);
        return _repository.ListCommentsAsync(postId, page, pageSize, viewerUserId, ct);
    }

    public async Task<SocialCommentItem> CreateCommentAsync(
        Guid postId,
        Guid authorUserId,
        Guid? parentCommentId,
        string content,
        CancellationToken ct = default)
    {
        ValidateIdentifiers(postId, authorUserId);
        try
        {
            return await _repository.AddCommentAsync(
                postId,
                authorUserId,
                parentCommentId,
                content,
                DateTimeOffset.UtcNow,
                ct);
        }
        catch (ArgumentException exception)
        {
            throw Error(SocialFeedError.Validation, exception.Message);
        }
    }

    public async Task<SocialCommentItem> UpdateCommentAsync(
        Guid postId,
        Guid commentId,
        Guid actorUserId,
        string content,
        CancellationToken ct = default)
    {
        ValidateIdentifiers(postId, actorUserId);
        if (commentId == Guid.Empty)
            throw Error(SocialFeedError.NotFound, "Comment not found.");
        try
        {
            return await _repository.UpdateCommentAsync(
                postId,
                commentId,
                actorUserId,
                content,
                ct);
        }
        catch (ArgumentException exception)
        {
            throw Error(SocialFeedError.Validation, exception.Message);
        }
    }

    private static void ValidatePage(int page, int pageSize, int maxPageSize)
    {
        if (page < 1 || page > MaxPageNumber)
        {
            throw Error(
                SocialFeedError.Validation,
                $"Page must be between 1 and {MaxPageNumber}.");
        }
        if (pageSize < 1 || pageSize > maxPageSize)
        {
            throw Error(
                SocialFeedError.Validation,
                $"Page size must be between 1 and {maxPageSize}.");
        }
    }

    private static void ValidateIdentifiers(Guid postId, Guid userId)
    {
        if (postId == Guid.Empty)
            throw Error(SocialFeedError.NotFound, "Post not found.");
        if (userId == Guid.Empty)
            throw Error(SocialFeedError.NotFound, "Authenticated user not found.");
    }

    private static SocialFeedException Error(SocialFeedError error, string message) =>
        new(error, message);
}
