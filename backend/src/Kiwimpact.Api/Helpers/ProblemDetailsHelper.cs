using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api;

internal static class ProblemDetailsHelper
{
    public static ProblemDetails NotFound(string detail)
    {
        return new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.5",
            Title = "Not Found",
            Status = StatusCodes.Status404NotFound,
            Detail = detail
        };
    }

    public static ProblemDetails Validation(string detail)
    {
        return new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.1",
            Title = "Bad Request",
            Status = StatusCodes.Status400BadRequest,
            Detail = detail
        };
    }

    public static ProblemDetails Forbidden(string detail)
    {
        return new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.4",
            Title = "Forbidden",
            Status = StatusCodes.Status403Forbidden,
            Detail = detail
        };
    }

    public static ProblemDetails Conflict(string detail)
    {
        return new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.10",
            Title = "Conflict",
            Status = StatusCodes.Status409Conflict,
            Detail = detail
        };
    }

    public static ProblemDetails InvalidCompletionCode()
    {
        return new ProblemDetails
        {
            Type = "https://kiwimpact.app/problems/invalid-completion-code",
            Title = "Invalid Completion Code",
            Status = StatusCodes.Status400BadRequest,
            Detail = "The completion code is invalid."
        };
    }

    public static ProblemDetails ProgressionNotReady()
    {
        return new ProblemDetails
        {
            Type = "https://kiwimpact.app/problems/progression-not-ready",
            Title = "Progression Not Ready",
            Status = StatusCodes.Status503ServiceUnavailable,
            Detail = "Progression state is not ready yet."
        };
    }

    public static ProblemDetails LeaderboardNotReady()
    {
        return new ProblemDetails
        {
            Type = "https://kiwimpact.app/problems/leaderboard-not-ready",
            Title = "Leaderboard Not Ready",
            Status = StatusCodes.Status503ServiceUnavailable,
            Detail = "Leaderboard state is not ready yet."
        };
    }
}
