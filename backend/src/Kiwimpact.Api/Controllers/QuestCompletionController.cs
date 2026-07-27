using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Hubs;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Api.Security;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Member + "," + AppRoles.Organizer + "," + AppRoles.Admin)]
[Route("api/v1/quests")]
public sealed class QuestCompletionController : ControllerBase
{
    private readonly IQuestCompletionService _service;
    private readonly IHubContext<LeaderboardHub> _hub;

    public QuestCompletionController(
        IQuestCompletionService service,
        IHubContext<LeaderboardHub> hub)
    {
        _service = service;
        _hub = hub;
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
            await _hub.Clients.All.SendAsync(
                LeaderboardHub.ImpactChangedEvent,
                ct);
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

    /// <summary>Submit private evidence for Admin review.</summary>
    [HttpPost("{questId:guid}/claims")]
    [ProducesResponseType(typeof(EvidenceClaimDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> SubmitClaim(
        Guid questId, EvidenceClaimRequest request, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();
        try
        {
            var result = await _service.SubmitClaimAsync(
                questId, actorId,
                new EvidenceClaimInput(
                    request.Description, request.EvidenceUrl,
                    request.UserDeclaration, request.CompletedAtUtc),
                ct);
            return Created($"/api/v1/users/me/claims/{result.ClaimId}", ToDto(result));
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    /// <summary>Record a completion without verification or rewards.</summary>
    [HttpPost("{questId:guid}/self-report")]
    [ProducesResponseType(typeof(MyQuestCompletionDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> SelfReport(
        Guid questId, SelfReportRequest request, CancellationToken ct)
    {
        if (!TryGetActor(out var actorId))
            return Unauthorized();
        try
        {
            var result = await _service.SelfReportAsync(
                questId, actorId, request.CompletedAtUtc, ct);
            return Created($"/api/v1/quests/{questId}/completion", result.ToDto());
        }
        catch (QuestCompletionException exception)
        {
            return QuestCompletionProblemMapper.ToProblem(this, exception);
        }
    }

    internal static EvidenceClaimDto ToDto(EvidenceClaimRecord item) =>
        new(item.ClaimId, item.UserId, item.QuestId, item.QuestTitle,
            item.Status.ToString(), item.CompletedAtUtc.ToUniversalTime().ToString("O"),
            item.CreatedAtUtc.ToUniversalTime().ToString("O"), item.Description,
            item.EvidenceUrl, item.UserDeclaration, item.ReviewNote,
            item.ReviewedByUserId, item.ReviewedAtUtc?.ToUniversalTime().ToString("O"),
            item.EvidencePurgedAtUtc?.ToUniversalTime().ToString("O"));

    internal static EvidenceClaimSummaryDto ToDto(EvidenceClaimSummary item) =>
        new(item.ClaimId, item.UserId, item.QuestId, item.QuestTitle,
            item.Status.ToString(), item.CompletedAtUtc.ToUniversalTime().ToString("O"),
            item.CreatedAtUtc.ToUniversalTime().ToString("O"),
            item.ReviewedAtUtc?.ToUniversalTime().ToString("O"));

    private bool TryGetActor(out Guid actorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);
}
