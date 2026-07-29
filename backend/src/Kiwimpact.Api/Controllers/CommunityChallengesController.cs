using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/community-challenges")]
public sealed class CommunityChallengesController : ControllerBase
{
    private readonly KiwimpactDbContext _db;

    public CommunityChallengesController(KiwimpactDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CommunityChallengeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] Guid? regionId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        ChallengeStatus? parsedStatus = null;
        ChallengeStatus value = default;
        if (status is not null &&
            (!Enum.TryParse(status, true, out value) ||
             !Enum.IsDefined(value) ||
             int.TryParse(status, out _)))
        {
            var problem = ProblemDetailsHelper.Validation("Challenge status is invalid.");
            return StatusCode(problem.Status!.Value, problem);
        }
        else if (status is not null)
        {
            parsedStatus = value;
        }

        var query = _db.CommunityChallenges
            .AsNoTracking()
            .Include(item => item.LocalAreaRegion)
            .AsQueryable();
        if (regionId.HasValue)
            query = query.Where(item => item.LocalAreaRegionId == regionId.Value);
        if (parsedStatus.HasValue)
            query = query.Where(item => item.Status == parsedStatus.Value);
        var challenges = await query
            .OrderByDescending(item => item.PeriodStart)
            .ThenBy(item => item.LocalAreaRegion!.Name)
            .ToListAsync(ct);
        var result = new List<CommunityChallengeDto>(challenges.Count);
        foreach (var challenge in challenges)
            result.Add(await ToDtoAsync(challenge, ct));
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CommunityChallengeDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var challenge = await _db.CommunityChallenges
            .AsNoTracking()
            .Include(item => item.LocalAreaRegion)
            .SingleOrDefaultAsync(item => item.Id == id, ct);
        return challenge is null
            ? NotFound()
            : Ok(await ToDtoAsync(challenge, ct));
    }

    [HttpGet("{id:guid}/progress")]
    [ProducesResponseType(typeof(CommunityChallengeProgressDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Progress(Guid id, CancellationToken ct)
    {
        var challenge = await _db.CommunityChallenges
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id, ct);
        if (challenge is null)
            return NotFound();
        var progress = await ReadProgressAsync(challenge, ct);
        return Ok(new CommunityChallengeProgressDto(
            challenge.Id,
            challenge.TargetValue,
            progress.Count,
            Percentage(progress.Count, challenge.TargetValue),
            progress.Contributors < LeaderboardService.PrivacyThreshold,
            progress.Contributors < LeaderboardService.PrivacyThreshold
                ? null
                : progress.Contributors));
    }

    private async Task<CommunityChallengeDto> ToDtoAsync(
        CommunityChallenge challenge,
        CancellationToken ct)
    {
        var progress = await ReadProgressAsync(challenge, ct);
        // Use the same privacy threshold as leaderboards so related community
        // surfaces cannot reveal a protected contributor count indirectly.
        var protectedCount =
            progress.Contributors < LeaderboardService.PrivacyThreshold;
        return new CommunityChallengeDto(
            challenge.Id,
            challenge.LocalAreaRegion!.ToSummary(),
            challenge.PeriodStart.ToString("O"),
            challenge.PeriodEnd.ToString("O"),
            challenge.TargetType,
            challenge.TargetValue,
            challenge.RewardAchievementId,
            challenge.Status.ToString(),
            progress.Count,
            Percentage(progress.Count, challenge.TargetValue),
            protectedCount,
            protectedCount ? null : progress.Contributors,
            challenge.Version);
    }

    private async Task<(long Count, int Contributors)> ReadProgressAsync(
        CommunityChallenge challenge,
        CancellationToken ct)
    {
        // Community attribution is the immutable award-time snapshot, and the
        // half-open period prevents a boundary award counting twice.
        var query = _db.XpTransactions.AsNoTracking().Where(item =>
            item.CommunityRegionIdAtAward == challenge.LocalAreaRegionId &&
            item.CreatedAt >= challenge.PeriodStart &&
            item.CreatedAt < challenge.PeriodEnd);
        return (
            await query.LongCountAsync(ct),
            await query.Select(item => item.UserId).Distinct().CountAsync(ct));
    }

    private static decimal Percentage(long progress, int target) =>
        decimal.Round(Math.Min(100m, decimal.Divide(progress * 100, target)), 1);
}

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/v1/admin/community-challenges")]
public sealed class AdminCommunityChallengesController : ControllerBase
{
    private readonly KiwimpactDbContext _db;

    public AdminCommunityChallengesController(KiwimpactDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    [ProducesResponseType(typeof(CommunityChallengeMutationResultDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        UpsertCommunityChallengeRequest request,
        CancellationToken ct)
    {
        var validation = await ValidateReferencesAsync(request, ct);
        if (validation is not null)
            return validation;
        if (await _db.CommunityChallenges.AnyAsync(item =>
                item.LocalAreaRegionId == request.LocalAreaRegionId &&
                item.Status == ChallengeStatus.Active,
                ct))
        {
            return ConflictProblem("This Local Area already has an Active challenge.");
        }

        try
        {
            var challenge = CommunityChallenge.Create(
                request.LocalAreaRegionId,
                request.PeriodStartUtc,
                request.PeriodEndUtc,
                request.TargetValue,
                request.RewardAchievementId,
                DateTimeOffset.UtcNow);
            _db.CommunityChallenges.Add(challenge);
            await _db.SaveChangesAsync(ct);
            return Created(
                $"/api/v1/community-challenges/{challenge.Id}",
                new CommunityChallengeMutationResultDto(
                    challenge.Id,
                    challenge.Version));
        }
        catch (ArgumentException exception)
        {
            return ValidationProblemResult(exception.Message);
        }
        catch (DbUpdateException)
        {
            // The database constraint remains authoritative if concurrent
            // create requests both pass the friendly preflight check.
            return ConflictProblem("The challenge conflicts with an existing Active challenge.");
        }
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpsertCommunityChallengeRequest request,
        CancellationToken ct)
    {
        var challenge = await _db.CommunityChallenges
            .SingleOrDefaultAsync(item => item.Id == id, ct);
        if (challenge is null)
            return NotFound();
        if (request.Version == 0 || challenge.Version != request.Version)
            return ConflictProblem("The challenge was changed by another request.");
        var validation = await ValidateReferencesAsync(request, ct);
        if (validation is not null)
            return validation;
        var progress = await ProgressAsync(challenge, ct);
        try
        {
            challenge.UpdateCompetitiveFields(
                request.LocalAreaRegionId,
                request.PeriodStartUtc,
                request.PeriodEndUtc,
                request.TargetValue,
                request.RewardAchievementId,
                progress,
                DateTimeOffset.UtcNow);
            await _db.SaveChangesAsync(ct);
            return Ok(new CommunityChallengeMutationResultDto(
                challenge.Id,
                challenge.Version));
        }
        catch (ArgumentException exception)
        {
            return ValidationProblemResult(exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            return ConflictProblem(exception.Message);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ConflictProblem("The challenge was changed by another request.");
        }
        catch (DbUpdateException)
        {
            return ConflictProblem(
                "The challenge conflicts with an existing Active challenge.");
        }
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(
        Guid id,
        CommunityChallengeVersionRequest request,
        CancellationToken ct)
    {
        var challenge = await _db.CommunityChallenges
            .SingleOrDefaultAsync(item => item.Id == id, ct);
        if (challenge is null)
            return NotFound();
        if (request.Version == 0 || challenge.Version != request.Version)
            return ConflictProblem("The challenge was changed by another request.");
        try
        {
            challenge.Cancel(DateTimeOffset.UtcNow);
            await _db.SaveChangesAsync(ct);
            return Ok(new CommunityChallengeMutationResultDto(
                challenge.Id,
                challenge.Version));
        }
        catch (InvalidOperationException exception)
        {
            return ConflictProblem(exception.Message);
        }
    }

    private async Task<IActionResult?> ValidateReferencesAsync(
        UpsertCommunityChallengeRequest request,
        CancellationToken ct)
    {
        var localArea = await _db.Regions.AsNoTracking().SingleOrDefaultAsync(
            item => item.Id == request.LocalAreaRegionId && item.IsActive,
            ct);
        if (localArea is null || localArea.Type != RegionType.LocalArea)
            return ValidationProblemResult(
                "Challenge region must be an active Local Area.");
        if (request.RewardAchievementId.HasValue &&
            !await _db.Achievements.AsNoTracking().AnyAsync(
                item =>
                    item.Id == request.RewardAchievementId.Value &&
                    item.IsActive,
                ct))
        {
            return ValidationProblemResult(
                "Reward achievement must be active.");
        }
        return null;
    }

    private Task<long> ProgressAsync(
        CommunityChallenge challenge,
        CancellationToken ct) =>
        _db.XpTransactions.AsNoTracking().LongCountAsync(item =>
            item.CommunityRegionIdAtAward == challenge.LocalAreaRegionId &&
            item.CreatedAt >= challenge.PeriodStart &&
            item.CreatedAt < challenge.PeriodEnd,
            ct);

    private ObjectResult ValidationProblemResult(string detail)
    {
        var problem = ProblemDetailsHelper.Validation(detail);
        return StatusCode(problem.Status!.Value, problem);
    }

    private ObjectResult ConflictProblem(string detail)
    {
        var problem = ProblemDetailsHelper.Conflict(detail);
        return StatusCode(problem.Status!.Value, problem);
    }
}
