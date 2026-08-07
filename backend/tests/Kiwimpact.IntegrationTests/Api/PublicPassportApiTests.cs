using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.IntegrationTests.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class PublicPassportApiTests
    : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private const string Password = "Correct-Horse-Battery-Staple-1!";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<HttpClient> _clients = [];

    public PublicPassportApiTests(CustomWebApplicationFactory factory) => _factory = factory;

    public void Dispose()
    {
        foreach (var client in _clients) client.Dispose();
    }

    [Fact]
    public async Task PublicPassportIsPrivateByDefaultAndKeepsItsOpaqueLinkAcrossDisable()
    {
        var actor = await CreateActorAsync("Public Passport Member");

        using var initial = await actor.Client.GetAsync(
            "/api/v1/users/me/public-passport",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, initial.StatusCode);
        var initialJson = await ReadJsonAsync(initial);
        Assert.False(initialJson.GetProperty("isEnabled").GetBoolean());
        Assert.Equal(JsonValueKind.Null, initialJson.GetProperty("shareId").ValueKind);

        using var enabled = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Put,
            "/api/v1/users/me/public-passport",
            new { isEnabled = true, featuredAchievementIds = Array.Empty<Guid>() });
        Assert.Equal(HttpStatusCode.OK, enabled.StatusCode);
        var shareId = (await ReadJsonAsync(enabled)).GetProperty("shareId").GetGuid();
        Assert.NotEqual(Guid.Empty, shareId);

        using var publicView = await _factory.CreateClient().GetAsync(
            $"/api/v1/public/passports/{shareId}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, publicView.StatusCode);
        var publicJson = await ReadJsonAsync(publicView);
        Assert.Equal("Public Passport Member", publicJson.GetProperty("displayName").GetString());
        Assert.False(publicJson.TryGetProperty("userId", out _));
        Assert.False(publicJson.TryGetProperty("homeCommunity", out _));
        Assert.False(publicJson.TryGetProperty("completionHistory", out _));

        using var disabled = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Put,
            "/api/v1/users/me/public-passport",
            new { isEnabled = false, featuredAchievementIds = Array.Empty<Guid>() });
        Assert.Equal(shareId, (await ReadJsonAsync(disabled)).GetProperty("shareId").GetGuid());
        using var hidden = await _factory.CreateClient().GetAsync(
            $"/api/v1/public/passports/{shareId}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, hidden.StatusCode);

        using var reenabled = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Put,
            "/api/v1/users/me/public-passport",
            new { isEnabled = true, featuredAchievementIds = Array.Empty<Guid>() });
        Assert.Equal(shareId, (await ReadJsonAsync(reenabled)).GetProperty("shareId").GetGuid());
    }

    [Fact]
    public async Task MalformedMissingAndDisabledPublicLinksShareTheSameNotFoundShape()
    {
        var malformed = await _factory.CreateClient().GetAsync(
            "/api/v1/public/passports/not-a-share-id",
            TestContext.Current.CancellationToken);
        var missing = await _factory.CreateClient().GetAsync(
            $"/api/v1/public/passports/{Guid.NewGuid()}",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, malformed.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        Assert.Equal(
            (await ReadJsonAsync(malformed)).GetProperty("type").GetString(),
            (await ReadJsonAsync(missing)).GetProperty("type").GetString());
    }

    [Fact]
    public async Task FeaturedAchievementsRejectMoreThanFiveAndUnearnedOrInactiveItems()
    {
        var actor = await CreateActorAsync("Featured Achievement Member");
        var tooManyIds = Enumerable.Range(0, 6).Select(_ => Guid.NewGuid()).ToArray();

        using var tooMany = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Put,
            "/api/v1/users/me/public-passport",
            new { isEnabled = true, featuredAchievementIds = tooManyIds });
        Assert.Equal(HttpStatusCode.BadRequest, tooMany.StatusCode);

        var activeUnearned = Achievement.Create(
            Guid.NewGuid(),
            $"public-active-{Guid.NewGuid():N}",
            "Active but unearned",
            "An active achievement that this member has not earned.",
            null,
            "Milestone",
            true,
            DateTimeOffset.UtcNow);
        var inactive = Achievement.Create(
            Guid.NewGuid(),
            $"public-inactive-{Guid.NewGuid():N}",
            "Inactive achievement",
            "An inactive catalog item cannot be featured.",
            null,
            "Milestone",
            false,
            DateTimeOffset.UtcNow);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            db.Achievements.AddRange(activeUnearned, inactive);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        using var unearned = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Put,
            "/api/v1/users/me/public-passport",
            new { isEnabled = true, featuredAchievementIds = new[] { activeUnearned.Id } });
        using var inactiveResponse = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Put,
            "/api/v1/users/me/public-passport",
            new { isEnabled = true, featuredAchievementIds = new[] { inactive.Id } });

        Assert.Equal(HttpStatusCode.BadRequest, unearned.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, inactiveResponse.StatusCode);
    }

    [Fact]
    public async Task VerifiedStoryRejectsForeignNonVerifiedAndMismatchedCompletionProvenance()
    {
        var actor = await CreateActorAsync("Provenance Member");
        var other = await CreateActorAsync("Foreign Provenance Member");
        var foreignCompletion = await SeedVerifiedCompletionAsync(other.UserId);
        var actorCompletion = await SeedVerifiedCompletionAsync(actor.UserId);
        var nonVerifiedCompletion = await SeedSelfReportedCompletionAsync(actor.UserId);
        var mismatchedQuestId = await SeedPublishedQuestAsync();

        using var foreign = await CreateVerifiedStoryAsync(
            actor.Client,
            foreignCompletion.QuestId,
            foreignCompletion.Id);
        using var nonVerified = await CreateVerifiedStoryAsync(
            actor.Client,
            nonVerifiedCompletion.QuestId,
            nonVerifiedCompletion.Id);
        using var mismatched = await CreateVerifiedStoryAsync(
            actor.Client,
            mismatchedQuestId,
            actorCompletion.Id);

        Assert.Equal(HttpStatusCode.BadRequest, foreign.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, nonVerified.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, mismatched.StatusCode);
    }

    [Fact]
    public async Task VerifiedStoryProvenanceIsOwnedLockedAndIncludedInThePublicPassport()
    {
        var actor = await CreateActorAsync("Verified Story Member");
        var other = await CreateActorAsync("Other Member");
        var completion = await SeedVerifiedCompletionAsync(actor.UserId);

        using var ownedContext = await actor.Client.GetAsync(
            $"/api/v1/users/me/verified-completions/{completion.Id}/story-context",
            TestContext.Current.CancellationToken);
        using var otherContext = await other.Client.GetAsync(
            $"/api/v1/users/me/verified-completions/{completion.Id}/story-context",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, ownedContext.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherContext.StatusCode);

        using var created = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Post,
            "/api/v1/social/posts",
            new
            {
                questId = completion.QuestId,
                title = "A verified restoration story",
                content = "Native planting completed and verified.",
                images = Array.Empty<object>(),
                tags = new[] { "verified" },
                isHidden = false,
                sourceCompletionId = completion.Id,
            });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var createdJson = await ReadJsonAsync(created);
        Assert.True(createdJson.GetProperty("isVerifiedQuestStory").GetBoolean());
        Assert.False(createdJson.TryGetProperty("sourceCompletionId", out _));
        var postId = createdJson.GetProperty("id").GetGuid();

        using var rebind = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Patch,
            $"/api/v1/social/posts/{postId}",
            new
            {
                questId = (Guid?)null,
                title = "Edited story",
                content = "The story can change, provenance cannot.",
                images = Array.Empty<object>(),
                tags = Array.Empty<string>(),
            });
        Assert.Equal(HttpStatusCode.BadRequest, rebind.StatusCode);

        using var enabled = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Put,
            "/api/v1/users/me/public-passport",
            new { isEnabled = true, featuredAchievementIds = Array.Empty<Guid>() });
        var shareId = (await ReadJsonAsync(enabled)).GetProperty("shareId").GetGuid();
        using var publicView = await _factory.CreateClient().GetAsync(
            $"/api/v1/public/passports/{shareId}",
            TestContext.Current.CancellationToken);
        var stories = (await ReadJsonAsync(publicView)).GetProperty("verifiedStories");
        Assert.Single(stories.EnumerateArray());
        Assert.Equal(postId, stories[0].GetProperty("postId").GetGuid());
        Assert.False(stories[0].TryGetProperty("completionId", out _));

        var hiddenCompletion = await SeedVerifiedCompletionAsync(actor.UserId);
        using var hiddenCreated = await SendJsonWithCsrfAsync(
            actor.Client,
            HttpMethod.Post,
            "/api/v1/social/posts",
            new
            {
                questId = hiddenCompletion.QuestId,
                title = "A private verified story",
                content = "This provenance-backed story must stay off the public Passport.",
                images = Array.Empty<object>(),
                tags = Array.Empty<string>(),
                isHidden = true,
                sourceCompletionId = hiddenCompletion.Id,
            });
        Assert.Equal(HttpStatusCode.Created, hiddenCreated.StatusCode);
        using var publicAfterHidden = await _factory.CreateClient().GetAsync(
            $"/api/v1/public/passports/{shareId}",
            TestContext.Current.CancellationToken);
        var storiesAfterHidden = (await ReadJsonAsync(publicAfterHidden))
            .GetProperty("verifiedStories");
        Assert.Single(storiesAfterHidden.EnumerateArray());
        Assert.Equal(postId, storiesAfterHidden[0].GetProperty("postId").GetGuid());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.Equal(
            completion.Id,
            await db.SocialPosts.Where(post => post.Id == postId)
                .Select(post => post.SourceCompletionId)
                .SingleAsync(TestContext.Current.CancellationToken));
    }

    private async Task<AuthClient> CreateActorAsync(string displayName)
    {
        var client = _factory.CreateClient();
        _clients.Add(client);
        var email = $"public-passport-{Guid.NewGuid():N}@example.test";
        var userId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = new ApplicationUser
            {
                Id = userId,
                Email = email,
                UserName = email,
                EmailConfirmed = true,
            };
            Assert.True((await userManager.CreateAsync(user, Password)).Succeeded);
            Assert.True((await userManager.AddToRoleAsync(user, AppRoles.Member)).Succeeded);
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            db.UserProfiles.Add(UserProfile.Create(userId, displayName, DateTimeOffset.UtcNow));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }
        using var login = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Post,
            "/api/v1/auth/login",
            new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        return new AuthClient(client, userId);
    }

    private async Task<QuestCompletion> SeedVerifiedCompletionAsync(Guid userId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var creator = XpLedgerTestHelpers.NewUser("public-passport-creator");
        var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
        var participation = QuestParticipation.CreateActive(
            userId,
            quest.Id,
            DateTimeOffset.UtcNow.AddHours(-1));
        db.Set<ApplicationUser>().Add(creator);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        var completion = QuestCompletion.CreateVerifiedWithCode(
            userId,
            quest,
            participation,
            null,
            DateTimeOffset.UtcNow);
        db.QuestCompletions.Add(completion);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return completion;
    }

    private async Task<QuestCompletion> SeedSelfReportedCompletionAsync(Guid userId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var creator = XpLedgerTestHelpers.NewUser("public-passport-self-report-creator");
        var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
        var participation = QuestParticipation.CreateActive(
            userId,
            quest.Id,
            DateTimeOffset.UtcNow.AddHours(-1));
        db.Set<ApplicationUser>().Add(creator);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        var completion = QuestCompletion.CreateSelfReported(
            userId,
            quest,
            participation.Id,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow);
        db.QuestCompletions.Add(completion);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return completion;
    }

    private async Task<Guid> SeedPublishedQuestAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var creator = XpLedgerTestHelpers.NewUser("public-passport-mismatch-creator");
        var quest = XpLedgerTestHelpers.NewQuest(creator.Id, QuestDifficulty.Easy);
        db.Set<ApplicationUser>().Add(creator);
        db.Quests.Add(quest);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return quest.Id;
    }

    private static Task<HttpResponseMessage> CreateVerifiedStoryAsync(
        HttpClient client,
        Guid questId,
        Guid completionId) =>
        SendJsonWithCsrfAsync(
            client,
            HttpMethod.Post,
            "/api/v1/social/posts",
            new
            {
                questId,
                title = "Attempted verified story",
                content = "This request exercises server provenance validation.",
                images = Array.Empty<object>(),
                tags = Array.Empty<string>(),
                isHidden = false,
                sourceCompletionId = completionId,
            });

    private static async Task<HttpResponseMessage> SendJsonWithCsrfAsync(
        HttpClient client,
        HttpMethod method,
        string path,
        object body)
    {
        using var tokenResponse = await client.GetAsync(
            "/api/v1/auth/csrf-token",
            TestContext.Current.CancellationToken);
        tokenResponse.EnsureSuccessStatusCode();
        var token = await tokenResponse.Content.ReadFromJsonAsync<AntiforgeryTokenDto>(
            TestContext.Current.CancellationToken);
        using var request = new HttpRequestMessage(method, path)
        {
            Content = JsonContent.Create(body, options: JsonOptions),
        };
        request.Headers.Add("X-CSRF-TOKEN", token!.Token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
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
