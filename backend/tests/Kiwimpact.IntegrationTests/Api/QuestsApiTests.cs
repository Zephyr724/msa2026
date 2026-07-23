using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class QuestsApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public QuestsApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/v1/quests ──────────────────────────────────────────

    [Fact]
    public async Task GetQuests_ReturnsOnlyPublishedQuests()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.Equal(15, page.TotalCount);
        Assert.All(page.Items, q => Assert.NotNull(q.CoverImage));
    }

    [Fact]
    public async Task GetQuests_AnonymousAccess_Works()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Pagination ──────────────────────────────────────────────────

    [Fact]
    public async Task GetQuests_Pagination_Defaults()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.Equal(1, page.Page);
        Assert.Equal(12, page.PageSize);
        Assert.True(page.TotalCount >= page.Items.Count);
    }

    [Fact]
    public async Task GetQuests_Page2_HasDifferentItems()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response1 = await client.GetAsync("/api/v1/quests?page=1&pageSize=5",
            TestContext.Current.CancellationToken);
        response1.EnsureSuccessStatusCode();
        var page1 = await response1.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page1);

        var response2 = await client.GetAsync("/api/v1/quests?page=2&pageSize=5",
            TestContext.Current.CancellationToken);
        response2.EnsureSuccessStatusCode();
        var page2 = await response2.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page2);

        var ids1 = page1.Items.Select(i => i.Id).ToHashSet();
        var ids2 = page2.Items.Select(i => i.Id).ToHashSet();
        Assert.Empty(ids1.Intersect(ids2));
    }

    [Fact]
    public async Task GetQuests_PageSizeExceedsMax_Returns400()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests?pageSize=100",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    // ── Filtering ───────────────────────────────────────────────────

    [Fact]
    public async Task GetQuests_FilterByCategory()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests?category=RestoreNature",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.All(page.Items, q => Assert.Equal("RestoreNature", q.Category));
    }

    [Fact]
    public async Task GetQuests_FilterByDifficulty()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests?difficulty=Hard",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.All(page.Items, q => Assert.Equal("Hard", q.Difficulty));
    }

    [Fact]
    public async Task GetQuests_FilterBySourceType()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests?sourceType=PlatformEcoChallenge",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.All(page.Items, q => Assert.Equal("PlatformEcoChallenge", q.SourceType));
    }

    [Fact]
    public async Task GetQuests_FilterByRegionParent_IncludesDescendants()
    {
        // Deterministic hierarchy-filter evidence using known demo-seed Quests.
        //
        // Auckland (AdministrativeArea) is the parent.
        // Henderson-Massey is a descendant LocalArea of Auckland.
        // Seed IDs (RegionSeed):
        //   AucklandId             = b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e
        //   HendersonMasseyId    = a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d
        // Seed Quest IDs (DemoQuestSeed):
        //   Auckland Citywide Bird Count   = 11111111-1111-4111-8111-11111111110B  (region = Auckland)
        //   Community Stream Cleanup       = 11111111-1111-4111-8111-111111111101  (region = Henderson-Massey)
        //   Backyard Biodiversity Challenge = 11111111-1111-4111-8111-11111111110C  (region = null)
        //
        // Filtering by Auckland must include both the direct-parent Quest AND
        // the descendant Quest. The null-region Quest must be excluded.
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var aucklandIdStr = RegionSeed.AucklandId.ToString();
        // Use pageSize=50 to get all matching results in one page.
        var response = await client.GetAsync(
            $"/api/v1/quests?regionId={aucklandIdStr}&pageSize=50",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.NotEmpty(page.Items);

        var resultIds = page.Items.Select(q => q.Id).ToHashSet();

        // ── Must include ──────────────────────────────────────────────
        Guid directParentQuestId = new("11111111-1111-4111-8111-11111111110B");
        Guid descendantQuestId = new("11111111-1111-4111-8111-111111111101");

        Assert.Contains(directParentQuestId, resultIds);
        Assert.Contains(descendantQuestId, resultIds);

        // ── Must exclude ──────────────────────────────────────────────
        Guid nullRegionQuestId = new("11111111-1111-4111-8111-11111111110C");
        // This Published Quest is assigned to NewZealand Country, not Auckland.
        Guid nzCountryQuestId = new("11111111-1111-4111-8111-11111111110F");

        Assert.DoesNotContain(nullRegionQuestId, resultIds);
        Assert.DoesNotContain(nzCountryQuestId, resultIds);

        // All returned items must have a non-null locationRegion.
        Assert.All(page.Items, q => Assert.NotNull(q.LocationRegion));

        // All returned Region IDs must be Auckland itself or one of its
        // known descendants. "Not Auckland" is not sufficient proof.
        var allowedRegionIds = new HashSet<Guid>
        {
            RegionSeed.AucklandId,
            RegionSeed.AlbertEdenId,
            RegionSeed.DevonportTakapunaId,
            RegionSeed.FranklinId,
            RegionSeed.GreatBarrierId,
            RegionSeed.HendersonMasseyId,
            RegionSeed.HibiscusBaysId,
            RegionSeed.HowickId,
            RegionSeed.KaipatikiId,
            RegionSeed.MangereOtahuhuId,
            RegionSeed.ManurewaId,
            RegionSeed.MaungakiekieTamakiId,
            RegionSeed.OrakeiId,
            RegionSeed.OtaraPapatoetoeId,
            RegionSeed.PapakuraId,
            RegionSeed.PuketapapaId,
            RegionSeed.RodneyId,
            RegionSeed.UpperHarbourId,
            RegionSeed.WaihekeId,
            RegionSeed.WaitakereRangesId,
            RegionSeed.WaitemataId,
            RegionSeed.WhauId,
        };

        // NewZealand Country is NOT in the allowed set — it is an unrelated Region.
        Assert.All(page.Items, q =>
        {
            Assert.NotNull(q.LocationRegion);
            Assert.Contains(q.LocationRegion!.Id, allowedRegionIds);
        });
    }

    [Fact]
    public async Task GetQuests_FilterByRegionId_ChildOnlyScope()
    {
        // Filtering by a child LocalArea returns only quests in that child scope,
        // not quests from sibling regions or the parent region directly.
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var regionId = RegionSeed.HendersonMasseyId.ToString();
        var response = await client.GetAsync(
            $"/api/v1/quests?regionId={regionId}",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.NotEmpty(page.Items);

        Assert.All(page.Items, q =>
        {
            Assert.NotNull(q.LocationRegion);
            Assert.Equal(Guid.Parse(regionId), q.LocationRegion!.Id);
        });
    }

    // ── Search ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetQuests_Search_FindsMatches()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests?search=Bird",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.NotEmpty(page.Items);
    }

    // ── Sorting ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetQuests_SortByTitleAsc()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests?sortBy=title&sortDirection=asc",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        var titles = page.Items.Select(q => q.Title).ToList();
        var sorted = titles.OrderBy(t => t, StringComparer.OrdinalIgnoreCase).ToList();
        Assert.Equal(sorted, titles);
    }

    [Fact]
    public async Task GetQuests_SortByStartAtDesc()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests?sortBy=startAt&sortDirection=desc",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.NotEmpty(page.Items);
    }

    // ── Invalid Query Values (S1-R1-5) ──────────────────────────────

    [Theory]
    [InlineData("category=999")]
    [InlineData("sourceType=999")]
    [InlineData("difficulty=999")]
    [InlineData("sortBy=999")]
    [InlineData("sortDirection=999")]
    public async Task GetQuests_InvalidNumericQueryValue_Returns400(string query)
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/quests?{query}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("\"status\"", body);
        Assert.Contains("\"title\"", body);
        Assert.DoesNotContain("stack", body, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("category=UnknownCategory")]
    [InlineData("sourceType=UnknownType")]
    [InlineData("difficulty=UnknownDifficulty")]
    [InlineData("sortBy=unknownSort")]
    [InlineData("sortDirection=unknownDirection")]
    public async Task GetQuests_InvalidEnumQueryValue_Returns400(string query)
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/quests?{query}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetQuests_InvalidRegionId_Returns400()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests?regionId=not-a-guid",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetQuests_MissingRegionId_Returns400()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync(
            $"/api/v1/quests?regionId={Guid.NewGuid()}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── GET /api/v1/quests/{id} ─────────────────────────────────────

    [Fact]
    public async Task GetQuest_PublishedQuest_Returns200()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var listResponse = await client.GetAsync("/api/v1/quests", TestContext.Current.CancellationToken);
        listResponse.EnsureSuccessStatusCode();
        var page = await listResponse.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.NotEmpty(page.Items);

        var questId = page.Items[0].Id;
        var response = await client.GetAsync($"/api/v1/quests/{questId}",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var detail = await response.Content.ReadFromJsonAsync<QuestDetailDto>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(detail);
        Assert.Equal(questId, detail.Id);
    }

    [Fact]
    public async Task GetQuest_DraftQuest_Returns404()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var draftId = new Guid("11111111-1111-4111-8111-111111111110");
        var response = await client.GetAsync($"/api/v1/quests/{draftId}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetQuest_NonExistent_Returns404()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/quests/{Guid.NewGuid()}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetQuest_InactiveLocationRegion_IsSuppressedFromListAndDetail()
    {
        await _factory.SeedAllAsync();
        var questId = new Guid("11111111-1111-4111-8111-111111111101");

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var region = await db.Regions.SingleAsync(
                r => r.Id == RegionSeed.HendersonMasseyId,
                TestContext.Current.CancellationToken);
            region.IsActive = false;
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        try
        {
            var client = _factory.CreateClient();

            var listResponse = await client.GetAsync(
                "/api/v1/quests?search=Community%20Stream%20Cleanup",
                TestContext.Current.CancellationToken);
            listResponse.EnsureSuccessStatusCode();
            var page = await listResponse.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
                TestContext.Current.CancellationToken);

            Assert.NotNull(page);
            var listItem = Assert.Single(page.Items);
            Assert.Equal(questId, listItem.Id);
            Assert.Null(listItem.LocationRegion);

            var detailResponse = await client.GetAsync(
                $"/api/v1/quests/{questId}",
                TestContext.Current.CancellationToken);
            detailResponse.EnsureSuccessStatusCode();
            var detail = await detailResponse.Content.ReadFromJsonAsync<QuestDetailDto>(
                TestContext.Current.CancellationToken);

            Assert.NotNull(detail);
            Assert.Null(detail.LocationRegion);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var region = await db.Regions.SingleAsync(
                r => r.Id == RegionSeed.HendersonMasseyId,
                TestContext.Current.CancellationToken);
            region.IsActive = true;
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }
    }

    // ── Exact DTO Contract Assertions (JsonElement) ──────────────────

    [Fact]
    public async Task GetQuest_ListItem_DtoHasExactExpectedProperties()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync(
            "/api/v1/quests?search=Community%20Stream%20Cleanup&pageSize=1",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var item = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var items = item.GetProperty("items");
        var firstQuest = items[0];

        var expectedProperties = new HashSet<string>(StringComparer.Ordinal)
        {
            "id", "title", "description", "category", "sourceType",
            "registrationMode", "difficulty", "xpAward", "capacity",
            "startAtUtc", "endAtUtc", "locationRegion", "locationDescription",
            "coverImage"
        };

        var actualProperties = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in firstQuest.EnumerateObject())
        {
            actualProperties.Add(prop.Name);
        }

        Assert.Equal(expectedProperties.Count, actualProperties.Count);
        Assert.Subset(expectedProperties, actualProperties);
        Assert.Subset(actualProperties, expectedProperties);

        // ── JSON value kinds ──────────────────────────────────────────
        Assert.True(firstQuest.GetProperty("coverImage").ValueKind is JsonValueKind.Object or JsonValueKind.Null);
        Assert.True(firstQuest.GetProperty("registrationMode").ValueKind is JsonValueKind.Null or JsonValueKind.String);
        Assert.Equal(JsonValueKind.Number, firstQuest.GetProperty("xpAward").ValueKind);
        Assert.True(firstQuest.GetProperty("capacity").ValueKind is JsonValueKind.Null or JsonValueKind.Number);
        Assert.True(firstQuest.GetProperty("startAtUtc").ValueKind is JsonValueKind.Null or JsonValueKind.String);
        Assert.True(firstQuest.GetProperty("endAtUtc").ValueKind is JsonValueKind.Null or JsonValueKind.String);
        Assert.True(firstQuest.GetProperty("locationDescription").ValueKind is JsonValueKind.Null or JsonValueKind.String);

        // ── Nested locationRegion shape ──────────────────────────────
        var locRegion = firstQuest.GetProperty("locationRegion");
        Assert.Equal(JsonValueKind.Object, locRegion.ValueKind);
        var locProps = new HashSet<string>(StringComparer.Ordinal);
        foreach (var p in locRegion.EnumerateObject()) locProps.Add(p.Name);
        var expectedLocProps = new HashSet<string>(StringComparer.Ordinal) { "id", "name", "type" };
        Assert.Equal(expectedLocProps.Count, locProps.Count);
        Assert.Subset(expectedLocProps, locProps);
        Assert.Subset(locProps, expectedLocProps);
        Assert.Equal(JsonValueKind.String, locRegion.GetProperty("id").ValueKind);
        Assert.Equal(JsonValueKind.String, locRegion.GetProperty("name").ValueKind);
        Assert.Equal(JsonValueKind.String, locRegion.GetProperty("type").ValueKind);

        // ── Nested coverImage shape ──────────────────────────────────
        var cover = firstQuest.GetProperty("coverImage");
        Assert.Equal(JsonValueKind.Object, cover.ValueKind);
        var coverProps = new HashSet<string>(StringComparer.Ordinal);
        foreach (var p in cover.EnumerateObject()) coverProps.Add(p.Name);
        var expectedCoverProps = new HashSet<string>(StringComparer.Ordinal)
        {
            "id", "imageUrl", "altText"
        };
        Assert.Equal(expectedCoverProps.Count, coverProps.Count);
        Assert.Subset(expectedCoverProps, coverProps);
        Assert.Subset(coverProps, expectedCoverProps);
        Assert.Equal(JsonValueKind.String, cover.GetProperty("id").ValueKind);
        Assert.Equal(JsonValueKind.String, cover.GetProperty("imageUrl").ValueKind);
        Assert.Equal(JsonValueKind.String, cover.GetProperty("altText").ValueKind);
    }

    [Fact]
    public async Task GetQuest_Detail_DtoHasExactExpectedProperties()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var questId = new Guid("11111111-1111-4111-8111-111111111101");

        var response = await client.GetAsync($"/api/v1/quests/{questId}",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var detail = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);

        var expectedProperties = new HashSet<string>(StringComparer.Ordinal)
        {
            "id", "title", "description", "category", "sourceType",
            "registrationMode", "difficulty", "xpAward", "capacity",
            "startAtUtc", "endAtUtc", "locationRegion", "locationDescription",
            "coverImage", "externalSourceUrl", "sourceCheckedAt"
        };

        var actualProperties = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in detail.EnumerateObject())
        {
            actualProperties.Add(prop.Name);
        }

        Assert.Equal(expectedProperties.Count, actualProperties.Count);
        Assert.Subset(expectedProperties, actualProperties);
        Assert.Subset(actualProperties, expectedProperties);

        // Detail-specific nullable fields
        Assert.Equal(JsonValueKind.Null, detail.GetProperty("externalSourceUrl").ValueKind);
        Assert.Equal(JsonValueKind.Null, detail.GetProperty("sourceCheckedAt").ValueKind);
    }

    [Fact]
    public async Task GetQuest_Page_DtoHasExactExpectedPaginationProperties()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/quests",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var page = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);

        var expectedProperties = new HashSet<string>(StringComparer.Ordinal)
        {
            "items", "page", "pageSize", "totalCount", "totalPages",
            "hasNextPage", "hasPreviousPage"
        };

        var actualProperties = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in page.EnumerateObject())
        {
            actualProperties.Add(prop.Name);
        }

        Assert.Equal(expectedProperties.Count, actualProperties.Count);
        Assert.Subset(expectedProperties, actualProperties);
        Assert.Subset(actualProperties, expectedProperties);

        // Type checks for pagination metadata
        Assert.Equal(JsonValueKind.Number, page.GetProperty("page").ValueKind);
        Assert.Equal(JsonValueKind.Number, page.GetProperty("pageSize").ValueKind);
        Assert.Equal(JsonValueKind.Number, page.GetProperty("totalCount").ValueKind);
        Assert.Equal(JsonValueKind.Number, page.GetProperty("totalPages").ValueKind);
        Assert.Equal(JsonValueKind.True, page.GetProperty("hasNextPage").ValueKind);
        Assert.Equal(JsonValueKind.False, page.GetProperty("hasPreviousPage").ValueKind);
    }

    // ── Quest Images exact DTO contract ──────────────────────────────

    [Fact]
    public async Task GetQuestImages_DtoHasExactExpectedProperties()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var listResponse = await client.GetAsync("/api/v1/quests?pageSize=1",
            TestContext.Current.CancellationToken);
        listResponse.EnsureSuccessStatusCode();
        var listEl = await listResponse.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        var questId = listEl.GetProperty("items")[0].GetProperty("id").GetGuid();

        var response = await client.GetAsync($"/api/v1/quests/{questId}/images",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var imagesArray = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(JsonValueKind.Array, imagesArray.ValueKind);
        Assert.NotEmpty(imagesArray.EnumerateArray());

        var image = imagesArray[0];

        var expectedProperties = new HashSet<string>(StringComparer.Ordinal)
        {
            "id", "imageUrl", "altText", "sortOrder", "isCover",
            "creatorName", "sourceUrl", "licenceNote"
        };

        var actualProperties = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in image.EnumerateObject())
        {
            actualProperties.Add(prop.Name);
        }

        Assert.Equal(expectedProperties.Count, actualProperties.Count);
        Assert.Subset(expectedProperties, actualProperties);
        Assert.Subset(actualProperties, expectedProperties);

        // Type checks
        Assert.Equal(JsonValueKind.String, image.GetProperty("id").ValueKind);
        Assert.Equal(JsonValueKind.String, image.GetProperty("imageUrl").ValueKind);
        Assert.Equal(JsonValueKind.String, image.GetProperty("altText").ValueKind);
        Assert.Equal(JsonValueKind.Number, image.GetProperty("sortOrder").ValueKind);
        Assert.True(image.GetProperty("isCover").ValueKind is JsonValueKind.True or JsonValueKind.False);
        Assert.True(image.GetProperty("creatorName").ValueKind is JsonValueKind.Null or JsonValueKind.String);
        Assert.True(image.GetProperty("sourceUrl").ValueKind is JsonValueKind.Null or JsonValueKind.String);
        Assert.True(image.GetProperty("licenceNote").ValueKind is JsonValueKind.Null or JsonValueKind.String);
    }

    // ── GET /api/v1/quests/{id}/images ──────────────────────────────

    [Fact]
    public async Task GetQuestImages_PublishedQuest_Returns200()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var listResponse = await client.GetAsync("/api/v1/quests?pageSize=1",
            TestContext.Current.CancellationToken);
        listResponse.EnsureSuccessStatusCode();
        var page = await listResponse.Content.ReadFromJsonAsync<PagedResponse<QuestListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(page);
        Assert.NotEmpty(page.Items);

        var questId = page.Items[0].Id;
        var response = await client.GetAsync($"/api/v1/quests/{questId}/images",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var images = await response.Content.ReadFromJsonAsync<List<QuestImageDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(images);
        Assert.NotEmpty(images);
    }

    [Fact]
    public async Task GetQuestImages_DraftQuest_Returns404()
    {
        await _factory.SeedAllAsync();
        var client = _factory.CreateClient();

        var draftId = new Guid("11111111-1111-4111-8111-111111111110");
        var response = await client.GetAsync($"/api/v1/quests/{draftId}/images",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
