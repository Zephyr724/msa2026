using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class PublicPassportsController : ControllerBase
{
    private readonly IPublicPassportService _service;

    public PublicPassportsController(IPublicPassportService service) => _service = service;

    [HttpGet("users/me/public-passport")]
    [Authorize]
    [ProducesResponseType(typeof(PublicPassportSettingsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        if (ActorId() is not { } actorId)
            return Unauthorized();
        try
        {
            return Ok(ToDto(await _service.GetSettingsAsync(actorId, ct)));
        }
        catch (PublicPassportException exception)
        {
            return ToProblem(exception);
        }
    }

    [HttpPut("users/me/public-passport")]
    [Authorize]
    [ProducesResponseType(typeof(PublicPassportSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSettings(
        UpdatePublicPassportRequest request,
        CancellationToken ct)
    {
        if (ActorId() is not { } actorId)
            return Unauthorized();
        try
        {
            return Ok(ToDto(await _service.UpdateSettingsAsync(
                actorId,
                request.IsEnabled,
                request.FeaturedAchievementIds ?? [],
                ct)));
        }
        catch (PublicPassportException exception)
        {
            return ToProblem(exception);
        }
    }

    [HttpGet("users/me/verified-completions/{completionId:guid}/story-context")]
    [Authorize]
    [ProducesResponseType(typeof(VerifiedStoryContextDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStoryContext(Guid completionId, CancellationToken ct)
    {
        if (ActorId() is not { } actorId)
            return Unauthorized();
        try
        {
            var context = await _service.GetVerifiedStoryContextAsync(actorId, completionId, ct);
            return Ok(new VerifiedStoryContextDto(
                context.CompletionId,
                context.QuestId,
                context.QuestTitle));
        }
        catch (PublicPassportException exception)
        {
            return ToProblem(exception);
        }
    }

    [HttpGet("public/passports/{shareIdentifier}")]
    [ProducesResponseType(typeof(PublicPassportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPublic(string shareIdentifier, CancellationToken ct)
    {
        if (!Guid.TryParse(shareIdentifier, out var shareId) || shareId == Guid.Empty)
            return PublicNotFound();
        try
        {
            return Ok(ToDto(await _service.GetPublicAsync(shareId, ct)));
        }
        catch (PublicPassportException exception)
        {
            return exception.Error == PublicPassportError.NotFound
                ? PublicNotFound()
                : ToProblem(exception);
        }
    }

    private Guid? ActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId)
            ? actorId
            : null;

    private IActionResult PublicNotFound() => Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Public Passport not found.",
        type: "https://kiwimpact.app/problems/public-passport-not-found");

    private IActionResult ToProblem(PublicPassportException exception) => exception.Error switch
    {
        PublicPassportError.Validation => Problem(
            statusCode: StatusCodes.Status400BadRequest,
            title: exception.Message,
            type: "https://kiwimpact.app/problems/public-passport-validation"),
        _ => Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: exception.Message,
            type: "https://kiwimpact.app/problems/public-passport-not-found"),
    };

    private static PublicPassportSettingsDto ToDto(PublicPassportSettings settings) =>
        new(settings.IsEnabled, settings.ShareId, settings.FeaturedAchievementIds);

    private static PublicPassportDto ToDto(PublicPassportView passport) =>
        new(
            passport.DisplayName,
            passport.VerifiedXp,
            passport.VerifiedQuestCount,
            passport.Level,
            passport.RankTitle,
            new PublicPassportTrophyDto(
                passport.Trophy.Tier.ToString(),
                passport.Trophy.NationwideEarnedCount,
                passport.Trophy.NationwideMemberCount,
                passport.Trophy.EarnedPercentage,
                passport.Trophy.Rarity.ToString()),
            passport.FeaturedAchievements.Select(achievement =>
                new PublicPassportAchievementDto(
                    achievement.AchievementId,
                    achievement.Name,
                    achievement.Description,
                    achievement.IconUrl,
                    achievement.Category,
                    achievement.NationwideEarnedCount,
                    achievement.NationwideMemberCount,
                    achievement.EarnedPercentage,
                    achievement.Rarity.ToString())).ToArray(),
            passport.VerifiedStories.Select(story =>
                new PublicPassportStoryDto(
                    story.PostId,
                    story.Title,
                    story.Content,
                    story.Images.Select(image => new PublicPassportStoryImageDto(
                        image.Url,
                        image.AltText,
                        image.SortOrder)).ToArray(),
                    story.Tags,
                    story.QuestTitle,
                    story.QuestCoverImageUrl,
                    story.CreatedAt.ToString("O"))).ToArray());
}
