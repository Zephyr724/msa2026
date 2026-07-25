using Kiwimpact.Infrastructure.Reconciliation;
using Microsoft.Extensions.Options;

namespace Kiwimpact.Api.Reconciliation;

/// <summary>
/// Thin hosting wrapper around <see cref="XpReconciliationRunner"/>. All
/// reconciliation execution lives in Infrastructure; this class only owns the
/// hosted lifecycle (initial delay, idle loop, shutdown) and bounded error
/// logging. The hosted service never propagates a failure to the host.
/// </summary>
public sealed class XpReconciliationHostedService : BackgroundService
{
    private readonly XpReconciliationRunner _runner;
    private readonly IOptions<XpReconciliationOptions> _options;
    private readonly ILogger<XpReconciliationHostedService> _logger;

    public XpReconciliationHostedService(
        XpReconciliationRunner runner,
        IOptions<XpReconciliationOptions> options,
        ILogger<XpReconciliationHostedService> logger)
    {
        _runner = runner;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = _options.Value;
        if (!options.Enabled)
        {
            _logger.LogInformation("XP reconciliation is disabled; no pass will run.");
            return;
        }

        try
        {
            await Task.Delay(options.InitialDelay, stoppingToken);
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await _runner.ReconcilePassAsync(stoppingToken);
                }
                catch (Exception exception) when (exception is not OperationCanceledException)
                {
                    _logger.LogError(
                        "XP reconciliation pass failed unexpectedly ({ExceptionType}).",
                        exception.GetType().Name);
                }

                await Task.Delay(options.IdleInterval, stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Normal host shutdown.
        }
    }
}
