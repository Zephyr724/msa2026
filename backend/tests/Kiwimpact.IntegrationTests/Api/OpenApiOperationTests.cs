using System.Text.Json;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class OpenApiOperationTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public OpenApiOperationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task AchievementOperationsAndResponsesAreDocumented()
    {
        var text = await _factory.CreateClient().GetStringAsync(
            "/openapi/v1.json",
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(text);
        var paths = document.RootElement.GetProperty("paths");

        var catalog = paths
            .GetProperty("/api/v1/achievements")
            .GetProperty("get");
        Assert.True(catalog.GetProperty("responses").TryGetProperty("200", out _));

        var earned = paths
            .GetProperty("/api/v1/users/me/achievements")
            .GetProperty("get");
        var responses = earned.GetProperty("responses");
        foreach (var status in new[] { "200", "401", "404", "503" })
            Assert.True(responses.TryGetProperty(status, out _), $"Missing {status}.");

        var stats = paths
            .GetProperty("/api/v1/achievement-stats")
            .GetProperty("get");
        foreach (var status in new[] { "200", "503" })
        {
            Assert.True(
                stats.GetProperty("responses").TryGetProperty(status, out _),
                $"Achievement stats is missing {status}.");
        }

        var profile = paths
            .GetProperty("/api/v1/users/me/achievement-profile")
            .GetProperty("get");
        foreach (var status in new[] { "200", "401", "404", "503" })
        {
            Assert.True(
                profile.GetProperty("responses").TryGetProperty(status, out _),
                $"Achievement profile is missing {status}.");
        }
    }

    [Fact]
    public async Task PeopleLeaderboardOperationAndResponsesAreDocumented()
    {
        var text = await _factory.CreateClient().GetStringAsync(
            "/openapi/v1.json",
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(text);
        var operation = document.RootElement
            .GetProperty("paths")
            .GetProperty("/api/v1/leaderboards/people")
            .GetProperty("get");

        var responses = operation.GetProperty("responses");
        foreach (var status in new[] { "200", "400", "503" })
            Assert.True(responses.TryGetProperty(status, out _), $"Missing {status}.");

        var parameters = operation.GetProperty("parameters")
            .EnumerateArray()
            .Select(parameter => parameter.GetProperty("name").GetString()!)
            .ToArray();
        Assert.Equal(["scope", "period", "page", "pageSize"], parameters);
    }

    [Fact]
    public async Task SocialFeedOperationsAndWriteBoundariesAreDocumented()
    {
        var text = await _factory.CreateClient().GetStringAsync(
            "/openapi/v1.json",
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(text);
        var paths = document.RootElement.GetProperty("paths");

        var list = paths.GetProperty("/api/v1/social/posts").GetProperty("get");
        Assert.True(list.GetProperty("responses").TryGetProperty("200", out _));
        var createResponses = paths
            .GetProperty("/api/v1/social/posts")
            .GetProperty("post")
            .GetProperty("responses");
        foreach (var status in new[] { "201", "400", "401", "403", "429" })
            Assert.True(createResponses.TryGetProperty(status, out _), $"Missing {status}.");

        var deleteResponses = paths
            .GetProperty("/api/v1/social/posts/{postId}")
            .GetProperty("delete")
            .GetProperty("responses");
        foreach (var status in new[] { "204", "401", "403", "404", "429" })
            Assert.True(deleteResponses.TryGetProperty(status, out _), $"Missing delete {status}.");

        var visibilityResponses = paths
            .GetProperty("/api/v1/social/posts/{postId}/visibility")
            .GetProperty("patch")
            .GetProperty("responses");
        foreach (var status in new[] { "200", "401", "403", "404", "429" })
            Assert.True(visibilityResponses.TryGetProperty(status, out _), $"Missing visibility {status}.");

        var likePath = paths.GetProperty("/api/v1/social/posts/{postId}/like");
        foreach (var method in new[] { "put", "delete" })
        {
            var responses = likePath.GetProperty(method).GetProperty("responses");
            foreach (var status in new[] { "200", "401", "403", "404", "429" })
                Assert.True(responses.TryGetProperty(status, out _), $"Missing {method} {status}.");
        }

        var commentResponses = paths
            .GetProperty("/api/v1/social/posts/{postId}/comments")
            .GetProperty("post")
            .GetProperty("responses");
        foreach (var status in new[] { "201", "400", "401", "403", "404", "429" })
            Assert.True(commentResponses.TryGetProperty(status, out _), $"Missing {status}.");
    }
}
