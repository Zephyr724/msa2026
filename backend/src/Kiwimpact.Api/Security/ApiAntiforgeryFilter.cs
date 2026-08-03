using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Kiwimpact.Api.Security;

public sealed class ApiAntiforgeryFilter : IAsyncAuthorizationFilter
{
    public const string ProblemType = "https://kiwimpact.app/problems/invalid-csrf-token";

    private readonly IAntiforgery _antiforgery;

    public ApiAntiforgeryFilter(IAntiforgery antiforgery)
    {
        _antiforgery = antiforgery;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var request = context.HttpContext.Request;
        // Cookie-authenticated API mutations require antiforgery validation;
        // safe methods and non-API middleware paths remain untouched.
        if (!request.Path.StartsWithSegments("/api") ||
            HttpMethods.IsGet(request.Method) ||
            HttpMethods.IsHead(request.Method) ||
            HttpMethods.IsOptions(request.Method) ||
            HttpMethods.IsTrace(request.Method))
        {
            return;
        }

        try
        {
            await _antiforgery.ValidateRequestAsync(context.HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            // A stable problem type allows the SPA transport to refresh its
            // request token and replay a replay-safe mutation once.
            context.Result = new ObjectResult(new ProblemDetails
            {
                Type = ProblemType,
                Title = "Invalid antiforgery token",
                Status = StatusCodes.Status400BadRequest,
                Detail = "Refresh the antiforgery token and try the request again.",
                Instance = request.Path,
            })
            {
                StatusCode = StatusCodes.Status400BadRequest,
                ContentTypes = { "application/problem+json" },
            };
        }
    }
}
