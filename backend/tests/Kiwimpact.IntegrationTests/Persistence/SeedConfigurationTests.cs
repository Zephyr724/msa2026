using Kiwimpact.Core.Enums;
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

    // ── Case 1: Non-Development environment → seed does not execute ──

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

    private sealed record DemoActivityCounts(
        int Users,
        int Completions,
        int XpTransactions,
        int Challenges);
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

    public NonDevelopmentWebApplicationFactory(string connectionString)
    {
        _connectionString = connectionString;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production"); // NOT Development

        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["CompletionCodes:HmacKey"] = Convert.ToBase64String(
                    Enumerable.Range(1, 32).Select(value => (byte)value).ToArray()),
            }));

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
