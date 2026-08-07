using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class MemberRewardEventConfiguration
    : IEntityTypeConfiguration<MemberRewardEvent>
{
    public void Configure(EntityTypeBuilder<MemberRewardEvent> builder)
    {
        builder.ToTable("MemberRewardEvents", table =>
        {
            table.HasCheckConstraint("CK_MemberRewardEvents_XpAwarded_Positive", "\"XpAwarded\" > 0");
            table.HasCheckConstraint("CK_MemberRewardEvents_TotalXp_Order", "\"TotalXp\" >= \"PreviousTotalXp\"");
            table.HasCheckConstraint("CK_MemberRewardEvents_Level_Range", "\"Level\" BETWEEN 1 AND 99 AND \"PreviousLevel\" BETWEEN 1 AND 99");
            table.HasCheckConstraint("CK_MemberRewardEvents_Streak_NonNegative", "\"StreakWeeks\" >= 0 AND \"PreviousStreakWeeks\" >= 0");
            table.HasCheckConstraint(
                "CK_MemberRewardEvents_CommunitySnapshot_Complete",
                "(\"CommunityChallengeId\" IS NULL AND \"CommunityName\" IS NULL AND \"CommunityChallengePreviousProgress\" IS NULL AND \"CommunityChallengeProgress\" IS NULL AND \"CommunityChallengeTarget\" IS NULL) OR " +
                "(\"CommunityChallengeId\" IS NOT NULL AND \"CommunityName\" IS NOT NULL AND \"CommunityChallengePreviousProgress\" IS NOT NULL AND \"CommunityChallengeProgress\" IS NOT NULL AND \"CommunityChallengeTarget\" IS NOT NULL)");
        });
        builder.HasKey(item => item.Id);
        builder.Property(item => item.VerificationMethod).HasConversion<string>().HasMaxLength(40);
        builder.Property(item => item.QuestTitle).IsRequired().HasMaxLength(MemberRewardEvent.MaxQuestTitleLength);
        builder.Property(item => item.PreviousRankTitle).IsRequired().HasMaxLength(MemberRewardEvent.MaxRankTitleLength);
        builder.Property(item => item.RankTitle).IsRequired().HasMaxLength(MemberRewardEvent.MaxRankTitleLength);
        builder.Property(item => item.CelebrationTitle).IsRequired()
            .HasMaxLength(MemberRewardEvent.MaxCelebrationTitleLength);
        builder.Property(item => item.CelebrationMessage).IsRequired()
            .HasMaxLength(MemberRewardEvent.MaxCelebrationMessageLength);
        builder.Property(item => item.CommunityName).HasMaxLength(MemberRewardEvent.MaxCommunityNameLength);
        builder.HasOne<ApplicationUser>().WithMany().HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(item => item.XpTransaction).WithOne().HasForeignKey<MemberRewardEvent>(item => item.Id).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(item => item.QuestCompletion).WithOne().HasForeignKey<MemberRewardEvent>(item => item.QuestCompletionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(item => item.Quest).WithMany().HasForeignKey(item => item.QuestId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(item => item.QuestCompletionId).IsUnique().HasDatabaseName("UX_MemberRewardEvents_QuestCompletionId");
        builder.HasIndex(item => new { item.UserId, item.SeenAtUtc, item.CreatedAt }).HasDatabaseName("IX_MemberRewardEvents_User_Inbox");
        builder.HasIndex(item => new { item.UserId, item.QuestId, item.CreatedAt }).HasDatabaseName("IX_MemberRewardEvents_User_Quest");
    }
}
