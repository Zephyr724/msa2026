using System.ComponentModel.DataAnnotations;
using Kiwimpact.Core.Entities;

namespace Kiwimpact.Api.Contracts;

public sealed class RegisterRequest
{
    public RegisterRequest()
    {
    }

    public RegisterRequest(
        string email,
        string password,
        string passwordConfirmation,
        string displayName)
    {
        Email = email;
        Password = password;
        PasswordConfirmation = passwordConfirmation;
        DisplayName = displayName;
    }

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(12), MaxLength(128)]
    public string Password { get; init; } = string.Empty;

    [Required, Compare(nameof(Password))]
    public string PasswordConfirmation { get; init; } = string.Empty;

    [Required, MaxLength(UserProfile.MaxDisplayNameLength)]
    public string DisplayName { get; init; } = string.Empty;
}

public sealed class LoginRequest
{
    public LoginRequest()
    {
    }

    public LoginRequest(string email, string password)
    {
        Email = email;
        Password = password;
    }

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, MaxLength(128)]
    public string Password { get; init; } = string.Empty;
}

public sealed record AuthSessionDto(
    Guid UserId,
    string DisplayName,
    string Email,
    IReadOnlyList<string> Roles);

public sealed record AntiforgeryTokenDto(string Token);
