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
}