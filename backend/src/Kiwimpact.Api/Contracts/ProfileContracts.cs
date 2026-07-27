namespace Kiwimpact.Api.Contracts;

public sealed record MyProfileDto(
    string DisplayName,
    RegionSummaryDto? HomeCommunity,
    bool ShowCommunityOnPassport,
    string? CommunityChangeAvailableAtUtc);

public sealed record UpdateMyProfileRequest(
    Guid? HomeCommunityRegionId,
    bool ShowCommunityOnPassport);
