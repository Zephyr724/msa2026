using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace Kiwimpact.Infrastructure.Data;

public sealed class KiwimpactDbContext
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public DbSet<Region> Regions => Set<Region>();
    public DbSet<Quest> Quests => Set<Quest>();
    public DbSet<QuestImage> QuestImages => Set<QuestImage>();
    public DbSet<QuestParticipation> QuestParticipations => Set<QuestParticipation>();
    public DbSet<QuestCompletion> QuestCompletions => Set<QuestCompletion>();
    public DbSet<EvidenceClaimDetail> EvidenceClaimDetails => Set<EvidenceClaimDetail>();
    public DbSet<CompletionCode> CompletionCodes => Set<CompletionCode>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<XpTransaction> XpTransactions => Set<XpTransaction>();
    public DbSet<Achievement> Achievements => Set<Achievement>();
    public DbSet<UserAchievement> UserAchievements => Set<UserAchievement>();
    public DbSet<CommunityChallenge> CommunityChallenges => Set<CommunityChallenge>();
    public DbSet<SocialPost> SocialPosts => Set<SocialPost>();
    public DbSet<SocialPostLike> SocialPostLikes => Set<SocialPostLike>();
    public DbSet<SocialComment> SocialComments => Set<SocialComment>();

    public KiwimpactDbContext(DbContextOptions<KiwimpactDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(KiwimpactDbContext).Assembly);

        // FK lookup indexes with their existing names. These were created by
        // EF's ForeignKeyIndexConvention; they are declared explicitly because
        // the convention is removed (ConfigureConventions) to keep the
        // XpTransactions index set exactly as approved.
        modelBuilder.Entity<IdentityUserRole<Guid>>()
            .HasIndex(userRole => userRole.RoleId)
            .HasDatabaseName("IX_AspNetUserRoles_RoleId");
        modelBuilder.Entity<IdentityUserLogin<Guid>>()
            .HasIndex(login => login.UserId)
            .HasDatabaseName("IX_AspNetUserLogins_UserId");
        modelBuilder.Entity<IdentityUserClaim<Guid>>()
            .HasIndex(claim => claim.UserId)
            .HasDatabaseName("IX_AspNetUserClaims_UserId");
        modelBuilder.Entity<IdentityRoleClaim<Guid>>()
            .HasIndex(claim => claim.RoleId)
            .HasDatabaseName("IX_AspNetRoleClaims_RoleId");
    }

    protected override void ConfigureConventions(
        ModelConfigurationBuilder configurationBuilder)
    {
        // Stop EF from creating an index for every foreign key
        // (https://learn.microsoft.com/en-us/ef/core/modeling/relationships/conventions).
        // The approved XpTransactions index set is exactly three indexes with
        // no QuestId lookup index; the FK indexes the rest of the model relies
        // on are declared explicitly in their entity configurations.
        configurationBuilder.Conventions.Remove(
            typeof(ForeignKeyIndexConvention));
    }
}
