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
public sealed class OrganizerQuestsController : ControllerBase
{
    private readonly IQuestManagementService _service;

    public OrganizerQuestsController(IQuestManagementService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<QuestManagementListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var quests = await _service.ListAsync(actorId, IsAdmin(), ct);
            return Ok(quests.Select(quest => quest.ToManagementListItem()).ToList());
        }
        catch (QuestManagementException ex)
        {
            return ToProblem(ex);
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(QuestManagementDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(CreateQuestRequest request, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var quest = await _service.CreateAsync(actorId, request.ToCommand(), ct);
            return CreatedAtRoute(
                nameof(Get),
                new { id = quest.Id },
                quest.ToManagementDetail());
        }
        catch (QuestManagementException ex)
        {
            return ToProblem(ex);
        }
    }

    [HttpGet("{id:guid}", Name = nameof(Get))]
    [ProducesResponseType(typeof(QuestManagementDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var quest = await _service.GetAsync(actorId, IsAdmin(), id, ct);
            return Ok(quest.ToManagementDetail());
        }
        catch (QuestManagementException ex)
        {
            return ToProblem(ex);
        }
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(QuestManagementDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, UpdateQuestRequest request, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var quest = await _service.UpdateAsync(actorId, IsAdmin(), id, request.ToCommand(), ct);
            return Ok(quest.ToManagementDetail());
        }
        catch (QuestManagementException ex)
        {
            return ToProblem(ex);
        }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(
        Guid id, [FromBody] QuestVersionRequest request, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            await _service.DeleteAsync(actorId, IsAdmin(), id, request.Version, ct);
            return NoContent();
        }
        catch (QuestManagementException ex)
        {
            return ToProblem(ex);
        }
    }

    [HttpPost("{id:guid}/publish")]
    [ProducesResponseType(typeof(QuestManagementDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<IActionResult> Publish(
        Guid id, QuestVersionRequest request, CancellationToken ct) =>
        ChangeStatus((actorId, isAdmin) =>
            _service.PublishAsync(actorId, isAdmin, id, request.Version, ct));

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(QuestManagementDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<IActionResult> Cancel(
        Guid id, CancelQuestRequest request, CancellationToken ct) =>
        ChangeStatus((actorId, isAdmin) =>
            _service.CancelAsync(
                actorId, isAdmin, id, request.Version, request.ConfirmActiveParticipants, ct));

    [HttpPost("{id:guid}/archive")]
    [ProducesResponseType(typeof(QuestManagementDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<IActionResult> Archive(
        Guid id, QuestVersionRequest request, CancellationToken ct) =>
        ChangeStatus((actorId, isAdmin) =>
            _service.ArchiveAsync(actorId, isAdmin, id, request.Version, ct));

    private async Task<IActionResult> ChangeStatus(
        Func<Guid, bool, Task<Kiwimpact.Core.Entities.Quest>> change)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();

        try
        {
            var quest = await change(actorId, IsAdmin());
            return Ok(quest.ToManagementDetail());
        }
        catch (QuestManagementException ex)
        {
            return ToProblem(ex);
        }
    }

    private bool TryGetActor(out Guid actorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);

    private bool IsAdmin() => User.IsInRole(AppRoles.Admin);

    private ObjectResult ToProblem(QuestManagementException exception)
    {
        var problem = exception.Error switch
        {
            QuestManagementError.Validation => ProblemDetailsHelper.Validation(exception.Message),
            QuestManagementError.NotFound => ProblemDetailsHelper.NotFound(exception.Message),
            QuestManagementError.Forbidden => ProblemDetailsHelper.Forbidden(exception.Message),
            QuestManagementError.Conflict => ProblemDetailsHelper.Conflict(exception.Message),
            _ => ProblemDetailsHelper.Conflict("Quest management request failed."),
        };
        return StatusCode(problem.Status ?? StatusCodes.Status500InternalServerError, problem);
    }
}
