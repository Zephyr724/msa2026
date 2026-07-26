namespace Kiwimpact.Infrastructure.Reconciliation;

public sealed class AchievementBackfillOptions
{
    public const string SectionName = "AchievementBackfill";

    public bool Enabled { get; set; } = true;
    public int BatchSize { get; set; } = 100;
    public TimeSpan InitialDelay { get; set; } = TimeSpan.FromSeconds(15);
    public TimeSpan IdleInterval { get; set; } = TimeSpan.FromHours(24);
    public int MaxConsecutiveRowFailures { get; set; } = 10;
}
