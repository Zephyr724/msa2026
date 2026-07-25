namespace Kiwimpact.Api.Contracts;

public sealed record MyProgressionDto(
    long TotalXp,
    int Level,
    string RankTitle);
