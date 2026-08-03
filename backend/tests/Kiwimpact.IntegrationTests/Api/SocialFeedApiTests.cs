using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class SocialFeedApiTests
    : IClassFixture<CustomWebApplicationFactory>, IAsyncLifetime
{
    private const string Password = "Correct-Horse-Battery-Staple-1!";
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<HttpClient> _clients = [];

    public SocialFeedApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public async ValueTask InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            """
            DELETE FROM "SocialComments";
            DELETE FROM "SocialPostLikes";
            DELETE FROM "SocialPosts";
            """,
            TestContext.Current.CancellationToken);
    }

    public ValueTask DisposeAsync()
    {
        foreach (var client in _clients)
            client.Dispose();
        return ValueTask.CompletedTask;
    }

    [Fact]
    public async Task PublicFeedSearchesLiteralTextAndPaginatesNewestFirst()
    {
        var author = await CreateAuthenticatedClientAsync("Aroha Search");
        var older = await CreatePostAsync(author, "Collected litter near the stream.");
        var newer = await CreatePostAsync(author, "Planted native kōwhai trees.");

        var page = await author.GetAsync(
            "/api/v1/social/posts?page=1&pageSize=1",
            TestContext.Current.CancellationToken);
        var search = await _factory.CreateClient().GetAsync(
            "/api/v1/social/posts?search=Aroha%20Search&page=1&pageSize=12",
            TestContext.Current.CancellationToken);
        var literalWildcard = await _factory.CreateClient().GetAsync(
            "/api/v1/social/posts?search=%25&page=1&pageSize=12",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, page.StatusCode);
        var pageJson = await ReadJsonAsync(page);
        Assert.Equal(2, pageJson.GetProperty("totalCount").GetInt32());
        Assert.True(pageJson.GetProperty("hasNextPage").GetBoolean());
        Assert.Equal(
            newer.GetProperty("id").GetGuid(),
            pageJson.GetProperty("items")[0].GetProperty("id").GetGuid());
        Assert.NotEqual(
            older.GetProperty("id").GetGuid(),
            pageJson.GetProperty("items")[0].GetProperty("id").GetGuid());

        Assert.Equal(HttpStatusCode.OK, search.StatusCode);
        Assert.Equal(2, (await ReadJsonAsync(search)).GetProperty("totalCount").GetInt32());
        Assert.Equal(HttpStatusCode.OK, literalWildcard.StatusCode);
        Assert.Equal(
            0,
            (await ReadJsonAsync(literalWildcard)).GetProperty("totalCount").GetInt32());

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            await db.UserProfiles
                .Where(profile => profile.DisplayName == "Aroha Search")
                .ExecuteDeleteAsync(TestContext.Current.CancellationToken);
        }
        using var missingProfileFeed = await _factory.CreateClient().GetAsync(
            "/api/v1/social/posts?page=1&pageSize=12",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, missingProfileFeed.StatusCode);
        var missingProfileJson = await ReadJsonAsync(missingProfileFeed);
        Assert.All(
            missingProfileJson.GetProperty("items").EnumerateArray(),
            item => Assert.Equal(
                "Community member",
                item.GetProperty("authorDisplayName").GetString()));
    }

    [Fact]
    public async Task PublishRequiresAuthenticationAndAntiforgeryAndValidImageMetadata()
    {
        using var guest = _factory.CreateClient();
        var guestResponse = await guest.PostAsJsonAsync(
            "/api/v1/social/posts",
            new { content = "Guest post", imageUrl = (string?)null, imageAltText = (string?)null },
            TestContext.Current.CancellationToken);
        var author = await CreateAuthenticatedClientAsync("Mereana Publisher");
        var missingCsrf = await author.PostAsJsonAsync(
            "/api/v1/social/posts",
            new { content = "Missing token", imageUrl = (string?)null, imageAltText = (string?)null },
            TestContext.Current.CancellationToken);
        var invalidImage = await SendJsonWithCsrfAsync(
            author,
            HttpMethod.Post,
            "/api/v1/social/posts",
            new
            {
                content = "Unsafe image",
                imageUrl = "http://images.example.test/photo.jpg",
                imageAltText = "A photo",
            });
        var valid = await SendJsonWithCsrfAsync(
            author,
            HttpMethod.Post,
            "/api/v1/social/posts",
            new
            {
                content = "A safe image post",
                imageUrl = "https://images.example.test/photo.jpg",
                imageAltText = "Reusable bags at a community event",
            });

        Assert.Equal(HttpStatusCode.Unauthorized, guestResponse.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingCsrf.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidImage.StatusCode);
        Assert.Equal(HttpStatusCode.Created, valid.StatusCode);
        var json = await ReadJsonAsync(valid);
        Assert.Equal("Mereana Publisher", json.GetProperty("authorDisplayName").GetString());
        Assert.False(json.TryGetProperty("authorUserId", out _));
    }

    [Fact]
    public async Task LikesAreIdempotentAndViewerSpecific()
    {
        var author = await CreateAuthenticatedClientAsync("Post Author");
        var reader = await CreateAuthenticatedClientAsync("Post Reader");
        var post = await CreatePostAsync(author, "A post worth supporting.");
        var postId = post.GetProperty("id").GetGuid();

        var first = await SendJsonWithCsrfAsync(
            reader, HttpMethod.Put, $"/api/v1/social/posts/{postId}/like", null);
        var duplicate = await SendJsonWithCsrfAsync(
            reader, HttpMethod.Put, $"/api/v1/social/posts/{postId}/like", null);
        var authorFeed = await ReadJsonAsync(await author.GetAsync(
            "/api/v1/social/posts",
            TestContext.Current.CancellationToken));
        var readerFeed = await ReadJsonAsync(await reader.GetAsync(
            "/api/v1/social/posts",
            TestContext.Current.CancellationToken));
        var removed = await SendJsonWithCsrfAsync(
            reader, HttpMethod.Delete, $"/api/v1/social/posts/{postId}/like", null);
        var duplicateRemoval = await SendJsonWithCsrfAsync(
            reader, HttpMethod.Delete, $"/api/v1/social/posts/{postId}/like", null);

        Assert.Equal(1, (await ReadJsonAsync(first)).GetProperty("likeCount").GetInt32());
        Assert.Equal(1, (await ReadJsonAsync(duplicate)).GetProperty("likeCount").GetInt32());
        Assert.False(authorFeed.GetProperty("items")[0].GetProperty("isLikedByViewer").GetBoolean());
        Assert.True(readerFeed.GetProperty("items")[0].GetProperty("isLikedByViewer").GetBoolean());
        Assert.Equal(0, (await ReadJsonAsync(removed)).GetProperty("likeCount").GetInt32());
        Assert.Equal(0, (await ReadJsonAsync(duplicateRemoval)).GetProperty("likeCount").GetInt32());
    }

    [Fact]
    public async Task CommentsAllowOneReplyLevelAndReturnNestedThreads()
    {
        var author = await CreateAuthenticatedClientAsync("Comment Author");
        var post = await CreatePostAsync(author, "Discuss this local action.");
        var postId = post.GetProperty("id").GetGuid();
        var rootResponse = await SendJsonWithCsrfAsync(
            author,
            HttpMethod.Post,
            $"/api/v1/social/posts/{postId}/comments",
            new { content = "First comment", parentCommentId = (Guid?)null });
        var root = await ReadJsonAsync(rootResponse);
        var rootId = root.GetProperty("id").GetGuid();
        var replyResponse = await SendJsonWithCsrfAsync(
            author,
            HttpMethod.Post,
            $"/api/v1/social/posts/{postId}/comments",
            new { content = "Direct reply", parentCommentId = rootId });
        var reply = await ReadJsonAsync(replyResponse);
        var replyId = reply.GetProperty("id").GetGuid();
        var tooDeep = await SendJsonWithCsrfAsync(
            author,
            HttpMethod.Post,
            $"/api/v1/social/posts/{postId}/comments",
            new { content = "Third level", parentCommentId = replyId });
        Assert.Equal(HttpStatusCode.Created, rootResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, replyResponse.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, tooDeep.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var authorId = await db.UserProfiles
                .Where(profile => profile.DisplayName == "Comment Author")
                .Select(profile => profile.Id)
                .SingleAsync(TestContext.Current.CancellationToken);
            for (var index = 0; index < SocialFeedService.MaxReplyPreviewSize; index++)
            {
                db.SocialComments.Add(SocialComment.Create(
                    postId,
                    authorId,
                    rootId,
                    $"Additional direct reply {index + 1}",
                    DateTimeOffset.UtcNow.AddSeconds(index + 1)));
            }
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        using var comments = await author.GetAsync(
            $"/api/v1/social/posts/{postId}/comments",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, comments.StatusCode);
        var page = await ReadJsonAsync(comments);
        var thread = Assert.Single(page.GetProperty("items").EnumerateArray());
        Assert.Equal("First comment", thread.GetProperty("content").GetString());
        Assert.Equal(
            SocialFeedService.MaxReplyPreviewSize,
            thread.GetProperty("replies").GetArrayLength());
        Assert.Equal(
            SocialFeedService.MaxReplyPreviewSize + 1,
            thread.GetProperty("replyCount").GetInt32());
        Assert.True(thread.GetProperty("hasMoreReplies").GetBoolean());
        var nested = thread.GetProperty("replies")[0];
        Assert.Equal(rootId, nested.GetProperty("parentCommentId").GetGuid());
        Assert.Equal("Direct reply", nested.GetProperty("content").GetString());
    }

    [Fact]
    public async Task EveryWriteRequiresAuthenticationAndAntiforgery()
    {
        var author = await CreateAuthenticatedClientAsync("Boundary Author");
        var post = await CreatePostAsync(author, "Boundary post.");
        var postId = post.GetProperty("id").GetGuid();
        using var guest = _factory.CreateClient();

        using var guestLike = await guest.PutAsync(
            $"/api/v1/social/posts/{postId}/like",
            null,
            TestContext.Current.CancellationToken);
        using var guestUnlike = await guest.DeleteAsync(
            $"/api/v1/social/posts/{postId}/like",
            TestContext.Current.CancellationToken);
        using var guestComment = await guest.PostAsJsonAsync(
            $"/api/v1/social/posts/{postId}/comments",
            new { content = "Guest comment", parentCommentId = (Guid?)null },
            TestContext.Current.CancellationToken);
        using var missingLikeCsrf = await author.PutAsync(
            $"/api/v1/social/posts/{postId}/like",
            null,
            TestContext.Current.CancellationToken);
        using var missingUnlikeCsrf = await author.DeleteAsync(
            $"/api/v1/social/posts/{postId}/like",
            TestContext.Current.CancellationToken);
        using var missingCommentCsrf = await author.PostAsJsonAsync(
            $"/api/v1/social/posts/{postId}/comments",
            new { content = "Missing token", parentCommentId = (Guid?)null },
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, guestLike.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, guestUnlike.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, guestComment.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingLikeCsrf.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingUnlikeCsrf.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingCommentCsrf.StatusCode);
    }

    [Fact]
    public async Task SocialRateLimitsAreActorPartitionedForEveryWritePolicy()
    {
        var first = await CreateAuthenticatedClientAsync("Rate Limited Actor");
        var second = await CreateAuthenticatedClientAsync("Independent Actor");
        var firstToken = await GetCsrfTokenAsync(first);
        var secondToken = await GetCsrfTokenAsync(second);

        for (var index = 0; index < 6; index++)
        {
            using var allowed = await SendJsonWithTokenAsync(
                first,
                HttpMethod.Post,
                "/api/v1/social/posts",
                new
                {
                    content = $"Rate post {index}",
                    imageUrl = (string?)null,
                    imageAltText = (string?)null,
                },
                firstToken);
            Assert.Equal(HttpStatusCode.Created, allowed.StatusCode);
        }
        using var limitedPublish = await SendJsonWithTokenAsync(
            first,
            HttpMethod.Post,
            "/api/v1/social/posts",
            new
            {
                content = "One publish too many",
                imageUrl = (string?)null,
                imageAltText = (string?)null,
            },
            firstToken);
        using var independentPublish = await SendJsonWithTokenAsync(
            second,
            HttpMethod.Post,
            "/api/v1/social/posts",
            new
            {
                content = "Independent publish",
                imageUrl = (string?)null,
                imageAltText = (string?)null,
            },
            secondToken);
        Assert.Equal(HttpStatusCode.TooManyRequests, limitedPublish.StatusCode);
        Assert.Equal(HttpStatusCode.Created, independentPublish.StatusCode);
        var postId = (await ReadJsonAsync(independentPublish)).GetProperty("id").GetGuid();

        for (var index = 0; index < 30; index++)
        {
            using var allowed = await SendJsonWithTokenAsync(
                first,
                HttpMethod.Post,
                $"/api/v1/social/posts/{postId}/comments",
                new { content = $"Rate comment {index}", parentCommentId = (Guid?)null },
                firstToken);
            Assert.Equal(HttpStatusCode.Created, allowed.StatusCode);
        }
        using var limitedComment = await SendJsonWithTokenAsync(
            first,
            HttpMethod.Post,
            $"/api/v1/social/posts/{postId}/comments",
            new { content = "One comment too many", parentCommentId = (Guid?)null },
            firstToken);
        using var independentComment = await SendJsonWithTokenAsync(
            second,
            HttpMethod.Post,
            $"/api/v1/social/posts/{postId}/comments",
            new { content = "Independent comment", parentCommentId = (Guid?)null },
            secondToken);
        Assert.Equal(HttpStatusCode.TooManyRequests, limitedComment.StatusCode);
        Assert.Equal(HttpStatusCode.Created, independentComment.StatusCode);

        for (var index = 0; index < 120; index++)
        {
            var method = index % 2 == 0 ? HttpMethod.Put : HttpMethod.Delete;
            using var allowed = await SendJsonWithTokenAsync(
                first,
                method,
                $"/api/v1/social/posts/{postId}/like",
                null,
                firstToken);
            Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        }
        using var limitedReaction = await SendJsonWithTokenAsync(
            first,
            HttpMethod.Put,
            $"/api/v1/social/posts/{postId}/like",
            null,
            firstToken);
        using var independentReaction = await SendJsonWithTokenAsync(
            second,
            HttpMethod.Put,
            $"/api/v1/social/posts/{postId}/like",
            null,
            secondToken);
        Assert.Equal(HttpStatusCode.TooManyRequests, limitedReaction.StatusCode);
        Assert.Equal(HttpStatusCode.OK, independentReaction.StatusCode);
    }

    [Fact]
    public async Task ExtremePageValuesReturnValidationProblems()
    {
        var author = await CreateAuthenticatedClientAsync("Page Boundary Author");
        var post = await CreatePostAsync(author, "Page boundary post.");
        var postId = post.GetProperty("id").GetGuid();

        using var posts = await author.GetAsync(
            $"/api/v1/social/posts?page={int.MaxValue}&pageSize=24",
            TestContext.Current.CancellationToken);
        using var comments = await author.GetAsync(
            $"/api/v1/social/posts/{postId}/comments?page={int.MaxValue}&pageSize=20",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, posts.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, comments.StatusCode);
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string displayName)
    {
        var client = _factory.CreateClient();
        _clients.Add(client);
        var email = $"social-{Guid.NewGuid():N}@example.test";
        using (var scope = _factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                UserName = email,
                EmailConfirmed = true,
            };
            Assert.True((await userManager.CreateAsync(user, Password)).Succeeded);
            Assert.True((await userManager.AddToRoleAsync(user, AppRoles.Member)).Succeeded);

            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            db.UserProfiles.Add(UserProfile.Create(user.Id, displayName, DateTimeOffset.UtcNow));
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }
        var login = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Post,
            "/api/v1/auth/login",
            new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        return client;
    }

    private static async Task<JsonElement> CreatePostAsync(HttpClient client, string content)
    {
        var response = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Post,
            "/api/v1/social/posts",
            new { content, imageUrl = (string?)null, imageAltText = (string?)null });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await ReadJsonAsync(response);
    }

    private static async Task<HttpResponseMessage> SendJsonWithCsrfAsync(
        HttpClient client,
        HttpMethod method,
        string path,
        object? body)
    {
        var token = await GetCsrfTokenAsync(client);
        return await SendJsonWithTokenAsync(client, method, path, body, token);
    }

    private static async Task<string> GetCsrfTokenAsync(HttpClient client)
    {
        using var tokenResponse = await client.GetAsync(
            "/api/v1/auth/csrf-token",
            TestContext.Current.CancellationToken);
        tokenResponse.EnsureSuccessStatusCode();
        var token = await tokenResponse.Content.ReadFromJsonAsync<AntiforgeryTokenDto>(
            TestContext.Current.CancellationToken);
        return token?.Token ?? throw new InvalidOperationException("Missing antiforgery token.");
    }

    private static async Task<HttpResponseMessage> SendJsonWithTokenAsync(
        HttpClient client,
        HttpMethod method,
        string path,
        object? body,
        string token)
    {
        using var request = new HttpRequestMessage(method, path);
        if (body is not null)
            request.Content = JsonContent.Create(body, options: JsonOptions);
        request.Headers.Add("X-CSRF-TOKEN", token);
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
