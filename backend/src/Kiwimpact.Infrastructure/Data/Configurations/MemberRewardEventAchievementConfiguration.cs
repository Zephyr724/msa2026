using Kiwimpact.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class MemberRewardEventAchievementConfiguration
    : IEntityTypeConfiguration<MemberRewardEventAchievement>
{
    public void Configure(EntityTypeBuilder<MemberRewardEventAchievement> builder)
    {
        builder.ToTable("MemberRewardEventAchievements", table =>
            table.HasCheckConstraint("CK_MemberRewardEventAchievements_SortOrder", "\"SortOrder\" >= 0"));
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Code).IsRequired().HasMaxLength(MemberRewardEventAchievement.MaxCodeLength);
        builder.Property(item => item.Name).IsRequired().HasMaxLength(MemberRewardEventAchievement.MaxNameLength);
        builder.HasOne(item => item.RewardEvent).WithMany(item => item.UnlockedAchievements).HasForeignKey(item => item.RewardEventId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(item => item.Achievement).WithMany().HasForeignKey(item => item.AchievementId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(item => new { item.RewardEventId, item.AchievementId }).IsUnique().HasDatabaseName("UX_MemberRewardEventAchievements_Event_Achievement");
        builder.HasIndex(item => new { item.RewardEventId, item.SortOrder }).IsUnique().HasDatabaseName("UX_MemberRewardEventAchievements_Event_Order");
    }
}
