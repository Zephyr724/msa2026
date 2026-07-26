using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class OrganizerQuestsApiTests : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private const string Password = "ValidPass!1234";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<WebApplicationFactory<Program>> _isolatedHosts = [];

    public OrganizerQuestsApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public void Dispose()
    {
        foreach (var host in _isolatedHosts)
            host.Dispose();
    }

    [Fact]
    public async Task Organizer_CreatesOwnedDraftWithCover()
    {
        var (client, userId) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);

        var response = await CreateQuestAsync(client, "Organizer create");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<QuestManagementDetailDto>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(dto);
        Assert.Equal("Draft", dto.Status);
        Assert.Equal("OrganizerOwned", dto.SourceType);
        // Public/management presentation follows the authoritative progression
        // rule even though the deprecated persistence column remains untouched.
        Assert.Equal(50, dto.XpAward);
        Assert.NotEqual(0u, dto.Version);
        Assert.Equal("/images/quests/organizer-cover.svg", dto.CoverImage.ImageUrl);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var quest = await db.Quests.Include(item => item.Images).SingleAsync(
            item => item.Id == dto.Id, TestContext.Current.CancellationToken);
        Assert.Equal(userId, quest.CreatedByUserId);
        Assert.Equal(QuestStatus.Draft, quest.Status);
        Assert.Equal(QuestSourceType.OrganizerOwned, quest.SourceType);
        Assert.Equal(0, quest.XpAward);
        Assert.True(Assert.Single(quest.Images).IsCover);
    }

    [Fact]
    public async Task Organizer_ListContainsOnlyOwnedQuests()
    {
        var (firstClient, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var (secondClient, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var first = await ReadCreatedQuestAsync(await CreateQuestAsync(firstClient, "First owner"));
        var second = await ReadCreatedQuestAsync(await CreateQuestAsync(secondClient, "Second owner"));

        var response = await firstClient.GetAsync(
            "/api/v1/organizer/quests", TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        var quests = await response.Content.ReadFromJsonAsync<List<QuestManagementListItemDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(quests);
        Assert.Contains(quests, quest => quest.Id == first.Id);
        Assert.DoesNotContain(quests, quest => quest.Id == second.Id);
    }

    [Fact]
    public async Task Organizer_CannotModifyAnotherOrganizersQuest()
    {
        var (ownerClient, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var (otherClient, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var quest = await ReadCreatedQuestAsync(await CreateQuestAsync(ownerClient, "Owned elsewhere"));

        var response = await SendJsonWithCsrfAsync(
            otherClient,
            HttpMethod.Put,
            $"/api/v1/organizer/quests/{quest.Id}",
            ValidUpdate(quest, "Forbidden update"));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.Equal(
            "Owned elsewhere",
            await db.Quests.Where(item => item.Id == quest.Id).Select(item => item.Title)
                .SingleAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task Member_ReceivesForbidden()
    {
        var (client, _) = await CreateAuthenticatedClientAsync(AppRoles.Member);

        var response = await client.GetAsync(
            "/api/v1/organizer/quests", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AnonymousUser_ReceivesUnauthorized()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var response = await client.GetAsync(
            "/api/v1/organizer/quests", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task Admin_CanReadAndUpdateAnotherOwnersQuest()
    {
        var (organizerClient, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var (adminClient, _) = await CreateAuthenticatedClientAsync(AppRoles.Admin);
        var quest = await ReadCreatedQuestAsync(await CreateQuestAsync(organizerClient, "Admin target"));

        var getResponse = await adminClient.GetAsync(
            $"/api/v1/organizer/quests/{quest.Id}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var updateResponse = await SendJsonWithCsrfAsync(
            adminClient,
            HttpMethod.Put,
            $"/api/v1/organizer/quests/{quest.Id}",
            ValidUpdate(quest, "Admin updated"));

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<QuestManagementDetailDto>(
            TestContext.Current.CancellationToken);
        Assert.Equal("Admin updated", updated?.Title);
    }

    [Fact]
    public async Task Admin_CanUpdateExistingCuratedQuestWithoutChangingSourceOrOwner()
    {
        await _factory.SeedAllAsync();
        var (adminClient, _) = await CreateAuthenticatedClientAsync(AppRoles.Admin);
        var questId = new Guid("11111111-1111-4111-8111-111111111104");
        var get = await adminClient.GetAsync(
            $"/api/v1/organizer/quests/{questId}", TestContext.Current.CancellationToken);
        var quest = await ReadSuccessQuestAsync(get);

        using var beforeScope = _factory.Services.CreateScope();
        var beforeDb = beforeScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var originalOwner = await beforeDb.Quests.Where(item => item.Id == questId)
            .Select(item => item.CreatedByUserId)
            .SingleAsync(TestContext.Current.CancellationToken);

        var update = await SendJsonWithCsrfAsync(
            adminClient,
            HttpMethod.Put,
            $"/api/v1/organizer/quests/{questId}",
            ValidUpdate(quest, "Admin curated update"));
        var updated = await ReadSuccessQuestAsync(update);

        Assert.Equal("AdminCuratedExternal", updated.SourceType);
        using var afterScope = _factory.Services.CreateScope();
        var afterDb = afterScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.Equal(
            originalOwner,
            await afterDb.Quests.Where(item => item.Id == questId)
                .Select(item => item.CreatedByUserId)
                .SingleAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task StaleXminUpdate_ReturnsConflict()
    {
        var (client, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var quest = await ReadCreatedQuestAsync(await CreateQuestAsync(client, "Concurrency target"));
        var originalVersion = quest.Version;

        var firstResponse = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Put,
            $"/api/v1/organizer/quests/{quest.Id}",
            ValidUpdate(quest, "First update"));
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        var stale = ValidUpdate(quest, "Stale update") with { Version = originalVersion };
        var staleResponse = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Put,
            $"/api/v1/organizer/quests/{quest.Id}",
            stale);

        Assert.Equal(HttpStatusCode.Conflict, staleResponse.StatusCode);
        Assert.Equal(
            "application/problem+json",
            staleResponse.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task QuestUpdate_UpdatesCoverMetadataAndPersistsIt()
    {
        var (client, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var quest = await ReadCreatedQuestAsync(await CreateQuestAsync(client, "Cover target"));
        var request = ValidUpdate(quest, "Cover updated") with
        {
            CoverImage = new CoverImageRequest(
                "https://example.test/replacement.svg",
                "Replacement cover alt text",
                "Example creator",
                "https://example.test/source",
                "Example licence"),
        };

        var response = await SendJsonWithCsrfAsync(
            client, HttpMethod.Put, $"/api/v1/organizer/quests/{quest.Id}", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var images = await db.QuestImages.Where(item => item.QuestId == quest.Id)
            .ToListAsync(TestContext.Current.CancellationToken);
        var cover = Assert.Single(images);
        Assert.True(cover.IsCover);
        Assert.Equal("https://example.test/replacement.svg", cover.ImageUrl);
        Assert.Equal("Replacement cover alt text", cover.AltText);
    }

    [Fact]
    public async Task Put_RetainingLocationRegion_PreservesForeignKeyAndReturnedRegion()
    {
        var (client, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var quest = await ReadCreatedQuestAsync(await CreateQuestAsync(client, "Same Region"));
        Assert.Equal(RegionSeed.HendersonMasseyId, quest.LocationRegion?.Id);

        var update = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Put,
            $"/api/v1/organizer/quests/{quest.Id}",
            ValidUpdate(quest, "Same Region updated"));
        var updated = await ReadSuccessQuestAsync(update);

        Assert.Equal(RegionSeed.HendersonMasseyId, updated.LocationRegion?.Id);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            Assert.Equal(
                RegionSeed.HendersonMasseyId,
                await db.Quests.Where(item => item.Id == quest.Id)
                    .Select(item => item.LocationRegionId)
                    .SingleAsync(TestContext.Current.CancellationToken));
        }

        var get = await client.GetAsync(
            $"/api/v1/organizer/quests/{quest.Id}", TestContext.Current.CancellationToken);
        var reread = await ReadSuccessQuestAsync(get);
        Assert.Equal(RegionSeed.HendersonMasseyId, reread.LocationRegion?.Id);
    }

    [Fact]
    public async Task Put_ChangingLocationRegion_PersistsAndReturnsNewRegion()
    {
        var (client, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var quest = await ReadCreatedQuestAsync(await CreateQuestAsync(client, "Change Region"));
        Assert.Equal(RegionSeed.HendersonMasseyId, quest.LocationRegion?.Id);
        var request = ValidUpdate(quest, "Change Region updated") with
        {
            LocationRegionId = RegionSeed.AlbertEdenId,
        };

        var update = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Put,
            $"/api/v1/organizer/quests/{quest.Id}",
            request);
        var updated = await ReadSuccessQuestAsync(update);

        Assert.Equal(RegionSeed.AlbertEdenId, updated.LocationRegion?.Id);
        Assert.NotEqual(RegionSeed.HendersonMasseyId, updated.LocationRegion?.Id);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            Assert.Equal(
                RegionSeed.AlbertEdenId,
                await db.Quests.Where(item => item.Id == quest.Id)
                    .Select(item => item.LocationRegionId)
                    .SingleAsync(TestContext.Current.CancellationToken));
        }

        var get = await client.GetAsync(
            $"/api/v1/organizer/quests/{quest.Id}", TestContext.Current.CancellationToken);
        var reread = await ReadSuccessQuestAsync(get);
        Assert.Equal(RegionSeed.AlbertEdenId, reread.LocationRegion?.Id);
    }

    [Fact]
    public async Task Organizer_CanUseLifecycleAndDeleteDraft()
    {
        var (client, _) = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var lifecycle = await ReadCreatedQuestAsync(await CreateQuestAsync(client, "Lifecycle"));

        var publish = await SendJsonWithCsrfAsync(
            client, HttpMethod.Post, $"/api/v1/organizer/quests/{lifecycle.Id}/publish",
            new QuestVersionRequest(lifecycle.Version));
        var published = await ReadSuccessQuestAsync(publish);
        Assert.Equal("Published", published.Status);

        var cancel = await SendJsonWithCsrfAsync(
            client, HttpMethod.Post, $"/api/v1/organizer/quests/{lifecycle.Id}/cancel",
            new CancelQuestRequest(published.Version));
        var cancelled = await ReadSuccessQuestAsync(cancel);
        Assert.Equal("Cancelled", cancelled.Status);

        var archive = await SendJsonWithCsrfAsync(
            client, HttpMethod.Post, $"/api/v1/organizer/quests/{lifecycle.Id}/archive",
            new QuestVersionRequest(cancelled.Version));
        Assert.Equal("Archived", (await ReadSuccessQuestAsync(archive)).Status);

        var draft = await ReadCreatedQuestAsync(await CreateQuestAsync(client, "Delete draft"));
        var delete = await SendJsonWithCsrfAsync(
            client, HttpMethod.Delete, $"/api/v1/organizer/quests/{draft.Id}",
            new QuestVersionRequest(draft.Version));
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task ManagementOpenApi_HasTenEndpointsIncludingCompletionCodesAndNoGalleryRoutes()
    {
        var client = _factory.CreateClient();
        var response = await client.GetStringAsync(
            "/openapi/v1.json", TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(response);
        var managementPaths = document.RootElement.GetProperty("paths")
            .EnumerateObject()
            .Where(path => path.Name.StartsWith("/api/v1/organizer/quests", StringComparison.Ordinal))
            .ToList();

        Assert.Equal(10, managementPaths.Sum(path => path.Value.EnumerateObject().Count()));
        Assert.Contains(
            managementPaths,
            path => path.Name.EndsWith("/completion-codes", StringComparison.Ordinal));
        Assert.DoesNotContain(managementPaths, path => path.Name.Contains("/images", StringComparison.Ordinal));
    }

    private async Task<(HttpClient Client, Guid UserId)> CreateAuthenticatedClientAsync(string role)
    {
        var host = _factory.WithWebHostBuilder(_ => { });
        _isolatedHosts.Add(host);
        var client = host.CreateClient();
        var email = $"quest-{Guid.NewGuid():N}@example.test";

        using (var scope = host.Services.CreateScope())
        {
            await IdentitySeed.SeedRolesAsync(
                scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>(),
                TestContext.Current.CancellationToken);
        }

        var register = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Post,
            "/api/v1/auth/register",
            new
            {
                email,
                password = Password,
                passwordConfirmation = Password,
                displayName = "Quest manager",
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
                var result = await userManager.AddToRoleAsync(user, role);
                Assert.True(result.Succeeded);
            }
        }

        var login = await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Post,
            "/api/v1/auth/login",
            new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        return (client, userId);
    }

    private async Task<HttpResponseMessage> CreateQuestAsync(HttpClient client, string title)
    {
        await _factory.SeedRegionsAsync();
        return await SendJsonWithCsrfAsync(
            client,
            HttpMethod.Post,
            "/api/v1/organizer/quests",
            new
            {
                title,
                description = "Help restore an Auckland community environment.",
                category = "RestoreNature",
                registrationMode = "Native",
                difficulty = "Easy",
                capacity = 25,
                startAtUtc = DateTimeOffset.UtcNow.AddDays(1),
                endAtUtc = DateTimeOffset.UtcNow.AddDays(1).AddHours(2),
                locationRegionId = RegionSeed.HendersonMasseyId,
                locationDescription = "Henderson reserve",
                externalSourceUrl = "https://example.test/quest",
                coverImage = new CoverImageRequest(
                    "/images/quests/organizer-cover.svg",
                    "Volunteers restoring a reserve",
                    "Kiwimpact",
                    "https://example.test/image-source",
                    "Project-owned image"),
                createdByUserId = Guid.NewGuid(),
                sourceType = "PlatformEcoChallenge",
                status = "Published",
                xpAward = 999,
            });
    }

    private static UpdateQuestRequest ValidUpdate(QuestManagementDetailDto quest, string title) => new(
        title,
        quest.Description,
        quest.Category,
        quest.RegistrationMode,
        quest.Difficulty,
        quest.Capacity,
        DateTimeOffset.Parse(quest.StartAtUtc!),
        DateTimeOffset.Parse(quest.EndAtUtc!),
        quest.LocationRegion?.Id,
        quest.LocationDescription,
        quest.ExternalSourceUrl,
        null,
        quest.Version);

    private static async Task<QuestManagementDetailDto> ReadCreatedQuestAsync(
        HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return Assert.IsType<QuestManagementDetailDto>(
            await response.Content.ReadFromJsonAsync<QuestManagementDetailDto>(
                TestContext.Current.CancellationToken));
    }

    private static async Task<QuestManagementDetailDto> ReadSuccessQuestAsync(
        HttpResponseMessage response)
    {
        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        return Assert.IsType<QuestManagementDetailDto>(
            await response.Content.ReadFromJsonAsync<QuestManagementDetailDto>(
                TestContext.Current.CancellationToken));
    }

    private static async Task<HttpResponseMessage> SendJsonWithCsrfAsync(
        HttpClient client,
        HttpMethod method,
        string path,
        object value)
    {
        var tokenResponse = await client.GetAsync(
            "/api/v1/auth/csrf-token", TestContext.Current.CancellationToken);
        tokenResponse.EnsureSuccessStatusCode();
        var token = await tokenResponse.Content.ReadFromJsonAsync<AntiforgeryTokenDto>(
            TestContext.Current.CancellationToken);

        using var request = new HttpRequestMessage(method, path)
        {
            Content = JsonContent.Create(value, options: JsonOptions),
        };
        request.Headers.Add("X-CSRF-TOKEN", Assert.IsType<string>(token?.Token));
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }
}
