using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Member + "," + AppRoles.Organizer + "," + AppRoles.Admin)]
[Route("api/v1/users/me/claims")]
public sealed class EvidenceClaimsController : ControllerBase
{
    private readonly IQuestCompletionService _service;

    public EvidenceClaimsController(IQuestCompletionService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, CancellationToken ct)
    {
        if (!TryActor(out var actorId))
            return Unauthorized();
        QuestCompletionStatus? parsed = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<QuestCompletionStatus>(status, true, out var value))
                return BadRequest(new ProblemDetails
                {
                    Status = 400, Title = "Invalid claim status",
                    Detail = "Status must be Pending, Verified, or Rejected.",
                });
            if (value is not (QuestCompletionStatus.Pending or
                QuestCompletionStatus.Verified or QuestCompletionStatus.Rejected))
            {
                return BadRequest(new ProblemDetails
                {
                    Status = 400, Title = "Invalid claim status",
                    Detail = "Status must be Pending, Verified, or Rejected.",
                });
            }
            parsed = value;
        }
        var items = await _service.ListMyClaimsAsync(actorId, parsed, ct);
        return Ok(items.Select(QuestCompletionController.ToDto));
    }

    [HttpGet("{claimId:guid}")]
    public async Task<IActionResult> Get(Guid claimId, CancellationToken ct)
    {
        if (!TryActor(out var actorId))
            return Unauthorized();
        try
        {
            return Ok(QuestCompletionController.ToDto(
                await _service.GetClaimAsync(claimId, actorId, User.IsInRole(AppRoles.Admin), ct)));
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    [HttpPut("{claimId:guid}")]
    public async Task<IActionResult> Update(
        Guid claimId, EvidenceClaimRequest request, CancellationToken ct)
    {
        if (!TryActor(out var actorId))
            return Unauthorized();
        try
        {
            var item = await _service.UpdateClaimAsync(
                claimId, actorId,
                new EvidenceClaimInput(
                    request.Description, request.EvidenceUrl,
                    request.UserDeclaration, request.CompletedAtUtc), ct);
            return Ok(QuestCompletionController.ToDto(item));
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    [HttpDelete("{claimId:guid}")]
    public async Task<IActionResult> Withdraw(Guid claimId, CancellationToken ct)
    {
        if (!TryActor(out var actorId))
            return Unauthorized();
        try
        {
            await _service.WithdrawClaimAsync(claimId, actorId, ct);
            return NoContent();
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    private bool TryActor(out Guid actorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);
}

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/v1/admin/claims")]
public sealed class AdminEvidenceClaimsController : ControllerBase
{
    private readonly IQuestCompletionService _service;

    public AdminEvidenceClaimsController(IQuestCompletionService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok((await _service.ListPendingClaimsAsync(ct))
            .Select(QuestCompletionController.ToDto));

    [HttpGet("{claimId:guid}")]
    public async Task<IActionResult> Get(Guid claimId, CancellationToken ct)
    {
        if (!TryActor(out var actorId))
            return Unauthorized();
        try
        {
            return Ok(QuestCompletionController.ToDto(
                await _service.GetClaimAsync(claimId, actorId, true, ct)));
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    [HttpPost("{claimId:guid}/review")]
    public async Task<IActionResult> Review(
        Guid claimId, ReviewEvidenceClaimRequest request, CancellationToken ct)
    {
        if (!TryActor(out var actorId))
            return Unauthorized();
        try
        {
            return Ok(QuestCompletionController.ToDto(
                await _service.ReviewClaimAsync(
                    claimId, actorId, request.Approve, request.ReviewNote, ct)));
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    private bool TryActor(out Guid actorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);
}
