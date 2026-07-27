namespace Kiwimpact.Api.Contracts;

public sealed record WeeklyStreakDto(
    int CurrentWeeks,
    bool HasVerifiedImpactThisWeek);
