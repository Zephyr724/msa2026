using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class FeaturedPassportAchievementConfiguration
    : IEntityTypeConfiguration<FeaturedPassportAchievement>
{
    public void Configure(EntityTypeBuilder<FeaturedPassportAchievement> builder)
    {
        builder.ToTable("FeaturedPassportAchievements", table =>
            table.HasCheckConstraint(
                "CK_FeaturedPassportAchievements_SortOrder",
                "\"SortOrder\" BETWEEN 0 AND 4"));

        builder.HasKey(item => new { item.UserId, item.AchievementId });
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(item => item.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Achievement>()
            .WithMany()
            .HasForeignKey(item => item.AchievementId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(item => new { item.UserId, item.SortOrder })
            .IsUnique()
            .HasDatabaseName("UX_FeaturedPassportAchievements_User_SortOrder");
        builder.HasIndex(item => item.AchievementId)
            .HasDatabaseName("IX_FeaturedPassportAchievements_AchievementId");
    }
}
