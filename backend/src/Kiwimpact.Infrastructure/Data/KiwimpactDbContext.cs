using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data;

/// <summary>
/// Foundation DbContext for Kiwimpact. Empty in Slice 0.
/// The first data-backed feature slice will add domain entities
/// and database migrations.
/// </summary>
public class KiwimpactDbContext : DbContext
{
    public KiwimpactDbContext(DbContextOptions<KiwimpactDbContext> options)
        : base(options)
    {
    }
}