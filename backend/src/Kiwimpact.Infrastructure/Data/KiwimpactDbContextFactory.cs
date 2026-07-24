using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kiwimpact.Infrastructure.Data;

public sealed class KiwimpactDbContextFactory
    : IDesignTimeDbContextFactory<KiwimpactDbContext>
{
    public KiwimpactDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<KiwimpactDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=kiwimpact_design;Username=kiwimpact_design",
                npgsql => npgsql.MigrationsAssembly(
                    typeof(KiwimpactDbContext).Assembly.FullName))
            .Options;

        return new KiwimpactDbContext(options);
    }
}
