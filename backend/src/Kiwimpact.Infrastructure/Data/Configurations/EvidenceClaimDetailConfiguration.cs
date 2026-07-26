using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class EvidenceClaimDetailConfiguration
    : IEntityTypeConfiguration<EvidenceClaimDetail>
{
    public void Configure(EntityTypeBuilder<EvidenceClaimDetail> builder)
    {
        builder.ToTable("EvidenceClaimDetails");
        builder.HasKey(detail => detail.Id);
        builder.Property(detail => detail.Description)
            .HasMaxLength(EvidenceClaimDetail.MaxDescriptionLength);
        builder.Property(detail => detail.EvidenceUrl)
            .HasMaxLength(EvidenceClaimDetail.MaxEvidenceUrlLength);
        builder.Property(detail => detail.ReviewNote)
            .HasMaxLength(EvidenceClaimDetail.MaxReviewNoteLength);
        builder.Property(detail => detail.UserDeclaration).IsRequired();

        builder.HasOne(detail => detail.QuestCompletion)
            .WithOne(completion => completion.EvidenceClaimDetail)
            .HasForeignKey<EvidenceClaimDetail>(detail => detail.QuestCompletionId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(detail => detail.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(detail => detail.QuestCompletionId)
            .IsUnique()
            .HasDatabaseName("UX_EvidenceClaimDetails_QuestCompletionId");
        builder.HasIndex(detail => detail.ReviewedByUserId);
        builder.HasIndex(detail => detail.EvidencePurgeDueAt)
            .HasFilter("\"EvidencePurgedAt\" IS NULL")
            .HasDatabaseName("IX_EvidenceClaimDetails_PurgeDue");
    }
}
