using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ── Service Registration ────────────────────────────────────────────
builder.Services.AddControllers();

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

// Core application services
builder.Services.AddScoped<IRegionReadService, RegionReadService>();
builder.Services.AddScoped<IQuestDiscoveryService, QuestDiscoveryService>();

var app = builder.Build();

// ── Middleware Pipeline ──────────────────────────────────────────────
app.UseCors();

// HTTPS redirection enabled only in non-Development environments
// so the local HTTP Vite proxy on port 5000 remains usable during development.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// ── Development Seed Orchestration ──────────────────────────────────
// Seeds run only when IHostEnvironment.IsDevelopment() is true.
// Each seed type is independently enabled via configuration flags.
if (app.Environment.IsDevelopment())
{
    var seedRegion = builder.Configuration.GetValue<bool>("Seed:Region");
    var seedDemoQuests = builder.Configuration.GetValue<bool>("Seed:DemoQuests");

    if (seedRegion || seedDemoQuests)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();

        // Apply pending migrations before seeding
        db.Database.Migrate();

        if (seedRegion)
        {
            await RegionSeed.SeedAsync(db);
        }

        if (seedDemoQuests)
        {
            // Validate all Region prerequisites before writing anything.
            // The demo seed references Auckland and 15 specific LocalArea IDs.
            // A partially populated hierarchy would bypass a simple Auckland check
            // and hit an FK failure inside the seed transaction.
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

            // Use a transaction to prevent partial seed on failure.
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
    }
}

// OpenAPI JSON endpoint (available in all environments for Slice 0)
app.MapOpenApi();

// Scalar API documentation UI
app.MapScalarApiReference();

// Map controllers
app.MapControllers();

app.Run();