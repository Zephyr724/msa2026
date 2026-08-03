using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Security;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.WebUtilities;
using System.Text;
using Microsoft.Extensions.Options;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class AuthApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private const string ValidPassword = "ValidPass!1234";
    private readonly CustomWebApplicationFactory _factory;

    public AuthApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_CreatesMemberAndProfileAtomically_AndIgnoresRoleInput()
    {
        using var host = CreateIsolatedHost();
        var client = host.CreateClient();
        using (var optionsScope = host.Services.CreateScope())
        {
            Assert.Equal(
                TimeSpan.FromHours(24),
                optionsScope.ServiceProvider
                    .GetRequiredService<IOptions<DataProtectionTokenProviderOptions>>()
                    .Value.TokenLifespan);
            Assert.Equal(
                TimeSpan.FromMinutes(45),
                optionsScope.ServiceProvider
                    .GetRequiredService<IOptions<PasswordResetTokenProviderOptions>>()
                    .Value.TokenLifespan);
        }
        var email = UniqueEmail();
        var token = await GetCsrfTokenAsync(client);

        var response = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/register",
            new
            {
                email,
                password = ValidPassword,
                passwordConfirmation = ValidPassword,
                displayName = "  Test Member  ",
                role = AppRoles.Admin,
                roles = new[] { AppRoles.Organizer },
            },
            token);

        Assert.True(
            response.StatusCode == HttpStatusCode.Created,
            await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var account = await response.Content.ReadFromJsonAsync<AuthSessionDto>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(account);
        Assert.Equal("Test Member", account.DisplayName);
        Assert.Equal([AppRoles.Member], account.Roles);

        using var scope = host.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user);
        Assert.Equal([AppRoles.Member], await userManager.GetRolesAsync(user));

        var profile = await db.UserProfiles.SingleAsync(
            item => item.Id == user.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal("Test Member", profile.DisplayName);
        Assert.Null(profile.HomeCommunityRegionId);
        Assert.Null(profile.LastCommunityChangeAt);
        Assert.False(profile.ShowCommunityOnPassport);
        Assert.Equal(profile.CreatedAt, profile.UpdatedAt);
    }

    [Fact]
    public async Task Register_DuplicateAndInvalidRequestsFailWithoutIdentityDetails()
    {
        using var host = CreateIsolatedHost();
        var client = host.CreateClient();
        var email = UniqueEmail();
        var first = await RegisterAsync(client, email);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var duplicate = await RegisterAsync(client, email);
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);
        var duplicateProblem = await duplicate.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(
            "Unable to create an account with the supplied details.",
            duplicateProblem.GetProperty("detail").GetString());
        Assert.DoesNotContain("duplicate", duplicateProblem.ToString(), StringComparison.OrdinalIgnoreCase);

        var token = await GetCsrfTokenAsync(client);
        var invalid = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/register",
            new RegisterRequest("not-an-email", "short", "different", ""),
            token);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
    }

    [Fact]
    public async Task LoginMeAndLogout_UseCookieAndAllowlistedSession()
    {
        using var host = CreateIsolatedHost();
        var client = host.CreateClient();
        var email = UniqueEmail();
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(client, email)).StatusCode);

        var token = await GetCsrfTokenAsync(client);
        var login = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/login",
            new LoginRequest(email, ValidPassword),
            token);

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.Contains(
            login.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("Kiwimpact.Auth=", StringComparison.Ordinal) &&
                value.Contains("httponly", StringComparison.OrdinalIgnoreCase) &&
                value.Contains("samesite=lax", StringComparison.OrdinalIgnoreCase));

        var me = await client.GetAsync(
            "/api/v1/auth/me",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var json = await me.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(
            new[]
            {
                "displayName", "email", "hasPassword",
                "linkedProviders", "roles", "userId",
            },
            json.EnumerateObject().Select(property => property.Name).Order().ToArray());
        Assert.Equal(email, json.GetProperty("email").GetString());
        Assert.True(json.GetProperty("hasPassword").GetBoolean());
        Assert.Empty(json.GetProperty("linkedProviders").EnumerateArray());

        token = await GetCsrfTokenAsync(client);
        var logout = await PostWithCsrfAsync(client, "/api/v1/auth/logout", token);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        Assert.Contains(
            logout.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("Kiwimpact.Auth=", StringComparison.Ordinal));

        var meAfterLogout = await client.GetAsync(
            "/api/v1/auth/me",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, meAfterLogout.StatusCode);
    }

    [Fact]
    public async Task Me_Anonymous_ReturnsUnauthorizedWithoutRedirect()
    {
        using var host = CreateIsolatedHost();
        var client = host.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var response = await client.GetAsync(
            "/api/v1/auth/me",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task LoginFailures_AreGenericForUnknownWrongPasswordAndLockout()
    {
        using var host = CreateIsolatedHost();
        var client = host.CreateClient();
        var email = UniqueEmail();
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(client, email)).StatusCode);

        var wrong = await LoginAsync(client, email, "WrongPass!1234");
        var unknown = await LoginAsync(client, UniqueEmail(), "WrongPass!1234");
        Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);

        var wrongProblem = await wrong.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var unknownProblem = await unknown.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(wrongProblem.GetProperty("title").GetString(), unknownProblem.GetProperty("title").GetString());
        Assert.Equal(wrongProblem.GetProperty("detail").GetString(), unknownProblem.GetProperty("detail").GetString());

        for (var attempt = 1; attempt < 5; attempt++)
        {
            Assert.Equal(
                HttpStatusCode.Unauthorized,
                (await LoginAsync(client, email, "WrongPass!1234")).StatusCode);
        }

        var locked = await LoginAsync(client, email, ValidPassword);
        Assert.Equal(HttpStatusCode.Unauthorized, locked.StatusCode);
        var lockedProblem = await locked.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(wrongProblem.GetProperty("detail").GetString(), lockedProblem.GetProperty("detail").GetString());

        using var scope = host.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user?.LockoutEnd);
        Assert.True(user.LockoutEnd > DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task StateChangingAuthRequests_RejectMissingAndInvalidCsrf()
    {
        using var host = CreateIsolatedHost();
        var client = host.CreateClient();

        var missingRegister = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest(UniqueEmail(), ValidPassword, ValidPassword, "Member"),
            TestContext.Current.CancellationToken);
        await AssertCsrfFailureAsync(missingRegister);

        var invalidLogin = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/login",
            new LoginRequest(UniqueEmail(), ValidPassword),
            "invalid");
        await AssertCsrfFailureAsync(invalidLogin);

        var email = UniqueEmail();
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(client, email)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await LoginAsync(client, email, ValidPassword)).StatusCode);

        var missingLogout = await client.PostAsync(
            "/api/v1/auth/logout",
            new StringContent(string.Empty),
            TestContext.Current.CancellationToken);
        await AssertCsrfFailureAsync(missingLogout);
    }

    [Fact]
    public async Task LoginRateLimit_Returns429WithoutAccountDisclosure()
    {
        using var host = CreateIsolatedHost();
        var client = host.CreateClient();

        for (var attempt = 0; attempt < 10; attempt++)
        {
            Assert.Equal(
                HttpStatusCode.Unauthorized,
                (await LoginAsync(client, UniqueEmail(), ValidPassword)).StatusCode);
        }

        var limited = await LoginAsync(client, UniqueEmail(), ValidPassword);

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
    }

    [Fact]
    public async Task RoleAndConfiguredDemoSeeding_IsIdempotentAndRequiresExplicitValues()
    {
        Assert.Equal(9, DemoAccountSeedOptions.StandardPersonas.Count);
        Assert.All(
            new[] { AppRoles.Member, AppRoles.Organizer, AppRoles.Admin },
            role => Assert.Equal(
                3,
                DemoAccountSeedOptions.StandardPersonas.Count(account => account.Role == role)));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await IdentitySeed.SeedRolesAsync(roleManager, TestContext.Current.CancellationToken);
        await IdentitySeed.SeedRolesAsync(roleManager, TestContext.Current.CancellationToken);
        Assert.Equal(3, await db.Roles.CountAsync(TestContext.Current.CancellationToken));

        var memberEmail = UniqueEmail();
        var organizerEmail = UniqueEmail();
        var adminEmail = UniqueEmail();
        var runtimePassword = $"{Guid.NewGuid():N}aA1!";
        var personas = new[]
        {
            new DemoAccountSeedPersona(memberEmail, "Seeded member", AppRoles.Member),
            new DemoAccountSeedPersona(organizerEmail, "Seeded external organizer", AppRoles.Organizer),
            new DemoAccountSeedPersona(adminEmail, "Seeded admin", AppRoles.Admin),
        };
        await IdentitySeed.SeedDemoAccountsAsync(
            db,
            userManager,
            new DemoAccountSeedOptions(
                Enabled: false,
                Password: runtimePassword,
                Accounts: personas),
            TestContext.Current.CancellationToken);
        Assert.Null(await userManager.FindByEmailAsync(memberEmail));
        Assert.Null(await userManager.FindByEmailAsync(organizerEmail));
        Assert.Null(await userManager.FindByEmailAsync(adminEmail));

        var enabled = new DemoAccountSeedOptions(
            Enabled: true,
            Password: runtimePassword,
            Accounts: personas);
        await IdentitySeed.SeedDemoAccountsAsync(
            db, userManager, enabled, TestContext.Current.CancellationToken);

        var seededOrganizer = await userManager.FindByEmailAsync(organizerEmail);
        Assert.NotNull(seededOrganizer);
        var staleOrganizerProfile = await db.UserProfiles.SingleAsync(
            profile => profile.Id == seededOrganizer.Id,
            TestContext.Current.CancellationToken);
        staleOrganizerProfile.UpdateDisplayName(
            "Stale organizer display name",
            DateTimeOffset.UtcNow);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        await IdentitySeed.SeedDemoAccountsAsync(
            db, userManager, enabled, TestContext.Current.CancellationToken);

        var member = await userManager.FindByEmailAsync(memberEmail);
        var organizer = await userManager.FindByEmailAsync(organizerEmail);
        var admin = await userManager.FindByEmailAsync(adminEmail);
        Assert.NotNull(member);
        Assert.NotNull(organizer);
        Assert.NotNull(admin);
        Assert.True(member.EmailConfirmed);
        Assert.True(organizer.EmailConfirmed);
        Assert.True(admin.EmailConfirmed);
        Assert.True(await userManager.CheckPasswordAsync(member, runtimePassword));
        Assert.True(await userManager.CheckPasswordAsync(organizer, runtimePassword));
        Assert.True(await userManager.CheckPasswordAsync(admin, runtimePassword));
        Assert.Equal(
            new[] { AppRoles.Member },
            (await userManager.GetRolesAsync(member)).Order().ToArray());
        Assert.Equal(
            new[] { AppRoles.Member, AppRoles.Organizer },
            (await userManager.GetRolesAsync(organizer)).Order().ToArray());
        Assert.Equal(
            new[] { AppRoles.Admin, AppRoles.Member },
            (await userManager.GetRolesAsync(admin)).Order().ToArray());
        Assert.Equal(
            "Seeded external organizer",
            (await db.UserProfiles.SingleAsync(
                profile => profile.Id == organizer.Id,
                TestContext.Current.CancellationToken)).DisplayName);
        Assert.Equal(1, await db.UserProfiles.CountAsync(
            profile => profile.Id == member.Id,
            TestContext.Current.CancellationToken));
        Assert.Equal(1, await db.UserProfiles.CountAsync(
            profile => profile.Id == organizer.Id,
            TestContext.Current.CancellationToken));
        Assert.Equal(1, await db.UserProfiles.CountAsync(
            profile => profile.Id == admin.Id,
            TestContext.Current.CancellationToken));

        await IdentitySeed.SeedDemoAccountsAsync(
            db,
            userManager,
            new DemoAccountSeedOptions(
                Enabled: true,
                Password: runtimePassword,
                Accounts:
                [
                    new DemoAccountSeedPersona(
                        organizerEmail,
                        "Seeded external organizer",
                        AppRoles.Member),
                ]),
            TestContext.Current.CancellationToken);
        Assert.Equal(
            new[] { AppRoles.Member },
            (await userManager.GetRolesAsync(organizer)).Order().ToArray());
    }

    [Fact]
    public async Task ConfirmationResetAndPasswordChangeUseIdentityTokens()
    {
        using var host = _factory.WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Auth:RequireConfirmedEmail"] = "true",
                })));
        var client = host.CreateClient();
        var email = UniqueEmail();
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(client, email)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await LoginAsync(client, email, ValidPassword)).StatusCode);

        string confirmationToken;
        using (var scope = host.Services.CreateScope())
        {
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = Assert.IsType<ApplicationUser>(await manager.FindByEmailAsync(email));
            confirmationToken = Encode(await manager.GenerateEmailConfirmationTokenAsync(user));
        }
        var csrf = await GetCsrfTokenAsync(client);
        var confirmation = await PostJsonWithCsrfAsync(
            client, "/api/v1/auth/confirm-email",
            new ConfirmEmailRequest { UserId = await UserIdAsync(host, email), Token = confirmationToken },
            csrf);
        Assert.Equal(HttpStatusCode.OK, confirmation.StatusCode);
        Assert.Equal(HttpStatusCode.OK,
            (await LoginAsync(client, email, ValidPassword)).StatusCode);

        string resetToken;
        using (var scope = host.Services.CreateScope())
        {
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = Assert.IsType<ApplicationUser>(await manager.FindByEmailAsync(email));
            resetToken = Encode(await manager.GeneratePasswordResetTokenAsync(user));
        }
        const string resetPassword = "ResetPass!5678";
        csrf = await GetCsrfTokenAsync(client);
        var reset = await PostJsonWithCsrfAsync(
            client, "/api/v1/auth/reset-password",
            new ResetPasswordRequest
            {
                Email = email, Token = resetToken,
                Password = resetPassword, PasswordConfirmation = resetPassword,
            }, csrf);
        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);

        const string changedPassword = "ChangedPass!9012";
        csrf = await GetCsrfTokenAsync(client);
        var changed = await PostJsonWithCsrfAsync(
            client, "/api/v1/auth/change-password",
            new ChangePasswordRequest
            {
                CurrentPassword = resetPassword,
                NewPassword = changedPassword,
                NewPasswordConfirmation = changedPassword,
            }, csrf);
        Assert.Equal(HttpStatusCode.OK, changed.StatusCode);
        Assert.Equal(HttpStatusCode.OK,
            (await LoginAsync(client, email, changedPassword)).StatusCode);
    }

    [Fact]
    public async Task RecoveryResponsesDoNotRevealAccountExistence()
    {
        using var host = CreateIsolatedHost();
        var client = host.CreateClient();
        var known = UniqueEmail();
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(client, known)).StatusCode);

        var knownResult = await LifecycleResponseAsync(
            client, "/api/v1/auth/forgot-password", known);
        var unknownResult = await LifecycleResponseAsync(
            client, "/api/v1/auth/forgot-password", UniqueEmail());
        Assert.Equal(knownResult, unknownResult);
    }

    [Fact]
    public async Task GoogleLogin_CreatesGoogleOnlyMemberAndSession()
    {
        var email = UniqueEmail();
        using var host = CreateGoogleHost(email, "google-new-member");
        var client = host.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });

        var providerCallback = await client.GetAsync(
            "/api/v1/auth/external-login/google?returnUrl=%2Fpassport",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Redirect, providerCallback.StatusCode);

        var completed = await client.GetAsync(
            Assert.IsType<Uri>(providerCallback.Headers.Location),
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Redirect, completed.StatusCode);
        Assert.Equal(
            "http://localhost:5173/passport",
            completed.Headers.Location?.AbsoluteUri);

        var me = await client.GetFromJsonAsync<AuthSessionDto>(
            "/api/v1/auth/me",
            TestContext.Current.CancellationToken);
        Assert.NotNull(me);
        Assert.Equal(email, me.Email);
        Assert.False(me.HasPassword);
        Assert.Equal(["Google"], me.LinkedProviders);
        Assert.Equal([AppRoles.Member], me.Roles);

        var csrf = await GetCsrfTokenAsync(client);
        var passwordChange = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/change-password",
            new ChangePasswordRequest
            {
                CurrentPassword = ValidPassword,
                NewPassword = "AnotherPass!5678",
                NewPasswordConfirmation = "AnotherPass!5678",
            },
            csrf);
        Assert.Equal(HttpStatusCode.Forbidden, passwordChange.StatusCode);

        using var scope = host.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = Assert.IsType<ApplicationUser>(await userManager.FindByEmailAsync(email));
        Assert.True(user.EmailConfirmed);
        Assert.False(await userManager.HasPasswordAsync(user));
        Assert.Single(await userManager.GetLoginsAsync(user));
    }

    [Fact]
    public async Task GoogleLogin_DoesNotAutomaticallyLinkMatchingEmail()
    {
        var email = UniqueEmail();
        using var host = CreateGoogleHost(email, "google-existing-email");
        var client = host.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(client, email)).StatusCode);

        var providerCallback = await client.GetAsync(
            "/api/v1/auth/external-login/google",
            TestContext.Current.CancellationToken);
        var completed = await client.GetAsync(
            Assert.IsType<Uri>(providerCallback.Headers.Location),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Redirect, completed.StatusCode);
        Assert.Contains(
            "externalError=account_exists",
            completed.Headers.Location?.Query,
            StringComparison.Ordinal);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await client.GetAsync(
                "/api/v1/auth/me",
                TestContext.Current.CancellationToken)).StatusCode);

        using var scope = host.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = Assert.IsType<ApplicationUser>(await userManager.FindByEmailAsync(email));
        Assert.Empty(await userManager.GetLoginsAsync(user));
    }

    [Fact]
    public async Task GoogleLogin_RejectsUnverifiedEmailWithoutCreatingAccount()
    {
        var email = UniqueEmail();
        using var host = CreateGoogleHost(
            email,
            "google-unverified-email",
            emailVerified: false);
        var client = host.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });

        var providerCallback = await client.GetAsync(
            "/api/v1/auth/external-login/google",
            TestContext.Current.CancellationToken);
        var completed = await client.GetAsync(
            Assert.IsType<Uri>(providerCallback.Headers.Location),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Redirect, completed.StatusCode);
        Assert.Contains(
            "externalError=unverified_email",
            completed.Headers.Location?.Query,
            StringComparison.Ordinal);
        using var scope = host.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        Assert.Null(await userManager.FindByEmailAsync(email));
    }

    [Fact]
    public async Task GoogleLogin_RejectsExternalReturnUrlAndHandlesUnconfiguredProvider()
    {
        using (var unconfiguredHost = CreateIsolatedHost())
        {
            var unconfiguredClient = unconfiguredHost.CreateClient(
                new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
            var unavailable = await unconfiguredClient.GetAsync(
                "/api/v1/auth/external-login/google",
                TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.Redirect, unavailable.StatusCode);
            Assert.Equal(
                "http://localhost:5173/login?externalError=unavailable",
                unavailable.Headers.Location?.AbsoluteUri);
        }

        using var host = CreateGoogleHost(UniqueEmail(), "google-safe-return");
        var client = host.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        var providerCallback = await client.GetAsync(
            "/api/v1/auth/external-login/google?returnUrl=https%3A%2F%2Fevil.example",
            TestContext.Current.CancellationToken);
        var completed = await client.GetAsync(
            Assert.IsType<Uri>(providerCallback.Headers.Location),
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Redirect, completed.StatusCode);
        Assert.Equal("http://localhost:5173/", completed.Headers.Location?.AbsoluteUri);
    }

    [Fact]
    public async Task GoogleLink_RequiresAuthenticatedCsrfFlowAndLinksCurrentAccount()
    {
        var email = UniqueEmail();
        using var host = CreateGoogleHost(
            "different-google-email@example.test",
            "google-link-key");
        var client = host.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(client, email)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await LoginAsync(client, email, ValidPassword)).StatusCode);

        var missingCsrf = await client.PostAsync(
            "/api/v1/auth/link/google",
            content: null,
            TestContext.Current.CancellationToken);
        await AssertCsrfFailureAsync(missingCsrf);
        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await client.GetAsync(
                "/api/v1/auth/link/google/start",
                TestContext.Current.CancellationToken)).StatusCode);

        var csrf = await GetCsrfTokenAsync(client);
        var start = await PostWithCsrfAsync(client, "/api/v1/auth/link/google", csrf);
        Assert.Equal(HttpStatusCode.OK, start.StatusCode);
        var startBody = await start.Content.ReadFromJsonAsync<ExternalAuthStartDto>(
            TestContext.Current.CancellationToken);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await client.GetAsync(
                $"{Assert.IsType<string>(startBody?.RedirectUrl)}tampered",
                TestContext.Current.CancellationToken)).StatusCode);

        var providerCallback = await client.GetAsync(
            Assert.IsType<string>(startBody?.RedirectUrl),
            TestContext.Current.CancellationToken);
        var completed = await client.GetAsync(
            Assert.IsType<Uri>(providerCallback.Headers.Location),
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Redirect, completed.StatusCode);
        Assert.Contains(
            "googleLinked=1",
            completed.Headers.Location?.Query,
            StringComparison.Ordinal);

        var me = await client.GetFromJsonAsync<AuthSessionDto>(
            "/api/v1/auth/me",
            TestContext.Current.CancellationToken);
        Assert.NotNull(me);
        Assert.True(me.HasPassword);
        Assert.Equal(["Google"], me.LinkedProviders);

        using var scope = host.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = Assert.IsType<ApplicationUser>(await userManager.FindByEmailAsync(email));
        Assert.Single(await userManager.GetLoginsAsync(user));
    }

    [Fact]
    public async Task GoogleLink_RejectsProviderAlreadyLinkedToAnotherAccount()
    {
        using var host = CreateGoogleHost(
            "google-owner@example.test",
            "google-shared-provider-key");
        var ownerClient = host.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        var ownerProviderCallback = await ownerClient.GetAsync(
            "/api/v1/auth/external-login/google",
            TestContext.Current.CancellationToken);
        Assert.Equal(
            HttpStatusCode.Redirect,
            (await ownerClient.GetAsync(
                Assert.IsType<Uri>(ownerProviderCallback.Headers.Location),
                TestContext.Current.CancellationToken)).StatusCode);

        var memberClient = host.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        var memberEmail = UniqueEmail();
        Assert.Equal(
            HttpStatusCode.Created,
            (await RegisterAsync(memberClient, memberEmail)).StatusCode);
        Assert.Equal(
            HttpStatusCode.OK,
            (await LoginAsync(memberClient, memberEmail, ValidPassword)).StatusCode);
        var csrf = await GetCsrfTokenAsync(memberClient);
        var start = await PostWithCsrfAsync(
            memberClient,
            "/api/v1/auth/link/google",
            csrf);
        var startBody = await start.Content.ReadFromJsonAsync<ExternalAuthStartDto>(
            TestContext.Current.CancellationToken);
        var providerCallback = await memberClient.GetAsync(
            Assert.IsType<string>(startBody?.RedirectUrl),
            TestContext.Current.CancellationToken);
        var completed = await memberClient.GetAsync(
            Assert.IsType<Uri>(providerCallback.Headers.Location),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Redirect, completed.StatusCode);
        Assert.Contains(
            "googleError=already_linked",
            completed.Headers.Location?.Query,
            StringComparison.Ordinal);
        using var scope = host.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var member = Assert.IsType<ApplicationUser>(
            await userManager.FindByEmailAsync(memberEmail));
        Assert.Empty(await userManager.GetLoginsAsync(member));
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private WebApplicationFactory<Program> CreateIsolatedHost() =>
        _factory.WithWebHostBuilder(_ => { });

    private WebApplicationFactory<Program> CreateGoogleHost(
        string email,
        string providerKey,
        bool emailVerified = true) =>
        _factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services =>
                services
                    .AddAuthentication()
                    .AddScheme<FakeGoogleOptions, FakeGoogleHandler>(
                        "Google",
                        options =>
                        {
                            options.Email = email;
                            options.ProviderKey = providerKey;
                            options.EmailVerified = emailVerified;
                        })));

    private static string UniqueEmail() => $"auth-{Guid.NewGuid():N}@example.test";

    private static string Encode(string token) =>
        WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

    private static async Task<Guid> UserIdAsync(
        WebApplicationFactory<Program> host, string email)
    {
        using var scope = host.Services.CreateScope();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        return Assert.IsType<ApplicationUser>(await manager.FindByEmailAsync(email)).Id;
    }

    private static async Task<string> LifecycleResponseAsync(
        HttpClient client, string path, string email)
    {
        var csrf = await GetCsrfTokenAsync(client);
        var response = await PostJsonWithCsrfAsync(
            client, path, new EmailOnlyRequest { Email = email }, csrf);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
    }

    private static async Task<HttpResponseMessage> RegisterAsync(HttpClient client, string email)
    {
        var token = await GetCsrfTokenAsync(client);
        return await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/register",
            new RegisterRequest(email, ValidPassword, ValidPassword, "Test Member"),
            token);
    }

    private static async Task<HttpResponseMessage> LoginAsync(
        HttpClient client,
        string email,
        string password)
    {
        var token = await GetCsrfTokenAsync(client);
        return await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/login",
            new LoginRequest(email, password),
            token);
    }

    private static async Task<string> GetCsrfTokenAsync(HttpClient client)
    {
        var response = await client.GetAsync(
            "/api/v1/auth/csrf-token",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AntiforgeryTokenDto>(
            TestContext.Current.CancellationToken);
        return Assert.IsType<string>(body?.Token);
    }

    private static async Task<HttpResponseMessage> PostJsonWithCsrfAsync(
        HttpClient client,
        string path,
        object value,
        string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = JsonContent.Create(value, options: JsonOptions),
        };
        request.Headers.Add("X-CSRF-TOKEN", token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    private static async Task<HttpResponseMessage> PostWithCsrfAsync(
        HttpClient client,
        string path,
        string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path);
        request.Headers.Add("X-CSRF-TOKEN", token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    private static async Task AssertCsrfFailureAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(ApiAntiforgeryFilter.ProblemType, problem.GetProperty("type").GetString());
    }
}
