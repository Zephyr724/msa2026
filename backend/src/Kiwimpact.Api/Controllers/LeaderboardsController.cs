using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/leaderboards")]
public sealed class LeaderboardsController : ControllerBase
{
    private readonly ILeaderboardService _service;

    public LeaderboardsController(ILeaderboardService service)
    {
        _service = service;
    }

    /// <summary>
    /// Read the people leaderboard across community, Auckland, or New Zealand.
    /// Returns 503 while any Verified completion still lacks its XP row.
    /// </summary>
    [HttpGet("people")]
    [ProducesResponseType(typeof(PeopleLeaderboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetPeople(
        [FromQuery] string? scope,
        [FromQuery] string? period,
        [FromQuery] string? page,
        [FromQuery] string? pageSize,
        CancellationToken ct)
    {
        try
        {
            // ASP.NET Core may normalize an explicitly empty simple-string
            // query value to null. Preserve presence so omitted values can
            // default while ?scope= and ?page= remain invalid by contract.
            var boundScope = Request.Query.ContainsKey("scope")
                ? scope ?? string.Empty
                : null;
            var boundPeriod = Request.Query.ContainsKey("period")
                ? period ?? string.Empty
                : null;
            var boundPage = Request.Query.ContainsKey("page")
                ? page ?? string.Empty
                : null;
            var boundPageSize = Request.Query.ContainsKey("pageSize")
                ? pageSize ?? string.Empty
                : null;
            var leaderboard = await _service.GetPeopleLeaderboardAsync(
                Guid.TryParse(
                    User.FindFirstValue(ClaimTypes.NameIdentifier),
                    out var actorId)
                    ? actorId
                    : null,
                boundScope,
                boundPeriod,
                boundPage,
                boundPageSize,
                ct);
            return Ok(leaderboard.ToDto());
        }
        catch (LeaderboardException exception)
        {
            var problem = exception.Error switch
            {
                LeaderboardError.InvalidParameters =>
                    ProblemDetailsHelper.Validation(exception.Message),
                LeaderboardError.Unauthorized =>
                    ProblemDetailsHelper.Unauthorized(exception.Message),
                LeaderboardError.NotReady =>
                    ProblemDetailsHelper.LeaderboardNotReady(),
                _ => throw new InvalidOperationException(
                    "Unsupported leaderboard error.", exception),
            };
            return StatusCode(
                problem.Status ?? StatusCodes.Status500InternalServerError,
                problem);
        }
    }

    [HttpGet("communities")]
    [ProducesResponseType(typeof(CommunitiesLeaderboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetCommunities(
        [FromQuery] string? scope,
        [FromQuery] string? period,
        CancellationToken ct)
    {
        try
        {
            var leaderboard = await _service.GetCommunitiesLeaderboardAsync(
                Request.Query.ContainsKey("scope") ? scope ?? string.Empty : null,
                Request.Query.ContainsKey("period") ? period ?? string.Empty : null,
                ct);
            return Ok(leaderboard.ToDto());
        }
        catch (LeaderboardException exception)
        {
            var problem = exception.Error switch
            {
                LeaderboardError.InvalidParameters =>
                    ProblemDetailsHelper.Validation(exception.Message),
                LeaderboardError.NotReady =>
                    ProblemDetailsHelper.LeaderboardNotReady(),
                _ => throw new InvalidOperationException(
                    "Unsupported leaderboard error.", exception),
            };
            return StatusCode(problem.Status!.Value, problem);
        }
    }
}
