using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class QuestParticipationApiTests
    : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private const string Password = "ValidPass!1234";
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<WebApplicationFactory<Program>> _hosts = [];

    public QuestParticipationApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public void Dispose()
    {
        foreach (var host in _hosts)
            host.Dispose();
    }

    [Fact]
    public async Task AnonymousJoin_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var response = await client.PostAsync(
            $"/api/v1/quests/{Guid.NewGuid()}/join",
            null,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedUnsupportedRole_ReturnsForbidden()
    {
        var actor = await CreateAuthenticatedClientAsync("Observer");
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(creator.UserId);

        var response = await PostWithCsrfAsync(actor.Client, JoinPath(quest.Id));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [InlineData(AppRoles.Member)]
    [InlineData(AppRoles.Organizer)]
    [InlineData(AppRoles.Admin)]
    public async Task ExplicitAuthorizedRole_CanJoinAnotherCreatorsQuest(string role)
    {
        var actor = await CreateAuthenticatedClientAsync(role);
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(creator.UserId);

        var response = await PostWithCsrfAsync(actor.Client, JoinPath(quest.Id));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal(
            $"/api/v1/quests/{quest.Id}/participation",
            response.Headers.Location?.OriginalString);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var row = await db.QuestParticipations.SingleAsync(
            item => item.QuestId == quest.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal(actor.UserId, row.UserId);
    }

    [Theory]
    [InlineData(AppRoles.Member)]
    [InlineData(AppRoles.Organizer)]
    [InlineData(AppRoles.Admin)]
    public async Task CreatorSelfJoin_ReturnsOwnQuestConflictAndCreatesNoRow(string role)
    {
        var creator = await CreateAuthenticatedClientAsync(role);
        var quest = await SeedQuestAsync(creator.UserId, capacity: 1);

        var response = await PostWithCsrfAsync(creator.Client, JoinPath(quest.Id));

        await AssertProblemAsync(
            response,
            HttpStatusCode.Conflict,
            "You cannot join a Quest you created.");
        Assert.Equal(0, await ActiveCountAsync(quest.Id));

        var other = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var otherJoin = await PostWithCsrfAsync(other.Client, JoinPath(quest.Id));
        Assert.Equal(HttpStatusCode.Created, otherJoin.StatusCode);
    }

    [Fact]
    public async Task CreatorDraftPostPrecedesVisibilityWhileDraftGetIsNotFound()
    {
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var other = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var draft = await SeedQuestAsync(creator.UserId, status: QuestStatus.Draft);

        var creatorPost = await PostWithCsrfAsync(creator.Client, JoinPath(draft.Id));
        var creatorGet = await creator.Client.GetAsync(
            StatePath(draft.Id), TestContext.Current.CancellationToken);
        var otherPost = await PostWithCsrfAsync(other.Client, JoinPath(draft.Id));

        await AssertProblemAsync(
            creatorPost,
            HttpStatusCode.Conflict,
            "You cannot join a Quest you created.");
        Assert.Equal(HttpStatusCode.NotFound, creatorGet.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherPost.StatusCode);
        Assert.Equal(0, await ActiveCountAsync(draft.Id));
    }

    [Fact]
    public async Task SessionIdentityIsAuthoritativeAndClientUserIdIsIgnored()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var attemptedUser = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(creator.UserId);

        var response = await PostJsonWithCsrfAsync(
            actor.Client,
            JoinPath(quest.Id),
            new { userId = attemptedUser.UserId });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var row = await db.QuestParticipations.SingleAsync(
            item => item.QuestId == quest.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal(actor.UserId, row.UserId);
        Assert.NotEqual(attemptedUser.UserId, row.UserId);
    }

    [Fact]
    public async Task DuplicateActiveJoin_ReturnsConflictAndKeepsOneRow()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(creator.UserId);

        var first = await PostWithCsrfAsync(actor.Client, JoinPath(quest.Id));
        var duplicate = await PostWithCsrfAsync(actor.Client, JoinPath(quest.Id));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        await AssertProblemAsync(
            duplicate,
            HttpStatusCode.Conflict,
            "You are already participating in this Quest.");
        Assert.Equal(1, await ActiveCountAsync(quest.Id));
    }

    [Theory]
    [InlineData(QuestStatus.Cancelled, RegistrationMode.Native, false, HttpStatusCode.Conflict)]
    [InlineData(QuestStatus.Archived, RegistrationMode.Native, false, HttpStatusCode.Conflict)]
    [InlineData(QuestStatus.Published, RegistrationMode.External, false, HttpStatusCode.BadRequest)]
    [InlineData(QuestStatus.Published, RegistrationMode.NoneRequired, false, HttpStatusCode.BadRequest)]
    [InlineData(QuestStatus.Published, RegistrationMode.Native, true, HttpStatusCode.Conflict)]
    public async Task IneligibleQuestRules_ReturnAcceptedStatus(
        QuestStatus status,
        RegistrationMode registrationMode,
        bool ended,
        HttpStatusCode expected)
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(
            creator.UserId,
            status,
            registrationMode,
            endAt: ended ? DateTimeOffset.UtcNow.AddMinutes(-1) : null);

        var response = await PostWithCsrfAsync(actor.Client, JoinPath(quest.Id));

        Assert.Equal(expected, response.StatusCode);
        Assert.Equal(0, await ActiveCountAsync(quest.Id));
    }

    [Fact]
    public async Task UnlimitedCapacityAllowsMultipleUsersAndFiniteCapacityRejectsFinalOverflow()
    {
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var first = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var second = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var unlimited = await SeedQuestAsync(creator.UserId, capacity: null);
        var limited = await SeedQuestAsync(creator.UserId, capacity: 1);

        Assert.Equal(
            HttpStatusCode.Created,
            (await PostWithCsrfAsync(first.Client, JoinPath(unlimited.Id))).StatusCode);
        Assert.Equal(
            HttpStatusCode.Created,
            (await PostWithCsrfAsync(second.Client, JoinPath(unlimited.Id))).StatusCode);
        Assert.Equal(
            HttpStatusCode.Created,
            (await PostWithCsrfAsync(first.Client, JoinPath(limited.Id))).StatusCode);
        var full = await PostWithCsrfAsync(second.Client, JoinPath(limited.Id));

        await AssertProblemAsync(full, HttpStatusCode.Conflict, "Quest is at capacity.");
        Assert.Equal(2, await ActiveCountAsync(unlimited.Id));
        Assert.Equal(1, await ActiveCountAsync(limited.Id));
    }

    [Fact]
    public async Task StateResponseIsCurrentUserOnlyAndHasExactPrivacyKeys()
    {
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var joined = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var other = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(creator.UserId);
        await PostWithCsrfAsync(joined.Client, JoinPath(quest.Id));

        var joinedResponse = await joined.Client.GetAsync(
            StatePath(quest.Id), TestContext.Current.CancellationToken);
        var otherResponse = await other.Client.GetAsync(
            StatePath(quest.Id), TestContext.Current.CancellationToken);
        var creatorResponse = await creator.Client.GetAsync(
            StatePath(quest.Id), TestContext.Current.CancellationToken);

        var joinedJson = await ReadJsonAsync(joinedResponse);
        var keys = joinedJson.EnumerateObject().Select(item => item.Name).Order().ToArray();
        Assert.Equal(
            new[] { "canJoin", "capacityFull", "ineligibilityReason", "status" },
            keys);
        Assert.Equal("Active", joinedJson.GetProperty("status").GetString());
        Assert.Equal("AlreadyParticipating", joinedJson.GetProperty("ineligibilityReason").GetString());

        var otherJson = await ReadJsonAsync(otherResponse);
        Assert.Equal("None", otherJson.GetProperty("status").GetString());
        Assert.True(otherJson.GetProperty("canJoin").GetBoolean());

        var creatorJson = await ReadJsonAsync(creatorResponse);
        Assert.Equal("OwnQuest", creatorJson.GetProperty("ineligibilityReason").GetString());
        Assert.False(creatorJson.GetProperty("canJoin").GetBoolean());
    }

    [Fact]
    public async Task CancelIsIsolatedRetainsHistoryAndRejoinCreatesNewRow()
    {
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var other = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(creator.UserId);
        await PostWithCsrfAsync(actor.Client, JoinPath(quest.Id));

        var otherCancel = await PostWithCsrfAsync(other.Client, CancelPath(quest.Id));
        Assert.Equal(HttpStatusCode.Conflict, otherCancel.StatusCode);
        Assert.Equal(1, await ActiveCountAsync(quest.Id));

        var cancel = await PostWithCsrfAsync(actor.Client, CancelPath(quest.Id));
        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);
        var cancelledState = await actor.Client.GetFromJsonAsync<MyQuestParticipationDto>(
            StatePath(quest.Id), TestContext.Current.CancellationToken);
        Assert.Equal("Cancelled", cancelledState?.Status);

        var rejoin = await PostWithCsrfAsync(actor.Client, JoinPath(quest.Id));
        Assert.Equal(HttpStatusCode.Created, rejoin.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var rows = await db.QuestParticipations
            .Where(item => item.QuestId == quest.Id && item.UserId == actor.UserId)
            .OrderBy(item => item.JoinedAt)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(2, rows.Count);
        Assert.NotNull(rows[0].CancelledAt);
        Assert.Null(rows[1].CancelledAt);
        Assert.NotEqual(rows[0].Id, rows[1].Id);
    }

    [Fact]
    public async Task CancellationAfterQuestEndIsAllowedAndFreesCapacity()
    {
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var next = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(creator.UserId, capacity: 1);
        await PostWithCsrfAsync(actor.Client, JoinPath(quest.Id));

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var persisted = await db.Quests.SingleAsync(
                item => item.Id == quest.Id,
                TestContext.Current.CancellationToken);
            persisted.EndAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var cancel = await PostWithCsrfAsync(actor.Client, CancelPath(quest.Id));
        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var persisted = await db.Quests.SingleAsync(
                item => item.Id == quest.Id,
                TestContext.Current.CancellationToken);
            persisted.EndAtUtc = DateTimeOffset.UtcNow.AddDays(1);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        Assert.Equal(
            HttpStatusCode.Created,
            (await PostWithCsrfAsync(next.Client, JoinPath(quest.Id))).StatusCode);
    }

    [Fact]
    public async Task MyParticipations_RequiresAuthentication()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var response = await client.GetAsync(
            "/api/v1/users/me/participations",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MyParticipations_ReturnsOnlyLatestPerQuestAndAppliesCurrentStatus()
    {
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var other = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var activeQuest = await SeedQuestAsync(creator.UserId);
        var cancelledQuest = await SeedQuestAsync(creator.UserId);
        var rejoinedQuest = await SeedQuestAsync(creator.UserId);
        var otherQuest = await SeedQuestAsync(creator.UserId);

        await PostWithCsrfAsync(actor.Client, JoinPath(activeQuest.Id));
        await PostWithCsrfAsync(actor.Client, JoinPath(cancelledQuest.Id));
        await PostWithCsrfAsync(actor.Client, CancelPath(cancelledQuest.Id));
        await PostWithCsrfAsync(actor.Client, JoinPath(rejoinedQuest.Id));
        await PostWithCsrfAsync(actor.Client, CancelPath(rejoinedQuest.Id));
        await PostWithCsrfAsync(actor.Client, JoinPath(rejoinedQuest.Id));
        await PostWithCsrfAsync(other.Client, JoinPath(otherQuest.Id));

        var all = await actor.Client.GetFromJsonAsync<MyQuestParticipationListItemDto[]>(
            "/api/v1/users/me/participations?status=all",
            TestContext.Current.CancellationToken);
        var active = await actor.Client.GetFromJsonAsync<MyQuestParticipationListItemDto[]>(
            "/api/v1/users/me/participations?status=active",
            TestContext.Current.CancellationToken);
        var cancelled = await actor.Client.GetFromJsonAsync<MyQuestParticipationListItemDto[]>(
            "/api/v1/users/me/participations?status=cancelled",
            TestContext.Current.CancellationToken);

        Assert.NotNull(all);
        Assert.Equal(3, all.Length);
        Assert.Equal(3, all.Select(item => item.Quest.Id).Distinct().Count());
        Assert.DoesNotContain(all, item => item.Quest.Id == otherQuest.Id);
        Assert.Equal(2, active?.Length);
        Assert.All(active!, item => Assert.Equal("Active", item.Status));
        var cancelledItem = Assert.Single(cancelled!);
        Assert.Equal(cancelledQuest.Id, cancelledItem.Quest.Id);
        Assert.Equal("Cancelled", cancelledItem.Status);
        Assert.NotNull(cancelledItem.CancelledAtUtc);
        Assert.Contains(all, item =>
            item.Quest.Id == rejoinedQuest.Id && item.Status == "Active");
    }

    [Fact]
    public async Task MyParticipations_RejectsUnknownStatusWithoutLeakingRows()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);

        var response = await actor.Client.GetAsync(
            "/api/v1/users/me/participations?status=someone-else",
            TestContext.Current.CancellationToken);

        await AssertProblemAsync(
            response,
            HttpStatusCode.BadRequest,
            "Status must be one of: active, cancelled, all.");
    }

    [Fact]
    public async Task StateChangingEndpointsEnforceCsrf()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(creator.UserId);

        var response = await actor.Client.PostAsync(
            JoinPath(quest.Id), null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.Equal(
            "https://kiwimpact.app/problems/invalid-csrf-token",
            problem.GetProperty("type").GetString());
    }

    [Fact]
    public async Task OpenApiDocumentsNoJoinOrCancelRequestBody()
    {
        var documentText = await _factory.CreateClient().GetStringAsync(
            "/openapi/v1.json", TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(documentText);
        var paths = document.RootElement.GetProperty("paths");

        var join = paths.GetProperty("/api/v1/quests/{questId}/join").GetProperty("post");
        var cancel = paths.GetProperty("/api/v1/quests/{questId}/cancel").GetProperty("post");
        var listMine = paths
            .GetProperty("/api/v1/users/me/participations")
            .GetProperty("get");

        Assert.False(join.TryGetProperty("requestBody", out _));
        Assert.False(cancel.TryGetProperty("requestBody", out _));
        Assert.False(listMine.TryGetProperty("requestBody", out _));
    }

    [Fact]
    public async Task ConcurrentFinalSlot_ExternallyHeldRowLockProducesExactlyOneWinner()
    {
        var creator = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var first = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var second = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(creator.UserId, capacity: 1);
        var firstToken = await GetCsrfTokenAsync(first.Client);
        var secondToken = await GetCsrfTokenAsync(second.Client);

        await using var lockConnection = new NpgsqlConnection(_factory.ConnectionString);
        await lockConnection.OpenAsync(TestContext.Current.CancellationToken);
        await using var lockTransaction = await lockConnection.BeginTransactionAsync(
            TestContext.Current.CancellationToken);
        await using (var lockCommand = new NpgsqlCommand(
            "SELECT \"Id\" FROM \"Quests\" WHERE \"Id\" = @id FOR UPDATE",
            lockConnection,
            lockTransaction))
        {
            lockCommand.Parameters.AddWithValue("id", quest.Id);
            await lockCommand.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        }

        var firstJoin = PostWithTokenAsync(first.Client, JoinPath(quest.Id), firstToken);
        var secondJoin = PostWithTokenAsync(second.Client, JoinPath(quest.Id), secondToken);

        var blockedSessions = await WaitForBlockedJoinSessionsAsync(2, TimeSpan.FromSeconds(10));
        Assert.True(blockedSessions >= 2, $"Observed only {blockedSessions} blocked join sessions.");
        Assert.False(firstJoin.IsCompleted);
        Assert.False(secondJoin.IsCompleted);

        await lockTransaction.CommitAsync(TestContext.Current.CancellationToken);

        var responses = await Task.WhenAll(firstJoin, secondJoin);
        Assert.Equal(1, responses.Count(item => item.StatusCode == HttpStatusCode.Created));
        Assert.Equal(1, responses.Count(item => item.StatusCode == HttpStatusCode.Conflict));
        var conflict = Assert.Single(responses, item => item.StatusCode == HttpStatusCode.Conflict);
        await AssertProblemAsync(conflict, HttpStatusCode.Conflict, "Quest is at capacity.");
        Assert.Equal(1, await ActiveCountAsync(quest.Id));
    }

    private async Task<int> WaitForBlockedJoinSessionsAsync(int expected, TimeSpan timeout)
    {
        var deadline = DateTimeOffset.UtcNow + timeout;
        var observed = 0;
        await using var connection = new NpgsqlConnection(_factory.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);

        while (DateTimeOffset.UtcNow < deadline)
        {
            await using var command = new NpgsqlCommand("""
                SELECT count(*)
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND state = 'active'
                  AND wait_event_type = 'Lock'
                  AND query LIKE '%FOR UPDATE%'
                  AND query LIKE '%Quests%'
                """, connection);
            observed = Convert.ToInt32(
                await command.ExecuteScalarAsync(TestContext.Current.CancellationToken));
            if (observed >= expected)
                return observed;
            await Task.Delay(50, TestContext.Current.CancellationToken);
        }

        return observed;
    }

    private async Task<(HttpClient Client, Guid UserId)> CreateAuthenticatedClientAsync(string role)
    {
        var host = _factory.WithWebHostBuilder(_ => { });
        _hosts.Add(host);
        var client = host.CreateClient();
        var email = $"participation-{Guid.NewGuid():N}@example.test";

        using (var scope = host.Services.CreateScope())
        {
            await IdentitySeed.SeedRolesAsync(
                scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>(),
                TestContext.Current.CancellationToken);
            if (!AppRoles.All.Contains(role))
            {
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
                if (!await roleManager.RoleExistsAsync(role))
                    Assert.True((await roleManager.CreateAsync(new ApplicationRole { Name = role })).Succeeded);
            }
        }

        var register = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/register",
            new
            {
                email,
                password = Password,
                passwordConfirmation = Password,
                displayName = "Participation tester",
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
        return (client, userId);
    }

    private async Task<Quest> SeedQuestAsync(
        Guid creatorId,
        QuestStatus status = QuestStatus.Published,
        RegistrationMode registrationMode = RegistrationMode.Native,
        int? capacity = 10,
        DateTimeOffset? endAt = null)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var now = DateTimeOffset.UtcNow;
        var effectiveEnd = endAt ?? now.AddDays(1);
        var quest = Quest.CreateOrganizerOwned(
            creatorId,
            new QuestDetails(
                $"Participation {Guid.NewGuid():N}",
                "A Quest used to verify participation behavior.",
                QuestCategory.RestoreNature,
                registrationMode,
                QuestDifficulty.Easy,
                capacity,
                now.AddDays(-1),
                effectiveEnd,
                null,
                null,
                registrationMode == RegistrationMode.External
                    ? "https://example.test/participation"
                    : null),
            new QuestCoverImageDetails(
                "/images/quests/test.svg",
                "Participation test cover",
                null,
                null,
                null),
            now.AddDays(-2));

        if (status != QuestStatus.Draft)
            quest.Publish(now.AddDays(-1));
        if (status is QuestStatus.Cancelled or QuestStatus.Archived)
            quest.Cancel(now);
        if (status == QuestStatus.Archived)
            quest.Archive(now);

        db.Quests.Add(quest);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return quest;
    }

    private async Task<int> ActiveCountAsync(Guid questId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        return await db.QuestParticipations.CountAsync(
            item => item.QuestId == questId && item.CancelledAt == null,
            TestContext.Current.CancellationToken);
    }

    private async Task<HttpResponseMessage> PostWithCsrfAsync(HttpClient client, string path)
    {
        var token = await GetCsrfTokenAsync(client);
        return await PostWithTokenAsync(client, path, token);
    }

    private async Task<HttpResponseMessage> PostJsonWithCsrfAsync(
        HttpClient client,
        string path,
        object body)
    {
        var token = await GetCsrfTokenAsync(client);
        using var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = JsonContent.Create(body, options: JsonOptions),
        };
        request.Headers.Add("X-CSRF-TOKEN", token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    private static async Task<HttpResponseMessage> PostWithTokenAsync(
        HttpClient client,
        string path,
        string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path);
        request.Headers.Add("X-CSRF-TOKEN", token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    private static async Task<string> GetCsrfTokenAsync(HttpClient client)
    {
        var response = await client.GetAsync(
            "/api/v1/auth/csrf-token", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AntiforgeryTokenDto>(
            TestContext.Current.CancellationToken);
        return Assert.IsType<string>(body?.Token);
    }

    private static async Task AssertProblemAsync(
        HttpResponseMessage response,
        HttpStatusCode status,
        string detail)
    {
        Assert.Equal(status, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.Equal(detail, problem.GetProperty("detail").GetString());
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(body);
        return document.RootElement.Clone();
    }

    private static string JoinPath(Guid questId) => $"/api/v1/quests/{questId}/join";
    private static string CancelPath(Guid questId) => $"/api/v1/quests/{questId}/cancel";
    private static string StatePath(Guid questId) =>
        $"/api/v1/quests/{questId}/participation";
}
