using System.Security.Claims;

namespace Kiwimpact.Api.Security;

public static class SocialRateLimitPolicies
{
    public const string Publish = "social-publish";
    public const string Comment = "social-comment";
    public const string Reaction = "social-reaction";

    public static string ActorPartitionKey(HttpContext context)
    {
        var actor = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(actor)
            ? $"ip:{context.Connection.RemoteIpAddress}"
            : $"user:{actor}";
    }
}
