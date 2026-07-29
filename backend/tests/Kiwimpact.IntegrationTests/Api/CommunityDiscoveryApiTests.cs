using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class CommunityDiscoveryApiTests
    : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private const string Password = "ValidPass!1234";
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<WebApplicationFactory<Program>> _hosts = [];

    public CommunityDiscoveryApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public void Dispose()
    {
        foreach (var host in _hosts)
            host.Dispose();
    }

    [Fact]
    public async Task PublicChallengeReadProtectsSmallContributorCounts()
    {
        await ResetAndSeedRegionsAsync();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            db.CommunityChallenges.Add(CommunityChallenge.Create(
                RegionSeed.AlbertEdenId,
                DateTimeOffset.UtcNow.AddHours(-1),
                DateTimeOffset.UtcNow.AddHours(1),
                20,
                null,
                DateTimeOffset.UtcNow.AddHours(-2)));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var response = await _factory.CreateClient().GetAsync(
            "/api/v1/community-challenges",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = Assert.Single((await ReadJsonAsync(response)).EnumerateArray());
        Assert.True(item.GetProperty("isPrivacyProtected").GetBoolean());
        Assert.Equal(JsonValueKind.Null, item.GetProperty("activeContributors").ValueKind);
        Assert.Equal(0, item.GetProperty("currentProgress").GetInt64());
        Assert.Equal("Albert-Eden", item.GetProperty("localArea").GetProperty("name").GetString());
    }

    [Fact]
    public async Task AdminCanCreateOnlyOneActiveChallengePerLocalArea()
    {
        await ResetAndSeedRegionsAsync();
        var admin = await CreateAuthenticatedClientAsync(AppRoles.Admin);
        var body = new
        {
            localAreaRegionId = RegionSeed.AlbertEdenId,
            periodStartUtc = DateTimeOffset.UtcNow.AddHours(1),
            periodEndUtc = DateTimeOffset.UtcNow.AddDays(7),
            targetValue = 20,
            rewardAchievementId = (Guid?)null,
            version = 0,
        };

        var created = await SendJsonWithCsrfAsync(
            admin,
            HttpMethod.Post,
            "/api/v1/admin/community-challenges",
            body);
        var duplicate = await SendJsonWithCsrfAsync(
            admin,
            HttpMethod.Post,
            "/api/v1/admin/community-challenges",
            body);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        var result = await ReadJsonAsync(created);
        Assert.NotEqual(Guid.Empty, result.GetProperty("id").GetGuid());
        Assert.True(result.GetProperty("version").GetUInt32() > 0);
    }

    [Fact]
    public async Task MemberCommunityUpdateIsReadableAndEnforcesCooldown()
    {
        await ResetAndSeedRegionsAsync();
        var member = await CreateAuthenticatedClientAsync(AppRoles.Member);

        var first = await SendJsonWithCsrfAsync(
            member,
            HttpMethod.Patch,
            "/api/v1/users/me/profile",
            new
            {
                homeCommunityRegionId = RegionSeed.AlbertEdenId,
                showCommunityOnPassport = false,
            });
        var second = await SendJsonWithCsrfAsync(
            member,
            HttpMethod.Patch,
            "/api/v1/users/me/profile",
            new
            {
                homeCommunityRegionId = RegionSeed.HowickId,
                showCommunityOnPassport = true,
            });
        var read = await member.GetAsync(
            "/api/v1/users/me/profile",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);
        var profile = await ReadJsonAsync(read);
        Assert.Equal(
            RegionSeed.AlbertEdenId,
            profile.GetProperty("homeCommunity").GetProperty("id").GetGuid());
        Assert.False(profile.GetProperty("showCommunityOnPassport").GetBoolean());
        Assert.Equal(
            JsonValueKind.String,
            profile.GetProperty("communityChangeAvailableAtUtc").ValueKind);
    }

    private async Task ResetAndSeedRegionsAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            """
            DELETE FROM "UserAchievements";
            DELETE FROM "CommunityChallenges";
            """,
            TestContext.Current.CancellationToken);
        await RegionSeed.SeedAsync(db);
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string role)
    {
        var host = _factory.WithWebHostBuilder(_ => { });
        _hosts.Add(host);
        var client = host.CreateClient();
        var email = $"community-api-{Guid.NewGuid():N}@example.test";

        using (var scope = host.Services.CreateScope())
        {
            await IdentitySeed.SeedRolesAsync(
                scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>(),
                TestContext.Current.CancellationToken);
        }

        var register = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Post,
            "/api/v1/auth/register",
            new
            {
                email,
                password = Password,
                passwordConfirmation = Password,
                displayName = "Community API tester",
            });
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);

        if (role != AppRoles.Member)
        {
            using var scope = host.Services.CreateScope();
            var userManager =
                scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            Assert.NotNull(user);
            Assert.True(
                (await userManager.RemoveFromRoleAsync(user, AppRoles.Member)).Succeeded);
            Assert.True((await userManager.AddToRoleAsync(user, role)).Succeeded);
        }

        var login = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Post,
            "/api/v1/auth/login",
            new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        return client;
    }

    private static async Task<HttpResponseMessage> SendJsonWithCsrfAsync(
        HttpClient client,
        HttpMethod method,
        string path,
        object body)
    {
        var tokenResponse = await client.GetAsync(
            "/api/v1/auth/csrf-token",
            TestContext.Current.CancellationToken);
        tokenResponse.EnsureSuccessStatusCode();
        var token = await tokenResponse.Content.ReadFromJsonAsync<AntiforgeryTokenDto>(
            TestContext.Current.CancellationToken);
        using var request = new HttpRequestMessage(method, path)
        {
            Content = JsonContent.Create(body, options: JsonOptions),
        };
        request.Headers.Add("X-CSRF-TOKEN", token?.Token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(body);
        return document.RootElement.Clone();
    }

    private sealed record AntiforgeryTokenDto(string Token);
}
