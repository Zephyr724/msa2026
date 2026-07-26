using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Api.Reconciliation;

public sealed class EvidencePurgeHostedService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<EvidencePurgeHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!configuration.GetValue("EvidencePurge:Enabled", true))
            return;

        var initialDelay = configuration.GetValue(
            "EvidencePurge:InitialDelay", TimeSpan.FromMinutes(2));
        var interval = configuration.GetValue(
            "EvidencePurge:Interval", TimeSpan.FromHours(12));
        if (initialDelay > TimeSpan.Zero)
            await Task.Delay(initialDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
                var now = DateTimeOffset.UtcNow;
                var due = await db.EvidenceClaimDetails
                    .Where(item => item.EvidencePurgeDueAt != null &&
                        item.EvidencePurgeDueAt <= now &&
                        item.EvidencePurgedAt == null)
                    .OrderBy(item => item.EvidencePurgeDueAt)
                    .Take(100)
                    .ToListAsync(stoppingToken);
                foreach (var item in due)
                    item.Purge(now);
                if (due.Count > 0)
                    await db.SaveChangesAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Evidence purge pass failed.");
            }

            await Task.Delay(interval, stoppingToken);
        }
    }
}
