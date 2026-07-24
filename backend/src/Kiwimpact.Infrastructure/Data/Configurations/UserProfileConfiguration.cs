using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("UserProfiles");

        builder.HasKey(profile => profile.Id);

        builder.Property(profile => profile.DisplayName)
            .IsRequired()
            .HasMaxLength(UserProfile.MaxDisplayNameLength);

        builder.Property(profile => profile.ShowCommunityOnPassport)
            .IsRequired()
            .HasDefaultValue(false);

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
