using System.Threading.RateLimiting;
using Kiwimpact.Api.Hosting;
using Kiwimpact.Api.Reconciliation;
using Kiwimpact.Api.Hubs;
using Kiwimpact.Api.Security;
using Kiwimpact.Core.Services;
using Kiwimpact.Core.Security;
using Kiwimpact.Infrastructure;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Reconciliation;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.OAuth.Claims;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile(
        "appsettings.Development.local.json",
        optional: true,
        reloadOnChange: false);
    // Keep environment variables authoritative for shared/dev-hosted runs.
    builder.Configuration.AddEnvironmentVariables();
}

// ── Service Registration ────────────────────────────────────────────
builder.Services.AddScoped<ApiAntiforgeryFilter>();
builder.Services.AddControllers(options =>
    options.Filters.AddService<ApiAntiforgeryFilter>());

// Problem Details for consistent error responses
builder.Services.AddProblemDetails();
builder.Services.AddSignalR();

var railwayHostingEnabled = builder.Configuration.GetValue<bool>(
    RailwayForwardedHeaders.SectionName + ":Enabled");
if (railwayHostingEnabled)
{
    RailwayForwardedHeaders.ValidateDataProtectionConfiguration(
        builder.Configuration);
    builder.Services.Configure<ForwardedHeadersOptions>(
        RailwayForwardedHeaders.Configure);
}

var dataProtection = builder.Services
    .AddDataProtection()
    .SetApplicationName(
        builder.Configuration["DataProtection:ApplicationName"] ?? "Kiwimpact");
var dataProtectionKeyPath = builder.Configuration["DataProtection:KeyPath"];
if (!string.IsNullOrWhiteSpace(dataProtectionKeyPath))
{
    var keyDirectory = Directory.CreateDirectory(dataProtectionKeyPath);
    dataProtection.PersistKeysToFileSystem(keyDirectory);
}

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
builder.Services.AddSingleton<CommunityChallengeFinalizer>();
builder.Services.AddHostedService<CommunityChallengeFinalizerHostedService>();

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

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
if (string.IsNullOrWhiteSpace(googleClientId) != string.IsNullOrWhiteSpace(googleClientSecret))
{
    throw new InvalidOperationException(
        "Google authentication requires both Authentication:Google:ClientId " +
        "and Authentication:Google:ClientSecret.");
}

if (!string.IsNullOrWhiteSpace(googleClientId) &&
    !string.IsNullOrWhiteSpace(googleClientSecret))
{
    builder.Services
        .AddAuthentication()
        .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.SignInScheme = IdentityConstants.ExternalScheme;
            options.ClaimActions.Add(new JsonKeyClaimAction(
                "urn:google:email_verified",
                System.Security.Claims.ClaimValueTypes.Boolean,
                "email_verified"));
        });
}

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
var socialRateLimitWindowMinutes = builder.Configuration.GetValue(
    "Social:RateLimits:WindowMinutes",
    1);
var socialPublishPermitLimit = builder.Configuration.GetValue(
    "Social:RateLimits:PublishPermitLimit",
    6);
var socialCommentPermitLimit = builder.Configuration.GetValue(
    "Social:RateLimits:CommentPermitLimit",
    30);
var socialReactionPermitLimit = builder.Configuration.GetValue(
    "Social:RateLimits:ReactionPermitLimit",
    120);

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
    options.AddPolicy(SocialRateLimitPolicies.Publish, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            SocialRateLimitPolicies.ActorPartitionKey(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = socialPublishPermitLimit,
                Window = TimeSpan.FromMinutes(socialRateLimitWindowMinutes),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));
    options.AddPolicy(SocialRateLimitPolicies.Comment, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            SocialRateLimitPolicies.ActorPartitionKey(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = socialCommentPermitLimit,
                Window = TimeSpan.FromMinutes(socialRateLimitWindowMinutes),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));
    options.AddPolicy(SocialRateLimitPolicies.Reaction, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            SocialRateLimitPolicies.ActorPartitionKey(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = socialReactionPermitLimit,
                Window = TimeSpan.FromMinutes(socialRateLimitWindowMinutes),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));
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
builder.Services.AddScoped<ISocialFeedService, SocialFeedService>();
builder.Services.AddScoped<IPublicPassportService, PublicPassportService>();

var app = builder.Build();

// ── Middleware Pipeline ──────────────────────────────────────────────
app.UseExceptionHandler();

if (railwayHostingEnabled)
{
    app.UseForwardedHeaders();
}

// HTTPS redirection enabled only in non-Development environments
// so the local HTTP Vite proxy remains usable during development.
if (!app.Environment.IsDevelopment() &&
    builder.Configuration.GetValue("HttpsRedirection:Enabled", true))
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        if (context.Context.Request.Path.StartsWithSegments("/assets"))
        {
            context.Context.Response.Headers.CacheControl =
                "public,max-age=31536000,immutable";
        }
        else
        {
            context.Context.Response.Headers.CacheControl = "no-cache";
        }
    },
});

app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

// ── Achievement catalog seed and validation (every environment) ─────
// Install the validated catalog before any optional activity fixtures so
// their XP history can receive the same rule-driven awards as live activity.
// In non-Development environments migrations remain a deployment step.
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
    if (app.Environment.IsDevelopment())
    {
        await db.Database.MigrateAsync();
    }
    await AchievementSeed.SeedAndValidateAsync(db);
}

// ── Seed Orchestration ──────────────────────────────────────────────
// Stable roles are safely idempotent in every environment. Automatic
// migration and all demo data remain Development-only. The separately
// approved assessment bootstrap is explicit, disabled by default, and may run
// in a deployed environment after its schema migration has completed.
var seedRoles = builder.Configuration.GetValue<bool>("Seed:Roles");
var seedRegion = builder.Configuration.GetValue<bool>("Seed:Region");
var seedDemoQuests = builder.Configuration.GetValue<bool>("Seed:DemoQuests");
var seedDemoAccounts = builder.Configuration.GetValue<bool>("Seed:DemoAccounts");
var seedAssessmentData = builder.Configuration.GetValue<bool>("Seed:AssessmentData");
var seedAssessmentAccounts =
    builder.Configuration.GetValue<bool>("Seed:AssessmentAccounts");

if (seedRoles || seedAssessmentData || seedAssessmentAccounts ||
    (app.Environment.IsDevelopment() &&
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

    if (seedRoles || seedAssessmentAccounts)
    {
        await IdentitySeed.SeedRolesAsync(
            services.GetRequiredService<RoleManager<ApplicationRole>>());
    }

    if (app.Environment.IsDevelopment() && seedRegion)
    {
        await RegionSeed.SeedAsync(db);
    }

    if (seedAssessmentData)
    {
        await using var assessmentTransaction =
            await db.Database.BeginTransactionAsync();
        try
        {
            // Reference data and the bounded assessment showcase commit as one
            // unit. No account with sign-in credentials or application role is
            // created by this path.
            await RegionSeed.SeedAsync(db);
            await AssessmentDataSeed.SeedAsync(db);
            await assessmentTransaction.CommitAsync();
        }
        catch
        {
            await assessmentTransaction.RollbackAsync();
            throw;
        }
    }

    if (seedAssessmentAccounts)
    {
        var missingAssessmentQuests = AssessmentDataSeed.QuestIds.Count -
            await db.Quests.CountAsync(
                quest => AssessmentDataSeed.QuestIds.Contains(quest.Id));
        if (missingAssessmentQuests > 0)
        {
            throw new InvalidOperationException(
                "Assessment account seeding requires the complete assessment " +
                "Quest catalogue. Run the assessment-data bootstrap first.");
        }

        var assessmentPersonas = ReadAssessmentAccountPersonas(
            builder.Configuration);
        await IdentitySeed.SeedAssessmentAccountsAsync(
            db,
            services.GetRequiredService<UserManager<ApplicationUser>>(),
            new AssessmentAccountSeedOptions(
                Enabled: true,
                Accounts: assessmentPersonas));

        await using var assessmentExperienceTransaction =
            await db.Database.BeginTransactionAsync();
        try
        {
            await AssessmentActivitySeed.SeedAsync(db, assessmentPersonas);
            await AssessmentSocialSeed.SeedAsync(db, assessmentPersonas);
            await assessmentExperienceTransaction.CommitAsync();
        }
        catch
        {
            await assessmentExperienceTransaction.RollbackAsync();
            throw;
        }
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
            await DemoSocialSeed.SeedAsync(db);
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
                builder.Configuration["DemoAccounts:Password"],
                DemoAccountSeedOptions.StandardPersonas));
        // Activity depends on both the configured personas and demo Quests.
        // Accounts remain independently seedable for authentication testing.
        if (seedDemoAccounts && seedDemoQuests)
        {
            await using var demoActivityTransaction =
                await db.Database.BeginTransactionAsync();
            try
            {
                await DemoActivitySeed.SeedAsync(
                    db,
                    DemoAccountSeedOptions.StandardPersonas);
                await demoActivityTransaction.CommitAsync();
            }
            catch
            {
                await demoActivityTransaction.RollbackAsync();
                throw;
            }
        }
    }
}

// OpenAPI JSON endpoint (available in all environments for Slice 0)
app.MapOpenApi();

// Scalar API documentation UI
app.MapScalarApiReference();

// Map controllers
app.MapControllers();
app.MapHub<LeaderboardHub>("/hubs/leaderboard");

// Serve the built React application only for safe, non-file frontend routes.
// Reserved server paths always retain their ordinary 404/405 response instead
// of being converted into a misleading HTML success response.
app.MapMethods("/{**path}", [HttpMethods.Get, HttpMethods.Head], async context =>
{
    var requestPath = context.Request.Path;
    if (IsReservedServerPath(requestPath) || Path.HasExtension(requestPath))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    var indexPath = Path.Combine(app.Environment.WebRootPath ?? string.Empty, "index.html");
    if (!File.Exists(indexPath))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    context.Response.ContentType = "text/html; charset=utf-8";
    context.Response.Headers.CacheControl = "no-cache";
    if (!HttpMethods.IsHead(context.Request.Method))
    {
        await context.Response.SendFileAsync(indexPath, context.RequestAborted);
    }
});

app.Run();

static bool IsReservedServerPath(PathString path) =>
    StartsWithSegment(path, "/api") ||
    StartsWithSegment(path, "/health") ||
    StartsWithSegment(path, "/openapi") ||
    StartsWithSegment(path, "/scalar") ||
    StartsWithSegment(path, "/hubs");

static bool StartsWithSegment(PathString path, string segment) =>
    path.Equals(segment, StringComparison.OrdinalIgnoreCase) ||
    path.StartsWithSegments(segment, StringComparison.OrdinalIgnoreCase);

static IReadOnlyList<AssessmentAccountSeedPersona>
    ReadAssessmentAccountPersonas(IConfiguration configuration)
{
    return configuration
        .GetSection("AssessmentAccounts:Accounts")
        .GetChildren()
        .OrderBy(section =>
            int.TryParse(section.Key, out var index) ? index : int.MaxValue)
        .ThenBy(section => section.Key, StringComparer.Ordinal)
        .Select(section => new AssessmentAccountSeedPersona(
            section["Email"] ?? string.Empty,
            section["DisplayName"] ?? string.Empty,
            section["Role"] ?? string.Empty,
            section["Password"] ?? string.Empty))
        .ToArray();
}
