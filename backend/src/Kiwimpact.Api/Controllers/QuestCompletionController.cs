using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Api.Security;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Member + "," + AppRoles.Organizer + "," + AppRoles.Admin)]
[Route("api/v1/quests")]
public sealed class QuestCompletionController : ControllerBase
{
    private readonly IQuestCompletionService _service;

    public QuestCompletionController(IQuestCompletionService service)
    {
        _service = service;
    }

    /// <summary>Redeem a Completion Code as the authenticated active participant.</summary>
    [HttpPost("{questId:guid}/redeem")]
    [EnableRateLimiting(CompletionCodeRateLimitPolicies.Redeem)]
    [ProducesResponseType(typeof(MyQuestCompletionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Redeem(
        Guid questId,
        [FromBody] RedeemCompletionCodeRequest? request,
        CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var state = await _service.RedeemAsync(questId, actorId, request?.Code, ct);
            return Created(
                $"/api/v1/quests/{questId}/completion",
                state.ToDto());
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    /// <summary>Read the authenticated user's completion state for a visible Quest.</summary>
    [HttpGet("{questId:guid}/completion")]
    [ProducesResponseType(typeof(MyQuestCompletionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetState(Guid questId, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            return Ok((await _service.GetStateAsync(questId, actorId, ct)).ToDto());
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    private bool TryGetActor(out Guid actorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);
}
