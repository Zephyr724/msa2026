using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("UserProfiles", table =>
        {
            table.HasCheckConstraint(
                "CK_UserProfiles_TotalXp_NonNegative",
                "\"TotalXp\" >= 0");
            table.HasCheckConstraint(
                "CK_UserProfiles_Level_Range",
                "\"Level\" BETWEEN 1 AND 99");
        });

        builder.HasKey(profile => profile.Id);

        builder.Property(profile => profile.DisplayName)
            .IsRequired()
            .HasMaxLength(UserProfile.MaxDisplayNameLength);

        builder.Property(profile => profile.ShowCommunityOnPassport)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(profile => profile.TotalXp)
            .IsRequired()
            .HasDefaultValue(0L);

        builder.Property(profile => profile.Level)
            .IsRequired()
            .HasDefaultValue(1);

        builder.HasOne<ApplicationUser>()
            .WithOne()
            .HasForeignKey<UserProfile>(profile => profile.Id)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(profile => profile.HomeCommunityRegion)
            .WithMany()
            .HasForeignKey(profile => profile.HomeCommunityRegionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(profile => profile.HomeCommunityRegionId);
    }
}
