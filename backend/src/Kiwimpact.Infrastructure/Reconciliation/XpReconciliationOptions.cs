namespace Kiwimpact.Infrastructure.Reconciliation;

public sealed class XpReconciliationOptions
{
    public const string SectionName = "XpReconciliation";

    public bool Enabled { get; set; } = true;
    public int BatchSize { get; set; } = 100;
    public TimeSpan InitialDelay { get; set; } = TimeSpan.FromSeconds(10);
    public TimeSpan IdleInterval { get; set; } = TimeSpan.FromHours(24);
    public int MaxConsecutiveRowFailures { get; set; } = 10;
}
