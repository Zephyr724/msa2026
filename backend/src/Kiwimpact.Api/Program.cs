using System.Threading.RateLimiting;
using Kiwimpact.Api.Reconciliation;
using Kiwimpact.Api.Security;
using Kiwimpact.Core.Services;
using Kiwimpact.Core.Security;
using Kiwimpact.Infrastructure;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Reconciliation;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ── Service Registration ────────────────────────────────────────────
builder.Services.AddScoped<ApiAntiforgeryFilter>();
builder.Services.AddControllers(options =>
    options.Filters.AddService<ApiAntiforgeryFilter>());

// Problem Details for consistent error responses
builder.Services.AddProblemDetails();

// OpenAPI generation
builder.Services.AddOpenApi();

// CORS — explicit origins from configuration
var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Infrastructure (EF Core + PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is not configured.");

builder.Services.AddInfrastructure(connectionString);

builder.Services.AddOptions<XpReconciliationOptions>()
    .Bind(builder.Configuration.GetSection(XpReconciliationOptions.SectionName))
    .Validate(
        options => options.BatchSize > 0,
        "XpReconciliation:BatchSize must be positive.")
    .Validate(
        options => options.InitialDelay >= TimeSpan.Zero,
        "XpReconciliation:InitialDelay must not be negative.")
    .Validate(
        options => options.IdleInterval > TimeSpan.Zero,
        "XpReconciliation:IdleInterval must be positive.")
    .Validate(
        options => options.MaxConsecutiveRowFailures > 0,
        "XpReconciliation:MaxConsecutiveRowFailures must be positive.")
    .ValidateOnStart();
builder.Services.AddHostedService<XpReconciliationHostedService>();

builder.Services.AddOptions<AchievementBackfillOptions>()
    .Bind(builder.Configuration.GetSection(AchievementBackfillOptions.SectionName))
    .Validate(
        options => options.BatchSize > 0,
        "AchievementBackfill:BatchSize must be positive.")
    .Validate(
        options => options.InitialDelay >= TimeSpan.Zero,
        "AchievementBackfill:InitialDelay must not be negative.")
    .Validate(
        options => options.IdleInterval > TimeSpan.Zero,
        "AchievementBackfill:IdleInterval must be positive.")
    .Validate(
        options => options.MaxConsecutiveRowFailures > 0,
        "AchievementBackfill:MaxConsecutiveRowFailures must be positive.")
    .ValidateOnStart();
builder.Services.AddHostedService<AchievementBackfillHostedService>();
builder.Services.AddHostedService<EvidencePurgeHostedService>();

builder.Services.AddOptions<CompletionCodeOptions>()
    .Bind(builder.Configuration.GetSection("CompletionCodes"))
    .Validate(
        CompletionCodeOptions.HasValidHmacKey,
        "CompletionCodes:HmacKey must be valid Base64 containing at least 32 bytes.")
    .ValidateOnStart();
builder.Services.AddSingleton(serviceProvider =>
{
    var options = serviceProvider.GetRequiredService<IOptions<CompletionCodeOptions>>().Value;
    return new CompletionCodeProtector(
        CompletionCodeProtector.DecodeConfiguredKey(options.HmacKey));
});

// Identity authentication, cookies, lockout, and API-safe challenge responses.
builder.Services
    .AddIdentity<ApplicationUser, ApplicationRole>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.SignIn.RequireConfirmedEmail =
            builder.Configuration.GetValue("Auth:RequireConfirmedEmail", true);
        options.Password.RequiredLength = 12;
        options.Password.RequiredUniqueChars = 4;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddEntityFrameworkStores<KiwimpactDbContext>()
    .AddTokenProvider<PasswordResetTokenProvider>("KiwimpactReset")
    .AddDefaultTokenProviders();

builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
    options.TokenLifespan = TimeSpan.FromHours(24));
builder.Services.Configure<PasswordResetTokenProviderOptions>(options =>
    options.TokenLifespan = TimeSpan.FromMinutes(45));
builder.Services.Configure<IdentityOptions>(options =>
    options.Tokens.PasswordResetTokenProvider = "KiwimpactReset");
builder.Services.AddScoped<IAccountEmailSender, SmtpAccountEmailSender>();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "Kiwimpact.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
    options.Events = new CookieAuthenticationEvents
    {
        OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        },
        OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        },
    };
});

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "Kiwimpact.Csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
});

var registerLimit = builder.Configuration.GetValue("Auth:RateLimits:RegisterPermitLimit", 5);
var loginLimit = builder.Configuration.GetValue("Auth:RateLimits:LoginPermitLimit", 10);
var rateLimitWindowMinutes = builder.Configuration.GetValue("Auth:RateLimits:WindowMinutes", 15);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(AuthRateLimitPolicies.Register, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = registerLimit,
                Window = TimeSpan.FromMinutes(rateLimitWindowMinutes),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));
    options.AddPolicy(AuthRateLimitPolicies.Login, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = loginLimit,
                Window = TimeSpan.FromMinutes(rateLimitWindowMinutes),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));
    options.AddPolicy(CompletionCodeRateLimitPolicies.Redeem, context =>
    {
        var actorIdText = context.User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var questIdText = context.Request.RouteValues["questId"]?.ToString();
        if (context.User.Identity?.IsAuthenticated != true ||
            !Guid.TryParse(actorIdText, out var actorId) ||
            !Guid.TryParse(questIdText, out var questId))
        {
            return RateLimitPartition.GetNoLimiter("unauthenticated");
        }

        return RateLimitPartition.GetFixedWindowLimiter(
            $"{actorId:D}:{questId:D}",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
                AutoReplenishment = true,
            });
    });
    options.OnRejected = (context, _) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                Math.Ceiling(retryAfter.TotalSeconds).ToString(
                    System.Globalization.CultureInfo.InvariantCulture);
        }
        return ValueTask.CompletedTask;
    };
});

// Core application services
builder.Services.AddScoped<IRegionReadService, RegionReadService>();
builder.Services.AddScoped<IQuestDiscoveryService, QuestDiscoveryService>();
builder.Services.AddScoped<IQuestManagementService, QuestManagementService>();
builder.Services.AddScoped<IQuestParticipationService, QuestParticipationService>();
builder.Services.AddScoped<IQuestCompletionService, QuestCompletionService>();
builder.Services.AddScoped<IProgressionService, ProgressionService>();
builder.Services.AddScoped<IPassportService, PassportService>();
builder.Services.AddScoped<IAchievementService, AchievementService>();
builder.Services.AddScoped<ILeaderboardService, LeaderboardService>();

var app = builder.Build();

// ── Middleware Pipeline ──────────────────────────────────────────────
app.UseExceptionHandler();
app.UseRouting();
app.UseCors();

// HTTPS redirection enabled only in non-Development environments
// so the local HTTP Vite proxy on port 5000 remains usable during development.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

// ── Seed Orchestration ──────────────────────────────────────────────
// Stable roles are safely idempotent in every environment. Automatic
// migration and all application/demo data remain Development-only.
var seedRoles = builder.Configuration.GetValue<bool>("Seed:Roles");
var seedRegion = builder.Configuration.GetValue<bool>("Seed:Region");
var seedDemoQuests = builder.Configuration.GetValue<bool>("Seed:DemoQuests");
var seedDemoAccounts = builder.Configuration.GetValue<bool>("Seed:DemoAccounts");

if (seedRoles || (app.Environment.IsDevelopment() &&
    (seedRegion || seedDemoQuests || seedDemoAccounts)))
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<KiwimpactDbContext>();

    if (app.Environment.IsDevelopment())
    {
        // Development-only automatic migration keeps local/test seeding coherent.
        db.Database.Migrate();
    }

    if (seedRoles)
    {
        await IdentitySeed.SeedRolesAsync(
            services.GetRequiredService<RoleManager<ApplicationRole>>());
    }

    if (app.Environment.IsDevelopment() && seedRegion)
    {
        await RegionSeed.SeedAsync(db);
    }

    if (app.Environment.IsDevelopment() && seedDemoQuests)
    {
        // Validate all Region prerequisites before writing anything.
        var requiredRegionIds = new[]
        {
            RegionSeed.NewZealandId,
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

        var existingIds = await db.Regions
            .Where(r => requiredRegionIds.Contains(r.Id))
            .Select(r => r.Id)
            .ToListAsync();

        var missing = requiredRegionIds.Except(existingIds).ToList();
        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"Demo Quest seeding requires {requiredRegionIds.Length} Regions to exist. " +
                $"Missing {missing.Count} Region(s): {string.Join(", ", missing)}. " +
                "Enable Seed:Region=true and re-run before enabling Seed:DemoQuests=true, " +
                "or apply the Region seed first.");
        }

        await using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            await DemoQuestSeed.SeedAsync(db);
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    if (app.Environment.IsDevelopment())
    {
        await IdentitySeed.SeedDemoAccountsAsync(
            db,
            services.GetRequiredService<UserManager<ApplicationUser>>(),
            new DemoAccountSeedOptions(
                seedDemoAccounts,
                builder.Configuration["DemoAccounts:Organizer:Email"],
                builder.Configuration["DemoAccounts:Organizer:Password"],
                builder.Configuration["DemoAccounts:Admin:Email"],
                builder.Configuration["DemoAccounts:Admin:Password"]));
    }
}

// ── Achievement catalog seed and validation (every environment) ─────
// The approved achievement catalog is a hard precondition of the award
// core: it is seeded concurrency-safely and validated completely before the
// host starts, so no hosted reconciliation/backfill pass and no request can
// run against a missing or malformed catalog. Any catalog defect fails
// startup; an empty catalog is never treated as ready.
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
    if (app.Environment.IsDevelopment())
    {
        // Same Development-only automatic migration as the seed block above;
        // idempotent when it already ran. In other environments the
        // deployment procedure must apply migrations before start — the
        // fail-closed validation below reports a missing table as a startup
        // failure rather than silently skipping awards.
        await db.Database.MigrateAsync();
    }
    await AchievementSeed.SeedAndValidateAsync(db);
}

// OpenAPI JSON endpoint (available in all environments for Slice 0)
app.MapOpenApi();

// Scalar API documentation UI
app.MapScalarApiReference();

// Map controllers
app.MapControllers();

app.Run();
