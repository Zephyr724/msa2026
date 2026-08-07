using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Security;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kiwimpact.IntegrationTests.Api;

public sealed class QuestCompletionApiTests
    : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    private const string Password = "ValidPass!1234";
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);
    private readonly CustomWebApplicationFactory _factory;
    private readonly List<WebApplicationFactory<Program>> _hosts = [];

    public QuestCompletionApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public void Dispose()
    {
        foreach (var host in _hosts)
            host.Dispose();
    }

    [Fact]
    public async Task AnonymousRedemptionAlwaysReturnsUnauthorizedBeforeRateLimiting()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
        var path = RedeemPath(Guid.NewGuid());

        for (var attempt = 0; attempt < 12; attempt++)
        {
            var response = await client.PostAsJsonAsync(
                path,
                new { code = "ABCDE-23456" },
                TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }

    [Fact]
    public async Task MyClaims_EmptyMemberHistory_ReturnsAnEmptyList()
    {
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);

        var response = await actor.Client.GetAsync(
            "/api/v1/users/me/claims",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var claims = await response.Content.ReadFromJsonAsync<JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.Equal(JsonValueKind.Array, claims.ValueKind);
        Assert.Empty(claims.EnumerateArray());
    }

    [Fact]
    public async Task UnsupportedRoleIsForbiddenAndAuthorizedRolesUseSessionIdentity()
    {
        var observer = await CreateAuthenticatedClientAsync("Observer");
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var quest = await SeedQuestAsync(owner.UserId);

        var forbidden = await PostJsonWithCsrfAsync(
            observer.Client,
            RedeemPath(quest.Id),
            new { code = "ABCDE-23456", userId = owner.UserId });

        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        foreach (var role in new[] { AppRoles.Member, AppRoles.Organizer, AppRoles.Admin })
        {
            var actor = await CreateAuthenticatedClientAsync(role);
            var roleQuest = await SeedQuestAsync(owner.UserId);
            await SeedParticipationAsync(actor.UserId, roleQuest.Id);
            var generated = await GenerateAsync(owner.Client, roleQuest.Id);
            var code = (await ReadJsonAsync(generated)).GetProperty("code").GetString();

            var response = await PostJsonWithCsrfAsync(
                actor.Client,
                RedeemPath(roleQuest.Id),
                new { code, userId = Guid.NewGuid() });

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var row = await db.QuestCompletions.SingleAsync(
                item => item.QuestId == roleQuest.Id,
                TestContext.Current.CancellationToken);
            Assert.Equal(actor.UserId, row.UserId);
        }
    }

    [Fact]
    public async Task CodeManagementRequiresOwnerOrAdminAndDoesNotDiscloseForeignDrafts()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var otherOrganizer = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var admin = await CreateAuthenticatedClientAsync(AppRoles.Admin);
        var member = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var published = await SeedQuestAsync(owner.UserId);
        var draft = await SeedQuestAsync(owner.UserId, status: QuestStatus.Draft);

        Assert.Equal(
            HttpStatusCode.Forbidden,
            (await otherOrganizer.Client.GetAsync(
                CodeStatusPath(published.Id),
                TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(
            HttpStatusCode.Forbidden,
            (await member.Client.GetAsync(
                CodeStatusPath(published.Id),
                TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(
            HttpStatusCode.NotFound,
            (await otherOrganizer.Client.GetAsync(
                CodeStatusPath(draft.Id),
                TestContext.Current.CancellationToken)).StatusCode);

        var adminStatus = await admin.Client.GetAsync(
            CodeStatusPath(published.Id),
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, adminStatus.StatusCode);
        var statusJson = await ReadJsonAsync(adminStatus);
        Assert.False(statusJson.GetProperty("isConfigured").GetBoolean());
        Assert.Equal(JsonValueKind.Null, statusJson.GetProperty("validFromUtc").ValueKind);

        var draftGenerate = await GenerateAsync(owner.Client, draft.Id);
        Assert.Equal(HttpStatusCode.Conflict, draftGenerate.StatusCode);
    }

    [Theory]
    [InlineData("Development")]
    [InlineData("Production")]
    public void StartupRejectsInvalidHmacKeyInEveryEnvironment(string environment)
    {
        using var host = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment(environment);
            builder.ConfigureAppConfiguration((_, configuration) =>
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["CompletionCodes:HmacKey"] = "invalid",
                }));
        });

        var exception = Assert.ThrowsAny<Exception>(() => host.CreateClient());

        Assert.Contains("CompletionCodes:HmacKey", exception.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task HappyPathPersistsVerifiedSnapshotsAndReturnsRevealOnceExactDtos()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId, difficulty: QuestDifficulty.Hard);
        var participation = await SeedParticipationAsync(actor.UserId, quest.Id);
        var communityId = await SetHomeCommunityAsync(actor.UserId);

        var generated = await GenerateAsync(owner.Client, quest.Id);
        Assert.Equal(HttpStatusCode.Created, generated.StatusCode);
        Assert.Equal(
            CodeStatusPath(quest.Id),
            generated.Headers.Location?.OriginalString);
        var generatedJson = await ReadJsonAsync(generated);
        AssertExactKeys(generatedJson, "code", "validFromUtc", "validToUtc");
        var plaintext = Assert.IsType<string>(generatedJson.GetProperty("code").GetString());
        Assert.Matches("^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$", plaintext);

        var statusResponse = await owner.Client.GetAsync(
            CodeStatusPath(quest.Id),
            TestContext.Current.CancellationToken);
        var statusJson = await ReadJsonAsync(statusResponse);
        AssertExactKeys(
            statusJson,
            "createdAtUtc",
            "isConfigured",
            "validFromUtc",
            "validToUtc");
        Assert.True(statusJson.GetProperty("isConfigured").GetBoolean());
        Assert.DoesNotContain(plaintext, statusJson.GetRawText(), StringComparison.Ordinal);
        Assert.DoesNotContain("hash", statusJson.GetRawText(), StringComparison.OrdinalIgnoreCase);

        var redeem = await PostJsonWithCsrfAsync(
            actor.Client,
            RedeemPath(quest.Id),
            new { code = $"  {plaintext.ToLowerInvariant()}  " });
        Assert.Equal(HttpStatusCode.Created, redeem.StatusCode);
        Assert.Equal(CompletionPath(quest.Id), redeem.Headers.Location?.OriginalString);
        var redemptionJson = await ReadJsonAsync(redeem);
        AssertExactKeys(redemptionJson, "completion", "reward");
        AssertCompletionDto(
            redemptionJson.GetProperty("completion"),
            "Verified",
            "CompletionCode");
        var rewardJson = redemptionJson.GetProperty("reward");
        AssertExactKeys(
            rewardJson,
            "communityChallenge",
            "celebrationMessage",
            "celebrationTitle",
            "createdAtUtc",
            "level",
            "previousLevel",
            "previousRankTitle",
            "previousTotalXp",
            "questCompletionId",
            "questId",
            "questTitle",
            "rankTitle",
            "rewardEventId",
            "seenAtUtc",
            "streak",
            "totalXp",
            "unlockedAchievements",
            "verificationMethod",
            "xpAwarded");
        Assert.Equal(150, rewardJson.GetProperty("xpAwarded").GetInt32());
        Assert.Equal(0, rewardJson.GetProperty("previousTotalXp").GetInt64());
        Assert.Equal(150, rewardJson.GetProperty("totalXp").GetInt64());
        Assert.Equal(1, rewardJson.GetProperty("previousLevel").GetInt32());
        Assert.Equal(3, rewardJson.GetProperty("level").GetInt32());
        Assert.Equal("Novice", rewardJson.GetProperty("previousRankTitle").GetString());
        Assert.Equal("Novice", rewardJson.GetProperty("rankTitle").GetString());
        Assert.Equal(quest.Id, rewardJson.GetProperty("questId").GetGuid());
        Assert.Equal(quest.Title, rewardJson.GetProperty("questTitle").GetString());
        var celebrationTitle = rewardJson.GetProperty("celebrationTitle").GetString();
        var celebrationMessage = rewardJson.GetProperty("celebrationMessage").GetString();
        Assert.False(string.IsNullOrWhiteSpace(celebrationTitle));
        Assert.False(string.IsNullOrWhiteSpace(celebrationMessage));
        Assert.Equal("CompletionCode", rewardJson.GetProperty("verificationMethod").GetString());
        Assert.Equal(JsonValueKind.Null, rewardJson.GetProperty("seenAtUtc").ValueKind);
        AssertExactKeys(
            rewardJson.GetProperty("streak"),
            "hasVerifiedImpactThisWeek",
            "previousHasVerifiedImpactThisWeek",
            "previousWeeks",
            "weeks");
        Assert.All(
            rewardJson.GetProperty("unlockedAchievements").EnumerateArray(),
            achievement => AssertExactKeys(
                achievement,
                "achievementId",
                "code",
                "name"));

        var stateResponse = await actor.Client.GetAsync(
            CompletionPath(quest.Id),
            TestContext.Current.CancellationToken);
        AssertCompletionDto(await ReadJsonAsync(stateResponse), "Verified", "CompletionCode");

        var inboxResponse = await actor.Client.GetAsync(
            "/api/v1/users/me/reward-events/unseen",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, inboxResponse.StatusCode);
        var inboxJson = await ReadJsonAsync(inboxResponse);
        AssertExactKeys(inboxJson, "items");
        var inboxReward = Assert.Single(inboxJson.GetProperty("items").EnumerateArray());
        Assert.Equal(
            rewardJson.GetProperty("rewardEventId").GetGuid(),
            inboxReward.GetProperty("rewardEventId").GetGuid());

        var resolutionResponse = await actor.Client.GetAsync(
            $"/api/v1/quests/{quest.Id}/reward-resolution",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resolutionResponse.StatusCode);
        var resolutionJson = await ReadJsonAsync(resolutionResponse);
        Assert.Equal(
            rewardJson.GetProperty("rewardEventId").GetGuid(),
            resolutionJson.GetProperty("rewardEventId").GetGuid());
        Assert.Equal(celebrationTitle, resolutionJson.GetProperty("celebrationTitle").GetString());
        Assert.Equal(celebrationMessage, resolutionJson.GetProperty("celebrationMessage").GetString());

        var passportResponse = await actor.Client.GetAsync(
            "/api/v1/users/me/passport",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, passportResponse.StatusCode);
        var categoryImpact = (await ReadJsonAsync(passportResponse))
            .GetProperty("categoryImpact")
            .EnumerateArray()
            .Single(item => item.GetProperty("category").GetString() == quest.Category.ToString());
        Assert.Equal(1, categoryImpact.GetProperty("verifiedCompletionCount").GetInt64());
        Assert.Equal(150, categoryImpact.GetProperty("verifiedXp").GetInt64());

        var seenResponse = await PostJsonWithCsrfAsync(
            actor.Client,
            $"/api/v1/users/me/reward-events/{rewardJson.GetProperty("rewardEventId").GetGuid()}/seen",
            new { });
        Assert.Equal(HttpStatusCode.OK, seenResponse.StatusCode);
        Assert.NotEqual(
            JsonValueKind.Null,
            (await ReadJsonAsync(seenResponse)).GetProperty("seenAtUtc").ValueKind);
        var emptyInboxResponse = await actor.Client.GetAsync(
            "/api/v1/users/me/reward-events/unseen",
            TestContext.Current.CancellationToken);
        Assert.Empty((await ReadJsonAsync(emptyInboxResponse))
            .GetProperty("items")
            .EnumerateArray());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var completion = await db.QuestCompletions.SingleAsync(
            item => item.QuestId == quest.Id && item.UserId == actor.UserId,
            TestContext.Current.CancellationToken);
        var storedCode = await db.CompletionCodes.SingleAsync(
            item => item.QuestId == quest.Id,
            TestContext.Current.CancellationToken);
        var xp = await db.XpTransactions.SingleAsync(
            item => item.SourceCompletionId == completion.Id,
            TestContext.Current.CancellationToken);
        Assert.Equal(
            xp.Id,
            rewardJson.GetProperty("rewardEventId").GetGuid());
        Assert.Equal(QuestCompletionStatus.Verified, completion.Status);
        Assert.Equal(CompletionMethod.CompletionCode, completion.Method);
        Assert.Equal(participation.Id, completion.ParticipationId);
        Assert.Equal(QuestDifficulty.Hard, completion.RewardDifficultySnapshot);
        Assert.Equal(quest.Category, completion.QuestCategorySnapshot);
        Assert.Equal(communityId, completion.CommunityRegionIdAtCompletion);
        Assert.Equal(completion.CompletedAt, completion.VerifiedAtUtc);
        Assert.NotEqual(0u, completion.Version);
        Assert.DoesNotContain(
            plaintext.Replace("-", string.Empty, StringComparison.Ordinal),
            storedCode.CodeHash,
            StringComparison.OrdinalIgnoreCase);
        Assert.Equal(
            32,
            Convert.FromBase64String(storedCode.CodeHash).Length);
    }

    [Fact]
    public async Task EvidenceApprovalDeliversEquivalentUnseenRewardToTheMember()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var member = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var admin = await CreateAuthenticatedClientAsync(AppRoles.Admin);
        var quest = await SeedQuestAsync(owner.UserId, difficulty: QuestDifficulty.Medium);
        await SeedParticipationAsync(member.UserId, quest.Id);

        var submitted = await PostJsonWithCsrfAsync(
            member.Client,
            $"/api/v1/quests/{quest.Id}/claims",
            new
            {
                description = "Collected and documented litter from the stream edge.",
                evidenceUrl = "https://example.test/member-evidence",
                userDeclaration = true,
                completedAtUtc = DateTimeOffset.UtcNow,
            });
        Assert.Equal(HttpStatusCode.Created, submitted.StatusCode);
        var claimId = (await ReadJsonAsync(submitted)).GetProperty("claimId").GetGuid();

        var approved = await PostJsonWithCsrfAsync(
            admin.Client,
            $"/api/v1/admin/claims/{claimId}/review",
            new { approve = true, reviewNote = "Evidence verified." });
        Assert.Equal(HttpStatusCode.OK, approved.StatusCode);

        var inboxResponse = await member.Client.GetAsync(
            "/api/v1/users/me/reward-events/unseen",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, inboxResponse.StatusCode);
        var reward = Assert.Single((await ReadJsonAsync(inboxResponse))
            .GetProperty("items")
            .EnumerateArray());
        Assert.Equal(claimId, reward.GetProperty("questCompletionId").GetGuid());
        Assert.Equal(quest.Id, reward.GetProperty("questId").GetGuid());
        Assert.Equal("EvidenceClaim", reward.GetProperty("verificationMethod").GetString());
        Assert.Equal(100, reward.GetProperty("xpAwarded").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(
            reward.GetProperty("celebrationTitle").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(
            reward.GetProperty("celebrationMessage").GetString()));
        Assert.Equal(JsonValueKind.Null, reward.GetProperty("seenAtUtc").ValueKind);
    }

    [Fact]
    public async Task ConcurrentCommunityAwardsPersistSequentialChallengeTransitions()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var firstMember = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var secondMember = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var firstQuest = await SeedQuestAsync(owner.UserId);
        var secondQuest = await SeedQuestAsync(owner.UserId);
        await SeedParticipationAsync(firstMember.UserId, firstQuest.Id);
        await SeedParticipationAsync(secondMember.UserId, secondQuest.Id);
        var communityId = await SetHomeCommunityAsync(firstMember.UserId);
        await SetHomeCommunityAsync(secondMember.UserId, communityId);
        var challengeId = await SeedCommunityChallengeAsync(communityId);
        var firstCode = (await ReadJsonAsync(
            await GenerateAsync(owner.Client, firstQuest.Id)))
            .GetProperty("code").GetString();
        var secondCode = (await ReadJsonAsync(
            await GenerateAsync(owner.Client, secondQuest.Id)))
            .GetProperty("code").GetString();
        var firstCsrf = await GetCsrfTokenAsync(firstMember.Client);
        var secondCsrf = await GetCsrfTokenAsync(secondMember.Client);

        await using var lockConnection = new NpgsqlConnection(_factory.ConnectionString);
        await lockConnection.OpenAsync(TestContext.Current.CancellationToken);
        await using var lockTransaction = await lockConnection.BeginTransactionAsync(
            TestContext.Current.CancellationToken);
        await using (var lockCommand = new NpgsqlCommand(
            "SELECT \"Id\" FROM \"CommunityChallenges\" WHERE \"Id\" = @id FOR UPDATE",
            lockConnection,
            lockTransaction))
        {
            lockCommand.Parameters.AddWithValue("id", challengeId);
            await lockCommand.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        }

        var firstAward = PostJsonWithTokenAsync(
            firstMember.Client,
            RedeemPath(firstQuest.Id),
            new { code = firstCode },
            firstCsrf);
        var secondAward = PostJsonWithTokenAsync(
            secondMember.Client,
            RedeemPath(secondQuest.Id),
            new { code = secondCode },
            secondCsrf);
        await Task.Delay(150, TestContext.Current.CancellationToken);
        Assert.False(firstAward.IsCompleted && secondAward.IsCompleted);

        await lockTransaction.CommitAsync(TestContext.Current.CancellationToken);
        var responses = await Task.WhenAll(firstAward, secondAward);
        Assert.All(responses, response => Assert.Equal(HttpStatusCode.Created, response.StatusCode));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var snapshots = await db.MemberRewardEvents
            .Where(item => item.CommunityChallengeId == challengeId)
            .OrderBy(item => item.CommunityChallengePreviousProgress)
            .Select(item => new
            {
                item.CommunityChallengePreviousProgress,
                item.CommunityChallengeProgress,
            })
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Collection(
            snapshots,
            item =>
            {
                Assert.Equal(0, item.CommunityChallengePreviousProgress);
                Assert.Equal(1, item.CommunityChallengeProgress);
            },
            item =>
            {
                Assert.Equal(1, item.CommunityChallengePreviousProgress);
                Assert.Equal(2, item.CommunityChallengeProgress);
            });
    }

    [Fact]
    public async Task ActiveParticipationIsRequiredAndRejoinRestoresEligibility()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId);
        var generated = await GenerateAsync(owner.Client, quest.Id);
        var code = (await ReadJsonAsync(generated)).GetProperty("code").GetString();

        var withoutParticipation = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(quest.Id), new { code });
        await AssertProblemAsync(
            withoutParticipation,
            HttpStatusCode.Conflict,
            "An active Quest participation is required.");

        await SeedParticipationAsync(actor.UserId, quest.Id, cancelled: true);
        var cancelled = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(quest.Id), new { code });
        await AssertProblemAsync(
            cancelled,
            HttpStatusCode.Conflict,
            "An active Quest participation is required.");

        await SeedParticipationAsync(actor.UserId, quest.Id);
        var rejoined = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(quest.Id), new { code });
        Assert.Equal(HttpStatusCode.Created, rejoined.StatusCode);
    }

    [Theory]
    [InlineData(AppRoles.Member)]
    [InlineData(AppRoles.Organizer)]
    [InlineData(AppRoles.Admin)]
    public async Task CreatorCannotSelfCompleteForAnyAuthorizedRole(string role)
    {
        var creator = await CreateAuthenticatedClientAsync(role);
        var admin = await CreateAuthenticatedClientAsync(AppRoles.Admin);
        var quest = await SeedQuestAsync(creator.UserId);
        await SeedParticipationAsync(creator.UserId, quest.Id);
        var generated = await GenerateAsync(admin.Client, quest.Id);
        var code = (await ReadJsonAsync(generated)).GetProperty("code").GetString();

        var response = await PostJsonWithCsrfAsync(
            creator.Client, RedeemPath(quest.Id), new { code });

        await AssertProblemAsync(
            response,
            HttpStatusCode.Conflict,
            "You cannot complete a Quest you created.");
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.False(await db.QuestCompletions.AnyAsync(
            item => item.QuestId == quest.Id,
            TestContext.Current.CancellationToken));
        Assert.True(await db.CompletionCodes.AnyAsync(
            item => item.QuestId == quest.Id && item.IsActive && !item.IsRevoked,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task EveryInvalidCodeClassReturnsTheSameGenericProblem()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var wrongQuest = await SeedQuestAsync(owner.UserId);
        await SeedParticipationAsync(actor.UserId, wrongQuest.Id);
        await GenerateAsync(owner.Client, wrongQuest.Id);
        var wrong = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(wrongQuest.Id), new { code = "ABCDE-23456" });
        var malformed = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(wrongQuest.Id), new { code = "invalid" });

        var rotatedQuest = await SeedQuestAsync(owner.UserId);
        await SeedParticipationAsync(actor.UserId, rotatedQuest.Id);
        var first = await GenerateAsync(owner.Client, rotatedQuest.Id);
        var oldCode = (await ReadJsonAsync(first)).GetProperty("code").GetString();
        await GenerateAsync(owner.Client, rotatedQuest.Id);
        var rotated = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(rotatedQuest.Id), new { code = oldCode });

        var expiredQuest = await SeedQuestAsync(owner.UserId);
        await SeedParticipationAsync(actor.UserId, expiredQuest.Id);
        await SeedCompletionCodeAsync(
            expiredQuest.Id,
            owner.UserId,
            "FGHJK6789A",
            DateTimeOffset.UtcNow.AddDays(-2),
            DateTimeOffset.UtcNow.AddDays(-1));
        var expired = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(expiredQuest.Id), new { code = "FGHJK-6789A" });

        var unconfiguredQuest = await SeedQuestAsync(owner.UserId);
        await SeedParticipationAsync(actor.UserId, unconfiguredQuest.Id);
        var unconfigured = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(unconfiguredQuest.Id), new { code = "ABCDE-23456" });

        var expected = await SafeProblemSignatureAsync(wrong);
        Assert.Equal(expected, await SafeProblemSignatureAsync(malformed));
        Assert.Equal(expected, await SafeProblemSignatureAsync(rotated));
        Assert.Equal(expected, await SafeProblemSignatureAsync(expired));
        Assert.Equal(expected, await SafeProblemSignatureAsync(unconfigured));
        Assert.Equal(HttpStatusCode.BadRequest, wrong.StatusCode);
        Assert.Equal("https://kiwimpact.app/problems/invalid-completion-code", expected.Type);
    }

    [Fact]
    public async Task RotationInvalidatesOldCodeAndKeepsExistingVerifiedCompletions()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var firstActor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var secondActor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId);
        await SeedParticipationAsync(firstActor.UserId, quest.Id);
        await SeedParticipationAsync(secondActor.UserId, quest.Id);
        var firstGenerated = await GenerateAsync(owner.Client, quest.Id);
        var firstCode = (await ReadJsonAsync(firstGenerated)).GetProperty("code").GetString();
        Assert.Equal(
            HttpStatusCode.Created,
            (await PostJsonWithCsrfAsync(
                firstActor.Client, RedeemPath(quest.Id), new { code = firstCode })).StatusCode);

        var rotated = await GenerateAsync(owner.Client, quest.Id);
        var replacement = (await ReadJsonAsync(rotated)).GetProperty("code").GetString();
        var oldAttempt = await PostJsonWithCsrfAsync(
            secondActor.Client, RedeemPath(quest.Id), new { code = firstCode });
        Assert.Equal(HttpStatusCode.BadRequest, oldAttempt.StatusCode);
        Assert.Equal(
            HttpStatusCode.Created,
            (await PostJsonWithCsrfAsync(
                secondActor.Client, RedeemPath(quest.Id), new { code = replacement })).StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.Equal(2, await db.QuestCompletions.CountAsync(
            item => item.QuestId == quest.Id,
            TestContext.Current.CancellationToken));
        Assert.Equal(1, await db.CompletionCodes.CountAsync(
            item => item.QuestId == quest.Id && item.IsActive && !item.IsRevoked,
            TestContext.Current.CancellationToken));
        Assert.Equal(1, await db.CompletionCodes.CountAsync(
            item => item.QuestId == quest.Id && item.IsRevoked && !item.IsActive,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task ConcurrentRotationLeavesExactlyOneActiveCode()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var quest = await SeedQuestAsync(owner.UserId);
        var csrf = await GetCsrfTokenAsync(owner.Client);

        await using var lockConnection = new NpgsqlConnection(_factory.ConnectionString);
        await lockConnection.OpenAsync(TestContext.Current.CancellationToken);
        await using var lockTransaction = await lockConnection.BeginTransactionAsync(
            TestContext.Current.CancellationToken);
        await using (var lockCommand = new NpgsqlCommand(
            "SELECT \"Id\" FROM \"Quests\" WHERE \"Id\" = @id FOR UPDATE",
            lockConnection,
            lockTransaction))
        {
            lockCommand.Parameters.AddWithValue("id", quest.Id);
            await lockCommand.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        }

        var first = PostWithTokenAsync(owner.Client, CodeStatusPath(quest.Id), csrf);
        var second = PostWithTokenAsync(owner.Client, CodeStatusPath(quest.Id), csrf);
        Assert.True(await WaitForBlockedQuestSessionsAsync(2, TimeSpan.FromSeconds(10)) >= 2);

        await lockTransaction.CommitAsync(TestContext.Current.CancellationToken);
        var responses = await Task.WhenAll(first, second);
        Assert.All(responses, response => Assert.Equal(HttpStatusCode.Created, response.StatusCode));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.Equal(2, await db.CompletionCodes.CountAsync(
            item => item.QuestId == quest.Id,
            TestContext.Current.CancellationToken));
        Assert.Equal(1, await db.CompletionCodes.CountAsync(
            item => item.QuestId == quest.Id && item.IsActive && !item.IsRevoked,
            TestContext.Current.CancellationToken));
        Assert.Equal(1, await db.CompletionCodes.CountAsync(
            item => item.QuestId == quest.Id && !item.IsActive && item.IsRevoked,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task FailedRotationPreservesPreviouslyActiveCode()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId, noExpiry: true);
        await SeedParticipationAsync(actor.UserId, quest.Id);
        var generated = await GenerateAsync(owner.Client, quest.Id);
        var oldCode = (await ReadJsonAsync(generated)).GetProperty("code").GetString();
        Guid originalCodeId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var persistedQuest = await db.Quests.SingleAsync(
                item => item.Id == quest.Id,
                TestContext.Current.CancellationToken);
            var originalCode = await db.CompletionCodes.SingleAsync(
                item => item.QuestId == quest.Id,
                TestContext.Current.CancellationToken);
            originalCodeId = originalCode.Id;
            persistedQuest.StartAtUtc = DateTimeOffset.UtcNow.AddDays(-10);
            persistedQuest.EndAtUtc = DateTimeOffset.UtcNow.AddDays(-8);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var failedRotation = await GenerateAsync(owner.Client, quest.Id);
        Assert.Equal(HttpStatusCode.Conflict, failedRotation.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var stillActive = await db.CompletionCodes.SingleAsync(
                item => item.QuestId == quest.Id && item.IsActive && !item.IsRevoked,
                TestContext.Current.CancellationToken);
            Assert.Equal(originalCodeId, stillActive.Id);
            Assert.Equal(1, await db.CompletionCodes.CountAsync(
                item => item.QuestId == quest.Id,
                TestContext.Current.CancellationToken));
        }

        var redeem = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(quest.Id), new { code = oldCode });
        Assert.Equal(HttpStatusCode.Created, redeem.StatusCode);
    }

    [Fact]
    public async Task DuplicateIsConflictUntilRateLimitTakesPrecedence()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId);
        await SeedParticipationAsync(actor.UserId, quest.Id);
        var generated = await GenerateAsync(owner.Client, quest.Id);
        var code = (await ReadJsonAsync(generated)).GetProperty("code").GetString();

        var first = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(quest.Id), new { code });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        for (var attempt = 0; attempt < 9; attempt++)
        {
            var path = attempt % 2 == 0
                ? RedeemPath(quest.Id)
                : RedeemPathWithUppercaseId(quest.Id);
            var duplicate = await PostJsonWithCsrfAsync(
                actor.Client, path, new { code = "malformed" });
            await AssertProblemAsync(
                duplicate,
                HttpStatusCode.Conflict,
                "You have already completed this Quest.");
        }

        var limited = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(quest.Id), new { code = "malformed" });
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.True(limited.Headers.RetryAfter is not null ||
            limited.Headers.Contains("Retry-After"));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.Equal(1, await db.QuestCompletions.CountAsync(
            item => item.UserId == actor.UserId && item.QuestId == quest.Id,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task ConcurrentDuplicateWithExternallyHeldQuestLockCreatesExactlyOneCompletion()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId);
        await SeedParticipationAsync(actor.UserId, quest.Id);
        var generated = await GenerateAsync(owner.Client, quest.Id);
        var code = (await ReadJsonAsync(generated)).GetProperty("code").GetString();
        var csrf = await GetCsrfTokenAsync(actor.Client);

        await using var lockConnection = new NpgsqlConnection(_factory.ConnectionString);
        await lockConnection.OpenAsync(TestContext.Current.CancellationToken);
        await using var lockTransaction = await lockConnection.BeginTransactionAsync(
            TestContext.Current.CancellationToken);
        await using (var lockCommand = new NpgsqlCommand(
            "SELECT \"Id\" FROM \"Quests\" WHERE \"Id\" = @id FOR UPDATE",
            lockConnection,
            lockTransaction))
        {
            lockCommand.Parameters.AddWithValue("id", quest.Id);
            await lockCommand.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        }

        var first = PostJsonWithTokenAsync(
            actor.Client, RedeemPath(quest.Id), new { code }, csrf);
        var second = PostJsonWithTokenAsync(
            actor.Client, RedeemPath(quest.Id), new { code }, csrf);
        Assert.True(await WaitForBlockedQuestSessionsAsync(2, TimeSpan.FromSeconds(10)) >= 2);
        Assert.False(first.IsCompleted);
        Assert.False(second.IsCompleted);

        await lockTransaction.CommitAsync(TestContext.Current.CancellationToken);
        var responses = await Task.WhenAll(first, second);

        Assert.Equal(1, responses.Count(item => item.StatusCode == HttpStatusCode.Created));
        Assert.Equal(1, responses.Count(item => item.StatusCode == HttpStatusCode.Conflict));
        var conflict = Assert.Single(
            responses,
            item => item.StatusCode == HttpStatusCode.Conflict);
        await AssertProblemAsync(
            conflict,
            HttpStatusCode.Conflict,
            "You have already completed this Quest.");
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.Equal(1, await db.QuestCompletions.CountAsync(
            item => item.QuestId == quest.Id && item.UserId == actor.UserId,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task DateWindowsUnsupportedQuestRulesAndNoExpiryAreAuthoritative()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var now = DateTimeOffset.UtcNow;

        var future = await SeedQuestAsync(
            owner.UserId,
            startAt: now.AddDays(1),
            endAt: now.AddDays(2));
        await SeedParticipationAsync(actor.UserId, future.Id);
        var futureGenerated = await GenerateAsync(owner.Client, future.Id);
        var futureCode = (await ReadJsonAsync(futureGenerated)).GetProperty("code").GetString();
        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await PostJsonWithCsrfAsync(
                actor.Client, RedeemPath(future.Id), new { code = futureCode })).StatusCode);

        var grace = await SeedQuestAsync(
            owner.UserId,
            startAt: now.AddDays(-3),
            endAt: now.AddDays(-1));
        await SeedParticipationAsync(actor.UserId, grace.Id);
        var graceGenerated = await GenerateAsync(owner.Client, grace.Id);
        var graceCode = (await ReadJsonAsync(graceGenerated)).GetProperty("code").GetString();
        Assert.Equal(
            HttpStatusCode.Created,
            (await PostJsonWithCsrfAsync(
                actor.Client, RedeemPath(grace.Id), new { code = graceCode })).StatusCode);

        var noExpiry = await SeedQuestAsync(owner.UserId, noExpiry: true);
        await SeedParticipationAsync(actor.UserId, noExpiry.Id);
        var noExpiryGenerated = await GenerateAsync(owner.Client, noExpiry.Id);
        var noExpiryJson = await ReadJsonAsync(noExpiryGenerated);
        Assert.Equal(JsonValueKind.Null, noExpiryJson.GetProperty("validToUtc").ValueKind);
        Assert.Equal(
            HttpStatusCode.Created,
            (await PostJsonWithCsrfAsync(
                actor.Client,
                RedeemPath(noExpiry.Id),
                new { code = noExpiryJson.GetProperty("code").GetString() })).StatusCode);

        foreach (var (source, mode) in new[]
        {
            (QuestSourceType.AdminCuratedExternal, RegistrationMode.Native),
            (QuestSourceType.OrganizerOwned, RegistrationMode.External),
        })
        {
            var unsupported = await SeedQuestAsync(
                owner.UserId,
                registrationMode: mode,
                sourceType: source);
            var response = await GenerateAsync(owner.Client, unsupported.Id);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        var empty = await SeedQuestAsync(
            owner.UserId,
            startAt: now.AddDays(-10),
            endAt: now.AddDays(-8));
        var emptyResponse = await GenerateAsync(owner.Client, empty.Id);
        Assert.Equal(HttpStatusCode.Conflict, emptyResponse.StatusCode);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.False(await db.CompletionCodes.AnyAsync(
            item => item.QuestId == empty.Id,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task QuestDateUpdateRevokesActiveCodeBeforeRegeneration()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId);
        await SeedParticipationAsync(actor.UserId, quest.Id);
        var generated = await GenerateAsync(owner.Client, quest.Id);
        var oldCode = (await ReadJsonAsync(generated)).GetProperty("code").GetString();

        using (var scope = _factory.Services.CreateScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<IQuestManagementService>();
            var current = await service.GetAsync(
                owner.UserId,
                false,
                quest.Id,
                TestContext.Current.CancellationToken);
            await service.UpdateAsync(
                owner.UserId,
                false,
                quest.Id,
                new UpdateQuestCommand(
                    current.Title,
                    current.Description,
                    current.Category.ToString(),
                    current.RegistrationMode?.ToString(),
                    current.Difficulty.ToString(),
                    current.Capacity,
                    current.StartAtUtc?.AddHours(-1),
                    current.EndAtUtc,
                    current.LocationRegionId,
                    current.LocationDescription,
                    current.ExternalSourceUrl,
                    null,
                    current.Version),
                TestContext.Current.CancellationToken);
        }

        var oldAttempt = await PostJsonWithCsrfAsync(
            actor.Client, RedeemPath(quest.Id), new { code = oldCode });
        Assert.Equal(HttpStatusCode.BadRequest, oldAttempt.StatusCode);

        var replacement = await GenerateAsync(owner.Client, quest.Id);
        var newCode = (await ReadJsonAsync(replacement)).GetProperty("code").GetString();
        Assert.Equal(
            HttpStatusCode.Created,
            (await PostJsonWithCsrfAsync(
                actor.Client, RedeemPath(quest.Id), new { code = newCode })).StatusCode);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        Assert.Equal(1, await verifyDb.CompletionCodes.CountAsync(
            item => item.QuestId == quest.Id && item.IsRevoked,
            TestContext.Current.CancellationToken));
        Assert.Equal(1, await verifyDb.CompletionCodes.CountAsync(
            item => item.QuestId == quest.Id && item.IsActive && !item.IsRevoked,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task StateChangingEndpointsRequireCsrfAndOpenApiDocumentsTheAcceptedSurface()
    {
        var owner = await CreateAuthenticatedClientAsync(AppRoles.Organizer);
        var actor = await CreateAuthenticatedClientAsync(AppRoles.Member);
        var quest = await SeedQuestAsync(owner.UserId);

        var noneState = await actor.Client.GetAsync(
            CompletionPath(quest.Id),
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, noneState.StatusCode);
        AssertCompletionDto(await ReadJsonAsync(noneState), "None", null);

        var generateWithoutCsrf = await owner.Client.PostAsync(
            CodeStatusPath(quest.Id),
            null,
            TestContext.Current.CancellationToken);
        var redeemWithoutCsrf = await actor.Client.PostAsJsonAsync(
            RedeemPath(quest.Id),
            new { code = "ABCDE-23456" },
            TestContext.Current.CancellationToken);
        await AssertInvalidCsrfAsync(generateWithoutCsrf);
        await AssertInvalidCsrfAsync(redeemWithoutCsrf);

        var documentText = await _factory.CreateClient().GetStringAsync(
            "/openapi/v1.json",
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(documentText);
        var paths = document.RootElement.GetProperty("paths");
        Assert.True(paths.TryGetProperty(
            "/api/v1/organizer/quests/{questId}/completion-codes", out var management));
        Assert.True(management.TryGetProperty("get", out _));
        Assert.True(management.TryGetProperty("post", out var generateOperation));
        Assert.False(generateOperation.TryGetProperty("requestBody", out _));
        Assert.True(paths.TryGetProperty(
            "/api/v1/quests/{questId}/redeem", out _));
        Assert.True(paths.TryGetProperty(
            "/api/v1/quests/{questId}/completion", out _));
    }

    private async Task<AuthClient> CreateAuthenticatedClientAsync(string role)
    {
        var host = _factory.WithWebHostBuilder(_ => { });
        _hosts.Add(host);
        var client = host.CreateClient();
        var email = $"completion-{Guid.NewGuid():N}@example.test";

        using (var scope = host.Services.CreateScope())
        {
            await IdentitySeed.SeedRolesAsync(
                scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>(),
                TestContext.Current.CancellationToken);
            if (!AppRoles.All.Contains(role))
            {
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
                if (!await roleManager.RoleExistsAsync(role))
                {
                    Assert.True((await roleManager.CreateAsync(
                        new ApplicationRole { Name = role })).Succeeded);
                }
            }
        }

        var register = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/register",
            new
            {
                email,
                password = Password,
                passwordConfirmation = Password,
                displayName = "Completion tester",
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
                Assert.True((await userManager.RemoveFromRoleAsync(user, AppRoles.Member)).Succeeded);
                Assert.True((await userManager.AddToRoleAsync(user, role)).Succeeded);
            }
        }

        var login = await PostJsonWithCsrfAsync(
            client,
            "/api/v1/auth/login",
            new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        return new AuthClient(client, userId);
    }

    private async Task<Quest> SeedQuestAsync(
        Guid creatorId,
        QuestStatus status = QuestStatus.Published,
        RegistrationMode registrationMode = RegistrationMode.Native,
        QuestSourceType sourceType = QuestSourceType.OrganizerOwned,
        QuestDifficulty difficulty = QuestDifficulty.Easy,
        DateTimeOffset? startAt = null,
        DateTimeOffset? endAt = null,
        bool noExpiry = false)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var now = DateTimeOffset.UtcNow;
        var effectiveStart = startAt ?? now.AddDays(-1);
        DateTimeOffset? effectiveEnd = noExpiry ? null : endAt ?? now.AddDays(1);
        var quest = Quest.CreateOrganizerOwned(
            creatorId,
            new QuestDetails(
                $"Completion {Guid.NewGuid():N}",
                "A Quest used to verify Completion Code behavior.",
                QuestCategory.RestoreNature,
                registrationMode,
                difficulty,
                20,
                effectiveStart,
                effectiveEnd,
                null,
                null,
                registrationMode == RegistrationMode.External
                    ? "https://example.test/completion"
                    : null),
            new QuestCoverImageDetails(
                "/images/quests/completion.svg",
                "Completion test cover",
                null,
                null,
                null),
            now.AddDays(-2));
        quest.SourceType = sourceType;

        if (status != QuestStatus.Draft)
            quest.Publish(now.AddDays(-1));
        if (status is QuestStatus.Cancelled or QuestStatus.Archived)
            quest.Cancel(now);
        if (status == QuestStatus.Archived)
            quest.Archive(now);

        db.Quests.Add(quest);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return quest;
    }

    private async Task<QuestParticipation> SeedParticipationAsync(
        Guid userId,
        Guid questId,
        bool cancelled = false)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var participation = QuestParticipation.CreateActive(
            userId,
            questId,
            DateTimeOffset.UtcNow.AddMinutes(-5));
        if (cancelled)
            participation.Cancel(DateTimeOffset.UtcNow.AddMinutes(-4));
        db.QuestParticipations.Add(participation);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return participation;
    }

    private async Task<Guid> SetHomeCommunityAsync(
        Guid userId,
        Guid? existingRegionId = null)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var regionId = existingRegionId ?? Guid.NewGuid();
        if (!existingRegionId.HasValue)
        {
            db.Regions.Add(new Region
            {
                Id = regionId,
                Name = $"Completion Region {Guid.NewGuid():N}",
                Type = RegionType.LocalArea,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            });
        }
        var profile = await db.UserProfiles.SingleAsync(
            item => item.Id == userId,
            TestContext.Current.CancellationToken);
        profile.HomeCommunityRegionId = regionId;
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return regionId;
    }

    private async Task<Guid> SeedCommunityChallengeAsync(Guid communityId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var now = DateTimeOffset.UtcNow;
        var challenge = CommunityChallenge.Create(
            communityId,
            now.AddDays(-1),
            now.AddDays(1),
            20,
            null,
            now);
        db.CommunityChallenges.Add(challenge);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return challenge.Id;
    }

    private async Task SeedCompletionCodeAsync(
        Guid questId,
        Guid creatorId,
        string normalizedCode,
        DateTimeOffset validFrom,
        DateTimeOffset? validTo)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var protector = scope.ServiceProvider.GetRequiredService<CompletionCodeProtector>();
        db.CompletionCodes.Add(CompletionCode.Create(
            questId,
            protector.ComputeHash(questId, normalizedCode),
            validFrom,
            validTo,
            creatorId,
            validFrom));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    private Task<HttpResponseMessage> GenerateAsync(HttpClient client, Guid questId) =>
        PostWithCsrfAsync(client, CodeStatusPath(questId));

    private async Task<HttpResponseMessage> PostWithCsrfAsync(
        HttpClient client,
        string path)
    {
        var token = await GetCsrfTokenAsync(client);
        return await PostWithTokenAsync(client, path, token);
    }

    private static async Task<HttpResponseMessage> PostWithTokenAsync(
        HttpClient client,
        string path,
        string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path);
        request.Headers.Add("X-CSRF-TOKEN", token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    private async Task<HttpResponseMessage> PostJsonWithCsrfAsync(
        HttpClient client,
        string path,
        object body)
    {
        var token = await GetCsrfTokenAsync(client);
        return await PostJsonWithTokenAsync(client, path, body, token);
    }

    private static async Task<HttpResponseMessage> PostJsonWithTokenAsync(
        HttpClient client,
        string path,
        object body,
        string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = JsonContent.Create(body, options: JsonOptions),
        };
        request.Headers.Add("X-CSRF-TOKEN", token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    private static async Task<string> GetCsrfTokenAsync(HttpClient client)
    {
        var response = await client.GetAsync(
            "/api/v1/auth/csrf-token",
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AntiforgeryTokenDto>(
            TestContext.Current.CancellationToken);
        return Assert.IsType<string>(body?.Token);
    }

    private async Task<int> WaitForBlockedQuestSessionsAsync(int expected, TimeSpan timeout)
    {
        var deadline = DateTimeOffset.UtcNow + timeout;
        var observed = 0;
        await using var connection = new NpgsqlConnection(_factory.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);

        while (DateTimeOffset.UtcNow < deadline)
        {
            await using var command = new NpgsqlCommand("""
                SELECT count(*)
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND state = 'active'
                  AND wait_event_type = 'Lock'
                  AND query LIKE '%FOR UPDATE%'
                  AND query LIKE '%Quests%'
                """, connection);
            observed = Convert.ToInt32(
                await command.ExecuteScalarAsync(TestContext.Current.CancellationToken));
            if (observed >= expected)
                return observed;
            await Task.Delay(50, TestContext.Current.CancellationToken);
        }
        return observed;
    }

    private static void AssertCompletionDto(
        JsonElement json,
        string status,
        string? method)
    {
        AssertExactKeys(
            json,
            "completedAtUtc",
            "method",
            "status",
            "verifiedAtUtc");
        Assert.Equal(status, json.GetProperty("status").GetString());
        Assert.Equal(method, json.GetProperty("method").GetString());
        Assert.False(json.TryGetProperty("completionId", out _));
        Assert.False(json.TryGetProperty("questId", out _));
    }

    private static void AssertExactKeys(JsonElement json, params string[] expected)
    {
        var keys = json.EnumerateObject()
            .Select(item => item.Name)
            .Order(StringComparer.Ordinal)
            .ToArray();
        Assert.Equal(expected.Order(StringComparer.Ordinal).ToArray(), keys);
    }

    private static async Task AssertProblemAsync(
        HttpResponseMessage response,
        HttpStatusCode status,
        string detail)
    {
        Assert.Equal(status, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.Equal(detail, problem.GetProperty("detail").GetString());
    }

    private static async Task<ProblemSignature> SafeProblemSignatureAsync(
        HttpResponseMessage response)
    {
        var problem = await ReadJsonAsync(response);
        return new ProblemSignature(
            problem.GetProperty("status").GetInt32(),
            Assert.IsType<string>(problem.GetProperty("type").GetString()),
            Assert.IsType<string>(problem.GetProperty("title").GetString()),
            Assert.IsType<string>(problem.GetProperty("detail").GetString()));
    }

    private static async Task AssertInvalidCsrfAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.Equal(
            "https://kiwimpact.app/problems/invalid-csrf-token",
            problem.GetProperty("type").GetString());
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(body);
        return document.RootElement.Clone();
    }

    private static string CodeStatusPath(Guid questId) =>
        $"/api/v1/organizer/quests/{questId}/completion-codes";

    private static string RedeemPath(Guid questId) =>
        $"/api/v1/quests/{questId}/redeem";

    private static string RedeemPathWithUppercaseId(Guid questId) =>
        $"/api/v1/quests/{questId.ToString("D").ToUpperInvariant()}/redeem";

    private static string CompletionPath(Guid questId) =>
        $"/api/v1/quests/{questId}/completion";

    private sealed record AuthClient(HttpClient Client, Guid UserId);

    private sealed record ProblemSignature(
        int Status,
        string Type,
        string Title,
        string Detail);
}
