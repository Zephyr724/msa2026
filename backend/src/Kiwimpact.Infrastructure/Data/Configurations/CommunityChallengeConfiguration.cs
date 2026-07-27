using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class CommunityChallengeConfiguration
    : IEntityTypeConfiguration<CommunityChallenge>
{
    public void Configure(EntityTypeBuilder<CommunityChallenge> builder)
    {
        builder.ToTable("CommunityChallenges", table =>
        {
            table.HasCheckConstraint(
                "CK_CommunityChallenges_TargetValue_Positive",
                "\"TargetValue\" > 0");
            table.HasCheckConstraint(
                "CK_CommunityChallenges_Period",
                "\"PeriodEnd\" > \"PeriodStart\"");
        });
        builder.HasKey(item => item.Id);
        builder.Property(item => item.TargetType)
            .HasMaxLength(50)
            .IsRequired();
        builder.Property(item => item.Status)
            .HasMaxLength(50)
            .HasConversion<string>()
            .IsRequired();
        builder.Property(item => item.Version)
            .IsRowVersion()
            .HasConversion<uint>();
        builder.HasOne(item => item.LocalAreaRegion)
            .WithMany()
            .HasForeignKey(item => item.LocalAreaRegionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(item => item.RewardAchievement)
            .WithMany()
            .HasForeignKey(item => item.RewardAchievementId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(item => item.LocalAreaRegionId)
            .IsUnique()
            .HasFilter("\"Status\" = 'Active'")
            .HasDatabaseName("UX_CommunityChallenges_ActiveLocalArea");
        builder.HasIndex(item => new { item.LocalAreaRegionId, item.PeriodStart })
            .HasDatabaseName("IX_CommunityChallenges_LocalArea_PeriodStart");
        builder.HasIndex(item => item.RewardAchievementId)
            .HasDatabaseName("IX_CommunityChallenges_RewardAchievementId");
    }
}
