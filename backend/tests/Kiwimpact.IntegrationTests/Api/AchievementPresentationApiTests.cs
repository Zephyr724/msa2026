using System.Data;
using System.Data.Common;
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
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class AchievementPresentationApiTests
    : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private const string Password = "ValidPass!1234";
    private const string StatsPath = "/api/v1/achievement-stats";
    private const string ProfilePath = "/api/v1/users/me/achievement-profile";
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<WebApplicationFactory<Program>> _hosts = [];

    public AchievementPresentationApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public void Dispose()
    {
        foreach (var host in _hosts)
            host.Dispose();
    }

    [Fact]
    public async Task NationwideStatsAreAnonymousExactDistinctAndPrivate()
    {
        await ResetPresentationStateAsync();
        var firstMember = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var secondMember = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var unconfirmedMember = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var organizer = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        await SetEmailConfirmedAsync(firstMember.UserId, true);
        await SetEmailConfirmedAsync(secondMember.UserId, true);
        await SetEmailConfirmedAsync(organizer.UserId, true);

        await AwardCompletionsAsync(firstMember.UserId, 5);
        await AwardCompletionsAsync(secondMember.UserId, 1);
        await AwardCompletionsAsync(unconfirmedMember.UserId, 5);
        await AwardCompletionsAsync(organizer.UserId, 5);

        var anonymous = _factory.CreateClient();
        var response = await anonymous.GetAsync(
            StatsPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        var items = json.EnumerateArray().ToArray();
        Assert.Equal(AchievementCatalog.Definitions.Count, items.Length);
        Assert.Equal(
            AchievementCatalog.Definitions
                .OrderBy(definition => definition.Code, StringComparer.Ordinal)
                .Select(definition => definition.Id),
            items.Select(item => item.GetProperty("achievementId").GetGuid()));
        foreach (var item in items)
        {
            AssertExactKeys(
                item,
                "achievementId",
                "calculatedAtUtc",
                "earnedPercentage",
                "nationwideEarnedCount",
                "nationwideMemberCount",
                "rarity");
            Assert.True(DateTimeOffset.TryParse(
                item.GetProperty("calculatedAtUtc").GetString(),
                out _));
        }
        Assert.Single(
            items.Select(item => item.GetProperty("calculatedAtUtc").GetString())
                .Distinct(StringComparer.Ordinal));

        var firstSteps = StatFor(items, AchievementCatalog.FirstSteps.Id);
        Assert.Equal(2, firstSteps.GetProperty("nationwideEarnedCount").GetInt32());
        Assert.Equal(2, firstSteps.GetProperty("nationwideMemberCount").GetInt32());
        Assert.Equal(100m, firstSteps.GetProperty("earnedPercentage").GetDecimal());
        Assert.Equal("Common", firstSteps.GetProperty("rarity").GetString());

        var momentum = StatFor(items, AchievementCatalog.BuildingMomentum.Id);
        Assert.Equal(1, momentum.GetProperty("nationwideEarnedCount").GetInt32());
        Assert.Equal(2, momentum.GetProperty("nationwideMemberCount").GetInt32());
        Assert.Equal(50m, momentum.GetProperty("earnedPercentage").GetDecimal());
        Assert.Equal("Common", momentum.GetProperty("rarity").GetString());

        var unawarded = StatFor(
            items,
            AchievementCatalog.FindByCode("verified-completions-10")!.Id);
        Assert.Equal(0, unawarded.GetProperty("nationwideEarnedCount").GetInt32());
        Assert.Equal(0m, unawarded.GetProperty("earnedPercentage").GetDecimal());
        Assert.Equal("Unawarded", unawarded.GetProperty("rarity").GetString());

        var raw = json.GetRawText();
        Assert.DoesNotContain("userId", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("email", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("displayName", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("region", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("evidence", raw, StringComparison.OrdinalIgnoreCase);

        await SetAchievementActiveAsync(AchievementCatalog.FirstSteps.Id, false);
        try
        {
            var activeOnly = (await ReadJsonAsync(
                    await anonymous.GetAsync(
                        StatsPath,
                        TestContext.Current.CancellationToken)))
                .EnumerateArray()
                .ToArray();
            Assert.Equal(
                AchievementCatalog.Definitions.Count - 1,
                activeOnly.Length);
            Assert.DoesNotContain(
                activeOnly,
                item =>
                    item.GetProperty("achievementId").GetGuid() ==
                    AchievementCatalog.FirstSteps.Id);
        }
        finally
        {
            await SetAchievementActiveAsync(
                AchievementCatalog.FirstSteps.Id,
                true);
        }
    }

    [Fact]
    public async Task NationwideStatsReturn503WhileAnyProfileIsStale()
    {
        await ResetPresentationStateAsync();
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SetAchievementEvaluationVersionAsync(actor.UserId, 0);
        try
        {
            var response = await _factory.CreateClient().GetAsync(
                StatsPath,
                TestContext.Current.CancellationToken);

            await AssertProgressionNotReadyAsync(response);
        }
        finally
        {
            await SetAchievementEvaluationVersionAsync(
                actor.UserId,
                AchievementCatalog.CurrentEvaluationVersion);
        }
    }

    [Fact]
    public async Task NationwideStatsUseZeroDenominatorWithoutInventingRarity()
    {
        await ResetPresentationStateAsync();
        var actorWithoutProfile =
            await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SetEmailConfirmedAsync(actorWithoutProfile.UserId, true);
        await DeleteProfileAsync(actorWithoutProfile.UserId);

        var response = await _factory.CreateClient().GetAsync(
            StatsPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = (await ReadJsonAsync(response)).EnumerateArray().ToArray();
        Assert.Equal(AchievementCatalog.Definitions.Count, items.Length);
        Assert.All(items, item =>
        {
            Assert.Equal(
                0,
                item.GetProperty("nationwideEarnedCount").GetInt32());
            Assert.Equal(
                0,
                item.GetProperty("nationwideMemberCount").GetInt32());
            Assert.Equal(
                0m,
                item.GetProperty("earnedPercentage").GetDecimal());
            Assert.Equal("Unawarded", item.GetProperty("rarity").GetString());
        });
    }

    [Fact]
    public async Task CompositeRarityReadsUseOneRepeatableReadSnapshot()
    {
        await ResetPresentationStateAsync();
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var interceptor = new IsolationRecordingInterceptor();
        var options = new DbContextOptionsBuilder<KiwimpactDbContext>()
            .UseNpgsql(
                _factory.ConnectionString,
                npgsql => npgsql.MigrationsAssembly(
                    typeof(KiwimpactDbContext).Assembly.FullName))
            .AddInterceptors(interceptor)
            .Options;
        await using var db = new KiwimpactDbContext(options);
        var repository = new AchievementRepository(db);

        _ = await repository.GetNationwideStatsAsync(
            TestContext.Current.CancellationToken);
        Assert.NotEmpty(interceptor.ObservedIsolationLevels);
        Assert.All(
            interceptor.ObservedIsolationLevels,
            level => Assert.Equal(IsolationLevel.RepeatableRead, level));

        interceptor.ObservedIsolationLevels.Clear();
        Assert.NotNull(await repository.GetAchievementProfileAsync(
            actor.UserId,
            TestContext.Current.CancellationToken));
        Assert.NotEmpty(interceptor.ObservedIsolationLevels);
        Assert.All(
            interceptor.ObservedIsolationLevels,
            level => Assert.Equal(IsolationLevel.RepeatableRead, level));
    }

    [Fact]
    public async Task ProfileReturnsBoundedNotReadyThenNotFound()
    {
        await ResetPresentationStateAsync();
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SetAchievementEvaluationVersionAsync(actor.UserId, 0);

        await AssertProgressionNotReadyAsync(await actor.Client.GetAsync(
            ProfilePath,
            TestContext.Current.CancellationToken));

        await SetAchievementEvaluationVersionAsync(
            actor.UserId,
            AchievementCatalog.CurrentEvaluationVersion);
        await DeleteProfileAsync(actor.UserId);
        var response = await actor.Client.GetAsync(
            ProfilePath,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.Equal(
            "https://kiwimpact.app/problems/profile-not-found",
            problem.GetProperty("type").GetString());
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task ProfileIsPrivateExactAndKeepsLifetimeTrophyAndCosmetics()
    {
        await ResetPresentationStateAsync();
        var anonymous = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await anonymous.GetAsync(
                ProfilePath,
                TestContext.Current.CancellationToken)).StatusCode);

        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SetEmailConfirmedAsync(actor.UserId, true);
        await AwardCompletionsAsync(actor.UserId, 5);

        var response = await actor.Client.GetAsync(
            ProfilePath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var profile = await ReadJsonAsync(response);
        AssertExactKeys(
            profile,
            "activeAchievementCount",
            "cosmetics",
            "earnedDistinctCount",
            "trophy");
        Assert.Equal(5, profile.GetProperty("earnedDistinctCount").GetInt32());
        Assert.Equal(
            AchievementCatalog.Definitions.Count,
            profile.GetProperty("activeAchievementCount").GetInt32());
        AssertBronzeTrophy(profile.GetProperty("trophy"));
        AssertSproutCosmetics(profile.GetProperty("cosmetics"));
        AssertProfilePrivacy(profile);

        await SetAchievementActiveAsync(AchievementCatalog.FirstSteps.Id, false);
        try
        {
            var historical = await ReadJsonAsync(await actor.Client.GetAsync(
                ProfilePath,
                TestContext.Current.CancellationToken));
            Assert.Equal(
                5,
                historical.GetProperty("earnedDistinctCount").GetInt32());
            Assert.Equal(
                AchievementCatalog.Definitions.Count - 1,
                historical.GetProperty("activeAchievementCount").GetInt32());
            Assert.Equal(
                "Bronze",
                historical.GetProperty("trophy").GetProperty("tier").GetString());
            AssertSproutCosmetics(historical.GetProperty("cosmetics"));
        }
        finally
        {
            await SetAchievementActiveAsync(AchievementCatalog.FirstSteps.Id, true);
        }
    }

    [Fact]
    public async Task ProfileSelectsHighestPriorityCosmeticsAndThreeBadgeStamps()
    {
        await ResetPresentationStateAsync();
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SetEmailConfirmedAsync(actor.UserId, true);
        await AwardCompletionsAsync(actor.UserId, 1);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var xp = await db.XpTransactions
                .AsNoTracking()
                .SingleAsync(
                    transaction => transaction.UserId == actor.UserId,
                    TestContext.Current.CancellationToken);
            var cosmeticCodes = new[]
            {
                "verified-completions-25",
                "verified-completions-100",
                "weekly-streak-52",
                "level-20",
                "weekly-streak-12",
                "level-50",
                "all-categories-1",
                "level-99",
                "community-catalyst",
            };
            db.UserAchievements.AddRange(cosmeticCodes.Select(
                (code, index) =>
                    UserAchievement.CreateFromMilestone(
                        actor.UserId,
                        new PendingAchievementAward(
                            AchievementCatalog.FindByCode(code)!.Id,
                            xp.Id,
                            xp.CreatedAt.AddMinutes(index + 1)))));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var profile = await ReadJsonAsync(await actor.Client.GetAsync(
            ProfilePath,
            TestContext.Current.CancellationToken));
        var cosmetics = profile.GetProperty("cosmetics");

        Assert.Equal(
            "aurora",
            cosmetics.GetProperty("passportBorderStyle").GetString());
        Assert.Equal(
            "guardian",
            cosmetics.GetProperty("avatarFrameStyle").GetString());
        Assert.Equal(
            ["legend", "community", "explorer"],
            cosmetics.GetProperty("badgeStampStyles")
                .EnumerateArray()
                .Select(item => item.GetString()));
    }

    [Fact]
    public async Task RepeatedCommunityRewardCountsOnceForStatsAndTrophy()
    {
        await ResetPresentationStateAsync();
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SetEmailConfirmedAsync(actor.UserId, true);
        var communityAchievement =
            AchievementCatalog.FindByCode("community-spark")!;

        await _factory.SeedRegionsAsync();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var localAreaIds = await db.Regions
                .AsNoTracking()
                .Where(region => region.Type == RegionType.LocalArea)
                .OrderBy(region => region.Id)
                .Select(region => region.Id)
                .Take(2)
                .ToListAsync(TestContext.Current.CancellationToken);
            Assert.Equal(2, localAreaIds.Count);
            var now = DateTimeOffset.UtcNow;
            var first = CommunityChallenge.Create(
                localAreaIds[0],
                now.AddDays(1),
                now.AddDays(2),
                1,
                communityAchievement.Id,
                now);
            var second = CommunityChallenge.Create(
                localAreaIds[1],
                now.AddDays(1),
                now.AddDays(2),
                1,
                communityAchievement.Id,
                now);
            db.CommunityChallenges.AddRange(first, second);
            db.UserAchievements.AddRange(
                UserAchievement.CreateFromCommunityChallenge(
                    actor.UserId,
                    communityAchievement.Id,
                    first.Id,
                    now),
                UserAchievement.CreateFromCommunityChallenge(
                    actor.UserId,
                    communityAchievement.Id,
                    second.Id,
                    now.AddMinutes(1)));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var stats = (await ReadJsonAsync(await _factory.CreateClient().GetAsync(
                StatsPath,
                TestContext.Current.CancellationToken)))
            .EnumerateArray()
            .ToArray();
        var communityStat = StatFor(stats, communityAchievement.Id);
        Assert.Equal(
            1,
            communityStat.GetProperty("nationwideEarnedCount").GetInt32());
        Assert.Equal(
            1,
            communityStat.GetProperty("nationwideMemberCount").GetInt32());

        var profile = await ReadJsonAsync(await actor.Client.GetAsync(
            ProfilePath,
            TestContext.Current.CancellationToken));
        Assert.Equal(1, profile.GetProperty("earnedDistinctCount").GetInt32());
        Assert.Equal(
            "Locked",
            profile.GetProperty("trophy").GetProperty("tier").GetString());
    }

    private async Task ResetPresentationStateAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            """UPDATE "Achievements" SET "IsActive" = TRUE""",
            TestContext.Current.CancellationToken);
        await db.Database.ExecuteSqlRawAsync(
            """UPDATE "AspNetUsers" SET "EmailConfirmed" = FALSE""",
            TestContext.Current.CancellationToken);
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"UserProfiles\" SET \"AchievementEvaluationVersion\" = {AchievementCatalog.CurrentEvaluationVersion}",
            TestContext.Current.CancellationToken);
    }

    private async Task SetEmailConfirmedAsync(Guid userId, bool confirmed)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"AspNetUsers\" SET \"EmailConfirmed\" = {confirmed} WHERE \"Id\" = {userId}",
            TestContext.Current.CancellationToken);
    }

    private async Task SetAchievementEvaluationVersionAsync(
        Guid userId,
        int version)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"UserProfiles\" SET \"AchievementEvaluationVersion\" = {version} WHERE \"Id\" = {userId}",
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
            var repository = new XpLedgerRepository(
                db,
                new AchievementAwardService(db));
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
        var creator = XpLedgerTestHelpers.NewUser("achievement-presentation-creator");
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

    private async Task<AuthClient> CreateAuthenticatedClientAsync(string role)
    {
        var host = _factory.WithWebHostBuilder(_ => { });
        _hosts.Add(host);
        var client = host.CreateClient();
        var email = $"achievement-presentation-{Guid.NewGuid():N}@example.test";

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
                displayName = "Achievement presentation tester",
            });
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);

        Guid userId;
        using (var scope = host.Services.CreateScope())
        {
            var userManager =
                scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            Assert.NotNull(user);
            userId = user.Id;
            if (role != AppRoles.Member)
            {
                Assert.True(
                    (await userManager.RemoveFromRoleAsync(user, AppRoles.Member))
                    .Succeeded);
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
            .ReadFromJsonAsync<AntiforgeryTokenDto>(
                TestContext.Current.CancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = body is null
                ? null
                : JsonContent.Create(body, options: JsonOptions),
        };
        request.Headers.Add("X-CSRF-TOKEN", tokenBody?.Token);
        return await client.SendAsync(
            request,
            TestContext.Current.CancellationToken);
    }

    private static JsonElement StatFor(
        IEnumerable<JsonElement> items,
        Guid achievementId) =>
        Assert.Single(
            items,
            item =>
                item.GetProperty("achievementId").GetGuid() == achievementId);

    private static void AssertBronzeTrophy(JsonElement trophy)
    {
        AssertExactKeys(
            trophy,
            "calculatedAtUtc",
            "earnedPercentage",
            "nationwideEarnedCount",
            "nationwideMemberCount",
            "nextRequiredCount",
            "nextTier",
            "rarity",
            "requiredCount",
            "tier");
        Assert.Equal("Bronze", trophy.GetProperty("tier").GetString());
        Assert.Equal(5, trophy.GetProperty("requiredCount").GetInt32());
        Assert.Equal("Silver", trophy.GetProperty("nextTier").GetString());
        Assert.Equal(10, trophy.GetProperty("nextRequiredCount").GetInt32());
        Assert.Equal(1, trophy.GetProperty("nationwideEarnedCount").GetInt32());
        Assert.Equal(1, trophy.GetProperty("nationwideMemberCount").GetInt32());
        Assert.Equal(100m, trophy.GetProperty("earnedPercentage").GetDecimal());
        Assert.Equal("Common", trophy.GetProperty("rarity").GetString());
        Assert.True(DateTimeOffset.TryParse(
            trophy.GetProperty("calculatedAtUtc").GetString(),
            out _));
    }

    private static void AssertSproutCosmetics(JsonElement cosmetics)
    {
        AssertExactKeys(
            cosmetics,
            "avatarFrameStyle",
            "badgeStampStyles",
            "passportBorderStyle");
        Assert.Equal(JsonValueKind.Null, cosmetics
            .GetProperty("passportBorderStyle")
            .ValueKind);
        Assert.Equal(
            "sprout",
            cosmetics.GetProperty("avatarFrameStyle").GetString());
        Assert.Empty(cosmetics
            .GetProperty("badgeStampStyles")
            .EnumerateArray());
    }

    private static void AssertProfilePrivacy(JsonElement profile)
    {
        var raw = profile.GetRawText();
        Assert.DoesNotContain("userId", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("email", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("displayName", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("region", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("evidence", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("xpTransaction", raw, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task AssertProgressionNotReadyAsync(
        HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        AssertExactKeys(problem, "detail", "status", "title", "type");
        Assert.Equal(
            "https://kiwimpact.app/problems/progression-not-ready",
            problem.GetProperty("type").GetString());
        Assert.Equal(503, problem.GetProperty("status").GetInt32());
    }

    private static void AssertExactKeys(JsonElement json, params string[] expected)
    {
        var actual = json.EnumerateObject()
            .Select(property => property.Name)
            .Order(StringComparer.Ordinal)
            .ToArray();
        Assert.Equal(expected.Order(StringComparer.Ordinal).ToArray(), actual);
    }

    private static async Task<JsonElement> ReadJsonAsync(
        HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(body);
        return document.RootElement.Clone();
    }

    private sealed record AuthClient(HttpClient Client, Guid UserId);
    private sealed record AntiforgeryTokenDto(string Token);

    private sealed class IsolationRecordingInterceptor : DbCommandInterceptor
    {
        public List<IsolationLevel?> ObservedIsolationLevels { get; } = [];

        public override ValueTask<InterceptionResult<DbDataReader>>
            ReaderExecutingAsync(
                DbCommand command,
                CommandEventData eventData,
                InterceptionResult<DbDataReader> result,
                CancellationToken cancellationToken = default)
        {
            ObservedIsolationLevels.Add(
                eventData.Context?.Database.CurrentTransaction
                    ?.GetDbTransaction()
                    .IsolationLevel);
            return ValueTask.FromResult(result);
        }
    }
}
