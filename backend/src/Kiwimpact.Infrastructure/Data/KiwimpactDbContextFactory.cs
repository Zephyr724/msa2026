using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kiwimpact.Infrastructure.Data;

public sealed class KiwimpactDbContextFactory
    : IDesignTimeDbContextFactory<KiwimpactDbContext>
{
    private const string DesignTimeConnectionString =
        "Host=localhost;Database=kiwimpact_design;Username=kiwimpact_design";

    public KiwimpactDbContext CreateDbContext(string[] args)
    {
        // EF migration bundles resolve their DbContext through this factory at
        // execution time. Prefer the standard .NET environment-variable form
        // used by Compose so the bundle never falls back to the design-only
        // localhost database inside a container.
        var connectionString = Environment.GetEnvironmentVariable(
                "ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable(
                "ConnectionStrings:DefaultConnection")
            ?? DesignTimeConnectionString;

        var options = new DbContextOptionsBuilder<KiwimpactDbContext>()
            .UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsAssembly(
                    typeof(KiwimpactDbContext).Assembly.FullName))
            .Options;

        return new KiwimpactDbContext(options);
    }
}
