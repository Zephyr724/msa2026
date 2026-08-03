using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kiwimpact.IntegrationTests.Api;

internal sealed class FakeGoogleOptions : AuthenticationSchemeOptions
{
    public string Email { get; set; } = "google-member@example.test";
    public string Name { get; set; } = "Google Member";
    public string ProviderKey { get; set; } = "google-provider-key";
    public bool EmailVerified { get; set; } = true;
}

/// <summary>
/// Replaces only Google's remote round trip. Identity external-cookie,
/// correlation properties, callbacks, user creation, and linking remain real.
/// </summary>
internal sealed class FakeGoogleHandler : AuthenticationHandler<FakeGoogleOptions>
{
    public FakeGoogleHandler(
        IOptionsMonitor<FakeGoogleOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync() =>
        Task.FromResult(AuthenticateResult.NoResult());

    protected override async Task HandleChallengeAsync(
        AuthenticationProperties properties)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Options.ProviderKey),
            new Claim(ClaimTypes.Email, Options.Email),
            new Claim(ClaimTypes.Name, Options.Name),
            new Claim(
                "urn:google:email_verified",
                Options.EmailVerified ? bool.TrueString : bool.FalseString,
                ClaimValueTypes.Boolean),
        };
        var principal = new ClaimsPrincipal(
            new ClaimsIdentity(claims, Scheme.Name));
        await Context.SignInAsync(
            IdentityConstants.ExternalScheme,
            principal,
            properties);
        Response.Redirect(properties.RedirectUri!);
    }
}
