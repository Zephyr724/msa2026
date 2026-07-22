using Kiwimpact.Infrastructure;
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

var app = builder.Build();

// ── Middleware Pipeline ──────────────────────────────────────────────
app.UseCors();

// HTTPS redirection enabled only in non-Development environments
// so the local HTTP Vite proxy on port 5000 remains usable during development.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// OpenAPI JSON endpoint (available in all environments for Slice 0)
app.MapOpenApi();

// Scalar API documentation UI
app.MapScalarApiReference();

// Map controllers
app.MapControllers();

app.Run();