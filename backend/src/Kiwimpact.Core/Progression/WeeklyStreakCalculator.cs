namespace Kiwimpact.Core.Progression;

public sealed record WeeklyStreakState(
    int CurrentWeeks,
    bool HasVerifiedImpactThisWeek);

public static class WeeklyStreakCalculator
{
    public static WeeklyStreakState Calculate(
        IEnumerable<DateTimeOffset> awardTimestamps,
        DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(awardTimestamps);
        var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland");
        var currentWeek = WeekStart(
            DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, zone).DateTime));
        var activeWeeks = awardTimestamps
            .Select(item => WeekStart(
                DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(item, zone).DateTime)))
            .ToHashSet();
        var hasCurrent = activeWeeks.Contains(currentWeek);
        // A member can retain the streak from the immediately preceding week
        // while the current week is still in progress.
        var cursor = hasCurrent ? currentWeek : currentWeek.AddDays(-7);
        var count = 0;
        while (activeWeeks.Contains(cursor))
        {
            count++;
            cursor = cursor.AddDays(-7);
        }
        return new WeeklyStreakState(count, hasCurrent);
    }

    private static DateOnly WeekStart(DateOnly date) =>
        date.AddDays(-(((int)date.DayOfWeek + 6) % 7));
}
