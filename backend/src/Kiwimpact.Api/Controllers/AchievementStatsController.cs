using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/achievement-stats")]
public sealed class AchievementStatsController : ControllerBase
{
    private readonly IAchievementService _service;

    public AchievementStatsController(IAchievementService service)
    {
        _service = service;
    }

    /// <summary>
    /// Returns public nationwide aggregate rarity for every active
    /// achievement. No member identities or regional slices are exposed.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<AchievementNationwideStatDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        typeof(ProblemDetails),
        StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        try
        {
            var items = await _service.GetNationwideStatsAsync(ct);
            return Ok(items.Select(item => item.ToDto()).ToList());
        }
        catch (AchievementReadException exception)
            when (exception.Error == AchievementReadError.NotReady)
        {
            var problem = ProblemDetailsHelper.ProgressionNotReady();
            return StatusCode(
                problem.Status ?? StatusCodes.Status503ServiceUnavailable,
                problem);
        }
    }
}
