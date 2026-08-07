using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Progression;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Reconciliation;
using Kiwimpact.Infrastructure.Repositories;
using Kiwimpact.IntegrationTests.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class ProgressionApiTests
    : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private const string Password = "ValidPass!1234";
    private const string ProgressionPath = "/api/v1/users/me/progression";
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<WebApplicationFactory<Program>> _hosts = [];

    public ProgressionApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public void Dispose()
    {
        foreach (var host in _hosts)
            host.Dispose();
    }

    [Fact]
    public async Task AnonymousReadIsUnauthorized()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var response = await client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public void HostedReconciliationIsDisabledInTheApiFactory()
    {
        var options = _factory.Services
            .GetRequiredService<IOptions<XpReconciliationOptions>>();

        Assert.False(options.Value.Enabled);
    }

    [Theory]
    [InlineData("XpReconciliation:BatchSize", "0", "BatchSize")]
    [InlineData("XpReconciliation:BatchSize", "-1", "BatchSize")]
    [InlineData("XpReconciliation:IdleInterval", "00:00:00", "IdleInterval")]
    [InlineData("XpReconciliation:InitialDelay", "-00:00:01", "InitialDelay")]
    [InlineData("XpReconciliation:MaxConsecutiveRowFailures", "0", "MaxConsecutiveRowFailures")]
    public void StartupRejectsInvalidReconciliationOptions(
        string key,
        string value,
        string expectedName)
    {
        using var host = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, configuration) =>
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    [key] = value,
                }));
        });

        var exception = Assert.ThrowsAny<Exception>(() => host.CreateClient());

        Assert.Contains(expectedName, exception.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public void StartupAcceptsValidReconciliationOptions()
    {
        using var host = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, configuration) =>
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["XpReconciliation:Enabled"] = "false",
                    ["XpReconciliation:BatchSize"] = "5",
                    ["XpReconciliation:InitialDelay"] = "00:00:00",
                    ["XpReconciliation:IdleInterval"] = "01:00:00",
                    ["XpReconciliation:MaxConsecutiveRowFailures"] = "3",
                }));
        });

        using var client = host.CreateClient();

        Assert.NotNull(client);
    }

    [Theory]
    [InlineData(AppRoles.Member)]
    [InlineData(AppRoles.Organizer)]
    [InlineData(AppRoles.Admin)]
    public async Task EveryAuthorizedRoleReadsExactlyItsOwnProgression(string role)
    {
        var actor = await CreateAuthenticatedClientAsync(role);
        await AwardAsync(actor.UserId, QuestDifficulty.Hard);

        var response = await actor.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        AssertExactKeys(json, "level", "rankTitle", "totalXp");
        Assert.Equal(150, json.GetProperty("totalXp").GetInt64());
        Assert.Equal(3, json.GetProperty("level").GetInt32());
        Assert.Equal("Novice", json.GetProperty("rankTitle").GetString());
        Assert.DoesNotContain("email", json.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(actor.UserId.ToString("D"), json.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("community", json.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("displayName", json.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task OneSessionNeverReturnsAnotherUsersProgressionOrClientSelectedIdentity()
    {
        var first = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var second = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await AwardAsync(first.UserId, QuestDifficulty.Easy);
        await AwardAsync(second.UserId, QuestDifficulty.Hard);

        var firstResponse = await first.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);
        var secondResponse = await second.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);
        Assert.Equal(50, (await ReadJsonAsync(firstResponse)).GetProperty("totalXp").GetInt64());
        Assert.Equal(150, (await ReadJsonAsync(secondResponse)).GetProperty("totalXp").GetInt64());

        // A query-string or route user selector never overrides session identity.
        var queried = await first.Client.GetAsync(
            $"{ProgressionPath}?userId={second.UserId:D}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, queried.StatusCode);
        Assert.Equal(50, (await ReadJsonAsync(queried)).GetProperty("totalXp").GetInt64());

        var routed = await first.Client.GetAsync(
            $"/api/v1/users/{second.UserId:D}/progression",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, routed.StatusCode);
    }

    [Fact]
    public async Task RewardPendingCompletionHoldsNotReadyUntilReconciliationCompletes()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SeedPendingCompletionAsync(actor.UserId, QuestDifficulty.Easy);

        var pending = await actor.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);
        await AssertNotReadyAsync(pending);

        await ReconcileAsync();

        var ready = await actor.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
        var json = await ReadJsonAsync(ready);
        AssertExactKeys(json, "level", "rankTitle", "totalXp");
        Assert.Equal(50, json.GetProperty("totalXp").GetInt64());
        Assert.Equal(2, json.GetProperty("level").GetInt32());
        Assert.Equal("Novice", json.GetProperty("rankTitle").GetString());

        // The gate re-closes from current database state when a new
        // unrewarded Verified completion appears, and reopens after the next
        // pass. It is never cached.
        await SeedPendingCompletionAsync(actor.UserId, QuestDifficulty.Medium);
        var reclosed = await actor.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);
        await AssertNotReadyAsync(reclosed);

        await ReconcileAsync();
        var reopened = await actor.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, reopened.StatusCode);
        Assert.Equal(150, (await ReadJsonAsync(reopened)).GetProperty("totalXp").GetInt64());
    }

    [Fact]
    public async Task UnprocessableRowAlsoHoldsNotReady()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var impossibleId = await SeedNullTimestampCompletionAsync(actor.UserId);
        try
        {
            var response = await actor.Client.GetAsync(
                ProgressionPath,
                TestContext.Current.CancellationToken);
            await AssertNotReadyAsync(response);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"QuestCompletions\" WHERE \"Id\" = {impossibleId}",
                TestContext.Current.CancellationToken);
        }

        var ready = await actor.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
    }

    [Fact]
    public async Task MissingProfileIsNotFound()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"UserProfiles\" WHERE \"Id\" = {actor.UserId}",
                TestContext.Current.CancellationToken);
        }

        var response = await actor.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.Equal(
            "https://kiwimpact.app/problems/profile-not-found",
            problem.GetProperty("type").GetString());
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
        Assert.Equal("Profile not found.", problem.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task RedemptionAwardsAtomicallyAndProgressionReflectsItImmediately()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId, QuestDifficulty.Medium);
        await SeedParticipationAsync(actor.UserId, quest.Id);
        var generated = await PostJsonWithCsrfAsync(
            owner.Client,
            $"/api/v1/organizer/quests/{quest.Id}/completion-codes",
            null);
        Assert.Equal(HttpStatusCode.Created, generated.StatusCode);
        var code = (await ReadJsonAsync(generated)).GetProperty("code").GetString();

        var redeem = await PostJsonWithCsrfAsync(
            actor.Client,
            $"/api/v1/quests/{quest.Id}/redeem",
            new { code });
        Assert.Equal(HttpStatusCode.Created, redeem.StatusCode);
        var redemptionJson = await ReadJsonAsync(redeem);
        AssertExactKeys(redemptionJson, "completion", "reward");
        var completionJson = redemptionJson.GetProperty("completion");
        AssertExactKeys(
            completionJson,
            "completedAtUtc",
            "method",
            "status",
            "verifiedAtUtc");
        Assert.Equal("Verified", completionJson.GetProperty("status").GetString());
        Assert.Equal("CompletionCode", completionJson.GetProperty("method").GetString());
        var rewardJson = redemptionJson.GetProperty("reward");
        AssertExactKeys(
            rewardJson,
            "communityChallenge",
            "celebrationMessage",
            "celebrationTitle",
            "createdAtUtc",
            "level",
            "previousLevel",
            "previousRankTitle",
            "previousTotalXp",
            "questCompletionId",
            "questId",
            "questTitle",
            "rankTitle",
            "rewardEventId",
            "seenAtUtc",
            "streak",
            "totalXp",
            "unlockedAchievements",
            "verificationMethod",
            "xpAwarded");
        Assert.Equal(100, rewardJson.GetProperty("xpAwarded").GetInt32());
        Assert.Equal(0, rewardJson.GetProperty("previousTotalXp").GetInt64());
        Assert.Equal(100, rewardJson.GetProperty("totalXp").GetInt64());
        Assert.Equal(1, rewardJson.GetProperty("previousLevel").GetInt32());
        Assert.Equal(3, rewardJson.GetProperty("level").GetInt32());
        Assert.Equal("Novice", rewardJson.GetProperty("previousRankTitle").GetString());
        Assert.Equal("Novice", rewardJson.GetProperty("rankTitle").GetString());

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var completion = await db.QuestCompletions.SingleAsync(
                item => item.UserId == actor.UserId,
                TestContext.Current.CancellationToken);
            var xp = await db.XpTransactions.SingleAsync(
                item => item.SourceCompletionId == completion.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(100, xp.XpAmount);
            Assert.Equal(completion.VerifiedAtUtc, xp.CreatedAt);
            Assert.Equal(xp.Id, rewardJson.GetProperty("rewardEventId").GetGuid());
        }

        var progression = await actor.Client.GetAsync(
            ProgressionPath,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, progression.StatusCode);
        var json = await ReadJsonAsync(progression);
        Assert.Equal(100, json.GetProperty("totalXp").GetInt64());
        Assert.Equal(3, json.GetProperty("level").GetInt32());
        Assert.Equal("Novice", json.GetProperty("rankTitle").GetString());
    }

    [Fact]
    public async Task RedemptionAwardFailureSurfacesGenericFailureAndRollsBackEverything()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId, QuestDifficulty.Easy);
        await SeedParticipationAsync(actor.UserId, quest.Id);
        var generated = await PostJsonWithCsrfAsync(
            owner.Client,
            $"/api/v1/organizer/quests/{quest.Id}/completion-codes",
            null);
        var code = (await ReadJsonAsync(generated)).GetProperty("code").GetString();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await db.Database.ExecuteSqlRawAsync(
                $"""
                CREATE OR REPLACE FUNCTION reject_xp_insert_for_api_test() RETURNS trigger AS $fn$
                BEGIN
                    IF NEW."UserId" = '{actor.UserId}' THEN
                        RAISE EXCEPTION 'forced XP insert failure for test';
                    END IF;
                    RETURN NEW;
                END;
                $fn$ LANGUAGE plpgsql
                """,
                TestContext.Current.CancellationToken);
            await db.Database.ExecuteSqlRawAsync(
                """
                CREATE TRIGGER xp_insert_reject_for_api_test
                BEFORE INSERT ON "XpTransactions"
                FOR EACH ROW EXECUTE FUNCTION reject_xp_insert_for_api_test()
                """,
                TestContext.Current.CancellationToken);
        }

        try
        {
            var redeem = await PostJsonWithCsrfAsync(
                actor.Client,
                $"/api/v1/quests/{quest.Id}/redeem",
                new { code });
            Assert.Equal(HttpStatusCode.InternalServerError, redeem.StatusCode);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await db.Database.ExecuteSqlRawAsync(
                """
                DROP TRIGGER IF EXISTS xp_insert_reject_for_api_test ON "XpTransactions";
                DROP FUNCTION IF EXISTS reject_xp_insert_for_api_test()
                """,
                TestContext.Current.CancellationToken);
        }

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            Assert.Equal(0, await db.QuestCompletions.CountAsync(
                item => item.UserId == actor.UserId,
                TestContext.Current.CancellationToken));
            Assert.Equal(0, await db.XpTransactions.CountAsync(
                item => item.UserId == actor.UserId,
                TestContext.Current.CancellationToken));
            var profile = await db.UserProfiles.SingleAsync(
                item => item.Id == actor.UserId,
                TestContext.Current.CancellationToken);
            Assert.Equal(0, profile.TotalXp);
            Assert.Equal(1, profile.Level);
        }
    }

    [Fact]
    public async Task OpenApiDocumentsTheProgressionRoute()
    {
        var documentText = await _factory.CreateClient().GetStringAsync(
            "/openapi/v1.json",
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(documentText);

        Assert.True(document.RootElement
            .GetProperty("paths")
            .TryGetProperty(ProgressionPath, out var path));
        Assert.True(path.TryGetProperty("get", out _));
    }

    private async Task ReconcileAsync()
    {
        var service = new XpReconciliationRunner(
            _factory.Services.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new XpReconciliationOptions()),
            NullLogger<XpReconciliationRunner>.Instance);
        var result = await service.ReconcilePassAsync(TestContext.Current.CancellationToken);
        Assert.True(result.PassComplete);
    }

    private async Task AwardAsync(Guid userId, QuestDifficulty difficulty)
    {
        var completion = await SeedPendingCompletionAsync(userId, difficulty);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var repository = new XpLedgerRepository(
            db, new Kiwimpact.Infrastructure.Achievements.AchievementAwardService(db));
        var outcome = await repository.AwardVerifiedCompletionAsync(
            completion,
            DateTimeOffset.UtcNow,
            TestContext.Current.CancellationToken);
        Assert.Equal(XpAwardOutcome.Awarded, outcome);
    }

    private async Task<QuestCompletion> SeedPendingCompletionAsync(
        Guid userId,
        QuestDifficulty difficulty)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var creator = XpLedgerTestHelpers.NewUser("progression-creator");
        var quest = XpLedgerTestHelpers.NewQuest(creator.Id, difficulty);
        var participation = QuestParticipation.CreateActive(
            userId, quest.Id, DateTimeOffset.UtcNow.AddHours(-1));
        db.Set<ApplicationUser>().Add(creator);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        var completion = QuestCompletion.CreateVerifiedWithCode(
            userId, quest, participation, null, DateTimeOffset.UtcNow);
        db.QuestCompletions.Add(completion);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return completion;
    }

    private async Task<Guid> SeedNullTimestampCompletionAsync(Guid userId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var creator = XpLedgerTestHelpers.NewUser("progression-creator");
        var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
        var participation = QuestParticipation.CreateActive(
            userId, quest.Id, DateTimeOffset.UtcNow.AddHours(-1));
        db.Set<ApplicationUser>().Add(creator);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        var completionId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "QuestCompletions"
                ("Id", "UserId", "QuestId", "ParticipationId", "Method", "Status",
                 "CompletedAt", "VerifiedAtUtc", "RewardDifficultySnapshot",
                 "QuestCategorySnapshot",
                 "CommunityRegionIdAtCompletion", "CreatedAt", "UpdatedAt")
            VALUES
                ({completionId}, {userId}, {quest.Id},
                 {participation.Id}, 'CompletionCode', 'Verified',
                 {now}, NULL, 'Easy', {quest.Category.ToString()},
                 NULL, {now}, {now})
            """, TestContext.Current.CancellationToken);
        return completionId;
    }

    private async Task<Quest> SeedQuestAsync(
        Guid creatorId,
        QuestDifficulty difficulty)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var quest = XpLedgerTestHelpers.NewQuest(creatorId, difficulty);
        db.Quests.Add(quest);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return quest;
    }

    private async Task SeedParticipationAsync(Guid userId, Guid questId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        db.QuestParticipations.Add(QuestParticipation.CreateActive(
            userId, questId, DateTimeOffset.UtcNow.AddMinutes(-5)));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    private async Task<AuthClient> CreateAuthenticatedClientAsync(string role)
    {
        var host = _factory.WithWebHostBuilder(_ => { });
        _hosts.Add(host);
        var client = host.CreateClient();
        var email = $"progression-{Guid.NewGuid():N}@example.test";

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
                displayName = "Progression tester",
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

    private static async Task AssertNotReadyAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        AssertExactKeys(problem, "detail", "status", "title", "type");
        Assert.Equal(
            "https://kiwimpact.app/problems/progression-not-ready",
            problem.GetProperty("type").GetString());
        Assert.Equal(503, problem.GetProperty("status").GetInt32());
        Assert.DoesNotContain("count", problem.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("pending", problem.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    private static void AssertExactKeys(JsonElement json, params string[] expected)
    {
        var keys = json.EnumerateObject()
            .Select(item => item.Name)
            .Order(StringComparer.Ordinal)
            .ToArray();
        Assert.Equal(expected.Order(StringComparer.Ordinal).ToArray(), keys);
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
