using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Api.Reconciliation;
using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.IntegrationTests.Persistence;
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
    public async Task AdminChallengeRewardMustBeAnActiveCommunityAchievement()
    {
        await ResetAndSeedRegionsAsync();
        var communityReward = AchievementCatalog.FindByCode("community-spark")!;
        var inactiveCommunityReward =
            AchievementCatalog.FindByCode("community-catalyst")!;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await AchievementSeed.SeedAndValidateAsync(
                db,
                TestContext.Current.CancellationToken);
            await db.Database.ExecuteSqlRawAsync(
                """UPDATE "Achievements" SET "IsActive" = TRUE""",
                TestContext.Current.CancellationToken);
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE \"Achievements\" SET \"IsActive\" = FALSE WHERE \"Id\" = {inactiveCommunityReward.Id}",
                TestContext.Current.CancellationToken);
        }

        try
        {
            var admin = await CreateAuthenticatedClientAsync(AppRoles.Admin);
            var now = DateTimeOffset.UtcNow;
            object Request(Guid regionId, Guid rewardId, uint version = 0) => new
            {
                localAreaRegionId = regionId,
                periodStartUtc = now.AddYears(10),
                periodEndUtc = now.AddYears(10).AddDays(7),
                targetValue = 20,
                rewardAchievementId = rewardId,
                version,
            };

            var valid = await SendJsonWithCsrfAsync(
                admin,
                HttpMethod.Post,
                "/api/v1/admin/community-challenges",
                Request(RegionSeed.DevonportTakapunaId, communityReward.Id));
            var automatic = await SendJsonWithCsrfAsync(
                admin,
                HttpMethod.Post,
                "/api/v1/admin/community-challenges",
                Request(RegionSeed.FranklinId, AchievementCatalog.FirstSteps.Id));
            var unknown = await SendJsonWithCsrfAsync(
                admin,
                HttpMethod.Post,
                "/api/v1/admin/community-challenges",
                Request(RegionSeed.GreatBarrierId, Guid.NewGuid()));
            var inactive = await SendJsonWithCsrfAsync(
                admin,
                HttpMethod.Post,
                "/api/v1/admin/community-challenges",
                Request(RegionSeed.HendersonMasseyId, inactiveCommunityReward.Id));

            Assert.Equal(HttpStatusCode.Created, valid.StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, automatic.StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, unknown.StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, inactive.StatusCode);

            var created = await ReadJsonAsync(valid);
            var challengeId = created.GetProperty("id").GetGuid();
            var current = await ReadJsonAsync(await admin.GetAsync(
                $"/api/v1/community-challenges/{challengeId}",
                TestContext.Current.CancellationToken));
            var invalidUpdate = await SendJsonWithCsrfAsync(
                admin,
                HttpMethod.Patch,
                $"/api/v1/admin/community-challenges/{challengeId}",
                Request(
                    RegionSeed.DevonportTakapunaId,
                    AchievementCatalog.FirstSteps.Id,
                    current.GetProperty("version").GetUInt32()));
            Assert.True(
                invalidUpdate.StatusCode == HttpStatusCode.BadRequest,
                await invalidUpdate.Content.ReadAsStringAsync(
                    TestContext.Current.CancellationToken));

            var unchanged = await ReadJsonAsync(await admin.GetAsync(
                $"/api/v1/community-challenges/{challengeId}",
                TestContext.Current.CancellationToken));
            Assert.Equal(
                communityReward.Id,
                unchanged.GetProperty("rewardAchievementId").GetGuid());
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE \"Achievements\" SET \"IsActive\" = TRUE WHERE \"Id\" = {inactiveCommunityReward.Id}",
                TestContext.Current.CancellationToken);
        }
    }

    [Fact]
    public async Task FinalizerAwardsCommunityAchievementOnceToEachContributor()
    {
        await ResetAndSeedRegionsAsync();
        Guid challengeId;
        Guid contributorId;
        var reward = AchievementCatalog.FindByCode("community-spark")!;
        var now = DateTimeOffset.UtcNow;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await AchievementSeed.SeedAndValidateAsync(
                db,
                TestContext.Current.CancellationToken);
            var creator = XpLedgerTestHelpers.NewUser("challenge-finalizer-creator");
            var contributor =
                XpLedgerTestHelpers.NewUser("challenge-finalizer-member");
            contributorId = contributor.Id;
            var profile = UserProfile.Create(
                contributor.Id,
                "Challenge contributor",
                now.AddHours(-4));
            var quest = XpLedgerTestHelpers.NewQuest(
                creator.Id,
                QuestDifficulty.Easy);
            var participation = QuestParticipation.CreateActive(
                contributor.Id,
                quest.Id,
                now.AddHours(-3));
            var completion = QuestCompletion.CreateVerifiedWithCode(
                contributor.Id,
                quest,
                participation,
                RegionSeed.AlbertEdenId,
                now.AddHours(-2));
            var xp = XpTransaction.CreateFromVerifiedCompletion(completion);
            profile.ApplyXpAward(xp.XpAmount, xp.CreatedAt);
            var challenge = CommunityChallenge.Create(
                RegionSeed.AlbertEdenId,
                now.AddHours(-3),
                now.AddHours(-1),
                1,
                reward.Id,
                now.AddHours(-4));
            challengeId = challenge.Id;

            db.Users.AddRange(creator, contributor);
            db.UserProfiles.Add(profile);
            db.Quests.Add(quest);
            db.QuestParticipations.Add(participation);
            db.QuestCompletions.Add(completion);
            db.XpTransactions.Add(xp);
            db.CommunityChallenges.Add(challenge);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var finalizer =
            _factory.Services.GetRequiredService<CommunityChallengeFinalizer>();
        Assert.Equal(
            1,
            await finalizer.FinalizePassAsync(
                TestContext.Current.CancellationToken));
        Assert.Equal(
            0,
            await finalizer.FinalizePassAsync(
                TestContext.Current.CancellationToken));

        using var assertScope = _factory.Services.CreateScope();
        var assertDb =
            assertScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var challengeAfter = await assertDb.CommunityChallenges
            .AsNoTracking()
            .SingleAsync(
                challenge => challenge.Id == challengeId,
                TestContext.Current.CancellationToken);
        Assert.Equal(ChallengeStatus.Completed, challengeAfter.Status);
        var award = Assert.Single(await assertDb.UserAchievements
            .AsNoTracking()
            .Where(item =>
                item.UserId == contributorId &&
                item.AchievementId == reward.Id)
            .ToListAsync(TestContext.Current.CancellationToken));
        Assert.Equal(challengeId, award.SourceCommunityChallengeId);
        Assert.Null(award.XpTransactionId);
        Assert.Equal(
            challengeAfter.PeriodEnd,
            award.AwardedAt,
            TimeSpan.FromMicroseconds(1));
    }

    [Fact]
    public async Task FinalizerFailsClosedForALegacyAutomaticRewardReference()
    {
        await ResetAndSeedRegionsAsync();
        var challenge = CommunityChallenge.Create(
            RegionSeed.WhauId,
            new DateTimeOffset(2000, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2000, 1, 2, 0, 0, 0, TimeSpan.Zero),
            1,
            AchievementCatalog.FirstSteps.Id,
            new DateTimeOffset(1999, 12, 31, 0, 0, 0, TimeSpan.Zero));
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await AchievementSeed.SeedAndValidateAsync(
                db,
                TestContext.Current.CancellationToken);
            db.CommunityChallenges.Add(challenge);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var finalizer =
            _factory.Services.GetRequiredService<CommunityChallengeFinalizer>();
        Assert.Equal(
            0,
            await finalizer.FinalizePassAsync(
                TestContext.Current.CancellationToken));

        using var assertScope = _factory.Services.CreateScope();
        var assertDb =
            assertScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var unchanged = await assertDb.CommunityChallenges
            .AsNoTracking()
            .SingleAsync(
                item => item.Id == challenge.Id,
                TestContext.Current.CancellationToken);
        Assert.Equal(ChallengeStatus.Active, unchanged.Status);
        Assert.Empty(await assertDb.UserAchievements
            .AsNoTracking()
            .Where(item => item.SourceCommunityChallengeId == challenge.Id)
            .ToListAsync(TestContext.Current.CancellationToken));
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
