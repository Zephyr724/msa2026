using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Route("api/v1/regions")]
public sealed class RegionsController : ControllerBase
{
    private readonly IRegionReadService _regionService;

    public RegionsController(IRegionReadService regionService)
    {
        _regionService = regionService;
    }

    /// <summary>
    /// List active LocalArea regions or AdministrativeArea cities with
    /// optional search. The default remains LocalArea for API compatibility.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RegionSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRegions(
        [FromQuery] string? type,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (search is { Length: > 100 })
            return ValidationProblem("Search must be at most 100 characters.");

        var regions = type switch
        {
            null or "LocalArea" =>
                await _regionService.GetActiveLocalAreasAsync(search, ct),
            "AdministrativeArea" =>
                await _regionService.GetActiveAdministrativeAreasAsync(search, ct),
            _ => null,
        };
        if (regions is null)
        {
            return ValidationProblem(
                "Region type must be LocalArea or AdministrativeArea.");
        }
        var dto = regions.Select(r => r.ToSummary()).ToList();
        return Ok(dto);
    }

    /// <summary>
    /// Get a single active Region by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RegionSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRegion(Guid id, CancellationToken ct)
    {
        var region = await _regionService.GetActiveRegionAsync(id, ct);
        if (region is null)
            return NotFound(ProblemDetailsHelper.NotFound("Region not found or inactive."));

        return Ok(region.ToSummary());
    }

    /// <summary>
    /// List active direct children of a Region.
    /// </summary>
    [HttpGet("{id:guid}/children")]
    [ProducesResponseType(typeof(IReadOnlyList<RegionSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetChildren(Guid id, CancellationToken ct)
    {
        var region = await _regionService.GetActiveRegionAsync(id, ct);
        if (region is null)
            return NotFound(ProblemDetailsHelper.NotFound("Region not found or inactive."));

        var children = await _regionService.GetActiveChildrenAsync(id, ct);
        var dto = children.Select(c => c.ToSummary()).ToList();
        return Ok(dto);
    }

    /// <summary>
    /// List active ancestors of a Region from nearest parent to root.
    /// </summary>
    [HttpGet("{id:guid}/ancestors")]
    [ProducesResponseType(typeof(IReadOnlyList<RegionSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAncestors(Guid id, CancellationToken ct)
    {
        var region = await _regionService.GetActiveRegionAsync(id, ct);
        if (region is null)
            return NotFound(ProblemDetailsHelper.NotFound("Region not found or inactive."));

        var ancestors = await _regionService.GetActiveAncestorsAsync(id, ct);
        var dto = ancestors.Select(a => a.ToSummary()).ToList();
        return Ok(dto);
    }

    private ObjectResult ValidationProblem(string detail)
    {
        return Problem(detail, statusCode: StatusCodes.Status400BadRequest);
    }
}
