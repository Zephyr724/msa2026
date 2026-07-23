using Kiwimpact.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class QuestImageConfiguration : IEntityTypeConfiguration<QuestImage>
{
    public void Configure(EntityTypeBuilder<QuestImage> builder)
    {
        builder.ToTable("QuestImages");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.ImageUrl)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(i => i.AltText)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(i => i.SortOrder)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(i => i.IsCover)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(i => i.CreatorName)
            .HasMaxLength(200);

        builder.Property(i => i.SourceUrl)
            .HasMaxLength(2000);

        builder.Property(i => i.LicenceNote)
            .HasMaxLength(500);

        // Quest FK with Cascade
        builder.HasOne(i => i.Quest)
            .WithMany(q => q.Images)
            .HasForeignKey(i => i.QuestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(i => new { i.QuestId, i.SortOrder })
            .HasDatabaseName("IX_QuestImages_QuestId_SortOrder");
        builder.HasIndex(i => new { i.QuestId, i.IsCover })
            .HasDatabaseName("IX_QuestImages_QuestId_IsCover");
    }
}