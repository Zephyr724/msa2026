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
[Route("api/v1/users/me/achievement-profile")]
public sealed class AchievementProfileController : ControllerBase
{
    private readonly IAchievementService _service;

    public AchievementProfileController(IAchievementService service)
    {
        _service = service;
    }

    /// <summary>
    /// Returns the authenticated member's derived trophy and automatically
    /// equipped Passport cosmetics.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(AchievementProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(
        typeof(ProblemDetails),
        StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        if (!Guid.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var actorId))
        {
            return Unauthorized();
        }

        try
        {
            var profile = await _service.GetMyAchievementProfileAsync(
                actorId,
                ct);
            return Ok(profile.ToDto());
        }
        catch (AchievementReadException exception)
        {
            var problem = exception.Error switch
            {
                AchievementReadError.NotReady =>
                    ProblemDetailsHelper.ProgressionNotReady(),
                _ => ProblemDetailsHelper.ProfileNotFound(),
            };
            return StatusCode(
                problem.Status ?? StatusCodes.Status500InternalServerError,
                problem);
        }
    }
}
