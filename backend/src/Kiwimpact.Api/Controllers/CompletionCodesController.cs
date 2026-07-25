using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Organizer + "," + AppRoles.Admin)]
[Route("api/v1/organizer/quests")]
public sealed class CompletionCodesController : ControllerBase
{
    private readonly IQuestCompletionService _service;

    public CompletionCodesController(IQuestCompletionService service)
    {
        _service = service;
    }

    /// <summary>Generate or rotate the active Completion Code for a manageable Quest.</summary>
    [HttpPost("{questId:guid}/completion-codes")]
    [ProducesResponseType(typeof(GeneratedCompletionCodeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GenerateOrRotate(Guid questId, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var generated = await _service.GenerateOrRotateAsync(
                questId, actorId, User.IsInRole(AppRoles.Admin), ct);
            return Created(
                $"/api/v1/organizer/quests/{questId}/completion-codes",
                generated.ToDto());
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    /// <summary>Read metadata-only active Completion Code configuration status.</summary>
    [HttpGet("{questId:guid}/completion-codes")]
    [ProducesResponseType(typeof(CompletionCodeStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStatus(Guid questId, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var status = await _service.GetCodeStatusAsync(
                questId, actorId, User.IsInRole(AppRoles.Admin), ct);
            return Ok(status.ToDto());
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    private bool TryGetActor(out Guid actorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);
}
