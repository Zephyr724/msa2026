using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data;

public sealed class KiwimpactDbContext
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public DbSet<Region> Regions => Set<Region>();
    public DbSet<Quest> Quests => Set<Quest>();
    public DbSet<QuestImage> QuestImages => Set<QuestImage>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

    public KiwimpactDbContext(DbContextOptions<KiwimpactDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(KiwimpactDbContext).Assembly);
    }
}
