using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Reconciliation;
using Kiwimpact.IntegrationTests.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class LeaderboardsApiTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private const string Password = "ValidPass!1234";
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);
    private const string LeaderboardPath = "/api/v1/leaderboards/people";
    private const string NzAllTimePath =
        LeaderboardPath + "?scope=nz&period=allTime";
    private readonly CustomWebApplicationFactory _factory;

    public LeaderboardsApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task AnonymousDefaultReadIsExactPrivateAndLedgerAuthoritative()
    {
        await ResetLeaderboardDataAsync();
        var zeroXpUserId = await SeedProfileOnlyAsync("No XP");
        var rankedUserId = await SeedRankedUserAsync(
            "Aroha",
            null,
            QuestDifficulty.Easy,
            QuestDifficulty.Medium);

        var response = await _factory.CreateClient().GetAsync(
            NzAllTimePath,
            TestContext.Current.CancellationToken);

        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var json = await ReadJsonAsync(response);
        AssertExactKeys(
            json,
            "collectiveProgress",
            "currentUser",
            "isPrivacyProtected",
            "page",
            "pageSize",
            "period",
            "rows",
            "scope",
            "totalCount");
        Assert.Equal(JsonValueKind.Null, json.GetProperty("currentUser").ValueKind);
        Assert.Equal("nz", json.GetProperty("scope").GetString());
        Assert.Equal("allTime", json.GetProperty("period").GetString());
        var rows = json.GetProperty("rows");
        Assert.Equal(1, rows.GetArrayLength());
        var row = rows[0];
        AssertExactKeys(
            row,
            "displayName",
            "isCurrentUser",
            "rank",
            "totalXp",
            "verifiedCompletionCount");
        Assert.Equal(1, row.GetProperty("rank").GetInt32());
        Assert.Equal("Aroha", row.GetProperty("displayName").GetString());
        Assert.Equal(150, row.GetProperty("totalXp").GetInt64());
        Assert.Equal(2, row.GetProperty("verifiedCompletionCount").GetInt64());
        Assert.False(row.GetProperty("isCurrentUser").GetBoolean());
        Assert.DoesNotContain(
            rankedUserId.ToString("D"),
            json.GetRawText(),
            StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(
            zeroXpUserId.ToString("D"),
            json.GetRawText(),
            StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("community", json.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("email", json.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("quest", json.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("transaction", json.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task EmptyLedgerReturnsAnEmptySuccessfulBoard()
    {
        await ResetLeaderboardDataAsync();
        await SeedProfileOnlyAsync("Still no XP");

        var response = await _factory.CreateClient().GetAsync(
            NzAllTimePath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        Assert.Empty(json.GetProperty("rows").EnumerateArray());
    }

    [Fact]
    public async Task RepositoryAppliesEveryTieBreakAndServiceAssignsOrdinalRanks()
    {
        await ResetLeaderboardDataAsync();
        await SeedRankedUserAsync(
            "Highest total",
            null,
            QuestDifficulty.Medium,
            QuestDifficulty.Medium);
        await SeedRankedUserAsync(
            "More completions",
            null,
            QuestDifficulty.Easy,
            QuestDifficulty.Easy,
            QuestDifficulty.Easy);
        await SeedRankedUserAsync(
            "Fewer completions",
            null,
            QuestDifficulty.Hard);
        await SeedRankedUserAsync(
            "Aroha",
            new Guid("00000000-0000-0000-0000-000000000002"),
            QuestDifficulty.Easy);
        await SeedRankedUserAsync(
            "AROHA",
            new Guid("00000000-0000-0000-0000-000000000001"),
            QuestDifficulty.Easy);
        await SeedRankedUserAsync(
            "Zebra",
            new Guid("00000000-0000-0000-0000-000000000004"),
            QuestDifficulty.Easy);
        await SeedRankedUserAsync(
            "Zebra",
            new Guid("00000000-0000-0000-0000-000000000003"),
            QuestDifficulty.Easy);

        var response = await _factory.CreateClient().GetAsync(
            $"{LeaderboardPath}?scope=nz&period=allTime",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rows = (await ReadJsonAsync(response)).GetProperty("rows");
        Assert.Equal(
            [
                "Highest total",
                "More completions",
                "Fewer completions",
                "AROHA",
                "Aroha",
                "Zebra",
                "Zebra",
            ],
            rows.EnumerateArray()
                .Select(row => row.GetProperty("displayName").GetString()!)
                .ToArray());
        Assert.Equal(
            Enumerable.Range(1, 7),
            rows.EnumerateArray().Select(row => row.GetProperty("rank").GetInt32()));
        Assert.Equal(
            [200L, 150L, 150L, 50L, 50L, 50L, 50L],
            rows.EnumerateArray().Select(row => row.GetProperty("totalXp").GetInt64()));
        Assert.Equal(
            [2L, 3L, 1L, 1L, 1L, 1L, 1L],
            rows.EnumerateArray()
                .Select(row => row.GetProperty("verifiedCompletionCount").GetInt64()));
    }

    [Fact]
    public async Task TopTenUsesTheFullDeterministicOrder()
    {
        await ResetLeaderboardDataAsync();
        for (var index = 0; index < 11; index++)
        {
            await SeedRankedUserAsync(
                $"Person {index:D2}",
                null,
                QuestDifficulty.Easy);
        }

        var response = await _factory.CreateClient().GetAsync(
            NzAllTimePath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rows = (await ReadJsonAsync(response)).GetProperty("rows");
        Assert.Equal(10, rows.GetArrayLength());
        Assert.Equal(
            Enumerable.Range(0, 10).Select(index => $"Person {index:D2}"),
            rows.EnumerateArray()
                .Select(row => row.GetProperty("displayName").GetString()!));
        Assert.DoesNotContain(
            rows.EnumerateArray(),
            row => row.GetProperty("displayName").GetString() == "Person 10");
    }

    [Fact]
    public async Task AuthenticatedMemberPositionIsReturnedOutsideTopTen()
    {
        await ResetLeaderboardDataAsync();
        var actor = await CreateAuthenticatedMemberAsync();
        await SeedRankedCompletionsAsync(
            actor.UserId,
            "Person 10",
            QuestDifficulty.Easy);
        for (var index = 0; index < 10; index++)
        {
            await SeedRankedUserAsync(
                $"Person {index:D2}",
                null,
                QuestDifficulty.Easy);
        }

        var response = await actor.Client.GetAsync(
            NzAllTimePath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        Assert.Equal(10, json.GetProperty("rows").GetArrayLength());
        Assert.DoesNotContain(
            json.GetProperty("rows").EnumerateArray(),
            row => row.GetProperty("isCurrentUser").GetBoolean());
        var current = json.GetProperty("currentUser");
        AssertExactKeys(
            current,
            "activeMemberCount",
            "hasReachedScopeUpgradeThreshold",
            "percentile",
            "rank",
            "surpassedMemberCount",
            "totalXp",
            "verifiedCompletionCount");
        Assert.Equal(11, current.GetProperty("rank").GetInt32());
        Assert.Equal(11, current.GetProperty("activeMemberCount").GetInt32());
        Assert.Equal(0, current.GetProperty("surpassedMemberCount").GetInt32());
        Assert.Equal(0m, current.GetProperty("percentile").GetDecimal());
        Assert.False(current.GetProperty("hasReachedScopeUpgradeThreshold").GetBoolean());
        Assert.Equal(50, current.GetProperty("totalXp").GetInt64());
        Assert.Equal(1, current.GetProperty("verifiedCompletionCount").GetInt64());
    }

    [Theory]
    [InlineData("?scope=somewhere")]
    [InlineData("?scope=")]
    [InlineData("?period=daily")]
    [InlineData("?period=")]
    [InlineData("?page=")]
    [InlineData("?page=0")]
    [InlineData("?page=nope")]
    [InlineData("?pageSize=")]
    [InlineData("?pageSize=51")]
    [InlineData("?pageSize=nope")]
    public async Task InvalidParametersReturnBoundedBadRequest(string query)
    {
        await ResetLeaderboardDataAsync();

        var response = await _factory.CreateClient().GetAsync(
            LeaderboardPath + query,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        AssertExactKeys(problem, "detail", "status", "title", "type");
        Assert.Equal(400, problem.GetProperty("status").GetInt32());
        Assert.DoesNotContain("exception", problem.GetRawText(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UnknownQueryKeysAreIgnored()
    {
        await ResetLeaderboardDataAsync();
        await SeedRankedUserAsync("Known", null, QuestDifficulty.Easy);

        var response = await _factory.CreateClient().GetAsync(
            $"{NzAllTimePath}&future=value",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Single((await ReadJsonAsync(response)).GetProperty("rows").EnumerateArray());
    }

    [Fact]
    public async Task RewardPendingFailsClosedThenReconciliationMakesTheBoardReady()
    {
        await ResetLeaderboardDataAsync();
        Guid userId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var completion = await XpLedgerTestHelpers.SeedPendingCompletionAsync(
                db,
                QuestDifficulty.Hard);
            userId = completion.UserId;
        }

        var pending = await _factory.CreateClient().GetAsync(
            NzAllTimePath,
            TestContext.Current.CancellationToken);
        await AssertNotReadyAsync(pending);

        var runner = _factory.Services.GetRequiredService<XpReconciliationRunner>();
        var pass = await runner.ReconcilePassCoreAsync(
            TestContext.Current.CancellationToken);
        Assert.Equal(1, pass.Awarded);
        Assert.True(pass.PassComplete);

        var ready = await _factory.CreateClient().GetAsync(
            NzAllTimePath,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
        var row = (await ReadJsonAsync(ready)).GetProperty("rows")[0];
        Assert.Equal(150, row.GetProperty("totalXp").GetInt64());
        Assert.Equal(1, row.GetProperty("verifiedCompletionCount").GetInt64());
        Assert.DoesNotContain(
            userId.ToString("D"),
            row.GetRawText(),
            StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task LedgerRowWithoutAResolvableProfileIsExcluded()
    {
        await ResetLeaderboardDataAsync();
        var userId = await SeedRankedUserAsync(
            "Removed profile",
            null,
            QuestDifficulty.Easy);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"UserProfiles\" WHERE \"Id\" = {userId}",
                TestContext.Current.CancellationToken);
        }

        var response = await _factory.CreateClient().GetAsync(
            NzAllTimePath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty((await ReadJsonAsync(response)).GetProperty("rows").EnumerateArray());
    }

    [Fact]
    public async Task CommunityScopeRanksLocalAreasButNzScopeRanksCities()
    {
        await ResetLeaderboardDataAsync();
        var wellingtonId = new Guid("71000000-0000-4000-8000-000000000001");
        var wellingtonCentralId =
            new Guid("71000000-0000-4000-8000-000000000101");
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            if (!await db.Regions.AnyAsync(
                region => region.Id == wellingtonId,
                TestContext.Current.CancellationToken))
            {
                var now = DateTimeOffset.UtcNow;
                db.Regions.Add(new Region
                {
                    Id = wellingtonId,
                    Name = "Wellington",
                    Type = RegionType.AdministrativeArea,
                    ParentRegionId = RegionSeed.NewZealandId,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
                db.Regions.Add(new Region
                {
                    Id = wellingtonCentralId,
                    Name = "Wellington Central",
                    Type = RegionType.LocalArea,
                    ParentRegionId = wellingtonId,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
                await db.SaveChangesAsync(TestContext.Current.CancellationToken);
            }
        }

        await SeedCommunityCompletionAsync("Albert member", RegionSeed.AlbertEdenId);
        await SeedCommunityCompletionAsync(
            "Henderson member",
            RegionSeed.HendersonMasseyId);
        await SeedCommunityCompletionAsync("Wellington member", wellingtonCentralId);

        var client = _factory.CreateClient();
        var auckland = await ReadJsonAsync(await client.GetAsync(
            "/api/v1/leaderboards/communities?scope=auckland&period=allTime",
            TestContext.Current.CancellationToken));
        Assert.Equal(
            ["Albert-Eden", "Henderson-Massey"],
            auckland.GetProperty("rows")
                .EnumerateArray()
                .Select(row => row.GetProperty("regionName").GetString()!)
                .Order(StringComparer.Ordinal)
                .ToArray());

        var nz = await ReadJsonAsync(await client.GetAsync(
            "/api/v1/leaderboards/communities?scope=nz&period=allTime",
            TestContext.Current.CancellationToken));
        Assert.Equal(
            ["Auckland", "Wellington"],
            nz.GetProperty("rows")
                .EnumerateArray()
                .Select(row => row.GetProperty("regionName").GetString()!)
                .Order(StringComparer.Ordinal)
                .ToArray());
        Assert.Equal(
            2,
            nz.GetProperty("rows")
                .EnumerateArray()
                .Single(row =>
                    row.GetProperty("regionName").GetString() == "Auckland")
                .GetProperty("verifiedCompletionCount")
                .GetInt64());
    }

    private async Task ResetLeaderboardDataAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            """
            DELETE FROM "UserAchievements";
            DELETE FROM "XpTransactions";
            DELETE FROM "QuestCompletions";
            """,
            TestContext.Current.CancellationToken);
    }

    private async Task<Guid> SeedProfileOnlyAsync(string displayName)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var user = XpLedgerTestHelpers.NewUser("leaderboard-profile");
        db.Set<ApplicationUser>().Add(user);
        db.UserProfiles.Add(UserProfile.Create(
            user.Id,
            displayName,
            DateTimeOffset.UtcNow));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return user.Id;
    }

    private async Task<Guid> SeedRankedUserAsync(
        string displayName,
        Guid? userId,
        params QuestDifficulty[] difficulties)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var user = XpLedgerTestHelpers.NewUser("leaderboard-user");
        if (userId.HasValue)
            user.Id = userId.Value;
        db.Set<ApplicationUser>().Add(user);
        db.UserProfiles.Add(UserProfile.Create(
            user.Id,
            displayName,
            DateTimeOffset.UtcNow));

        foreach (var difficulty in difficulties)
        {
            var creator = XpLedgerTestHelpers.NewUser("leaderboard-creator");
            var quest = XpLedgerTestHelpers.NewQuest(creator.Id, difficulty);
            var participation = QuestParticipation.CreateActive(
                user.Id,
                quest.Id,
                DateTimeOffset.UtcNow.AddMinutes(-5));
            var completion = QuestCompletion.CreateVerifiedWithCode(
                user.Id,
                quest,
                participation,
                null,
                DateTimeOffset.UtcNow);
            var transaction = XpTransaction.CreateFromVerifiedCompletion(completion);
            db.Set<ApplicationUser>().Add(creator);
            db.Quests.Add(quest);
            db.QuestParticipations.Add(participation);
            db.QuestCompletions.Add(completion);
            db.XpTransactions.Add(transaction);
        }

        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return user.Id;
    }

    private async Task SeedRankedCompletionsAsync(
        Guid userId,
        string displayName,
        params QuestDifficulty[] difficulties)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var profile = await db.UserProfiles.SingleAsync(
            item => item.Id == userId,
            TestContext.Current.CancellationToken);
        profile.UpdateDisplayName(displayName, DateTimeOffset.UtcNow);
        foreach (var difficulty in difficulties)
        {
            var creator = XpLedgerTestHelpers.NewUser("leaderboard-creator");
            var quest = XpLedgerTestHelpers.NewQuest(creator.Id, difficulty);
            var participation = QuestParticipation.CreateActive(
                userId,
                quest.Id,
                DateTimeOffset.UtcNow.AddMinutes(-5));
            var completion = QuestCompletion.CreateVerifiedWithCode(
                userId,
                quest,
                participation,
                null,
                DateTimeOffset.UtcNow);
            db.Set<ApplicationUser>().Add(creator);
            db.Quests.Add(quest);
            db.QuestParticipations.Add(participation);
            db.QuestCompletions.Add(completion);
            db.XpTransactions.Add(XpTransaction.CreateFromVerifiedCompletion(completion));
        }
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    private async Task<(HttpClient Client, Guid UserId)> CreateAuthenticatedMemberAsync()
    {
        var client = _factory.CreateClient();
        var email = $"leaderboard-{Guid.NewGuid():N}@example.test";
        var register = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/register",
            new
            {
                email,
                password = Password,
                passwordConfirmation = Password,
                displayName = "Leaderboard member",
            });
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);
        var login = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/login",
            new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var userId = await db.Users
            .Where(item => item.NormalizedEmail == email.ToUpperInvariant())
            .Select(item => item.Id)
            .SingleAsync(TestContext.Current.CancellationToken);
        return (client, userId);
    }

    private static async Task<HttpResponseMessage> PostJsonWithCsrfAsync(
        HttpClient client,
        string path,
        object body)
    {
        var csrf = await client.GetFromJsonAsync<AntiforgeryTokenDto>(
            "/api/v1/auth/csrf-token",
            TestContext.Current.CancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = JsonContent.Create(body, options: JsonOptions),
        };
        request.Headers.Add("X-CSRF-TOKEN", csrf!.Token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    private async Task SeedCommunityCompletionAsync(
        string displayName,
        Guid communityRegionId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var user = XpLedgerTestHelpers.NewUser("community-leaderboard-member");
        var creator = XpLedgerTestHelpers.NewUser("community-leaderboard-creator");
        var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
        var participation = QuestParticipation.CreateActive(
            user.Id,
            quest.Id,
            DateTimeOffset.UtcNow.AddMinutes(-5));
        var completion = QuestCompletion.CreateVerifiedWithCode(
            user.Id,
            quest,
            participation,
            communityRegionId,
            DateTimeOffset.UtcNow);
        db.Set<ApplicationUser>().AddRange(user, creator);
        db.UserProfiles.Add(UserProfile.Create(
            user.Id,
            displayName,
            DateTimeOffset.UtcNow));
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        db.QuestCompletions.Add(completion);
        db.XpTransactions.Add(
            XpTransaction.CreateFromVerifiedCompletion(completion));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    private static async Task AssertNotReadyAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        AssertExactKeys(problem, "detail", "status", "title", "type");
        Assert.Equal(
            "https://kiwimpact.app/problems/leaderboard-not-ready",
            problem.GetProperty("type").GetString());
        Assert.Equal("Leaderboard Not Ready", problem.GetProperty("title").GetString());
        Assert.Equal(503, problem.GetProperty("status").GetInt32());
        Assert.Equal(
            "Leaderboard state is not ready yet.",
            problem.GetProperty("detail").GetString());
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
        var body = await response.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(body);
        return document.RootElement.Clone();
    }
}
