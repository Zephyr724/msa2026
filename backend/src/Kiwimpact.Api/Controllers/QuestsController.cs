using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Route("api/v1/quests")]
public sealed class QuestsController : ControllerBase
{
    private readonly IQuestDiscoveryService _questService;

    public QuestsController(IQuestDiscoveryService questService)
    {
        _questService = questService;
    }

    /// <summary>
    /// Browse published Quests with filters, search, sorting, and pagination.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<QuestListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetQuests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? category = null,
        [FromQuery] string? sourceType = null,
        [FromQuery] string? difficulty = null,
        [FromQuery] string? regionId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken ct = default)
    {
        try
        {
            var (items, totalCount) = await _questService.GetPublishedPageAsync(
                page, pageSize, category, sourceType, difficulty,
                regionId, search, sortBy, sortDirection, ct);

            var dto = items.Select(q => q.ToListItem()).ToList();

            // Normalize page/pageSize for the response
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 12 : Math.Min(pageSize, 50);

            var totalPages = pageSize > 0 ? (int)Math.Ceiling((double)totalCount / pageSize) : 0;

            var response = new PagedResponse<QuestListItemDto>
            {
                Items = dto,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1
            };

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ProblemDetailsHelper.Validation(ex.Message));
        }
    }

    /// <summary>
    /// Get a published Quest by ID with detail fields.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(QuestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuest(Guid id, CancellationToken ct)
    {
        var quest = await _questService.GetPublishedByIdAsync(id, ct);
        if (quest is null)
            return NotFound(ProblemDetailsHelper.NotFound("Quest not found."));

        return Ok(quest.ToDetail());
    }

    /// <summary>
    /// Get images for a published Quest.
    /// </summary>
    [HttpGet("{id:guid}/images")]
    [ProducesResponseType(typeof(IReadOnlyList<QuestImageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuestImages(Guid id, CancellationToken ct)
    {
        // Verify Quest exists and is published
        var quest = await _questService.GetPublishedByIdAsync(id, ct);
        if (quest is null)
            return NotFound(ProblemDetailsHelper.NotFound("Quest not found."));

        var images = await _questService.GetPublishedImagesAsync(id, ct);
        var dto = images.Select(i => i.ToDto()).ToList();
        return Ok(dto);
    }
}