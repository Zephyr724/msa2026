using System.ComponentModel.DataAnnotations;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Security;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

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

    public AuthController(
        IAntiforgery antiforgery,
        KiwimpactDbContext db,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        _antiforgery = antiforgery;
        _db = db;
        _userManager = userManager;
        _signInManager = signInManager;
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

        var response = new AuthSessionDto(
            user.Id,
            displayName,
            email,
            [AppRoles.Member]);
        return Created("/api/v1/auth/me", response);
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
        return new AuthSessionDto(
            user.Id,
            profile.DisplayName,
            user.Email,
            roles.Order(StringComparer.Ordinal).ToArray());
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
}
