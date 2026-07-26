using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Repositories;
using Kiwimpact.IntegrationTests.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class PassportApiTests
    : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private const string Password = "ValidPass!1234";
    private const string PassportPath = "/api/v1/users/me/passport/completions";
    private static readonly Regex RoundTripUtcTimestamp = new(
        @"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}\+00:00$",
        RegexOptions.Compiled);
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<WebApplicationFactory<Program>> _hosts = [];

    public PassportApiTests(CustomWebApplicationFactory factory)
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
            PassportPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData(AppRoles.Member, QuestDifficulty.Easy, 50)]
    [InlineData(AppRoles.Organizer, QuestDifficulty.Medium, 100)]
    [InlineData(AppRoles.Admin, QuestDifficulty.Hard, 150)]
    public async Task EveryAuthorizedRoleReadsExactlyItsOwnHistory(
        string role,
        QuestDifficulty difficulty,
        int expectedXp)
    {
        var actor = await CreateAuthenticatedClientAsync(role);
        var completion = await SeedCompletionAsync(actor.UserId, difficulty);
        await AwardAsync(completion);

        var response = await actor.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        Assert.Equal(1, json.GetProperty("totalCount").GetInt32());
        var item = Assert.Single(json.GetProperty("items").EnumerateArray());
        Assert.Equal(
            completion.Id,
            item.GetProperty("completionId").GetGuid());
        Assert.Equal(expectedXp, item.GetProperty("xpAmount").GetInt32());
    }

    [Fact]
    public async Task OneSessionNeverReturnsAnotherUsersHistory()
    {
        var first = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var second = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var firstCompletion = await SeedCompletionAsync(first.UserId, QuestDifficulty.Easy);
        var secondCompletion = await SeedCompletionAsync(second.UserId, QuestDifficulty.Hard);

        var firstResponse = await first.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);
        var secondResponse = await second.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);

        var firstJson = await ReadJsonAsync(firstResponse);
        Assert.Equal(
            firstCompletion.Id,
            Assert.Single(firstJson.GetProperty("items").EnumerateArray())
                .GetProperty("completionId").GetGuid());
        Assert.DoesNotContain(
            secondCompletion.Id.ToString("D"),
            firstJson.GetRawText(),
            StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(
            second.UserId.ToString("D"),
            firstJson.GetRawText(),
            StringComparison.OrdinalIgnoreCase);

        var secondJson = await ReadJsonAsync(secondResponse);
        Assert.Equal(
            secondCompletion.Id,
            Assert.Single(secondJson.GetProperty("items").EnumerateArray())
                .GetProperty("completionId").GetGuid());
        Assert.DoesNotContain(
            firstCompletion.Id.ToString("D"),
            secondJson.GetRawText(),
            StringComparison.OrdinalIgnoreCase);

        // A query-string user selector never overrides session identity.
        var queried = await first.Client.GetAsync(
            $"{PassportPath}?userId={second.UserId:D}",
            TestContext.Current.CancellationToken);
        var queriedJson = await ReadJsonAsync(queried);
        Assert.Equal(
            firstCompletion.Id,
            Assert.Single(queriedJson.GetProperty("items").EnumerateArray())
                .GetProperty("completionId").GetGuid());
    }

    [Fact]
    public async Task ResponseUsesTheExactContractKeysAndFormats()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var completion = await SeedCompletionAsync(actor.UserId, QuestDifficulty.Easy);
        await AwardAsync(completion);

        var response = await actor.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        AssertExactKeys(
            json,
            "hasNextPage",
            "hasPreviousPage",
            "items",
            "page",
            "pageSize",
            "totalCount",
            "totalPages");
        var item = Assert.Single(json.GetProperty("items").EnumerateArray());
        AssertExactKeys(
            item,
            "completedAtUtc",
            "completionId",
            "method",
            "questCategory",
            "questId",
            "questStatus",
            "questTitle",
            "status",
            "verifiedAtUtc",
            "xpAmount");
        Assert.Equal("Verified", item.GetProperty("status").GetString());
        Assert.Equal("CompletionCode", item.GetProperty("method").GetString());
        Assert.Equal("RestoreNature", item.GetProperty("questCategory").GetString());
        Assert.Equal("Published", item.GetProperty("questStatus").GetString());
        Assert.Matches(
            RoundTripUtcTimestamp,
            item.GetProperty("completedAtUtc").GetString());
        Assert.Matches(
            RoundTripUtcTimestamp,
            item.GetProperty("verifiedAtUtc").GetString());
        Assert.Equal(50, item.GetProperty("xpAmount").GetInt32());
    }

    [Fact]
    public async Task EmptyHistoryReturnsACoherentPage()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);

        var response = await actor.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        Assert.Empty(json.GetProperty("items").EnumerateArray());
        Assert.Equal(0, json.GetProperty("totalCount").GetInt32());
        Assert.Equal(0, json.GetProperty("totalPages").GetInt32());
        Assert.Equal(1, json.GetProperty("page").GetInt32());
        Assert.Equal(12, json.GetProperty("pageSize").GetInt32());
        Assert.False(json.GetProperty("hasNextPage").GetBoolean());
        Assert.False(json.GetProperty("hasPreviousPage").GetBoolean());
    }

    [Fact]
    public async Task PaginationBoundariesAndNormalizationHold()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var baseTime = DateTimeOffset.UtcNow.AddHours(-2);
        var completions = new List<QuestCompletion>();
        for (var index = 0; index < 25; index++)
        {
            completions.Add(await SeedCompletionAsync(
                actor.UserId,
                QuestDifficulty.Easy,
                baseTime.AddMinutes(index)));
        }

        // Newest verification first: expected order is the reverse seed order.
        var expected = completions.Select(item => item.Id).Reverse().ToArray();

        var pageOne = await ReadPageAsync(actor.Client, PassportPath + "?page=1&pageSize=12");
        Assert.Equal(25, pageOne.GetProperty("totalCount").GetInt32());
        Assert.Equal(3, pageOne.GetProperty("totalPages").GetInt32());
        Assert.Equal(1, pageOne.GetProperty("page").GetInt32());
        Assert.Equal(12, pageOne.GetProperty("pageSize").GetInt32());
        Assert.True(pageOne.GetProperty("hasNextPage").GetBoolean());
        Assert.False(pageOne.GetProperty("hasPreviousPage").GetBoolean());
        Assert.Equal(
            expected.Take(12).ToArray(),
            ItemIds(pageOne));

        var pageTwo = await ReadPageAsync(actor.Client, PassportPath + "?page=2&pageSize=12");
        Assert.True(pageTwo.GetProperty("hasNextPage").GetBoolean());
        Assert.True(pageTwo.GetProperty("hasPreviousPage").GetBoolean());
        Assert.Equal(
            expected.Skip(12).Take(12).ToArray(),
            ItemIds(pageTwo));

        var pageThree = await ReadPageAsync(actor.Client, PassportPath + "?page=3&pageSize=12");
        Assert.False(pageThree.GetProperty("hasNextPage").GetBoolean());
        Assert.True(pageThree.GetProperty("hasPreviousPage").GetBoolean());
        Assert.Equal(
            expected.Skip(24).ToArray(),
            ItemIds(pageThree));

        // pageSize above the maximum clamps to 50.
        var clamped = await ReadPageAsync(actor.Client, PassportPath + "?pageSize=100");
        Assert.Equal(50, clamped.GetProperty("pageSize").GetInt32());
        Assert.Equal(25, clamped.GetProperty("items").GetArrayLength());

        // page below 1 normalizes to 1.
        var normalized = await ReadPageAsync(actor.Client, PassportPath + "?page=0&pageSize=12");
        Assert.Equal(1, normalized.GetProperty("page").GetInt32());
        Assert.Equal(expected.Take(12).ToArray(), ItemIds(normalized));
    }

    [Fact]
    public async Task FixedDatasetOrderingBreaksTiesByIdAcrossPages()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var sharedTimestamp = DateTimeOffset.UtcNow.AddHours(-1);
        var completions = new List<QuestCompletion>();
        for (var index = 0; index < 5; index++)
        {
            completions.Add(await SeedCompletionAsync(
                actor.UserId,
                QuestDifficulty.Easy,
                sharedTimestamp));
        }

        // Equal VerifiedAtUtc rows order by Id ascending (canonical UUID text
        // order matches PostgreSQL uuid ordering).
        var expected = completions
            .Select(item => item.Id)
            .OrderBy(id => id.ToString("D"), StringComparer.Ordinal)
            .ToArray();

        var pageOne = await ReadPageAsync(actor.Client, PassportPath + "?page=1&pageSize=2");
        var pageTwo = await ReadPageAsync(actor.Client, PassportPath + "?page=2&pageSize=2");
        var pageThree = await ReadPageAsync(actor.Client, PassportPath + "?page=3&pageSize=2");
        Assert.Equal(expected.Take(2).ToArray(), ItemIds(pageOne));
        Assert.Equal(expected.Skip(2).Take(2).ToArray(), ItemIds(pageTwo));
        Assert.Equal(expected.Skip(4).ToArray(), ItemIds(pageThree));

        // An unchanged dataset pages deterministically across requests.
        var pageOneAgain = await ReadPageAsync(actor.Client, PassportPath + "?page=1&pageSize=2");
        var pageTwoAgain = await ReadPageAsync(actor.Client, PassportPath + "?page=2&pageSize=2");
        Assert.Equal(ItemIds(pageOne), ItemIds(pageOneAgain));
        Assert.Equal(ItemIds(pageTwo), ItemIds(pageTwoAgain));
    }

    [Fact]
    public async Task XpAmountMatchesTheLedgerRowForEachCompletion()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var easy = await SeedCompletionAsync(actor.UserId, QuestDifficulty.Easy);
        var medium = await SeedCompletionAsync(actor.UserId, QuestDifficulty.Medium);
        var hard = await SeedCompletionAsync(actor.UserId, QuestDifficulty.Hard);
        await AwardAsync(easy);
        await AwardAsync(medium);
        await AwardAsync(hard);

        var json = await ReadPageAsync(actor.Client, PassportPath);

        var amounts = json.GetProperty("items").EnumerateArray()
            .ToDictionary(
                item => item.GetProperty("completionId").GetGuid(),
                item => item.GetProperty("xpAmount").GetInt32());
        Assert.Equal(3, amounts.Count);
        Assert.Equal(50, amounts[easy.Id]);
        Assert.Equal(100, amounts[medium.Id]);
        Assert.Equal(150, amounts[hard.Id]);
    }

    [Fact]
    public async Task OrdinaryRewardPendingRowReturnsNullXpAmount()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var completion = await SeedCompletionAsync(actor.UserId, QuestDifficulty.Easy);

        var response = await actor.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        Assert.Equal(1, json.GetProperty("totalCount").GetInt32());
        var item = Assert.Single(json.GetProperty("items").EnumerateArray());
        Assert.Equal(completion.Id, item.GetProperty("completionId").GetGuid());
        Assert.Equal(JsonValueKind.Null, item.GetProperty("xpAmount").ValueKind);
    }

    [Fact]
    public async Task NullTimestampInvariantFailureFailsClosedForThatCallerOnly()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var other = await CreateAuthenticatedClientAsync(AppRoles.Member);
        // The other caller has only an ordinary reward-pending row.
        await SeedCompletionAsync(other.UserId, QuestDifficulty.Easy);
        var impossibleId = await SeedRawSqlCompletionAsync(
            actor.UserId,
            method: "CompletionCode",
            verified: false);
        try
        {
            var response = await actor.Client.GetAsync(
                PassportPath,
                TestContext.Current.CancellationToken);

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
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM \"QuestCompletions\" WHERE \"Id\" = {impossibleId}",
                TestContext.Current.CancellationToken);
        }

        // Ordinary reward-pending rows never trigger the invariant failure.
        var otherResponse = await other.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, otherResponse.StatusCode);

        // Once the unprocessable row is gone the caller recovers.
        var recovered = await actor.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, recovered.StatusCode);
    }

    [Fact]
    public async Task NonCompletionCodeMethodIsExcludedFromItemsAndTotalCount()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var completion = await SeedCompletionAsync(actor.UserId, QuestDifficulty.Easy);
        // Simulates a future completion method on an otherwise Verified row.
        var futureMethodId = await SeedRawSqlCompletionAsync(
            actor.UserId,
            method: "EvidenceClaim",
            verified: true);

        var response = await actor.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        Assert.Equal(1, json.GetProperty("totalCount").GetInt32());
        var item = Assert.Single(json.GetProperty("items").EnumerateArray());
        Assert.Equal(completion.Id, item.GetProperty("completionId").GetGuid());
        Assert.DoesNotContain(
            futureMethodId.ToString("D"),
            json.GetRawText(),
            StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task HistoryReflectsTheQuestsCurrentMutableFields()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var edited = await SeedCompletionAsync(actor.UserId, QuestDifficulty.Easy);
        var archived = await SeedCompletionAsync(actor.UserId, QuestDifficulty.Easy);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var now = DateTimeOffset.UtcNow;

            var editedQuest = await db.Quests.SingleAsync(
                quest => quest.Id == edited.QuestId,
                TestContext.Current.CancellationToken);
            editedQuest.UpdateDetails(
                new QuestDetails(
                    "Renamed after completion",
                    editedQuest.Description,
                    QuestCategory.LearnShare,
                    RegistrationMode.Native,
                    QuestDifficulty.Easy,
                    editedQuest.Capacity,
                    editedQuest.StartAtUtc,
                    editedQuest.EndAtUtc,
                    editedQuest.LocationRegionId,
                    editedQuest.LocationDescription,
                    editedQuest.ExternalSourceUrl),
                null,
                now);
            editedQuest.Cancel(now);

            var archivedQuest = await db.Quests.SingleAsync(
                quest => quest.Id == archived.QuestId,
                TestContext.Current.CancellationToken);
            archivedQuest.Cancel(now);
            archivedQuest.Archive(now.AddMinutes(1));

            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var json = await ReadPageAsync(actor.Client, PassportPath);

        var items = json.GetProperty("items").EnumerateArray()
            .ToDictionary(item => item.GetProperty("completionId").GetGuid());
        var editedItem = items[edited.Id];
        Assert.Equal("Renamed after completion", editedItem.GetProperty("questTitle").GetString());
        Assert.Equal("LearnShare", editedItem.GetProperty("questCategory").GetString());
        Assert.Equal("Cancelled", editedItem.GetProperty("questStatus").GetString());
        Assert.Equal("Archived", items[archived.Id].GetProperty("questStatus").GetString());
    }

    [Fact]
    public async Task MissingProfileIsNotFound()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await DeleteProfileAsync(actor.UserId);

        var response = await actor.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
        Assert.Equal("Profile not found.", problem.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task MissingProfileIsNotFoundEvenWhenCompletionsExist()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        await SeedCompletionAsync(actor.UserId, QuestDifficulty.Easy);
        await DeleteProfileAsync(actor.UserId);

        var response = await actor.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);

        // The profile-existence check precedes any page composition.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
        Assert.Equal("Profile not found.", problem.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task ResponseExcludesPrivateAndInternalFields()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        Guid regionId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var region = await XpLedgerTestHelpers.SeedRegionAsync(db, "passport-region");
            regionId = region.Id;
        }

        var completion = await SeedCompletionAsync(
            actor.UserId,
            QuestDifficulty.Easy,
            communityRegionId: regionId);
        await AwardAsync(completion);

        var response = await actor.Client.GetAsync(
            PassportPath,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await ReadJsonAsync(response);
        var raw = json.GetRawText();
        Assert.DoesNotContain("email", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("userId", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(actor.UserId.ToString("D"), raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("region", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(regionId.ToString("D"), raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("participation", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(
            completion.ParticipationId!.Value.ToString("D"),
            raw,
            StringComparison.OrdinalIgnoreCase);
        // No completion-code key or code material anywhere in the payload;
        // the "CompletionCode" method label is contract data, not code material.
        Assert.DoesNotContain("\"code\"", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(XpLedgerTestHelpers.NormalizedCode, raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(XpLedgerTestHelpers.DisplayCode, raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("displayName", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("evidence", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task OpenApiDocumentsThePassportRoute()
    {
        var documentText = await _factory.CreateClient().GetStringAsync(
            "/openapi/v1.json",
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(documentText);

        Assert.True(document.RootElement
            .GetProperty("paths")
            .TryGetProperty(PassportPath, out var path));
        Assert.True(path.TryGetProperty("get", out _));
    }

    private async Task<QuestCompletion> SeedCompletionAsync(
        Guid userId,
        QuestDifficulty difficulty,
        DateTimeOffset? verifiedAtUtc = null,
        Guid? communityRegionId = null)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var creator = XpLedgerTestHelpers.NewUser("passport-creator");
        var quest = XpLedgerTestHelpers.NewQuest(creator.Id, difficulty);
        var participation = QuestParticipation.CreateActive(
            userId, quest.Id, DateTimeOffset.UtcNow.AddHours(-1));
        db.Set<ApplicationUser>().Add(creator);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        var completion = QuestCompletion.CreateVerifiedWithCode(
            userId,
            quest,
            participation,
            communityRegionId,
            verifiedAtUtc ?? DateTimeOffset.UtcNow);
        db.QuestCompletions.Add(completion);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return completion;
    }

    private async Task<Guid> SeedRawSqlCompletionAsync(
        Guid userId,
        string method,
        bool verified)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var creator = XpLedgerTestHelpers.NewUser("passport-creator");
        var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
        var participation = QuestParticipation.CreateActive(
            userId, quest.Id, DateTimeOffset.UtcNow.AddHours(-1));
        db.Set<ApplicationUser>().Add(creator);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        var completionId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        DateTimeOffset? verifiedAtUtc = verified ? now : null;
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "QuestCompletions"
                ("Id", "UserId", "QuestId", "ParticipationId", "Method", "Status",
                 "CompletedAt", "VerifiedAtUtc", "RewardDifficultySnapshot",
                 "CommunityRegionIdAtCompletion", "CreatedAt", "UpdatedAt")
            VALUES
                ({completionId}, {userId}, {quest.Id},
                 {participation.Id}, {method}, 'Verified',
                 {now}, {verifiedAtUtc}, 'Easy', NULL, {now}, {now})
            """, TestContext.Current.CancellationToken);
        return completionId;
    }

    private async Task AwardAsync(QuestCompletion completion)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var repository = new XpLedgerRepository(db);
        var outcome = await repository.AwardVerifiedCompletionAsync(
            completion,
            DateTimeOffset.UtcNow,
            TestContext.Current.CancellationToken);
        Assert.Equal(XpAwardOutcome.Awarded, outcome);
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
        var email = $"passport-{Guid.NewGuid():N}@example.test";

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
                displayName = "Passport tester",
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

    private async Task<JsonElement> ReadPageAsync(HttpClient client, string path)
    {
        var response = await client.GetAsync(path, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await ReadJsonAsync(response);
    }

    private static Guid[] ItemIds(JsonElement page) =>
        page.GetProperty("items").EnumerateArray()
            .Select(item => item.GetProperty("completionId").GetGuid())
            .ToArray();

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
