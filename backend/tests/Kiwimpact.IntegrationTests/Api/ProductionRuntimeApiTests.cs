using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class ProductionRuntimeApiTests : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly string _temporaryRoot;
    private readonly string _webRoot;
    private readonly WebApplicationFactory<Program> _host;
    private readonly HttpClient _client;

    public ProductionRuntimeApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _temporaryRoot = Path.Combine(
            Path.GetTempPath(), $"kiwimpact-runtime-{Guid.NewGuid():N}");
        _webRoot = Path.Combine(_temporaryRoot, "wwwroot");
        Directory.CreateDirectory(Path.Combine(_webRoot, "assets"));
        File.WriteAllText(
            Path.Combine(_webRoot, "index.html"),
            "<!doctype html><html><body>KIWIMPACT_RUNTIME_SHELL</body></html>");
        File.WriteAllText(
            Path.Combine(_webRoot, "assets", "app-ABC123.js"),
            "globalThis.kiwimpactRuntime = true;");

        _host = factory.WithWebHostBuilder(builder => builder.UseWebRoot(_webRoot));
        _client = _host.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    public void Dispose()
    {
        _client.Dispose();
        _host.Dispose();
        if (Directory.Exists(_temporaryRoot))
            Directory.Delete(_temporaryRoot, recursive: true);
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/passport")]
    [InlineData("/my-quests?view=ready")]
    [InlineData("/api-docs")]
    public async Task FrontendRoutesReturnTheSingleOriginShell(string path)
    {
        var response = await _client.GetAsync(
            path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains(
            "KIWIMPACT_RUNTIME_SHELL",
            await response.Content.ReadAsStringAsync(
                TestContext.Current.CancellationToken),
            StringComparison.Ordinal);
        Assert.Contains(
            "no-cache",
            response.Headers.CacheControl?.ToString(),
            StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("/api/not-a-real-endpoint")]
    [InlineData("/health/not-a-real-endpoint")]
    [InlineData("/openapi/not-a-real-endpoint")]
    [InlineData("/hubs/not-a-real-endpoint")]
    [InlineData("/missing.js")]
    public async Task ReservedAndMissingFilePathsNeverReturnSpaHtml(string path)
    {
        var response = await _client.GetAsync(
            path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.NotEqual("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.DoesNotContain(
            "KIWIMPACT_RUNTIME_SHELL",
            await response.Content.ReadAsStringAsync(
                TestContext.Current.CancellationToken),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task ScalarOwnedPathsNeverReturnTheFrontendShell()
    {
        var response = await _client.GetAsync(
            "/scalar/not-a-real-endpoint",
            TestContext.Current.CancellationToken);

        Assert.DoesNotContain(
            "KIWIMPACT_RUNTIME_SHELL",
            await response.Content.ReadAsStringAsync(
                TestContext.Current.CancellationToken),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task UnsafeUnknownFrontendRouteNeverReceivesSpaFallback()
    {
        var response = await _client.PostAsync(
            "/passport",
            JsonContent.Create(new { }),
            TestContext.Current.CancellationToken);

        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
        Assert.NotEqual("text/html", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task HeadFrontendRouteReturnsHeadersWithoutABody()
    {
        using var request = new HttpRequestMessage(HttpMethod.Head, "/passport");

        var response = await _client.SendAsync(
            request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Empty(await response.Content.ReadAsByteArrayAsync(
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task HashedAssetIsImmutableWhileIndexIsNotCached()
    {
        var asset = await _client.GetAsync(
            "/assets/app-ABC123.js", TestContext.Current.CancellationToken);
        var index = await _client.GetAsync(
            "/index.html", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, asset.StatusCode);
        Assert.Contains(
            "immutable",
            asset.Headers.CacheControl?.ToString(),
            StringComparison.OrdinalIgnoreCase);
        Assert.Equal(HttpStatusCode.OK, index.StatusCode);
        Assert.Contains(
            "no-cache",
            index.Headers.CacheControl?.ToString(),
            StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task LivenessAndMigratedDatabaseReadinessAreSeparate()
    {
        var live = await _client.GetAsync(
            "/health/live", TestContext.Current.CancellationToken);
        var ready = await _client.GetAsync(
            "/health/ready", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, live.StatusCode);
        Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
        Assert.Contains(
            "\"status\":\"Healthy\"",
            await live.Content.ReadAsStringAsync(
                TestContext.Current.CancellationToken),
            StringComparison.Ordinal);
        Assert.Contains(
            "\"status\":\"Ready\"",
            await ready.Content.ReadAsStringAsync(
                TestContext.Current.CancellationToken),
            StringComparison.Ordinal);
    }

    [Fact]
    public void SharedFilesystemKeysUnprotectAcrossApplicationHosts()
    {
        var keyPath = Path.Combine(_temporaryRoot, "keys");
        string protectedValue;
        using (var firstHost = CreateHostWithKeyPath(keyPath))
        {
            var protector = firstHost.Services
                .GetRequiredService<IDataProtectionProvider>()
                .CreateProtector("Slice13.PersistenceProof");
            protectedValue = protector.Protect("survives-restart");
        }

        using var secondHost = CreateHostWithKeyPath(keyPath);
        var secondProtector = secondHost.Services
            .GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("Slice13.PersistenceProof");

        Assert.Equal("survives-restart", secondProtector.Unprotect(protectedValue));
        Assert.NotEmpty(Directory.EnumerateFiles(keyPath, "*.xml"));
    }

    private WebApplicationFactory<Program> CreateHostWithKeyPath(string keyPath) =>
        _factory.WithWebHostBuilder(builder =>
        {
            builder.UseWebRoot(_webRoot);
            builder.UseSetting(
                "DataProtection:ApplicationName", "Kiwimpact.Tests");
            builder.UseSetting("DataProtection:KeyPath", keyPath);
        });
}
