using System.ComponentModel.DataAnnotations;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Security;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.WebUtilities;
using System.Text;
using System.Security.Claims;
using System.Security.Cryptography;

namespace Kiwimpact.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private const string GenericLoginDetail = "The email or password is incorrect.";
    private const string GenericRegistrationDetail =
        "Unable to create an account with the supplied details.";

    private readonly IAntiforgery _antiforgery;
    private readonly KiwimpactDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IAccountEmailSender _emailSender;
    private readonly IAuthenticationSchemeProvider _schemeProvider;
    private readonly ITimeLimitedDataProtector _googleLinkProtector;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAntiforgery antiforgery,
        KiwimpactDbContext db,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IAccountEmailSender emailSender,
        IAuthenticationSchemeProvider schemeProvider,
        IDataProtectionProvider dataProtectionProvider,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _antiforgery = antiforgery;
        _db = db;
        _userManager = userManager;
        _signInManager = signInManager;
        _emailSender = emailSender;
        _schemeProvider = schemeProvider;
        _googleLinkProtector = dataProtectionProvider
            .CreateProtector("Kiwimpact.GoogleLinkStart.v1")
            .ToTimeLimitedDataProtector();
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>Issue an antiforgery request token and its protected cookie.</summary>
    [HttpGet("csrf-token")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AntiforgeryTokenDto), StatusCodes.Status200OK)]
    public ActionResult<AntiforgeryTokenDto> GetCsrfToken()
    {
        var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new AntiforgeryTokenDto(tokens.RequestToken!));
    }

    /// <summary>Create a local email/password account with the Member role.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Register)]
    [ProducesResponseType(typeof(AuthSessionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Register(
        RegisterRequest request,
        [FromHeader(Name = "X-CSRF-TOKEN"), Required] string csrfToken,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        var displayName = request.DisplayName.Trim();
        if (displayName.Length == 0)
        {
            return RegistrationFailure();
        }

        if (!await _db.Roles.AnyAsync(
                role => role.NormalizedName == AppRoles.Member.ToUpperInvariant(),
                cancellationToken))
        {
            return Problem(
                title: "Registration unavailable",
                detail: "Account registration is temporarily unavailable.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            LockoutEnabled = true,
        };

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Identity, role membership, and the domain profile form one
            // account boundary and must either all commit or all roll back.
            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                await transaction.RollbackAsync(cancellationToken);
                return RegistrationFailure();
            }

            var roleResult = await _userManager.AddToRoleAsync(user, AppRoles.Member);
            if (!roleResult.Succeeded)
            {
                await transaction.RollbackAsync(cancellationToken);
                return RegistrationFailure();
            }

            _db.UserProfiles.Add(UserProfile.Create(
                user.Id,
                displayName,
                DateTimeOffset.UtcNow));
            await _db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return RegistrationFailure();
        }

        await SendConfirmationAsync(user, cancellationToken);
        var response = new AuthSessionDto(
            user.Id,
            displayName,
            email,
            [AppRoles.Member],
            HasPassword: true,
            LinkedProviders: []);
        return Created("/api/v1/auth/me", response);
    }

    /// <summary>Confirm an email address using an ASP.NET Core Identity token.</summary>
    [HttpPost("confirm-email")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Register)]
    public async Task<IActionResult> ConfirmEmail(
        ConfirmEmailRequest request,
        [FromHeader(Name = "X-CSRF-TOKEN"), Required] string csrfToken)
    {
        var user = await _userManager.FindByIdAsync(request.UserId.ToString());
        if (user is null || !TryDecodeToken(request.Token, out var token))
            return InvalidLifecycleToken();
        var result = await _userManager.ConfirmEmailAsync(user, token);
        return result.Succeeded
            ? Ok(new AccountLifecycleResultDto("Email confirmed. You can now sign in."))
            : InvalidLifecycleToken();
    }

    /// <summary>Resend confirmation without revealing whether the account exists.</summary>
    [HttpPost("resend-confirmation")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Register)]
    public async Task<IActionResult> ResendConfirmation(
        EmailOnlyRequest request,
        [FromHeader(Name = "X-CSRF-TOKEN"), Required] string csrfToken,
        CancellationToken ct)
    {
        // Always return the same response so this endpoint cannot be used to
        // discover whether an email address has an account.
        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user is not null && !await _userManager.IsEmailConfirmedAsync(user))
            await SendConfirmationAsync(user, ct);
        return Ok(GenericEmailResponse());
    }

    /// <summary>Send a password reset link without account enumeration.</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Register)]
    public async Task<IActionResult> ForgotPassword(
        EmailOnlyRequest request,
        [FromHeader(Name = "X-CSRF-TOKEN"), Required] string csrfToken,
        CancellationToken ct)
    {
        // Eligibility affects email delivery only; the HTTP response remains
        // indistinguishable for unknown, unconfirmed, and confirmed accounts.
        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user is not null && await _userManager.IsEmailConfirmedAsync(user))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
            var url = BuildFrontendUrl(
                "/reset-password", ("email", user.Email ?? request.Email), ("token", encoded));
            await SendPasswordResetAsync(
                user,
                $"Reset your password within 45 minutes:\n{url}",
                ct);
        }
        return Ok(GenericEmailResponse());
    }

    /// <summary>Reset a local password using an Identity token.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Register)]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        [FromHeader(Name = "X-CSRF-TOKEN"), Required] string csrfToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null || !TryDecodeToken(request.Token, out var token))
            return InvalidLifecycleToken();
        var result = await _userManager.ResetPasswordAsync(user, token, request.Password);
        return result.Succeeded
            ? Ok(new AccountLifecycleResultDto("Password reset. You can now sign in."))
            : InvalidLifecycleToken();
    }

    /// <summary>Change the authenticated user's local password.</summary>
    [HttpPost("change-password")]
    [Authorize]
    [EnableRateLimiting(AuthRateLimitPolicies.Register)]
    public async Task<IActionResult> ChangePassword(
        ChangePasswordRequest request,
        [FromHeader(Name = "X-CSRF-TOKEN"), Required] string csrfToken)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();
        if (!await _userManager.HasPasswordAsync(user))
        {
            return Problem(
                title: "Local password unavailable",
                detail: "Add a local password before using password change.",
                statusCode: StatusCodes.Status403Forbidden);
        }
        var result = await _userManager.ChangePasswordAsync(
            user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return Problem(
                title: "Password change failed",
                detail: "The current password is incorrect or the new password is invalid.",
                statusCode: StatusCodes.Status400BadRequest);
        }
        await _signInManager.RefreshSignInAsync(user);
        return Ok(new AccountLifecycleResultDto("Password changed."));
    }

    /// <summary>Start Google sign-in through the configured OAuth handler.</summary>
    [HttpGet("external-login/google")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Login)]
    public async Task<IActionResult> GoogleLogin([FromQuery] string? returnUrl = null)
    {
        if (!await IsGoogleConfiguredAsync())
            return RedirectToLoginError("unavailable");

        var safeReturnUrl = NormalizeFrontendPath(returnUrl);
        var callbackUrl = Url.Action(
            nameof(GoogleLoginCallback),
            values: new { returnUrl = safeReturnUrl });
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme,
            callbackUrl!);
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>Complete Google sign-in after the provider middleware callback.</summary>
    [HttpGet("external-login/google/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleLoginCallback(
        [FromQuery] string? returnUrl = null,
        [FromQuery] string? remoteError = null,
        CancellationToken cancellationToken = default)
    {
        var safeReturnUrl = NormalizeFrontendPath(returnUrl);
        if (!string.IsNullOrWhiteSpace(remoteError))
            return RedirectToLoginError("provider");

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info is null ||
            !string.Equals(
                info.LoginProvider,
                GoogleDefaults.AuthenticationScheme,
                StringComparison.Ordinal))
        {
            return RedirectToLoginError("provider");
        }
        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

        var signInResult = await _signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            isPersistent: false,
            bypassTwoFactor: true);
        if (signInResult.Succeeded)
            return Redirect(BuildFrontendUrl(safeReturnUrl));
        if (signInResult.IsLockedOut)
            return RedirectToLoginError("locked");

        var email = info.Principal.FindFirstValue(ClaimTypes.Email)?.Trim();
        var emailVerified = string.Equals(
            info.Principal.FindFirstValue("urn:google:email_verified"),
            bool.TrueString,
            StringComparison.OrdinalIgnoreCase);
        if (!emailVerified || string.IsNullOrWhiteSpace(email))
            return RedirectToLoginError("unverified_email");

        // An email match is deliberately not enough to link accounts. The
        // owner must authenticate the existing Kiwimpact account and use the
        // explicit settings flow below.
        if (await _userManager.FindByEmailAsync(email) is not null)
            return RedirectToLoginError("account_exists");

        if (!await _db.Roles.AnyAsync(
                role => role.NormalizedName == AppRoles.Member.ToUpperInvariant(),
                cancellationToken))
        {
            return RedirectToLoginError("unavailable");
        }

        var displayName = ResolveGoogleDisplayName(info.Principal, email);
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            LockoutEnabled = true,
        };

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var createResult = await _userManager.CreateAsync(user);
            var roleResult = createResult.Succeeded
                ? await _userManager.AddToRoleAsync(user, AppRoles.Member)
                : IdentityResult.Failed();
            var loginResult = roleResult.Succeeded
                ? await _userManager.AddLoginAsync(user, info)
                : IdentityResult.Failed();
            if (!createResult.Succeeded || !roleResult.Succeeded || !loginResult.Succeeded)
            {
                await transaction.RollbackAsync(cancellationToken);
                return RedirectToLoginError("unavailable");
            }

            _db.UserProfiles.Add(UserProfile.Create(
                user.Id,
                displayName,
                DateTimeOffset.UtcNow));
            await _db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return RedirectToLoginError("unavailable");
        }

        await _signInManager.SignInAsync(user, isPersistent: false);
        return Redirect(BuildFrontendUrl(safeReturnUrl));
    }

    /// <summary>Authorize the authenticated account-linking redirect.</summary>
    [HttpPost("link/google")]
    [Authorize]
    [EnableRateLimiting(AuthRateLimitPolicies.Login)]
    [ProducesResponseType(typeof(ExternalAuthStartDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> LinkGoogle(
        [FromHeader(Name = "X-CSRF-TOKEN"), Required] string csrfToken)
    {
        if (!await IsGoogleConfiguredAsync())
            return GoogleUnavailable();

        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        var existingLogins = await _userManager.GetLoginsAsync(user);
        if (existingLogins.Any(login =>
                string.Equals(
                    login.LoginProvider,
                    GoogleDefaults.AuthenticationScheme,
                    StringComparison.Ordinal)))
        {
            return Ok(new ExternalAuthStartDto(
                BuildFrontendUrl("/settings/profile", ("googleLinked", "1"))));
        }

        var token = _googleLinkProtector.Protect(
            user.Id.ToString(),
            TimeSpan.FromMinutes(5));
        return Ok(new ExternalAuthStartDto(
            Url.Action(nameof(LinkGoogleStart), values: new { token })!));
    }

    /// <summary>Start the provider challenge for an authenticated link request.</summary>
    [HttpGet("link/google/start")]
    [Authorize]
    public async Task<IActionResult> LinkGoogleStart([FromQuery] string? token)
    {
        if (!await IsGoogleConfiguredAsync())
            return GoogleUnavailable();

        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();
        if (string.IsNullOrWhiteSpace(token) ||
            !TryValidateGoogleLinkToken(token, user.Id))
        {
            return Problem(
                title: "Invalid Google link request",
                detail: "Start Google linking again from Profile Settings.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var callbackUrl = Url.Action(nameof(LinkGoogleCallback));
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme,
            callbackUrl!,
            user.Id.ToString());
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>Attach the verified Google identity to the current account.</summary>
    [HttpGet("link/google/callback")]
    [Authorize]
    public async Task<IActionResult> LinkGoogleCallback([FromQuery] string? remoteError = null)
    {
        if (!string.IsNullOrWhiteSpace(remoteError))
            return RedirectToLinkResult("provider");

        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        var info = await _signInManager.GetExternalLoginInfoAsync(user.Id.ToString());
        if (info is null ||
            !string.Equals(
                info.LoginProvider,
                GoogleDefaults.AuthenticationScheme,
                StringComparison.Ordinal))
        {
            return RedirectToLinkResult("provider");
        }
        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

        var linkedUser = await _userManager.FindByLoginAsync(
            info.LoginProvider,
            info.ProviderKey);
        if (linkedUser is not null && linkedUser.Id != user.Id)
            return RedirectToLinkResult("already_linked");

        if (linkedUser is null)
        {
            try
            {
                var result = await _userManager.AddLoginAsync(user, info);
                if (!result.Succeeded)
                    return RedirectToLinkResult("unavailable");
            }
            catch (DbUpdateException)
            {
                // The provider-login primary key remains authoritative when
                // two accounts race to link the same Google identity.
                return RedirectToLinkResult("unavailable");
            }
        }

        await _signInManager.RefreshSignInAsync(user);
        return Redirect(BuildFrontendUrl(
            "/settings/profile",
            ("googleLinked", "1")));
    }

    /// <summary>Issue the Identity application cookie for valid credentials.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Login)]
    [ProducesResponseType(typeof(AuthSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login(
        LoginRequest request,
        [FromHeader(Name = "X-CSRF-TOKEN"), Required] string csrfToken,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return LoginFailure();
        }

        var result = await _signInManager.PasswordSignInAsync(
            user,
            request.Password,
            isPersistent: false,
            lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            return LoginFailure();
        }

        var session = await CreateSessionAsync(user, cancellationToken);
        if (session is null)
        {
            await _signInManager.SignOutAsync();
            return LoginFailure();
        }

        return Ok(session);
    }

    /// <summary>Return the allowlisted current browser session.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(AuthSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        var session = await CreateSessionAsync(user, cancellationToken);
        return session is null ? Unauthorized() : Ok(session);
    }

    /// <summary>Clear the Identity application cookie.</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(
        [FromHeader(Name = "X-CSRF-TOKEN"), Required] string csrfToken)
    {
        await _signInManager.SignOutAsync();
        return NoContent();
    }

    private async Task<AuthSessionDto?> CreateSessionAsync(
        ApplicationUser user,
        CancellationToken cancellationToken)
    {
        var profile = await _db.UserProfiles
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == user.Id, cancellationToken);
        if (profile is null || string.IsNullOrWhiteSpace(user.Email))
        {
            return null;
        }

        var roles = await _userManager.GetRolesAsync(user);
        var logins = await _userManager.GetLoginsAsync(user);
        return new AuthSessionDto(
            user.Id,
            profile.DisplayName,
            user.Email,
            roles.Order(StringComparer.Ordinal).ToArray(),
            await _userManager.HasPasswordAsync(user),
            logins
                .Select(login => login.LoginProvider)
                .Order(StringComparer.Ordinal)
                .ToArray());
    }

    private ObjectResult RegistrationFailure()
    {
        return Problem(
            title: "Registration failed",
            detail: GenericRegistrationDetail,
            statusCode: StatusCodes.Status400BadRequest);
    }

    private ObjectResult LoginFailure()
    {
        return Problem(
            title: "Invalid credentials",
            detail: GenericLoginDetail,
            statusCode: StatusCodes.Status401Unauthorized);
    }

    private async Task SendConfirmationAsync(ApplicationUser user, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(user.Email))
            return;
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var url = BuildFrontendUrl(
            "/confirm-email", ("userId", user.Id.ToString()), ("token", encoded));
        try
        {
            await _emailSender.SendAsync(
                user.Email,
                "Confirm your Kiwimpact email",
                $"Confirm your email within 24 hours:\n{url}", ct);
        }
        catch (Exception exception)
        {
            // Registration remains successful even when delivery is
            // temporarily unavailable; the member can request another email.
            _logger.LogError(
                exception,
                "Confirmation email delivery failed for account {UserId}.",
                user.Id);
        }
    }

    private async Task SendPasswordResetAsync(
        ApplicationUser user, string message, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(user.Email))
            return;
        try
        {
            await _emailSender.SendAsync(
                user.Email,
                "Reset your Kiwimpact password",
                message,
                ct);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Password reset email delivery failed for account {UserId}.",
                user.Id);
        }
    }

    private string BuildFrontendUrl(string path, params (string Key, string Value)[] query)
    {
        var root = (_configuration["Auth:FrontendBaseUrl"] ?? "http://localhost:5173")
            .TrimEnd('/');
        return FrontendAccountLinkBuilder.Build(root, path, query);
    }

    private async Task<bool> IsGoogleConfiguredAsync() =>
        await _schemeProvider.GetSchemeAsync(GoogleDefaults.AuthenticationScheme) is not null;

    private ObjectResult GoogleUnavailable() =>
        Problem(
            title: "Google sign-in unavailable",
            detail: "Google sign-in is not configured for this environment.",
            statusCode: StatusCodes.Status503ServiceUnavailable);

    private RedirectResult RedirectToLoginError(string error) =>
        Redirect(BuildFrontendUrl("/login", ("externalError", error)));

    private RedirectResult RedirectToLinkResult(string error) =>
        Redirect(BuildFrontendUrl("/settings/profile", ("googleError", error)));

    private string NormalizeFrontendPath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path) ||
            !Url.IsLocalUrl(path) ||
            !path.StartsWith("/", StringComparison.Ordinal) ||
            path.StartsWith("//", StringComparison.Ordinal) ||
            path.Contains('\\'))
        {
            return "/";
        }

        return path;
    }

    private bool TryValidateGoogleLinkToken(string token, Guid userId)
    {
        try
        {
            var protectedUserId = _googleLinkProtector.Unprotect(
                token,
                out _);
            return Guid.TryParse(protectedUserId, out var parsedUserId) &&
                parsedUserId == userId;
        }
        catch (CryptographicException)
        {
            return false;
        }
    }

    private static string ResolveGoogleDisplayName(ClaimsPrincipal principal, string email)
    {
        var candidate = principal.FindFirstValue(ClaimTypes.Name)?.Trim();
        if (string.IsNullOrWhiteSpace(candidate))
            candidate = email.Split('@', 2)[0];
        return candidate.Length <= UserProfile.MaxDisplayNameLength
            ? candidate
            : candidate[..UserProfile.MaxDisplayNameLength];
    }

    private static bool TryDecodeToken(string encoded, out string token)
    {
        try
        {
            token = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(encoded));
            return token.Length > 0;
        }
        catch (FormatException)
        {
            token = string.Empty;
            return false;
        }
    }

    private AccountLifecycleResultDto GenericEmailResponse() =>
        new("If the account is eligible, an email has been sent.");

    private ObjectResult InvalidLifecycleToken() =>
        Problem(
            title: "Invalid or expired link",
            detail: "This account link is invalid or has expired.",
            statusCode: StatusCodes.Status400BadRequest);
}
