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
public sealed class ProgressionController : ControllerBase
{
    private readonly IProgressionService _service;

    public ProgressionController(IProgressionService service)
    {
        _service = service;
    }

    /// <summary>
    /// Read the authenticated user's own server-authoritative XP, level, and
    /// rank title. Returns 503 progression-not-ready while any Verified
    /// completion still lacks its XP row.
    /// </summary>
    [HttpGet("progression")]
    [ProducesResponseType(typeof(MyProgressionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetMyProgression(CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId))
            return Unauthorized();

        try
        {
            return Ok((await _service.GetMyProgressionAsync(actorId, ct)).ToDto());
        }
        catch (ProgressionException exception)
        {
            var problem = exception.Error switch
            {
                ProgressionError.NotReady => ProblemDetailsHelper.ProgressionNotReady(),
                _ => ProblemDetailsHelper.ProfileNotFound(),
            };
            return StatusCode(
                problem.Status ?? StatusCodes.Status500InternalServerError,
                problem);
        }
    }
}
