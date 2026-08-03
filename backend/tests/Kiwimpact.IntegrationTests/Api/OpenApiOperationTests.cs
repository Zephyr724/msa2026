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
}
