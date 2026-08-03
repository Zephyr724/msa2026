using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class QuestCompletionConfiguration
    : IEntityTypeConfiguration<QuestCompletion>
{
    public void Configure(EntityTypeBuilder<QuestCompletion> builder)
    {
        builder.ToTable("QuestCompletions");

        builder.HasKey(completion => completion.Id);

        builder.Property(completion => completion.Method)
            .IsRequired()
            .HasMaxLength(50)
            .HasConversion<string>();
        builder.Property(completion => completion.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasConversion<string>();
        builder.Property(completion => completion.CompletedAt)
            .IsRequired();
        builder.Property(completion => completion.RewardDifficultySnapshot)
            .IsRequired()
            .HasMaxLength(50)
            .HasConversion<string>();
        builder.Property(completion => completion.QuestCategorySnapshot)
            .IsRequired()
            .HasMaxLength(50)
            .HasConversion<string>();
        builder.Property(completion => completion.CreatedAt)
            .IsRequired();
        builder.Property(completion => completion.UpdatedAt)
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(completion => completion.UserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne(completion => completion.Quest)
            .WithMany()
            .HasForeignKey(completion => completion.QuestId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne(completion => completion.Participation)
            .WithMany()
            .HasForeignKey(completion => completion.ParticipationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(completion => completion.CommunityRegionAtCompletion)
            .WithMany()
            .HasForeignKey(completion => completion.CommunityRegionIdAtCompletion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(completion => completion.Version)
            .IsRowVersion()
            .HasConversion<uint>();

        builder.HasIndex(completion => new
            {
                completion.UserId,
                completion.QuestId,
            })
            .IsUnique()
            .HasFilter("\"Status\" = 'Verified'")
            .HasDatabaseName("UX_QuestCompletions_UserId_QuestId_Verified");

        builder.HasIndex(completion => completion.ParticipationId)
            .HasDatabaseName("IX_QuestCompletions_ParticipationId");

        builder.HasIndex(completion => completion.QuestId);
        builder.HasIndex(completion => completion.CommunityRegionIdAtCompletion);
        builder.HasIndex(completion => new
            {
                completion.UserId,
                completion.QuestCategorySnapshot,
                completion.VerifiedAtUtc,
            })
            .HasDatabaseName(
                "IX_QuestCompletions_UserId_CategorySnapshot_VerifiedAtUtc");
        builder.HasIndex(completion => new { completion.Method, completion.Status, completion.CreatedAt });
    }
}
