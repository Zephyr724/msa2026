using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class CompletionCodeConfiguration : IEntityTypeConfiguration<CompletionCode>
{
    public void Configure(EntityTypeBuilder<CompletionCode> builder)
    {
        builder.ToTable("CompletionCodes", table => table.HasCheckConstraint(
            "CK_CompletionCodes_ValidityWindow",
            "\"ValidTo\" IS NULL OR \"ValidTo\" > \"ValidFrom\""));

        builder.HasKey(code => code.Id);

        builder.Property(code => code.CodeHash)
            .IsRequired()
            .HasMaxLength(CompletionCode.MaxCodeHashLength);
        builder.Property(code => code.ValidFrom)
            .IsRequired();
        builder.Property(code => code.IsActive)
            .IsRequired();
        builder.Property(code => code.IsRevoked)
            .IsRequired();
        builder.Property(code => code.CreatedAt)
            .IsRequired();

        builder.HasOne(code => code.Quest)
            .WithMany()
            .HasForeignKey(code => code.QuestId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(code => code.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasIndex(code => new
            {
                code.QuestId,
                code.IsActive,
                code.IsRevoked,
            })
            .HasDatabaseName("IX_CompletionCodes_QuestId_IsActive_IsRevoked");

        builder.HasIndex(code => code.QuestId)
            .IsUnique()
            .HasFilter("\"IsActive\" AND NOT \"IsRevoked\"")
            .HasDatabaseName("UX_CompletionCodes_QuestId_Active");

        builder.HasIndex(code => code.CreatedByUserId);
    }
}
