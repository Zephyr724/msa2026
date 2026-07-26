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
[Route("api/v1/users/me/achievements")]
public sealed class UserAchievementsController : ControllerBase
{
    private readonly IAchievementService _service;

    public UserAchievementsController(IAchievementService service)
    {
        _service = service;
    }

    /// <summary>
    /// Read the authenticated user's own active earned achievements ordered
    /// by award timestamp and code.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<EarnedAchievementItemDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId))
            return Unauthorized();

        try
        {
            var items = await _service.GetMyEarnedAsync(actorId, ct);
            return Ok(items.Select(item => item.ToDto()).ToList());
        }
        catch (AchievementReadException exception)
        {
            var problem = exception.Error switch
            {
                AchievementReadError.NotReady =>
                    ProblemDetailsHelper.ProgressionNotReady(),
                _ => ProblemDetailsHelper.NotFound(exception.Message),
            };
            return StatusCode(
                problem.Status ?? StatusCodes.Status500InternalServerError,
                problem);
        }
    }
}
