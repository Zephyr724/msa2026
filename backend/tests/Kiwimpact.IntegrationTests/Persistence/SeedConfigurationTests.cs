using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Progression;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace Kiwimpact.IntegrationTests.Persistence;

/// <summary>
/// Seed-configuration integration tests.
/// These tests verify the seed orchestration in Program.cs:
/// Development-only execution, flag combinations, prerequisite
/// validation, and transaction rollback.
/// </summary>
public sealed class SeedConfigurationTests
{
    // ── Helper: create an independent DbContext for database inspection ──

    private static KiwimpactDbContext CreateInspectionContext(string connectionString)
    {
        var options = new DbContextOptionsBuilder<KiwimpactDbContext>()
            .UseNpgsql(connectionString,
                npgsql => npgsql.MigrationsAssembly(typeof(KiwimpactDbContext).Assembly.FullName))
            .Options;
        return new KiwimpactDbContext(options);
    }

    // ── Case 1: Non-Development environment → demo seed does not execute ──

    [Fact]
    public async Task NonDevelopmentEnvironment_SeedDoesNotExecute()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            using (var preDb = CreateInspectionContext(container.GetConnectionString()))
            {
                await preDb.Database.MigrateAsync(TestContext.Current.CancellationToken);
            }

            var factory = new NonDevelopmentWebApplicationFactory(container.GetConnectionString());

            // Create a client — this triggers startup but seed is gated
            // behind IsDevelopment() and will not run.
            _ = factory.CreateClient();

            // Inspect database via an independent context (not factory.Services
            // which would re-trigger startup).
            using var db = CreateInspectionContext(container.GetConnectionString());
            var regionCount = await db.Regions.CountAsync(TestContext.Current.CancellationToken);
            var questCount = await db.Quests.CountAsync(TestContext.Current.CancellationToken);
            var roleCount = await db.Roles.CountAsync(TestContext.Current.CancellationToken);

            Assert.Equal(0, regionCount);
            Assert.Equal(0, questCount);
            Assert.Equal(3, roleCount);
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    [Fact]
    public async Task ProductionAssessmentData_SeedsBoundedPublicDataWithoutSignInIdentity()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            using (var preDb = CreateInspectionContext(container.GetConnectionString()))
            {
                await preDb.Database.MigrateAsync(TestContext.Current.CancellationToken);
            }

            using var factory = new NonDevelopmentWebApplicationFactory(
                container.GetConnectionString(),
                new Dictionary<string, string?>
                {
                    ["Seed:AssessmentData"] = "true",
                });
            _ = factory.CreateClient();

            using var db = CreateInspectionContext(container.GetConnectionString());
            Assert.Equal(27, await db.Regions.CountAsync(
                TestContext.Current.CancellationToken));

            var quests = await db.Quests
                .Where(quest => AssessmentDataSeed.QuestIds.Contains(quest.Id))
                .Include(quest => quest.Images)
                .ToListAsync(TestContext.Current.CancellationToken);
            Assert.Equal(10, quests.Count);
            Assert.All(quests, quest =>
            {
                Assert.Equal(QuestStatus.Published, quest.Status);
                Assert.Equal(QuestSourceType.AdminCuratedExternal, quest.SourceType);
                Assert.Equal(AssessmentDataSeed.CuratorUserId, quest.CreatedByUserId);
                Assert.StartsWith("https://", quest.ExternalSourceUrl);
                Assert.Equal(ExternalSourceStatus.Current, quest.ExternalSourceStatus);
                Assert.NotNull(quest.SourceCheckedAt);
                Assert.Single(quest.Images, image => image.IsCover);
            });
            Assert.Contains(quests, quest => quest.Latitude.HasValue);
            Assert.Contains(quests, quest =>
                quest.ExternalSourceUrl!.Contains(
                    "aucklandcouncil.govt.nz",
                    StringComparison.Ordinal));
            Assert.Contains(quests, quest =>
                quest.ExternalSourceUrl!.Contains(
                    "ecan.govt.nz",
                    StringComparison.Ordinal));
            Assert.Contains(quests, quest =>
                quest.ExternalSourceUrl!.Contains(
                    "ccc.govt.nz",
                    StringComparison.Ordinal));
            Assert.Contains(quests, quest =>
                quest.ExternalSourceUrl!.Contains(
                    "wellington.govt.nz",
                    StringComparison.Ordinal));
            Assert.Contains(quests, quest =>
                quest.ExternalSourceUrl!.Contains(
                    "tauranga.govt.nz",
                    StringComparison.Ordinal));
            Assert.Contains(quests, quest =>
                quest.ExternalSourceUrl!.Contains(
                    "doc.govt.nz",
                    StringComparison.Ordinal));

            var curator = await db.Set<ApplicationUser>()
                .SingleAsync(
                    user => user.Id == AssessmentDataSeed.CuratorUserId,
                    TestContext.Current.CancellationToken);
            Assert.Null(curator.PasswordHash);
            Assert.False(curator.EmailConfirmed);
            Assert.True(curator.LockoutEnabled);
            Assert.Empty(await db.Set<IdentityUserRole<Guid>>()
                .Where(item => item.UserId == curator.Id)
                .ToListAsync(TestContext.Current.CancellationToken));
            Assert.Empty(await db.Set<IdentityUserClaim<Guid>>()
                .Where(item => item.UserId == curator.Id)
                .ToListAsync(TestContext.Current.CancellationToken));
            Assert.Empty(await db.Set<IdentityUserLogin<Guid>>()
                .Where(item => item.UserId == curator.Id)
                .ToListAsync(TestContext.Current.CancellationToken));
            Assert.Empty(await db.Set<IdentityUserToken<Guid>>()
                .Where(item => item.UserId == curator.Id)
                .ToListAsync(TestContext.Current.CancellationToken));
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    [Fact]
    public async Task ProductionAssessmentData_IsIdempotentAndDoesNotOverwriteEdits()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            using (var preDb = CreateInspectionContext(container.GetConnectionString()))
            {
                await preDb.Database.MigrateAsync(TestContext.Current.CancellationToken);
            }

            var config = new Dictionary<string, string?>
            {
                ["Seed:AssessmentData"] = "true",
            };
            using (var firstFactory = new NonDevelopmentWebApplicationFactory(
                container.GetConnectionString(), config))
            {
                _ = firstFactory.CreateClient();
            }

            const string operatorEditedTitle = "Operator-reviewed assessment quest";
            using (var editDb = CreateInspectionContext(container.GetConnectionString()))
            {
                var quest = await editDb.Quests.SingleAsync(
                    item => item.Id == AssessmentDataSeed.QuestIds[0],
                    TestContext.Current.CancellationToken);
                quest.Title = operatorEditedTitle;
                await editDb.SaveChangesAsync(TestContext.Current.CancellationToken);
            }

            using (var secondFactory = new NonDevelopmentWebApplicationFactory(
                container.GetConnectionString(), config))
            {
                _ = secondFactory.CreateClient();
            }

            using var db = CreateInspectionContext(container.GetConnectionString());
            Assert.Equal(27, await db.Regions.CountAsync(
                TestContext.Current.CancellationToken));
            Assert.Equal(10, await db.Quests.CountAsync(
                quest => AssessmentDataSeed.QuestIds.Contains(quest.Id),
                TestContext.Current.CancellationToken));
            Assert.Equal(10, await db.QuestImages.CountAsync(
                image => AssessmentDataSeed.QuestIds.Contains(image.QuestId),
                TestContext.Current.CancellationToken));
            Assert.Equal(
                operatorEditedTitle,
                await db.Quests
                    .Where(quest => quest.Id == AssessmentDataSeed.QuestIds[0])
                    .Select(quest => quest.Title)
                    .SingleAsync(TestContext.Current.CancellationToken));
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    [Fact]
    public async Task ProductionAssessmentAccounts_SeedSixSecretDrivenRolesAndRichHistoryIdempotently()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            using (var preDb = CreateInspectionContext(container.GetConnectionString()))
            {
                await preDb.Database.MigrateAsync(TestContext.Current.CancellationToken);
            }

            var config = AssessmentAccountConfiguration();
            using (var firstFactory = new NonDevelopmentWebApplicationFactory(
                container.GetConnectionString(),
                config))
            {
                _ = firstFactory.CreateClient();
                using var scope = firstFactory.Services.CreateScope();
                var userManager = scope.ServiceProvider
                    .GetRequiredService<UserManager<ApplicationUser>>();
                foreach (var account in AssessmentTestAccounts)
                {
                    var user = await userManager.FindByEmailAsync(account.Email);
                    Assert.NotNull(user);
                    Assert.True(await userManager.CheckPasswordAsync(
                        user,
                        account.Password));
                }
            }

            AssessmentSeedCounts firstCounts;
            using (var db = CreateInspectionContext(container.GetConnectionString()))
            {
                firstCounts = await AssessmentCountsAsync(db);
                Assert.Equal(10, firstCounts.Quests);
                Assert.Equal(38, firstCounts.Completions);
                Assert.Equal(38, firstCounts.XpTransactions);
                Assert.Equal(38, firstCounts.EvidenceDetails);
                Assert.True(firstCounts.Achievements >= 20);

                var configuredEmails = AssessmentTestAccounts
                    .Select(account => account.Email.ToUpperInvariant())
                    .ToArray();
                var configuredUsers = await db.Set<ApplicationUser>()
                    .Where(user =>
                        user.NormalizedEmail != null &&
                        configuredEmails.Contains(user.NormalizedEmail))
                    .ToListAsync(TestContext.Current.CancellationToken);
                Assert.Equal(6, configuredUsers.Count);
                Assert.All(configuredUsers, user => Assert.True(user.EmailConfirmed));

                var userIds = configuredUsers.Select(user => user.Id).ToArray();
                Assert.All(
                    await db.UserProfiles
                        .Where(profile => userIds.Contains(profile.Id))
                        .ToListAsync(TestContext.Current.CancellationToken),
                    profile =>
                    {
                        Assert.Equal(
                            RegionSeed.HendersonMasseyId,
                            profile.HomeCommunityRegionId);
                        Assert.True(profile.TotalXp > 0);
                    });
                Assert.All(configuredUsers, user => Assert.Contains(
                    db.UserAchievements.Where(achievement => achievement.UserId == user.Id),
                    achievement =>
                        achievement.AchievementId ==
                        Kiwimpact.Core.Achievements.AchievementCatalog.FirstSteps.Id));

                var roleRows = await db.Set<IdentityUserRole<Guid>>()
                    .Where(item => userIds.Contains(item.UserId))
                    .Join(
                        db.Roles,
                        item => item.RoleId,
                        role => role.Id,
                        (item, role) => new { item.UserId, role.Name })
                    .ToListAsync(TestContext.Current.CancellationToken);
                foreach (var account in AssessmentTestAccounts)
                {
                    var userId = configuredUsers.Single(user =>
                        user.NormalizedEmail == account.Email.ToUpperInvariant()).Id;
                    var expected = account.Role == AppRoles.Member
                        ? new[] { AppRoles.Member }
                        : new[] { AppRoles.Member, account.Role };
                    Assert.Equal(
                        expected.Order(),
                        roleRows
                            .Where(item => item.UserId == userId)
                            .Select(item => item.Name!)
                            .Order());
                }

                var supporters = await db.Set<ApplicationUser>()
                    .Where(user => user.UserName!.StartsWith("assessment-supporter-"))
                    .ToListAsync(TestContext.Current.CancellationToken);
                Assert.Equal(4, supporters.Count);
                Assert.All(supporters, supporter =>
                {
                    Assert.Null(supporter.PasswordHash);
                    Assert.False(supporter.EmailConfirmed);
                });
                var supporterIds = supporters.Select(user => user.Id).ToArray();
                Assert.Empty(await db.Set<IdentityUserRole<Guid>>()
                    .Where(item => supporterIds.Contains(item.UserId))
                    .ToListAsync(TestContext.Current.CancellationToken));
            }

            using (var secondFactory = new NonDevelopmentWebApplicationFactory(
                container.GetConnectionString(),
                config))
            {
                _ = secondFactory.CreateClient();
            }

            using var finalDb = CreateInspectionContext(container.GetConnectionString());
            Assert.Equal(firstCounts, await AssessmentCountsAsync(finalDb));
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    [Fact]
    public async Task ProductionAssessmentAccounts_ExistingEmailCollisionCreatesNoReviewerAccounts()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            var existingUserId = Guid.NewGuid();
            using (var preDb = CreateInspectionContext(container.GetConnectionString()))
            {
                await preDb.Database.MigrateAsync(TestContext.Current.CancellationToken);
                // Use slot two so slot one is staged first; the outer account
                // transaction must roll it back when this collision is found.
                var email = AssessmentTestAccounts[1].Email;
                preDb.Set<ApplicationUser>().Add(new ApplicationUser
                {
                    Id = existingUserId,
                    UserName = email,
                    NormalizedUserName = email.ToUpperInvariant(),
                    Email = email,
                    NormalizedEmail = email.ToUpperInvariant(),
                    EmailConfirmed = true,
                    PasswordHash = "pre-existing-password-hash",
                    LockoutEnabled = true,
                });
                await preDb.SaveChangesAsync(TestContext.Current.CancellationToken);
            }

            using var factory = new NonDevelopmentWebApplicationFactory(
                container.GetConnectionString(),
                AssessmentAccountConfiguration());
            var exception = Assert.Throws<InvalidOperationException>(
                () => _ = factory.CreateClient());
            Assert.Contains("already owned", exception.Message);

            using var db = CreateInspectionContext(container.GetConnectionString());
            var configuredEmails = AssessmentTestAccounts
                .Select(account => account.Email.ToUpperInvariant())
                .ToArray();
            var configuredUsers = await db.Set<ApplicationUser>()
                .Where(user =>
                    user.NormalizedEmail != null &&
                    configuredEmails.Contains(user.NormalizedEmail))
                .ToListAsync(TestContext.Current.CancellationToken);
            Assert.Single(configuredUsers);
            Assert.Equal(existingUserId, configuredUsers[0].Id);
            Assert.Equal(
                "pre-existing-password-hash",
                configuredUsers[0].PasswordHash);
            Assert.Equal(0, await db.XpTransactions.CountAsync(
                TestContext.Current.CancellationToken));
            Assert.DoesNotContain(
                await db.Set<ApplicationUser>()
                    .Where(user => user.Id != existingUserId)
                    .Select(user => user.UserName)
                    .ToListAsync(TestContext.Current.CancellationToken),
                userName => userName is not null &&
                    userName.StartsWith("assessment-supporter-"));
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    [Fact]
    public async Task ProductionAssessmentData_ReservedIdentityCollisionRollsBackAllWrites()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            var conflictingUserId = Guid.NewGuid();
            using (var preDb = CreateInspectionContext(container.GetConnectionString()))
            {
                await preDb.Database.MigrateAsync(TestContext.Current.CancellationToken);
                preDb.Set<ApplicationUser>().Add(new ApplicationUser
                {
                    Id = conflictingUserId,
                    UserName = "existing-assessment-email-owner",
                    NormalizedUserName = "EXISTING-ASSESSMENT-EMAIL-OWNER",
                    Email = "assessment-showcase-curator@kiwimpact.invalid",
                    NormalizedEmail = "ASSESSMENT-SHOWCASE-CURATOR@KIWIMPACT.INVALID",
                    EmailConfirmed = false,
                    PasswordHash = null,
                    LockoutEnabled = true,
                });
                await preDb.SaveChangesAsync(TestContext.Current.CancellationToken);
            }

            using var factory = new NonDevelopmentWebApplicationFactory(
                container.GetConnectionString(),
                new Dictionary<string, string?>
                {
                    ["Seed:AssessmentData"] = "true",
                });
            var exception = Assert.Throws<InvalidOperationException>(
                () => _ = factory.CreateClient());
            Assert.Contains("reserved by another user", exception.Message);

            using var db = CreateInspectionContext(container.GetConnectionString());
            Assert.Equal(0, await db.Regions.CountAsync(
                TestContext.Current.CancellationToken));
            Assert.Equal(0, await db.Quests.CountAsync(
                TestContext.Current.CancellationToken));
            Assert.Null(await db.Set<ApplicationUser>().SingleOrDefaultAsync(
                user => user.Id == AssessmentDataSeed.CuratorUserId,
                TestContext.Current.CancellationToken));
            Assert.NotNull(await db.Set<ApplicationUser>().SingleOrDefaultAsync(
                user => user.Id == conflictingUserId,
                TestContext.Current.CancellationToken));
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    // ── Case 2: SeedDemoQuests=true without Regions → fail before writes ──

    [Fact]
    public async Task DemoQuestsWithoutRegions_FailsBeforeWrites()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            var config = new Dictionary<string, string?>
            {
                ["Seed:Region"] = "false",
                ["Seed:DemoQuests"] = "true",
            };
            var factory = new SeedConfigWebApplicationFactory(
                container.GetConnectionString(), config);

            // The seed prerequisite check must fail because Regions table is empty.
            var ex = Assert.Throws<InvalidOperationException>(
                () => _ = factory.CreateClient());
            Assert.Contains("Missing", ex.Message);
            Assert.Contains("Region", ex.Message);

            // Use independent DbContext — factory.Services would re-trigger startup.
            using var db = CreateInspectionContext(container.GetConnectionString());

            var regionCount = await db.Regions.CountAsync(TestContext.Current.CancellationToken);
            Assert.Equal(0, regionCount);

            var questCount = await db.Quests.CountAsync(TestContext.Current.CancellationToken);
            Assert.Equal(0, questCount);
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    // ── Case 3: Development + both flags → success ───────────────────

    [Fact]
    public async Task DevelopmentWithBothFlags_Succeeds()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            var config = new Dictionary<string, string?>
            {
                ["Seed:Region"] = "true",
                ["Seed:DemoQuests"] = "true",
            };
            var factory = new SeedConfigWebApplicationFactory(
                container.GetConnectionString(), config);
            _ = factory.CreateClient();

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

            var regionCount = await db.Regions.CountAsync(TestContext.Current.CancellationToken);
            var questCount = await db.Quests.CountAsync(TestContext.Current.CancellationToken);

            Assert.Equal(23, regionCount);
            Assert.Equal(18, questCount);
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    // ── Case 4: SeedRegion=true only → demo Quest seed does not run ──

    [Fact]
    public async Task RegionsOnlyFlag_QuestsNotSeeded()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            var config = new Dictionary<string, string?>
            {
                ["Seed:Region"] = "true",
                ["Seed:DemoQuests"] = "false",
            };
            var factory = new SeedConfigWebApplicationFactory(
                container.GetConnectionString(), config);
            _ = factory.CreateClient();

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

            Assert.Equal(23, await db.Regions.CountAsync(TestContext.Current.CancellationToken));
            Assert.Equal(0, await db.Quests.CountAsync(TestContext.Current.CancellationToken));
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    // ── Case 5: Prerequisites missing → no partial state ─────────────

    [Fact]
    public async Task MissingPrerequisite_NoPartialRegionState()
    {
        // Seed only New Zealand and Auckland, then request DemoQuests.
        // The prerequisite check should detect that LocalArea Region IDs
        // are missing and fail before any Quest write.
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            // First, insert only NZ + Auckland via raw SQL into an independent DbContext.
            await using (var preDb = CreateInspectionContext(container.GetConnectionString()))
            {
                await preDb.Database.MigrateAsync(TestContext.Current.CancellationToken);

                var now = new DateTimeOffset(2026, 7, 22, 0, 0, 0, TimeSpan.Zero);
                await preDb.Database.ExecuteSqlRawAsync(
                    @"INSERT INTO ""Regions"" (""Id"", ""Name"", ""Type"", ""ParentRegionId"", ""IsActive"", ""CreatedAt"", ""UpdatedAt"")
                    VALUES ({0}, {1}, {2}, NULL, TRUE, {3}, {3}),
                           ({4}, {5}, {6}, {0}, TRUE, {3}, {3})",
                    new object[] { RegionSeed.NewZealandId, "New Zealand", "Country", now,
                     RegionSeed.AucklandId, "Auckland", "AdministrativeArea" },
                    TestContext.Current.CancellationToken);
            }

            // Now start a factory that tries to seed DemoQuests only.
            var config = new Dictionary<string, string?>
            {
                ["Seed:Region"] = "false",
                ["Seed:DemoQuests"] = "true",
            };
            var factory = new SeedConfigWebApplicationFactory(
                container.GetConnectionString(), config);

            // The seed prerequisite check must detect missing LocalArea IDs
            // and throw InvalidOperationException before writing Quests.
            var ex = Assert.Throws<InvalidOperationException>(
                () => _ = factory.CreateClient());
            Assert.Contains("Missing", ex.Message);
            Assert.Contains("Region", ex.Message);

            // Use independent DbContext for post-failure inspection.
            using var db = CreateInspectionContext(container.GetConnectionString());

            // Verify no Quests were written (no partial state).
            var questCount = await db.Quests.CountAsync(TestContext.Current.CancellationToken);
            Assert.Equal(0, questCount);

            // Regions still only NZ + Auckland (no partial LocalArea writes).
            var regionCount = await db.Regions.CountAsync(TestContext.Current.CancellationToken);
            Assert.Equal(2, regionCount);
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    // ── Case 6: Rollback after partial DemoQuestSeed writes ──────────

    [Fact]
    public async Task DemoQuestSeed_RollbackAfterPartialWrites()
    {
        // Strategy: pre-seed all Regions, then pre-create a conflicting
        // ApplicationUser with UserName = "dev-seed-curator" (but a different Id).
        // When DemoQuestSeed.SeedAsync runs inside its transaction, the curator
        // INSERT violates the unique UserNameIndex, causing the transaction to
        // fail. The test then verifies that the transaction rolled back all
        // partial changes (no curator with the seed's Id, no Quests, no images).

        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            // Phase 1: seed all Regions via the factory (Region seed only).
            var regionConfig = new Dictionary<string, string?>
            {
                ["Seed:Region"] = "true",
                ["Seed:DemoQuests"] = "false",
            };
            var regionFactory = new SeedConfigWebApplicationFactory(
                container.GetConnectionString(), regionConfig);
            _ = regionFactory.CreateClient();

            // Verify 23 Regions exist.
            using (var checkScope = regionFactory.Services.CreateScope())
            {
                var checkDb = checkScope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
                Assert.Equal(23, await checkDb.Regions.CountAsync(TestContext.Current.CancellationToken));
            }

            // Phase 2: pre-create a conflicting user via an independent context.
            using (var preDb = CreateInspectionContext(container.GetConnectionString()))
            {
                var conflictingUser = new ApplicationUser
                {
                    Id = new Guid("00000000-0000-0000-0000-000000000001"),
                    UserName = "dev-seed-curator",
                    NormalizedUserName = "DEV-SEED-CURATOR",
                    Email = "conflict@kiwimpact.invalid",
                    NormalizedEmail = "CONFLICT@KIWIMPACT.INVALID",
                    EmailConfirmed = false,
                    LockoutEnabled = true,
                    AccessFailedCount = 0
                };
                preDb.Set<ApplicationUser>().Add(conflictingUser);
                await preDb.SaveChangesAsync(TestContext.Current.CancellationToken);
            }

            // Phase 3: attempt to seed DemoQuests. The curator INSERT
            // inside the transaction violates the unique UserNameIndex.
            var questConfig = new Dictionary<string, string?>
            {
                ["Seed:Region"] = "false",
                ["Seed:DemoQuests"] = "true",
            };
            var questFactory = new SeedConfigWebApplicationFactory(
                container.GetConnectionString(), questConfig);

            // The seed should fail. Program.cs catches, rolls back, and rethrows.
            Assert.ThrowsAny<Exception>(
                () => _ = questFactory.CreateClient());

            // Phase 4: verify no partial state via independent context.
            using var finalDb = CreateInspectionContext(container.GetConnectionString());

            // Curator with the seed's expected Id must NOT exist
            // (the transaction rolled back the INSERT).
            var curator = await finalDb.Set<ApplicationUser>()
                .FirstOrDefaultAsync(u => u.Id == DemoQuestSeed.CuratorUserId,
                    TestContext.Current.CancellationToken);
            Assert.Null(curator);

            // The pre-existing conflicting user must still exist (unaffected).
            var conflicting = await finalDb.Set<ApplicationUser>()
                .FirstOrDefaultAsync(u => u.Id == new Guid("00000000-0000-0000-0000-000000000001"),
                    TestContext.Current.CancellationToken);
            Assert.NotNull(conflicting);

            // No Quests or QuestImages were written.
            var questCount = await finalDb.Quests.CountAsync(TestContext.Current.CancellationToken);
            Assert.Equal(0, questCount);

            var imageCount = await finalDb.QuestImages.CountAsync(
                TestContext.Current.CancellationToken);
            Assert.Equal(0, imageCount);

            // Regions still intact (23 from Phase 1).
            var regionCount = await finalDb.Regions.CountAsync(
                TestContext.Current.CancellationToken);
            Assert.Equal(23, regionCount);
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    [Fact]
    public async Task DemoActivitySeed_IsIdempotentAndRebasesObservablePeriods()
    {
        await using var container = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .Build();
        await container.StartAsync(TestContext.Current.CancellationToken);

        try
        {
            var config = new Dictionary<string, string?>
            {
                ["Seed:Roles"] = "true",
                ["Seed:Region"] = "true",
                ["Seed:DemoQuests"] = "true",
                ["Seed:DemoAccounts"] = "true",
                ["DemoAccounts:Password"] = "Slice19!Demo2026",
                ["CommunityChallenges:FinalizerEnabled"] = "false",
            };
            using var factory = new SeedConfigWebApplicationFactory(
                container.GetConnectionString(),
                config);
            _ = factory.CreateClient();

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
            var march = new DateTimeOffset(
                2027, 3, 10, 8, 0, 0, TimeSpan.Zero);

            await DemoActivitySeed.SeedAsync(
                db,
                DemoAccountSeedOptions.StandardPersonas,
                march,
                TestContext.Current.CancellationToken);

            var countsAfterFirst = await DemoActivityCountsAsync(db);
            await DemoActivitySeed.SeedAsync(
                db,
                DemoAccountSeedOptions.StandardPersonas,
                march,
                TestContext.Current.CancellationToken);
            Assert.Equal(countsAfterFirst, await DemoActivityCountsAsync(db));

            var primaryId = await db.Set<ApplicationUser>()
                .Where(user => user.NormalizedEmail == "ADMIN1@KIWIMPACT.TEST")
                .Select(user => user.Id)
                .SingleAsync(TestContext.Current.CancellationToken);
            var primaryAwards = await db.XpTransactions
                .Where(transaction => transaction.UserId == primaryId)
                .Select(transaction => transaction.CreatedAt)
                .ToListAsync(TestContext.Current.CancellationToken);
            var marchStreak = WeeklyStreakCalculator.Calculate(
                primaryAwards,
                march);
            Assert.Equal(5, marchStreak.CurrentWeeks);
            Assert.True(marchStreak.HasVerifiedImpactThisWeek);
            Assert.Contains(
                await db.UserAchievements
                    .Where(achievement => achievement.UserId == primaryId)
                    .Select(achievement => achievement.AchievementId)
                    .ToListAsync(TestContext.Current.CancellationToken),
                achievementId =>
                    achievementId ==
                    Kiwimpact.Core.Achievements.AchievementCatalog.FirstSteps.Id);

            await AssertCurrentDemoChallengesAsync(db, march);
            await AssertSupportingNeighboursArePasswordlessAsync(db);

            var april = new DateTimeOffset(
                2027, 4, 15, 8, 0, 0, TimeSpan.Zero);
            await DemoActivitySeed.SeedAsync(
                db,
                DemoAccountSeedOptions.StandardPersonas,
                april,
                TestContext.Current.CancellationToken);
            var countsAfterAdvance = await DemoActivityCountsAsync(db);
            Assert.Equal(countsAfterFirst.Users, countsAfterAdvance.Users);
            Assert.Equal(
                countsAfterFirst.Completions,
                countsAfterAdvance.Completions);
            Assert.Equal(
                countsAfterFirst.XpTransactions,
                countsAfterAdvance.XpTransactions);
            Assert.Equal(
                countsAfterFirst.Challenges + 5,
                countsAfterAdvance.Challenges);
            await AssertCurrentDemoChallengesAsync(db, april);

            var aprilAwards = await db.XpTransactions
                .Where(transaction => transaction.UserId == primaryId)
                .Select(transaction => transaction.CreatedAt)
                .ToListAsync(TestContext.Current.CancellationToken);
            var aprilStreak = WeeklyStreakCalculator.Calculate(
                aprilAwards,
                april);
            Assert.Equal(5, aprilStreak.CurrentWeeks);
            Assert.True(aprilStreak.HasVerifiedImpactThisWeek);

            await DemoActivitySeed.SeedAsync(
                db,
                DemoAccountSeedOptions.StandardPersonas,
                april,
                TestContext.Current.CancellationToken);
            Assert.Equal(countsAfterAdvance, await DemoActivityCountsAsync(db));
        }
        finally
        {
            await container.DisposeAsync();
        }
    }

    private static async Task<DemoActivityCounts> DemoActivityCountsAsync(
        KiwimpactDbContext db) =>
        new(
            await db.Set<ApplicationUser>().CountAsync(
                TestContext.Current.CancellationToken),
            await db.QuestCompletions.CountAsync(
                TestContext.Current.CancellationToken),
            await db.XpTransactions.CountAsync(
                TestContext.Current.CancellationToken),
            await db.CommunityChallenges.CountAsync(
                TestContext.Current.CancellationToken),
            await db.UserAchievements.CountAsync(
                TestContext.Current.CancellationToken));

    private static async Task AssertCurrentDemoChallengesAsync(
        KiwimpactDbContext db,
        DateTimeOffset now)
    {
        var active = await db.CommunityChallenges
            .Where(challenge => challenge.Status == ChallengeStatus.Active)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(5, active.Count);
        Assert.All(active, challenge =>
        {
            Assert.True(challenge.PeriodStart <= now);
            Assert.True(challenge.PeriodEnd > now);
            Assert.Equal(50, challenge.TargetValue);
            Assert.Null(challenge.RewardAchievementId);
        });
    }

    private static async Task AssertSupportingNeighboursArePasswordlessAsync(
        KiwimpactDbContext db)
    {
        var neighbours = await db.Set<ApplicationUser>()
            .Where(user =>
                user.NormalizedUserName != null &&
                user.NormalizedUserName.StartsWith("DEMO-NEIGHBOUR-"))
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(50, neighbours.Count);
        Assert.All(neighbours, neighbour =>
        {
            Assert.Null(neighbour.PasswordHash);
            Assert.False(neighbour.EmailConfirmed);
            Assert.True(neighbour.LockoutEnabled);
        });

        var neighbourIds = neighbours.Select(neighbour => neighbour.Id).ToArray();
        Assert.Empty(await db.Set<IdentityUserRole<Guid>>()
            .Where(item => neighbourIds.Contains(item.UserId))
            .ToListAsync(TestContext.Current.CancellationToken));
        Assert.Empty(await db.Set<IdentityUserClaim<Guid>>()
            .Where(item => neighbourIds.Contains(item.UserId))
            .ToListAsync(TestContext.Current.CancellationToken));
        Assert.Empty(await db.Set<IdentityUserLogin<Guid>>()
            .Where(item => neighbourIds.Contains(item.UserId))
            .ToListAsync(TestContext.Current.CancellationToken));
        Assert.Empty(await db.Set<IdentityUserToken<Guid>>()
            .Where(item => neighbourIds.Contains(item.UserId))
            .ToListAsync(TestContext.Current.CancellationToken));
    }

    private static readonly IReadOnlyList<AssessmentAccountSeedPersona>
        AssessmentTestAccounts =
    [
        new(
            "assessment-member-1@example.test",
            "Assessment Member One",
            AppRoles.Member,
            "Assessment01!AaZ"),
        new(
            "assessment-member-2@example.test",
            "Assessment Member Two",
            AppRoles.Member,
            "Assessment02!BbY"),
        new(
            "assessment-organizer-1@example.test",
            "Assessment Organizer One",
            AppRoles.Organizer,
            "Assessment03!CcX"),
        new(
            "assessment-organizer-2@example.test",
            "Assessment Organizer Two",
            AppRoles.Organizer,
            "Assessment04!DdW"),
        new(
            "assessment-admin-1@example.test",
            "Assessment Admin One",
            AppRoles.Admin,
            "Assessment05!EeV"),
        new(
            "assessment-admin-2@example.test",
            "Assessment Admin Two",
            AppRoles.Admin,
            "Assessment06!FfU"),
    ];

    private static Dictionary<string, string?> AssessmentAccountConfiguration()
    {
        var config = new Dictionary<string, string?>
        {
            ["Seed:AssessmentData"] = "true",
            ["Seed:AssessmentAccounts"] = "true",
            ["CommunityChallenges:FinalizerEnabled"] = "false",
        };
        for (var index = 0; index < AssessmentTestAccounts.Count; index++)
        {
            var account = AssessmentTestAccounts[index];
            config[$"AssessmentAccounts:Accounts:{index}:Email"] = account.Email;
            config[$"AssessmentAccounts:Accounts:{index}:DisplayName"] =
                account.DisplayName;
            config[$"AssessmentAccounts:Accounts:{index}:Role"] = account.Role;
            config[$"AssessmentAccounts:Accounts:{index}:Password"] =
                account.Password;
        }
        return config;
    }

    private static async Task<AssessmentSeedCounts> AssessmentCountsAsync(
        KiwimpactDbContext db) =>
        new(
            await db.Quests.CountAsync(
                quest => AssessmentDataSeed.QuestIds.Contains(quest.Id),
                TestContext.Current.CancellationToken),
            await db.QuestCompletions.CountAsync(
                TestContext.Current.CancellationToken),
            await db.XpTransactions.CountAsync(
                TestContext.Current.CancellationToken),
            await db.EvidenceClaimDetails.CountAsync(
                TestContext.Current.CancellationToken),
            await db.UserAchievements.CountAsync(
                TestContext.Current.CancellationToken));

    private sealed record AssessmentSeedCounts(
        int Quests,
        int Completions,
        int XpTransactions,
        int EvidenceDetails,
        int Achievements);

    private sealed record DemoActivityCounts(
        int Users,
        int Completions,
        int XpTransactions,
        int Challenges,
        int Achievements);
}

// ── Test Helpers ───────────────────────────────────────────────────────

/// <summary>
/// WebApplicationFactory that forces a non-Development environment.
/// Does not implement IAsyncLifetime to avoid hiding base DisposeAsync.
/// </summary>
internal sealed class NonDevelopmentWebApplicationFactory
    : WebApplicationFactory<Program>
{
    private readonly string _connectionString;
    private readonly Dictionary<string, string?> _config;

    public NonDevelopmentWebApplicationFactory(
        string connectionString,
        Dictionary<string, string?>? config = null)
    {
        _connectionString = connectionString;
        _config = config ?? [];
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production"); // NOT Development

        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            var values = new Dictionary<string, string?>
            {
                ["CompletionCodes:HmacKey"] = Convert.ToBase64String(
                    Enumerable.Range(1, 32).Select(value => (byte)value).ToArray()),
            };
            foreach (var item in _config)
                values[item.Key] = item.Value;
            configuration.AddInMemoryCollection(values);
        });

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<KiwimpactDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<KiwimpactDbContext>(options =>
                options.UseNpgsql(_connectionString,
                    npgsql => npgsql.MigrationsAssembly(typeof(KiwimpactDbContext).Assembly.FullName)));
        });
    }
}

/// <summary>
/// WebApplicationFactory with custom configuration values for seed flags.
/// Always uses Development environment so seed orchestration runs.
/// Overrides DisposeAsync with 'new' to avoid hiding warnings — the class
/// does not implement IAsyncLifetime.
/// </summary>
internal sealed class SeedConfigWebApplicationFactory
    : WebApplicationFactory<Program>
{
    private readonly string _connectionString;
    private readonly Dictionary<string, string?> _config;

    public SeedConfigWebApplicationFactory(
        string connectionString,
        Dictionary<string, string?> config)
    {
        _connectionString = connectionString;
        _config = config;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(_config);
            var defaults = new Dictionary<string, string?>
            {
                ["CompletionCodes:HmacKey"] = Convert.ToBase64String(
                    Enumerable.Range(1, 32).Select(value => (byte)value).ToArray()),
            };
            if (!_config.ContainsKey("Seed:DemoAccounts"))
            {
                // Local developer persona settings must not alter the exact
                // flag combination exercised by isolated seed tests.
                defaults["Seed:DemoAccounts"] = "false";
            }
            configBuilder.AddInMemoryCollection(defaults);
        });

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<KiwimpactDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<KiwimpactDbContext>(options =>
                options.UseNpgsql(_connectionString,
                    npgsql => npgsql.MigrationsAssembly(typeof(KiwimpactDbContext).Assembly.FullName)));
        });
    }
}
