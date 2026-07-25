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
[Route("api/v1/quests")]
public sealed class QuestParticipationController : ControllerBase
{
    private readonly IQuestParticipationService _service;

    public QuestParticipationController(IQuestParticipationService service)
    {
        _service = service;
    }

    /// <summary>Join an eligible Quest as the authenticated user.</summary>
    [HttpPost("{questId:guid}/join")]
    [ProducesResponseType(typeof(QuestParticipationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Join(Guid questId, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var participation = await _service.JoinAsync(questId, actorId, ct);
            return Created(
                $"/api/v1/quests/{questId}/participation",
                participation.ToDto());
        }
        catch (QuestParticipationException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Cancel the authenticated user's active Quest participation.</summary>
    [HttpPost("{questId:guid}/cancel")]
    [ProducesResponseType(typeof(QuestParticipationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(Guid questId, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var participation = await _service.CancelAsync(questId, actorId, ct);
            return Ok(participation.ToDto());
        }
        catch (QuestParticipationException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Read the authenticated user's participation state for a Quest.</summary>
    [HttpGet("{questId:guid}/participation")]
    [ProducesResponseType(typeof(MyQuestParticipationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetState(Guid questId, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var state = await _service.GetStateAsync(questId, actorId, ct);
            return Ok(state.ToDto());
        }
        catch (QuestParticipationException exception)
        {
            return ToProblem(exception);
        }
    }

    private bool TryGetActor(out Guid actorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);

    private ObjectResult ToProblem(QuestParticipationException exception)
    {
        var problem = exception.Error switch
        {
            QuestParticipationError.NotFound =>
                ProblemDetailsHelper.NotFound(exception.Message),
            QuestParticipationError.RegistrationModeNotSupported =>
                ProblemDetailsHelper.Validation(exception.Message),
            QuestParticipationError.OwnQuest or
            QuestParticipationError.AlreadyParticipating or
            QuestParticipationError.QuestNotPublished or
            QuestParticipationError.QuestEnded or
            QuestParticipationError.CapacityFull or
            QuestParticipationError.NoActiveParticipation or
            QuestParticipationError.Concurrency =>
                ProblemDetailsHelper.Conflict(exception.Message),
            _ => ProblemDetailsHelper.Conflict("Participation request failed."),
        };

        return StatusCode(problem.Status ?? StatusCodes.Status500InternalServerError, problem);
    }
}
