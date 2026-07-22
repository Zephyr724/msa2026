using Microsoft.AspNetCore.Mvc;

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
    /// <summary>
    /// Returns a successful response when the API process is healthy.
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "Healthy" });
    }
}