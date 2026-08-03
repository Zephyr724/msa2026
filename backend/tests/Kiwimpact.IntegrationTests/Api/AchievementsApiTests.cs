using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Repositories;
using Kiwimpact.IntegrationTests.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class AchievementsApiTests
    : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private const string Password = "ValidPass!1234";
    private const string CatalogPath = "/api/v1/achievements";
    private const string EarnedPath = "/api/v1/users/me/achievements";
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<WebApplicationFactory<Program>> _hosts = [];

    public AchievementsApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public void Dispose()
    {
        foreach (var host in _hosts)
            host.Dispose();
    }

    [Fact]
    public async Task CatalogIsAnonymousActiveOnlyCodeOrderedAndExact()
    {
        await ResetCatalogAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync(
            CatalogPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        var items = json.EnumerateArray().ToArray();
        Assert.Equal(AchievementCatalog.Definitions.Count, items.Length);
        Assert.Equal(
            AchievementCatalog.Definitions
                .Select(definition => definition.Code)
                .Order(StringComparer.Ordinal),
            items.Select(item => item.GetProperty("code").GetString()));
        foreach (var item in items)
        {
            AssertExactKeys(
                item,
                "category",
                "code",
                "description",
                "iconUrl",
                "id",
                "name");
            var definition = Assert.Single(
                AchievementCatalog.Definitions,
                candidate =>
                    candidate.Id == item.GetProperty("id").GetGuid());
            Assert.Equal(
                definition.Category,
                item.GetProperty("category").GetString());
            Assert.Equal(JsonValueKind.Null, item.GetProperty("iconUrl").ValueKind);
        }

        await SetAchievementActiveAsync(AchievementCatalog.FirstSteps.Id, false);
        try
        {
            var activeOnly = await ReadJsonAsync(await client.GetAsync(
                CatalogPath,
                TestContext.Current.CancellationToken));
            Assert.Equal(
                AchievementCatalog.Definitions.Count - 1,
                activeOnly.GetArrayLength());
            Assert.DoesNotContain(
                AchievementCatalog.FirstSteps.Code,
                activeOnly
                    .EnumerateArray()
                    .Select(item => item.GetProperty("code").GetString()));
        }
        finally
        {
            await SetAchievementActiveAsync(AchievementCatalog.FirstSteps.Id, true);
        }
    }

    [Fact]
    public async Task AnonymousEarnedReadIsUnauthorized()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var response = await client.GetAsync(
            EarnedPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData(AppRoles.Member)]
    [InlineData(AppRoles.Organizer)]
    [InlineData(AppRoles.Admin)]
    public async Task EveryAuthenticatedRoleCanReadItsOwnEmptyList(string role)
    {
        await ResetCatalogAsync();
        var actor = await CreateAuthenticatedClientAsync(role);

        var response = await actor.Client.GetAsync(
            EarnedPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(0, (await ReadJsonAsync(response)).GetArrayLength());
    }

    [Fact]
    public async Task MissingProfileReturns404BeforeRewardPendingReadiness()
    {
        await ResetCatalogAsync();
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SeedVerifiedCompletionAsync(
            actor.UserId,
            DateTimeOffset.UtcNow.AddMinutes(-1));
        await DeleteProfileAsync(actor.UserId);

        var response = await actor.Client.GetAsync(
            EarnedPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.Equal(
            "https://kiwimpact.app/problems/profile-not-found",
            problem.GetProperty("type").GetString());
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task RewardPendingCallerGetsBoundedProgressionNotReady()
    {
        await ResetCatalogAsync();
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SeedVerifiedCompletionAsync(
            actor.UserId,
            DateTimeOffset.UtcNow.AddMinutes(-1));

        var response = await actor.Client.GetAsync(
            EarnedPath,
            TestContext.Current.CancellationToken);

        await AssertProgressionNotReadyAsync(response);
    }

    [Fact]
    public async Task EarnedButUnawardedCallerGetsBoundedProgressionNotReady()
    {
        await ResetCatalogAsync();
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var completion = await SeedVerifiedCompletionAsync(
            actor.UserId,
            DateTimeOffset.UtcNow.AddMinutes(-1));
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            db.XpTransactions.Add(XpTransaction.CreateFromVerifiedCompletion(completion));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
            await XpLedgerTestHelpers.MarkAchievementEvaluationStaleAsync(
                db,
                actor.UserId);
        }

        var response = await actor.Client.GetAsync(
            EarnedPath,
            TestContext.Current.CancellationToken);

        await AssertProgressionNotReadyAsync(response);
    }

    [Fact]
    public async Task EarnedReadIsExactOrderedPrivateAndExcludesInactiveAwards()
    {
        await ResetCatalogAsync();
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var other = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await AwardCompletionsAsync(actor.UserId, 5);
        await AwardCompletionsAsync(other.UserId, 1);

        // PostgreSQL timestamptz persists microsecond precision. Fixed,
        // microsecond-aligned values avoid comparing an unpersisted 100 ns
        // tail while deliberately making timestamp order oppose code order:
        // code "-3" must sort before "-1", then "-1"/"-5" use the code
        // tie-break at the same timestamp.
        var earlierAwardedAt = new DateTimeOffset(
            2026, 7, 25, 9, 58, 53, 123, TimeSpan.Zero);
        var tiedAwardedAt = earlierAwardedAt.AddHours(1);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE \"UserAchievements\" SET \"AwardedAt\" = {tiedAwardedAt} WHERE \"UserId\" = {actor.UserId}",
                TestContext.Current.CancellationToken);
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE \"UserAchievements\" SET \"AwardedAt\" = {earlierAwardedAt} WHERE \"UserId\" = {actor.UserId} AND \"AchievementId\" = {AchievementCatalog.BuildingMomentum.Id}",
                TestContext.Current.CancellationToken);
        }

        var response = await actor.Client.GetAsync(
            $"{EarnedPath}?userId={other.UserId:D}",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        var items = json.EnumerateArray().ToArray();
        Assert.Equal(5, items.Length);
        Assert.Equal(
            [
                AchievementCatalog.BuildingMomentum.Code,
                "level-5",
                "restore-nature-3",
                AchievementCatalog.FirstSteps.Code,
                AchievementCatalog.CommittedContributor.Code,
            ],
            items.Select(item => item.GetProperty("code").GetString()));
        var expectedAwardedAt = new[]
        {
            earlierAwardedAt,
            tiedAwardedAt,
            tiedAwardedAt,
            tiedAwardedAt,
            tiedAwardedAt,
        };
        for (var index = 0; index < items.Length; index++)
        {
            var item = items[index];
            AssertExactKeys(
                item,
                "achievementId",
                "awardedAt",
                "category",
                "code",
                "description",
                "iconUrl",
                "name");
            Assert.Equal(
                expectedAwardedAt[index].ToString("O"),
                item.GetProperty("awardedAt").GetString());
        }

        var raw = json.GetRawText();
        Assert.DoesNotContain("userId", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("xpTransactionId", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("sourceCompletionId", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("email", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("region", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("evidence", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(other.UserId.ToString("D"), raw, StringComparison.OrdinalIgnoreCase);

        await SetAchievementActiveAsync(AchievementCatalog.FirstSteps.Id, false);
        try
        {
            var activeOnly = await ReadJsonAsync(await actor.Client.GetAsync(
                EarnedPath,
                TestContext.Current.CancellationToken));
            Assert.Equal(4, activeOnly.GetArrayLength());
            Assert.DoesNotContain(
                AchievementCatalog.FirstSteps.Code,
                activeOnly
                    .EnumerateArray()
                    .Select(item => item.GetProperty("code").GetString()));
        }
        finally
        {
            await SetAchievementActiveAsync(AchievementCatalog.FirstSteps.Id, true);
        }
    }

    private async Task AwardCompletionsAsync(Guid userId, int count)
    {
        var baseTime = DateTimeOffset.UtcNow.AddDays(-2);
        for (var index = 0; index < count; index++)
        {
            var completion = await SeedVerifiedCompletionAsync(
                userId,
                baseTime.AddMinutes(index));
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var repository = new XpLedgerRepository(db, new AchievementAwardService(db));
            var outcome = await repository.AwardVerifiedCompletionAsync(
                completion,
                DateTimeOffset.UtcNow,
                TestContext.Current.CancellationToken);
            Assert.Equal(XpAwardOutcome.Awarded, outcome);
        }
    }

    private async Task<QuestCompletion> SeedVerifiedCompletionAsync(
        Guid userId,
        DateTimeOffset verifiedAt)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var creator = XpLedgerTestHelpers.NewUser("achievement-api-creator");
        var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
        var participation = QuestParticipation.CreateActive(
            userId,
            quest.Id,
            verifiedAt.AddHours(-1));
        db.Set<ApplicationUser>().Add(creator);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        var completion = QuestCompletion.CreateVerifiedWithCode(
            userId,
            quest,
            participation,
            null,
            verifiedAt);
        db.QuestCompletions.Add(completion);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return completion;
    }

    private async Task ResetCatalogAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            """UPDATE "Achievements" SET "IsActive" = TRUE""",
            TestContext.Current.CancellationToken);
    }

    private async Task SetAchievementActiveAsync(Guid achievementId, bool active)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Achievements\" SET \"IsActive\" = {active} WHERE \"Id\" = {achievementId}",
            TestContext.Current.CancellationToken);
    }

    private async Task DeleteProfileAsync(Guid userId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM \"UserProfiles\" WHERE \"Id\" = {userId}",
            TestContext.Current.CancellationToken);
    }

    private async Task<AuthClient> CreateAuthenticatedClientAsync(string role)
    {
        var host = _factory.WithWebHostBuilder(_ => { });
        _hosts.Add(host);
        var client = host.CreateClient();
        var email = $"achievement-api-{Guid.NewGuid():N}@example.test";

        using (var scope = host.Services.CreateScope())
        {
            await Kiwimpact.Infrastructure.Data.Seeds.IdentitySeed.SeedRolesAsync(
                scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>(),
                TestContext.Current.CancellationToken);
        }

        var register = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/register",
            new
            {
                email,
                password = Password,
                passwordConfirmation = Password,
                displayName = "Achievement API tester",
            });
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);

        Guid userId;
        using (var scope = host.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            Assert.NotNull(user);
            userId = user.Id;
            if (role != AppRoles.Member)
            {
                Assert.True((await userManager.RemoveFromRoleAsync(user, AppRoles.Member)).Succeeded);
                Assert.True((await userManager.AddToRoleAsync(user, role)).Succeeded);
            }
        }

        var login = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/login",
            new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        return new AuthClient(client, userId);
    }

    private async Task<HttpResponseMessage> PostJsonWithCsrfAsync(
        HttpClient client,
        string path,
        object? body)
    {
        var tokenResponse = await client.GetAsync(
            "/api/v1/auth/csrf-token",
            TestContext.Current.CancellationToken);
        tokenResponse.EnsureSuccessStatusCode();
        var tokenBody = await tokenResponse.Content
            .ReadFromJsonAsync<AntiforgeryTokenDto>(TestContext.Current.CancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = body is null ? null : JsonContent.Create(body, options: JsonOptions),
        };
        request.Headers.Add("X-CSRF-TOKEN", tokenBody?.Token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    private static async Task AssertProgressionNotReadyAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        AssertExactKeys(problem, "detail", "status", "title", "type");
        Assert.Equal(
            "https://kiwimpact.app/problems/progression-not-ready",
            problem.GetProperty("type").GetString());
        Assert.Equal(503, problem.GetProperty("status").GetInt32());
        Assert.DoesNotContain("count", problem.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    private static void AssertExactKeys(JsonElement json, params string[] expected)
    {
        var actual = json.EnumerateObject()
            .Select(property => property.Name)
            .Order(StringComparer.Ordinal)
            .ToArray();
        Assert.Equal(expected.Order(StringComparer.Ordinal).ToArray(), actual);
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(body);
        return document.RootElement.Clone();
    }

    private sealed record AuthClient(HttpClient Client, Guid UserId);
    private sealed record AntiforgeryTokenDto(string Token);
}
