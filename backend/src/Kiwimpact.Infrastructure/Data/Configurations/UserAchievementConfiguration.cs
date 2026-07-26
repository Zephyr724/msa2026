using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class UserAchievementConfiguration : IEntityTypeConfiguration<UserAchievement>
{
    public void Configure(EntityTypeBuilder<UserAchievement> builder)
    {
        builder.ToTable("UserAchievements");

        builder.HasKey(award => award.Id);

        builder.Property(award => award.AwardedAt)
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(award => award.UserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne<Achievement>()
            .WithMany()
            .HasForeignKey(award => award.AchievementId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne<XpTransaction>()
            .WithMany()
            .HasForeignKey(award => award.XpTransactionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Staged form of the accepted partial unique index while
        // SourceCommunityChallengeId is omitted: every 6A row is
        // challenge-less, so a plain unique index is semantically identical.
        // Also serves as the user-lookup index (leftmost column).
        builder.HasIndex(award => new
            {
                award.UserId,
                award.AchievementId,
            })
            .IsUnique()
            .HasDatabaseName("UX_UserAchievements_UserId_AchievementId");

        // Explicit FK lookup indexes: ForeignKeyIndexConvention is removed.
        builder.HasIndex(award => award.AchievementId)
            .HasDatabaseName("IX_UserAchievements_AchievementId");
        builder.HasIndex(award => award.XpTransactionId)
            .HasDatabaseName("IX_UserAchievements_XpTransactionId");
    }
}
