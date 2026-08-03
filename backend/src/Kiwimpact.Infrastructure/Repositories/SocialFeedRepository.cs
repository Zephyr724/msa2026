using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Queries;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class SocialFeedRepository : ISocialFeedRepository
{
    private const string MissingAuthorDisplayName = "Community member";

    private readonly KiwimpactDbContext _db;

    public SocialFeedRepository(KiwimpactDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<SocialPostItem>> ListPostsAsync(
        string? search,
        int page,
        int pageSize,
        Guid? viewerUserId,
        CancellationToken ct = default)
    {
        var query = _db.SocialPosts.AsNoTracking().AsQueryable();
        if (search is not null)
        {
            var pattern = $"%{EscapeLikePattern(search)}%";
            query = query.Where(post =>
                EF.Functions.ILike(post.Content, pattern, @"\") ||
                _db.UserProfiles.Any(profile =>
                    profile.Id == post.AuthorUserId &&
                    EF.Functions.ILike(profile.DisplayName, pattern, @"\")));
        }

        var totalCount = await query.CountAsync(ct);
        var rows = await ProjectPosts(query, viewerUserId)
            .OrderByDescending(post => post.CreatedAt)
            .ThenByDescending(post => post.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<SocialPostItem>(
            rows.Select(ToPostItem).ToArray(),
            totalCount,
            page,
            pageSize);
    }

    public async Task<SocialPostItem> AddPostAsync(
        SocialPost post,
        Guid viewerUserId,
        CancellationToken ct = default)
    {
        _db.SocialPosts.Add(post);
        await _db.SaveChangesAsync(ct);

        var row = await ProjectPosts(
                _db.SocialPosts.AsNoTracking().Where(item => item.Id == post.Id),
                viewerUserId)
            .SingleAsync(ct);
        return ToPostItem(row);
    }

    public async Task<SocialLikeState> SetLikeAsync(
        Guid postId,
        Guid userId,
        bool isLiked,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        if (!await _db.SocialPosts.AsNoTracking().AnyAsync(post => post.Id == postId, ct))
            throw Error(SocialFeedError.NotFound, "Post not found.");

        if (isLiked)
        {
            var like = SocialPostLike.Create(postId, userId, now);
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"""
                INSERT INTO "SocialPostLikes" ("PostId", "UserId", "CreatedAt")
                VALUES ({like.PostId}, {like.UserId}, {like.CreatedAt})
                ON CONFLICT ("PostId", "UserId") DO NOTHING
                """,
                ct);
        }
        else
        {
            await _db.SocialPostLikes
                .Where(like => like.PostId == postId && like.UserId == userId)
                .ExecuteDeleteAsync(ct);
        }

        var likeCount = await _db.SocialPostLikes
            .AsNoTracking()
            .CountAsync(like => like.PostId == postId, ct);
        var isLikedByViewer = await _db.SocialPostLikes
            .AsNoTracking()
            .AnyAsync(like => like.PostId == postId && like.UserId == userId, ct);
        return new SocialLikeState(likeCount, isLikedByViewer);
    }

    public async Task<PagedResult<SocialCommentThread>> ListCommentsAsync(
        Guid postId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        if (!await _db.SocialPosts.AsNoTracking().AnyAsync(post => post.Id == postId, ct))
            throw Error(SocialFeedError.NotFound, "Post not found.");

        var roots = _db.SocialComments
            .AsNoTracking()
            .Where(comment =>
                comment.PostId == postId && comment.ParentCommentId == null);
        var totalCount = await roots.CountAsync(ct);
        var rootRows = await ProjectComments(roots)
            .OrderBy(comment => comment.CreatedAt)
            .ThenBy(comment => comment.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        var rootIds = rootRows.Select(comment => comment.Id).ToArray();
        var replyCounts = rootIds.Length == 0
            ? new Dictionary<Guid, int>()
            : await _db.SocialComments
                .AsNoTracking()
                .Where(comment =>
                    comment.ParentCommentId.HasValue &&
                    rootIds.Contains(comment.ParentCommentId.Value))
                .GroupBy(comment => comment.ParentCommentId!.Value)
                .ToDictionaryAsync(group => group.Key, group => group.Count(), ct);
        var replyRows = rootIds.Length == 0
            ? []
            : await _db.SocialComments
                .FromSqlInterpolated($"""
                    SELECT limited."Id",
                           limited."PostId",
                           limited."AuthorUserId",
                           limited."ParentCommentId",
                           limited."Content",
                           limited."CreatedAt"
                    FROM (
                        SELECT comment."Id",
                               comment."PostId",
                               comment."AuthorUserId",
                               comment."ParentCommentId",
                               comment."Content",
                               comment."CreatedAt",
                               ROW_NUMBER() OVER (
                                   PARTITION BY comment."ParentCommentId"
                                   ORDER BY comment."CreatedAt", comment."Id") AS "ReplyRow"
                        FROM "SocialComments" AS comment
                        WHERE comment."PostId" = {postId}
                          AND comment."ParentCommentId" = ANY ({rootIds})
                    ) AS limited
                    WHERE limited."ReplyRow" <= {SocialFeedService.MaxReplyPreviewSize}
                    ORDER BY limited."ParentCommentId", limited."CreatedAt", limited."Id"
                    """)
                .AsNoTracking()
                .ToListAsync(ct);
        var replyAuthorIds = replyRows
            .Select(comment => comment.AuthorUserId)
            .Distinct()
            .ToArray();
        var replyAuthorNames = replyAuthorIds.Length == 0
            ? new Dictionary<Guid, string>()
            : await _db.UserProfiles
                .AsNoTracking()
                .Where(profile => replyAuthorIds.Contains(profile.Id))
                .ToDictionaryAsync(profile => profile.Id, profile => profile.DisplayName, ct);
        var repliesByParent = replyRows
            .GroupBy(comment => comment.ParentCommentId!.Value)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<SocialCommentItem>)group
                    .Select(comment => new SocialCommentItem(
                        comment.Id,
                        comment.PostId,
                        comment.ParentCommentId,
                        comment.Content,
                        replyAuthorNames.GetValueOrDefault(
                            comment.AuthorUserId,
                            MissingAuthorDisplayName),
                        comment.CreatedAt))
                    .ToArray());

        var threads = rootRows
            .Select(root => new SocialCommentThread(
                ToCommentItem(root),
                repliesByParent.GetValueOrDefault(root.Id, []),
                replyCounts.GetValueOrDefault(root.Id)))
            .ToArray();

        return new PagedResult<SocialCommentThread>(
            threads,
            totalCount,
            page,
            pageSize);
    }

    public async Task<SocialCommentItem> AddCommentAsync(
        Guid postId,
        Guid authorUserId,
        Guid? parentCommentId,
        string content,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        if (!await _db.SocialPosts.AsNoTracking().AnyAsync(post => post.Id == postId, ct))
            throw Error(SocialFeedError.NotFound, "Post not found.");

        if (parentCommentId.HasValue)
        {
            var parent = await _db.SocialComments
                .AsNoTracking()
                .Where(comment => comment.Id == parentCommentId.Value)
                .Select(comment => new { comment.PostId, comment.ParentCommentId })
                .SingleOrDefaultAsync(ct);
            if (parent is null || parent.PostId != postId)
            {
                throw Error(
                    SocialFeedError.InvalidReplyParent,
                    "Parent comment was not found on this post.");
            }
            if (parent.ParentCommentId.HasValue)
            {
                throw Error(
                    SocialFeedError.ReplyDepthExceeded,
                    "Replies can only be added to top-level comments.");
            }
        }

        var comment = SocialComment.Create(
            postId,
            authorUserId,
            parentCommentId,
            content,
            now);
        _db.SocialComments.Add(comment);
        await _db.SaveChangesAsync(ct);

        var row = await ProjectComments(
                _db.SocialComments.AsNoTracking().Where(item => item.Id == comment.Id))
            .SingleAsync(ct);
        return ToCommentItem(row);
    }

    private IQueryable<SocialPostProjection> ProjectPosts(
        IQueryable<SocialPost> query,
        Guid? viewerUserId)
    {
        return query.Select(post => new SocialPostProjection
        {
            Id = post.Id,
            Content = post.Content,
            ImageUrl = post.ImageUrl,
            ImageAltText = post.ImageAltText,
            AuthorDisplayName = _db.UserProfiles
                .Where(profile => profile.Id == post.AuthorUserId)
                .Select(profile => profile.DisplayName)
                .FirstOrDefault() ?? MissingAuthorDisplayName,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            LikeCount = _db.SocialPostLikes.Count(like => like.PostId == post.Id),
            CommentCount = _db.SocialComments.Count(comment => comment.PostId == post.Id),
            IsLikedByViewer = viewerUserId.HasValue && _db.SocialPostLikes.Any(like =>
                like.PostId == post.Id && like.UserId == viewerUserId.Value),
        });
    }

    private IQueryable<SocialCommentProjection> ProjectComments(
        IQueryable<SocialComment> query)
    {
        return query.Select(comment => new SocialCommentProjection
        {
            Id = comment.Id,
            PostId = comment.PostId,
            ParentCommentId = comment.ParentCommentId,
            Content = comment.Content,
            AuthorDisplayName = _db.UserProfiles
                .Where(profile => profile.Id == comment.AuthorUserId)
                .Select(profile => profile.DisplayName)
                .FirstOrDefault() ?? MissingAuthorDisplayName,
            CreatedAt = comment.CreatedAt,
        });
    }

    private static SocialPostItem ToPostItem(SocialPostProjection post) =>
        new(
            post.Id,
            post.Content,
            post.ImageUrl,
            post.ImageAltText,
            post.AuthorDisplayName,
            post.CreatedAt,
            post.UpdatedAt,
            post.LikeCount,
            post.CommentCount,
            post.IsLikedByViewer);

    private static SocialCommentItem ToCommentItem(SocialCommentProjection comment) =>
        new(
            comment.Id,
            comment.PostId,
            comment.ParentCommentId,
            comment.Content,
            comment.AuthorDisplayName,
            comment.CreatedAt);

    private static string EscapeLikePattern(string value) =>
        value.Replace(@"\", @"\\", StringComparison.Ordinal)
            .Replace("%", @"\%", StringComparison.Ordinal)
            .Replace("_", @"\_", StringComparison.Ordinal);

    private static SocialFeedException Error(SocialFeedError error, string message) =>
        new(error, message);

    private sealed class SocialPostProjection
    {
        public Guid Id { get; init; }
        public string Content { get; init; } = string.Empty;
        public string? ImageUrl { get; init; }
        public string? ImageAltText { get; init; }
        public string AuthorDisplayName { get; init; } = string.Empty;
        public DateTimeOffset CreatedAt { get; init; }
        public DateTimeOffset UpdatedAt { get; init; }
        public int LikeCount { get; init; }
        public int CommentCount { get; init; }
        public bool IsLikedByViewer { get; init; }
    }

    private sealed class SocialCommentProjection
    {
        public Guid Id { get; init; }
        public Guid PostId { get; init; }
        public Guid? ParentCommentId { get; init; }
        public string Content { get; init; } = string.Empty;
        public string AuthorDisplayName { get; init; } = string.Empty;
        public DateTimeOffset CreatedAt { get; init; }
    }
}
