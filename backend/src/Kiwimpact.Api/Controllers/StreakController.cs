using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Progression;
using Kiwimpact.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Member + "," + AppRoles.Organizer + "," + AppRoles.Admin)]
[Route("api/v1/users/me/streak")]
public sealed class StreakController : ControllerBase
{
    private readonly KiwimpactDbContext _db;

    public StreakController(KiwimpactDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [ProducesResponseType(typeof(WeeklyStreakDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        if (!Guid.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var actorId))
        {
            return Unauthorized();
        }

        var timestamps = await _db.XpTransactions
            .AsNoTracking()
            .Where(item => item.UserId == actorId)
            .Select(item => item.CreatedAt)
            .ToListAsync(ct);
        var state = WeeklyStreakCalculator.Calculate(
            timestamps,
            DateTimeOffset.UtcNow);
        return Ok(new WeeklyStreakDto(
            state.CurrentWeeks,
            state.HasVerifiedImpactThisWeek));
    }
}
