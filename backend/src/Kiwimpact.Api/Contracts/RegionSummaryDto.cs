namespace Kiwimpact.Api.Contracts;

public sealed record RegionSummaryDto(
    Guid Id,
    string Name,
    string Type,
    Guid? ParentRegionId);