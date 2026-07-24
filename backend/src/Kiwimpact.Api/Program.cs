using System.Threading.RateLimiting;
using Kiwimpact.Api.Security;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
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

// Identity authentication, cookies, lockout, and API-safe challenge responses.
builder.Services
    .AddIdentity<ApplicationUser, ApplicationRole>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.SignIn.RequireConfirmedEmail = false;
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
    .AddDefaultTokenProviders();

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
});

// Core application services
builder.Services.AddScoped<IRegionReadService, RegionReadService>();
builder.Services.AddScoped<IQuestDiscoveryService, QuestDiscoveryService>();
builder.Services.AddScoped<IQuestManagementService, QuestManagementService>();

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

app.UseRateLimiter();
app.UseAuthentication();
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

// OpenAPI JSON endpoint (available in all environments for Slice 0)
app.MapOpenApi();

// Scalar API documentation UI
app.MapScalarApiReference();

// Map controllers
app.MapControllers();

app.Run();
