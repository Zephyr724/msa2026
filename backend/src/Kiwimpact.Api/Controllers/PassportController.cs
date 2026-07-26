using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Member + "," + AppRoles.Organizer + "," + AppRoles.Admin)]
[Route("api/v1/users/me")]
public sealed class PassportController : ControllerBase
{
    private readonly IPassportService _service;

    public PassportController(IPassportService service)
    {
        _service = service;
    }

    /// <summary>
    /// Read the authenticated user's own Verified completion history, newest
    /// verification first. Returns 404 when the caller has no profile and
    /// 503 progression-not-ready while the caller owns a Verified completion
    /// that lacks its verification timestamp.
    /// </summary>
    [HttpGet("passport/completions")]
    [ProducesResponseType(typeof(PagedResponse<PassportCompletionItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetMyCompletions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId))
            return Unauthorized();

        try
        {
            var (items, totalCount) = await _service.GetMyCompletionsAsync(
                actorId, page, pageSize, ct);

            // Normalize page/pageSize for the response
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 12 : Math.Min(pageSize, 50);

            var totalPages = pageSize > 0 ? (int)Math.Ceiling((double)totalCount / pageSize) : 0;

            var response = new PagedResponse<PassportCompletionItemDto>
            {
                Items = items.Select(item => item.ToDto()).ToList(),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1
            };

            return Ok(response);
        }
        catch (PassportException exception)
        {
            var problem = exception.Error switch
            {
                PassportError.NotReady => ProblemDetailsHelper.ProgressionNotReady(),
                _ => ProblemDetailsHelper.NotFound(exception.Message),
            };
            return StatusCode(
                problem.Status ?? StatusCodes.Status500InternalServerError,
                problem);
        }
    }
}
