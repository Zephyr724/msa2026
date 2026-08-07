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
[Route("api/v1/users/me/reward-events")]
public sealed class RewardEventsController : ControllerBase
{
    private readonly IQuestCompletionService _service;

    public RewardEventsController(IQuestCompletionService service) => _service = service;

    [HttpGet("unseen")]
    [ProducesResponseType(typeof(RewardEventInboxDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListUnseen(
        [FromQuery] int take = 10,
        CancellationToken ct = default)
    {
        if (!TryActor(out var actorId)) return Unauthorized();
        if (take is < 1 or > 25)
            return BadRequest(ProblemDetailsHelper.Validation("Take must be between 1 and 25."));
        var items = await _service.ListUnseenRewardEventsAsync(actorId, take, ct);
        return Ok(new RewardEventInboxDto(items.Select(item => item.ToDto()).ToArray()));
    }

    [HttpPost("{rewardEventId:guid}/seen")]
    [ProducesResponseType(typeof(CompletionRewardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkSeen(
        Guid rewardEventId,
        CancellationToken ct = default)
    {
        if (!TryActor(out var actorId)) return Unauthorized();
        try
        {
            return Ok((await _service.MarkRewardEventSeenAsync(
                rewardEventId, actorId, ct)).ToDto());
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    private bool TryActor(out Guid actorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);
}
