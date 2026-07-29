using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Infrastructure.Data.Seeds;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class RegionsApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public RegionsApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/v1/regions ─────────────────────────────────────────

    [Fact]
    public async Task GetRegions_ReturnsAllActiveLocalAreas()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/regions", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType?.ToString());

        var regions = await response.Content.ReadFromJsonAsync<List<RegionSummaryDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(regions);
        Assert.Equal(21, regions.Count);
        Assert.All(regions, r => Assert.Equal("LocalArea", r.Type));
    }

    [Fact]
    public async Task GetRegions_AnonymousAccess_Works()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/regions", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetRegions_Search_FiltersByName()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/regions?search=Henderson",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var regions = await response.Content.ReadFromJsonAsync<List<RegionSummaryDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(regions);
        Assert.Single(regions);
        Assert.Equal("Henderson-Massey", regions[0].Name);
    }

    [Fact]
    public async Task GetRegions_AdministrativeAreaType_ReturnsCities()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync(
            "/api/v1/regions?type=AdministrativeArea",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var regions = await response.Content.ReadFromJsonAsync<List<RegionSummaryDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(regions);
        var city = Assert.Single(regions);
        Assert.Equal("Auckland", city.Name);
        Assert.Equal("AdministrativeArea", city.Type);
        Assert.Equal(RegionSeed.NewZealandId, city.ParentRegionId);
    }

    [Fact]
    public async Task GetRegions_UnsupportedType_ReturnsBadRequest()
    {
        await _factory.SeedRegionsAsync();
        var response = await _factory.CreateClient().GetAsync(
            "/api/v1/regions?type=Country",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);
    }

    // ── GET /api/v1/regions/{id} ────────────────────────────────────

    [Fact]
    public async Task GetRegion_ById_ReturnsRegion()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/regions/{RegionSeed.AucklandId}",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var region = await response.Content.ReadFromJsonAsync<RegionSummaryDto>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(region);
        Assert.Equal("Auckland", region.Name);
        Assert.Equal("AdministrativeArea", region.Type);
    }

    [Fact]
    public async Task GetRegion_ByInvalidId_ReturnsNotFound()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync(
            $"/api/v1/regions/{Guid.NewGuid()}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetRegion_ByMalformedId_ReturnsNotFound()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/regions/not-a-guid",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── GET /api/v1/regions/{id}/children ────────────────────────────

    [Fact]
    public async Task GetRegionChildren_ReturnsActiveDirectChildren()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/regions/{RegionSeed.AucklandId}/children",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var children = await response.Content.ReadFromJsonAsync<List<RegionSummaryDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(children);
        Assert.Equal(21, children.Count);
        Assert.All(children, c => Assert.Equal("LocalArea", c.Type));
        Assert.Equal(RegionSeed.AucklandId, children[0].ParentRegionId);
    }

    // ── GET /api/v1/regions/{id}/ancestors ──────────────────────────

    [Fact]
    public async Task GetRegionAncestors_ReturnsAncestors()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/regions/{RegionSeed.HendersonMasseyId}/ancestors",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var ancestors = await response.Content.ReadFromJsonAsync<List<RegionSummaryDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(ancestors);
        Assert.Equal(2, ancestors.Count);
        Assert.Equal("Auckland", ancestors[0].Name);
        Assert.Equal("New Zealand", ancestors[1].Name);
    }

    // ── Exact DTO Contract Assertions ────────────────────────────────

    [Fact]
    public async Task GetRegion_Summary_DtoHasExactExpectedProperties()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/regions",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var array = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(JsonValueKind.Array, array.ValueKind);
        var first = array[0];

        var expectedProperties = new HashSet<string>(StringComparer.Ordinal)
        {
            "id", "name", "type", "parentRegionId"
        };

        var actualProperties = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in first.EnumerateObject())
        {
            actualProperties.Add(prop.Name);
        }

        Assert.Equal(expectedProperties.Count, actualProperties.Count);
        Assert.Subset(expectedProperties, actualProperties);
        Assert.Subset(actualProperties, expectedProperties);

        // JSON value kinds
        Assert.Equal(JsonValueKind.String, first.GetProperty("id").ValueKind);
        Assert.Equal(JsonValueKind.String, first.GetProperty("name").ValueKind);
        Assert.Equal(JsonValueKind.String, first.GetProperty("type").ValueKind);
        // parentRegionId must be present (either string or null)
        var parentKind = first.GetProperty("parentRegionId").ValueKind;
        Assert.True(parentKind is JsonValueKind.String or JsonValueKind.Null);
    }

    [Fact]
    public async Task GetRegion_Detail_DtoHasExactExpectedProperties()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/regions/{RegionSeed.NewZealandId}",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var detail = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(JsonValueKind.Object, detail.ValueKind);

        var expectedProperties = new HashSet<string>(StringComparer.Ordinal)
        {
            "id", "name", "type", "parentRegionId"
        };

        var actualProperties = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in detail.EnumerateObject())
        {
            actualProperties.Add(prop.Name);
        }

        Assert.Equal(expectedProperties.Count, actualProperties.Count);
        Assert.Subset(expectedProperties, actualProperties);
        Assert.Subset(actualProperties, expectedProperties);

        // New Zealand (Country) has null parentRegionId
        Assert.Equal(JsonValueKind.String, detail.GetProperty("id").ValueKind);
        Assert.Equal("New Zealand", detail.GetProperty("name").GetString());
        Assert.Equal("Country", detail.GetProperty("type").GetString());
        Assert.Equal(JsonValueKind.Null, detail.GetProperty("parentRegionId").ValueKind);
    }

    [Fact]
    public async Task GetRegion_Children_DtoHasExactExpectedProperties()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/regions/{RegionSeed.AucklandId}/children",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var array = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(JsonValueKind.Array, array.ValueKind);
        Assert.NotEmpty(array.EnumerateArray());

        var first = array[0];
        var expectedProperties = new HashSet<string>(StringComparer.Ordinal)
        {
            "id", "name", "type", "parentRegionId"
        };

        var actualProperties = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in first.EnumerateObject())
        {
            actualProperties.Add(prop.Name);
        }

        Assert.Equal(expectedProperties.Count, actualProperties.Count);
    }

    [Fact]
    public async Task GetRegion_Ancestors_DtoHasExactExpectedProperties()
    {
        await _factory.SeedRegionsAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/regions/{RegionSeed.HendersonMasseyId}/ancestors",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var array = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(JsonValueKind.Array, array.ValueKind);
        Assert.NotEmpty(array.EnumerateArray());

        var first = array[0];
        var expectedProperties = new HashSet<string>(StringComparer.Ordinal)
        {
            "id", "name", "type", "parentRegionId"
        };

        var actualProperties = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in first.EnumerateObject())
        {
            actualProperties.Add(prop.Name);
        }

        Assert.Equal(expectedProperties.Count, actualProperties.Count);
        // Auckland (AdministrativeArea) — ancestors of Henderson-Massey
        Assert.Equal("Auckland", first.GetProperty("name").GetString());
        Assert.Equal("AdministrativeArea", first.GetProperty("type").GetString());
        // Auckland has parentRegionId = NewZealandId
        Assert.Equal(JsonValueKind.String, first.GetProperty("parentRegionId").ValueKind);
    }
}
