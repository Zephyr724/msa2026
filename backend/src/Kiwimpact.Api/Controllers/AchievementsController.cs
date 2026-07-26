using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/achievements")]
public sealed class AchievementsController : ControllerBase
{
    private readonly IAchievementService _service;

    public AchievementsController(IAchievementService service)
    {
        _service = service;
    }

    /// <summary>
    /// Read the public active achievement catalog ordered by code.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<AchievementCatalogItemDto>),
        StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCatalog(CancellationToken ct)
    {
        var items = await _service.GetCatalogAsync(ct);
        return Ok(items.Select(item => item.ToDto()).ToList());
    }
}
