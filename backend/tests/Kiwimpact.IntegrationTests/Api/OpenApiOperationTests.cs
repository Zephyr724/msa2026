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
    }
}
