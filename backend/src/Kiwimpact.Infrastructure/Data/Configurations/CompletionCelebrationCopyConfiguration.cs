using Kiwimpact.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class CompletionCelebrationCopyConfiguration
    : IEntityTypeConfiguration<CompletionCelebrationCopy>
{
    public void Configure(EntityTypeBuilder<CompletionCelebrationCopy> builder)
    {
        builder.ToTable("CompletionCelebrationCopies", table =>
        {
            table.HasCheckConstraint(
                "CK_CompletionCelebrationCopies_SortOrder_NonNegative",
                "\"SortOrder\" >= 0");
            table.HasCheckConstraint(
                "CK_CompletionCelebrationCopies_Text_NotBlank",
                "length(btrim(\"Text\")) > 0");
        });
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Kind).HasConversion<string>().HasMaxLength(20);
        builder.Property(item => item.Text)
            .IsRequired()
            .HasMaxLength(CompletionCelebrationCopy.MaxTextLength);
        builder.HasIndex(item => new { item.Kind, item.SortOrder })
            .IsUnique()
            .HasDatabaseName("UX_CompletionCelebrationCopies_Kind_Order");
        builder.HasIndex(item => new { item.Kind, item.Text })
            .IsUnique()
            .HasDatabaseName("UX_CompletionCelebrationCopies_Kind_Text");
    }
}
