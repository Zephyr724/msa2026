using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Security;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Queries;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Route("api/v1/social/posts")]
public sealed class SocialPostsController : ControllerBase
{
    private const string WriterRoles =
        AppRoles.Member + "," + AppRoles.Organizer + "," + AppRoles.Admin;

    private readonly ISocialFeedService _service;

    public SocialPostsController(ISocialFeedService service)
    {
        _service = service;
    }

    /// <summary>Browse the newest public social posts with optional search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<SocialPostDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> List(
        [FromQuery] string? search = null,
        [FromQuery] bool mine = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        var actorId = TryGetActorId();
        if (mine && !actorId.HasValue)
            return Unauthorized();

        try
        {
            var result = await _service.ListPostsAsync(
                search,
                page,
                pageSize,
                actorId,
                mine,
                ct);
            return Ok(ToPostPage(result));
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Open one public post, or an owned hidden post.</summary>
    [HttpGet("{postId:guid}")]
    [ProducesResponseType(typeof(SocialPostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid postId, CancellationToken ct)
    {
        try
        {
            return Ok(ToDto(await _service.GetPostAsync(postId, TryGetActorId(), ct)));
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Publish a social post as the authenticated user.</summary>
    [HttpPost]
    [Authorize(Roles = WriterRoles)]
    [EnableRateLimiting(SocialRateLimitPolicies.Publish)]
    [ProducesResponseType(typeof(SocialPostDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Create(
        CreateSocialPostRequest request,
        CancellationToken ct)
    {
        if (TryGetActorId() is not { } actorId)
            return Unauthorized();

        try
        {
            var post = await _service.CreatePostAsync(
                actorId,
                request.QuestId,
                request.Title,
                request.Content,
                (request.Images ?? [])
                    .Select(image => new SocialPostImageDetails(
                        image.ImageUrl,
                        image.ImageAltText))
                    .ToArray(),
                request.Tags ?? [],
                request.IsHidden,
                ct);
            return StatusCode(StatusCodes.Status201Created, ToDto(post));
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Edit the content of a social post owned by the authenticated user.</summary>
    [HttpPatch("{postId:guid}")]
    [Authorize(Roles = WriterRoles)]
    [EnableRateLimiting(SocialRateLimitPolicies.Publish)]
    [ProducesResponseType(typeof(SocialPostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Update(
        Guid postId,
        UpdateSocialPostRequest request,
        CancellationToken ct)
    {
        if (TryGetActorId() is not { } actorId)
            return Unauthorized();

        try
        {
            var post = await _service.UpdatePostAsync(
                postId,
                actorId,
                request.QuestId,
                request.Title,
                request.Content,
                (request.Images ?? [])
                    .Select(image => new SocialPostImageDetails(
                        image.ImageUrl,
                        image.ImageAltText))
                    .ToArray(),
                request.Tags ?? [],
                ct);
            return Ok(ToDto(post));
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Switch an owned published post between public and hidden.</summary>
    [HttpPatch("{postId:guid}/visibility")]
    [Authorize(Roles = WriterRoles)]
    [EnableRateLimiting(SocialRateLimitPolicies.Publish)]
    [ProducesResponseType(typeof(SocialPostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> SetVisibility(
        Guid postId,
        SetSocialPostVisibilityRequest request,
        CancellationToken ct)
    {
        if (TryGetActorId() is not { } actorId)
            return Unauthorized();

        try
        {
            var post = await _service.SetPostVisibilityAsync(
                postId,
                actorId,
                request.IsHidden,
                ct);
            return Ok(ToDto(post));
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Delete a social post owned by the authenticated user.</summary>
    [HttpDelete("{postId:guid}")]
    [Authorize(Roles = WriterRoles)]
    [EnableRateLimiting(SocialRateLimitPolicies.Publish)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Delete(Guid postId, CancellationToken ct)
    {
        if (TryGetActorId() is not { } actorId)
            return Unauthorized();

        try
        {
            await _service.DeletePostAsync(postId, actorId, ct);
            return NoContent();
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Set the authenticated user's like on a post.</summary>
    [HttpPut("{postId:guid}/like")]
    [Authorize(Roles = WriterRoles)]
    [EnableRateLimiting(SocialRateLimitPolicies.Reaction)]
    [ProducesResponseType(typeof(SetSocialLikeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public Task<IActionResult> Like(Guid postId, CancellationToken ct) =>
        SetLike(postId, true, ct);

    /// <summary>Remove the authenticated user's like from a post.</summary>
    [HttpDelete("{postId:guid}/like")]
    [Authorize(Roles = WriterRoles)]
    [EnableRateLimiting(SocialRateLimitPolicies.Reaction)]
    [ProducesResponseType(typeof(SetSocialLikeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public Task<IActionResult> Unlike(Guid postId, CancellationToken ct) =>
        SetLike(postId, false, ct);

    /// <summary>List top-level comments and their direct replies.</summary>
    [HttpGet("{postId:guid}/comments")]
    [ProducesResponseType(
        typeof(PagedResponse<SocialCommentThreadDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListComments(
        Guid postId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _service.ListCommentsAsync(
                postId,
                page,
                pageSize,
                TryGetActorId(),
                ct);
            return Ok(ToCommentPage(result));
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Create a top-level comment or one direct reply.</summary>
    [HttpPost("{postId:guid}/comments")]
    [Authorize(Roles = WriterRoles)]
    [EnableRateLimiting(SocialRateLimitPolicies.Comment)]
    [ProducesResponseType(typeof(SocialCommentCreatedDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> CreateComment(
        Guid postId,
        CreateSocialCommentRequest request,
        CancellationToken ct)
    {
        if (TryGetActorId() is not { } actorId)
            return Unauthorized();

        try
        {
            var comment = await _service.CreateCommentAsync(
                postId,
                actorId,
                request.ParentCommentId,
                request.Content,
                ct);
            return StatusCode(
                StatusCodes.Status201Created,
                ToCreatedDto(comment));
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Edit a comment or reply owned by the authenticated user.</summary>
    [HttpPatch("{postId:guid}/comments/{commentId:guid}")]
    [Authorize(Roles = WriterRoles)]
    [EnableRateLimiting(SocialRateLimitPolicies.Comment)]
    [ProducesResponseType(typeof(SocialCommentCreatedDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> UpdateComment(
        Guid postId,
        Guid commentId,
        UpdateSocialCommentRequest request,
        CancellationToken ct)
    {
        if (TryGetActorId() is not { } actorId)
            return Unauthorized();

        try
        {
            var comment = await _service.UpdateCommentAsync(
                postId,
                commentId,
                actorId,
                request.Content,
                ct);
            return Ok(ToCreatedDto(comment));
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    private async Task<IActionResult> SetLike(
        Guid postId,
        bool isLiked,
        CancellationToken ct)
    {
        if (TryGetActorId() is not { } actorId)
            return Unauthorized();

        try
        {
            var result = await _service.SetLikeAsync(postId, actorId, isLiked, ct);
            return Ok(new SetSocialLikeDto(result.LikeCount, result.IsLikedByViewer));
        }
        catch (SocialFeedException exception)
        {
            return ToProblem(exception);
        }
    }

    private Guid? TryGetActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId)
            ? actorId
            : null;

    private ObjectResult ToProblem(SocialFeedException exception)
    {
        var problem = exception.Error switch
        {
            SocialFeedError.NotFound => ProblemDetailsHelper.NotFound(exception.Message),
            SocialFeedError.Forbidden => ProblemDetailsHelper.Forbidden(exception.Message),
            SocialFeedError.Validation or
            SocialFeedError.InvalidReplyParent =>
                ProblemDetailsHelper.Validation(exception.Message),
            _ => ProblemDetailsHelper.Validation("Social request failed."),
        };
        return StatusCode(problem.Status ?? StatusCodes.Status500InternalServerError, problem);
    }

    private static PagedResponse<SocialPostDto> ToPostPage(
        PagedResult<SocialPostItem> result) =>
        new()
        {
            Items = result.Items.Select(ToDto).ToArray(),
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount,
            TotalPages = result.TotalPages,
            HasNextPage = result.HasNextPage,
            HasPreviousPage = result.HasPreviousPage,
        };

    private static PagedResponse<SocialCommentThreadDto> ToCommentPage(
        PagedResult<SocialCommentThread> result) =>
        new()
        {
            Items = result.Items.Select(ToThreadDto).ToArray(),
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount,
            TotalPages = result.TotalPages,
            HasNextPage = result.HasNextPage,
            HasPreviousPage = result.HasPreviousPage,
        };

    private static SocialPostDto ToDto(SocialPostItem post) =>
        new(
            post.Id,
            post.Title,
            post.Content,
            post.Images.Select(image => new SocialPostImageDto(
                image.Url,
                image.AltText,
                image.SortOrder)).ToArray(),
            post.Tags,
            post.Quest is null
                ? null
                : new SocialPostQuestDto(
                    post.Quest.Id,
                    post.Quest.Title,
                    post.Quest.CoverImageUrl,
                    post.Quest.LocationDescription,
                    post.Quest.StartAtUtc?.ToString("O")),
            post.AuthorDisplayName,
            post.CreatedAt.ToString("O"),
            post.UpdatedAt.ToString("O"),
            post.LikeCount,
            post.CommentCount,
            post.IsLikedByViewer,
            post.CanDelete,
            post.IsHidden);

    private static SocialCommentThreadDto ToThreadDto(SocialCommentThread thread) =>
        new(
            thread.Comment.Id,
            thread.Comment.PostId,
            thread.Comment.Content,
            thread.Comment.AuthorDisplayName,
            thread.Comment.CreatedAt.ToString("O"),
            thread.Comment.CanEdit,
            thread.Replies.Select(ToReplyDto).ToArray(),
            thread.ReplyCount,
            thread.ReplyCount > thread.Replies.Count);

    private static SocialCommentReplyDto ToReplyDto(SocialCommentItem comment) =>
        new(
            comment.Id,
            comment.PostId,
            comment.ParentCommentId
                ?? throw new InvalidOperationException("Reply is missing its parent."),
            comment.Content,
            comment.AuthorDisplayName,
            comment.CreatedAt.ToString("O"),
            comment.CanEdit);

    private static SocialCommentCreatedDto ToCreatedDto(SocialCommentItem comment) =>
        new(
            comment.Id,
            comment.PostId,
            comment.ParentCommentId,
            comment.Content,
            comment.AuthorDisplayName,
            comment.CreatedAt.ToString("O"),
            comment.CanEdit);
}
