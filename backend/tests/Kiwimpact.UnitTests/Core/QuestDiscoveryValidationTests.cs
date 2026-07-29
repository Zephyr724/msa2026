using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Queries;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Core;

/// <summary>
/// Unit tests for QuestDiscoveryService query validation behaviour.
/// Uses manual test doubles for repository interfaces.
/// </summary>
public class QuestDiscoveryValidationTests
{
    private static IQuestReadRepository CreateQuestRepo() => new StubQuestReadRepository();
    private static IRegionReadRepository CreateRegionRepo(Region? activeRegion = null) =>
        new StubRegionReadRepository(activeRegion);

    [Fact]
    public async Task Page_LessThan1_ThrowsArgumentOutOfRangeException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            svc.GetPublishedPageAsync(0, 12, null, null, null, null, null, null, null, TestContext.Current.CancellationToken));
        Assert.Contains("Page must be >= 1", ex.Message);
    }

    [Fact]
    public async Task PageSize_LessThan1_ThrowsArgumentOutOfRangeException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            svc.GetPublishedPageAsync(1, 0, null, null, null, null, null, null, null, TestContext.Current.CancellationToken));
        Assert.Contains("Page size must be >= 1", ex.Message);
    }

    [Fact]
    public async Task PageSize_GreaterThan50_ThrowsArgumentOutOfRangeException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            svc.GetPublishedPageAsync(1, 51, null, null, null, null, null, null, null, TestContext.Current.CancellationToken));
        Assert.Contains("Page size must be <= 50", ex.Message);
    }

    [Fact]
    public async Task Search_Over100Characters_ThrowsArgumentException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var longSearch = new string('x', 101);
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, null, null, null, null, longSearch, null, null, TestContext.Current.CancellationToken));
        Assert.Contains("Search", ex.Message);
    }

    [Fact]
    public async Task Category_AcceptedName_DoesNotThrow()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var (items, _) = await svc.GetPublishedPageAsync(1, 12, "RestoreNature", null, null, null, null, null, null, TestContext.Current.CancellationToken);
        Assert.NotNull(items);
    }

    [Fact]
    public async Task Category_InvalidName_ThrowsArgumentException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, "NotARealCategory", null, null, null, null, null, null, TestContext.Current.CancellationToken));
        Assert.Contains("Invalid value", ex.Message);
    }

    [Fact]
    public async Task Category_NumericValue_ThrowsArgumentException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, "0", null, null, null, null, null, null, TestContext.Current.CancellationToken));
        Assert.Contains("Numeric values are not accepted", ex.Message);
    }

    [Theory]
    [InlineData("1")]
    [InlineData("999")]
    [InlineData("-1")]
    public async Task EnumFilter_NumericValues_ThrowsArgumentException(string numericValue)
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, numericValue, null, null, null, null, null, null, TestContext.Current.CancellationToken));
        Assert.Contains("Numeric values are not accepted", ex.Message);
    }

    [Fact]
    public async Task InvalidSortBy_ThrowsArgumentException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, null, null, null, null, null, "invalidField", null, TestContext.Current.CancellationToken));
        Assert.Contains("Invalid sortBy value", ex.Message);
    }

    [Fact]
    public async Task SortBy_NumericValue_ThrowsArgumentException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, null, null, null, null, null, "0", null, TestContext.Current.CancellationToken));
        Assert.Contains("Numeric values are not accepted", ex.Message);
    }

    [Fact]
    public async Task InvalidSortDirection_ThrowsArgumentException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, null, null, null, null, null, null, "sideways", TestContext.Current.CancellationToken));
        Assert.Contains("Invalid sortDirection value", ex.Message);
    }

    [Fact]
    public async Task SortDirection_NumericValue_ThrowsArgumentException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, null, null, null, null, null, null, "999", TestContext.Current.CancellationToken));
        Assert.Contains("Numeric values are not accepted", ex.Message);
    }

    [Fact]
    public async Task MalformedRegionId_ThrowsArgumentException()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, null, null, null, "not-a-guid", null, null, null, TestContext.Current.CancellationToken));
        Assert.Contains("Invalid region ID format", ex.Message);
    }

    [Fact]
    public async Task RegionId_MissingOrInactive_ThrowsArgumentException()
    {
        // Stub returns null for any region, simulating not-found or inactive
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo(activeRegion: null));
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.GetPublishedPageAsync(1, 12, null, null, null, "11111111-1111-4111-8111-111111111101", null, null, null, TestContext.Current.CancellationToken));
        Assert.Contains("Region not found or inactive", ex.Message);
    }

    [Fact]
    public async Task AllAcceptedEnumCategories_DoNotThrow()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        foreach (var name in new[] { "RestoreNature", "ProtectWildlife", "CleanReduceWaste", "GrowCompost", "ObserveMeasure", "LearnShare" })
        {
            var (items, _) = await svc.GetPublishedPageAsync(1, 12, name, null, null, null, null, null, null, TestContext.Current.CancellationToken);
            Assert.NotNull(items);
        }
    }

    [Fact]
    public async Task AllAcceptedSourceTypes_DoNotThrow()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        foreach (var name in new[] { "OrganizerOwned", "AdminCuratedExternal", "PlatformEcoChallenge" })
        {
            var (items, _) = await svc.GetPublishedPageAsync(1, 12, null, name, null, null, null, null, null, TestContext.Current.CancellationToken);
            Assert.NotNull(items);
        }
    }

    [Fact]
    public async Task AllAcceptedDifficulties_DoNotThrow()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        foreach (var name in new[] { "Easy", "Medium", "Hard" })
        {
            var (items, _) = await svc.GetPublishedPageAsync(1, 12, null, null, name, null, null, null, null, TestContext.Current.CancellationToken);
            Assert.NotNull(items);
        }
    }

    [Fact]
    public async Task AllAcceptedSortBy_DoNotThrow()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        foreach (var name in new[] { "startAt", "createdAt", "title" })
        {
            var (items, _) = await svc.GetPublishedPageAsync(1, 12, null, null, null, null, null, name, null, TestContext.Current.CancellationToken);
            Assert.NotNull(items);
        }
    }

    [Fact]
    public async Task CaseInsensitiveEnumNames_Accepted()
    {
        var svc = new QuestDiscoveryService(CreateQuestRepo(), CreateRegionRepo());
        var (items, _) = await svc.GetPublishedPageAsync(1, 12, "restorenature", null, null, null, null, null, null, TestContext.Current.CancellationToken);
        Assert.NotNull(items);
    }

    // ── Manual test doubles ──────────────────────────────────────────

    private sealed class StubQuestReadRepository : IQuestReadRepository
    {
        public Task<(IReadOnlyList<Quest> Items, int TotalCount)> GetPublishedPageAsync(
            QuestDiscoveryQuery query, IReadOnlyList<Guid>? regionIds, CancellationToken ct = default)
        {
            return Task.FromResult<(IReadOnlyList<Quest>, int)>((Array.Empty<Quest>(), 0));
        }

        public Task<Quest?> GetPublishedByIdAsync(Guid id, CancellationToken ct = default)
        {
            return Task.FromResult<Quest?>(null);
        }

        public Task<IReadOnlyList<QuestImage>> GetPublishedImagesAsync(Guid questId, CancellationToken ct = default)
        {
            return Task.FromResult<IReadOnlyList<QuestImage>>(Array.Empty<QuestImage>());
        }
    }

    private sealed class StubRegionReadRepository : IRegionReadRepository
    {
        private readonly Region? _activeRegion;

        public StubRegionReadRepository(Region? activeRegion = null)
        {
            _activeRegion = activeRegion;
        }

        public Task<Region?> GetActiveByIdAsync(Guid id, CancellationToken ct = default)
        {
            if (_activeRegion is not null)
                return Task.FromResult<Region?>(_activeRegion);

            return Task.FromResult<Region?>(null);
        }

        public Task<IReadOnlyList<Region>> GetActiveLocalAreasAsync(string? search, CancellationToken ct = default)
        {
            return Task.FromResult<IReadOnlyList<Region>>(Array.Empty<Region>());
        }

        public Task<IReadOnlyList<Region>> GetActiveAdministrativeAreasAsync(
            string? search,
            CancellationToken ct = default)
        {
            return Task.FromResult<IReadOnlyList<Region>>(Array.Empty<Region>());
        }

        public Task<IReadOnlyList<Region>> GetActiveChildrenAsync(Guid parentId, CancellationToken ct = default)
        {
            return Task.FromResult<IReadOnlyList<Region>>(Array.Empty<Region>());
        }

        public Task<IReadOnlyList<Region>> GetActiveAncestorsAsync(Guid regionId, CancellationToken ct = default)
        {
            return Task.FromResult<IReadOnlyList<Region>>(Array.Empty<Region>());
        }

        public Task<IReadOnlyList<Guid>> GetActiveDescendantIdsAsync(Guid regionId, CancellationToken ct = default)
        {
            return Task.FromResult<IReadOnlyList<Guid>>(Array.Empty<Guid>());
        }
    }
}
