using Kiwimpact.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Api.Controllers;

/// <summary>
/// Foundation health endpoint for process liveness checks.
/// Contains no secrets, connection strings, environment variables,
/// or internal exception details.
/// </summary>
[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly KiwimpactDbContext _db;

    public HealthController(KiwimpactDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns a successful response when the API process is healthy.
    /// </summary>
    [HttpGet]
    [HttpGet("live")]
    public IActionResult Get()
    {
        return Ok(new { status = "Healthy" });
    }

    /// <summary>
    /// Returns success only when PostgreSQL is reachable and every reviewed EF
    /// migration has been applied. Internal connection/schema details are
    /// deliberately withheld.
    /// </summary>
    [HttpGet("ready")]
    public async Task<IActionResult> Ready(CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(3));
        try
        {
            if (!await _db.Database.CanConnectAsync(timeout.Token))
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new { status = "NotReady" });

            var pendingMigrations = await _db.Database
                .GetPendingMigrationsAsync(timeout.Token);
            if (pendingMigrations.Any())
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new { status = "NotReady" });

            return Ok(new { status = "Ready" });
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { status = "NotReady" });
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { status = "NotReady" });
        }
    }
}
