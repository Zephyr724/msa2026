using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class XpTransactionConfiguration : IEntityTypeConfiguration<XpTransaction>
{
    public void Configure(EntityTypeBuilder<XpTransaction> builder)
    {
        builder.ToTable("XpTransactions", table => table.HasCheckConstraint(
            "CK_XpTransactions_XpAmount_Positive",
            "\"XpAmount\" > 0"));

        builder.HasKey(transaction => transaction.Id);

        builder.Property(transaction => transaction.XpAmount)
            .IsRequired();
        builder.Property(transaction => transaction.CreatedAt)
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(transaction => transaction.UserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne<Quest>()
            .WithMany()
            .HasForeignKey(transaction => transaction.QuestId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne<QuestCompletion>()
            .WithMany()
            .HasForeignKey(transaction => transaction.SourceCompletionId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne<Region>()
            .WithMany()
            .HasForeignKey(transaction => transaction.CommunityRegionIdAtAward)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(transaction => transaction.SourceCompletionId)
            .IsUnique()
            .HasDatabaseName("UX_XpTransactions_SourceCompletionId");

        builder.HasIndex(transaction => new
            {
                transaction.UserId,
                transaction.CreatedAt,
            })
            .HasDatabaseName("IX_XpTransactions_UserId_CreatedAt");

        builder.HasIndex(transaction => new
            {
                transaction.CommunityRegionIdAtAward,
                transaction.CreatedAt,
            })
            .HasDatabaseName("IX_XpTransactions_CommunityRegionIdAtAward_CreatedAt");
    }
}
