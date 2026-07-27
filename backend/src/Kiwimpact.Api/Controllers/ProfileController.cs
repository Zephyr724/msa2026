using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Member + "," + AppRoles.Organizer + "," + AppRoles.Admin)]
[Route("api/v1/users/me/profile")]
public sealed class ProfileController : ControllerBase
{
    private static readonly TimeSpan CommunityChangeCooldown = TimeSpan.FromDays(30);
    private readonly KiwimpactDbContext _db;

    public ProfileController(KiwimpactDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [ProducesResponseType(typeof(MyProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        var profile = await _db.UserProfiles
            .AsNoTracking()
            .Include(item => item.HomeCommunityRegion)
            .SingleOrDefaultAsync(item => item.Id == actorId, ct);
        return profile is null
            ? NotFound()
            : Ok(ToDto(profile));
    }

    [HttpPatch]
    [ProducesResponseType(typeof(MyProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        UpdateMyProfileRequest request,
        CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        var profile = await _db.UserProfiles
            .Include(item => item.HomeCommunityRegion)
            .SingleOrDefaultAsync(item => item.Id == actorId, ct);
        if (profile is null)
            return NotFound();

        if (request.HomeCommunityRegionId.HasValue)
        {
            var region = await _db.Regions.SingleOrDefaultAsync(
                item =>
                    item.Id == request.HomeCommunityRegionId.Value &&
                    item.IsActive,
                ct);
            if (region is null || region.Type != RegionType.LocalArea)
            {
                var problem = ProblemDetailsHelper.Validation(
                    "Home Community must be an active Local Area.");
                return StatusCode(problem.Status!.Value, problem);
            }
        }

        try
        {
            profile.UpdateCommunity(
                request.HomeCommunityRegionId,
                request.ShowCommunityOnPassport,
                DateTimeOffset.UtcNow,
                CommunityChangeCooldown);
            await _db.SaveChangesAsync(ct);
            await _db.Entry(profile).Reference(item => item.HomeCommunityRegion).LoadAsync(ct);
            return Ok(ToDto(profile));
        }
        catch (InvalidOperationException exception)
        {
            var problem = ProblemDetailsHelper.Conflict(exception.Message);
            return StatusCode(problem.Status!.Value, problem);
        }
    }

    private static MyProfileDto ToDto(Kiwimpact.Core.Entities.UserProfile profile)
    {
        var changeAvailableAt = profile.HomeCommunityRegionId.HasValue &&
            profile.LastCommunityChangeAt.HasValue
                ? profile.LastCommunityChangeAt.Value
                    .Add(CommunityChangeCooldown)
                    .ToString("O")
                : null;
        return new MyProfileDto(
            profile.DisplayName,
            profile.HomeCommunityRegion?.ToSummary(),
            profile.ShowCommunityOnPassport,
            changeAvailableAt);
    }

    private bool TryGetActor(out Guid actorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);
}
