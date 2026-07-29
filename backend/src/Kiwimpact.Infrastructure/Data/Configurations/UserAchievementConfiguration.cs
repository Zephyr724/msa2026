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

        builder.HasOne<CommunityChallenge>()
            .WithMany()
            .HasForeignKey(award => award.SourceCommunityChallengeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(award => new
            {
                award.UserId,
                award.AchievementId,
            })
            .IsUnique()
            .HasFilter("\"SourceCommunityChallengeId\" IS NULL")
            .HasDatabaseName("UX_UserAchievements_Milestone");
        builder.HasIndex(award => new
            {
                award.UserId,
                award.AchievementId,
                award.SourceCommunityChallengeId,
            })
            .IsUnique()
            .HasFilter("\"SourceCommunityChallengeId\" IS NOT NULL")
            .HasDatabaseName("UX_UserAchievements_CommunityChallenge");

        // Explicit FK lookup indexes: ForeignKeyIndexConvention is removed.
        builder.HasIndex(award => award.AchievementId)
            .HasDatabaseName("IX_UserAchievements_AchievementId");
        builder.HasIndex(award => award.XpTransactionId)
            .HasDatabaseName("IX_UserAchievements_XpTransactionId");
        builder.HasIndex(award => award.SourceCommunityChallengeId)
            .HasDatabaseName("IX_UserAchievements_SourceCommunityChallengeId");
    }
}
