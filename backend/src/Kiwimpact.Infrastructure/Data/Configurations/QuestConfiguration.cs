using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class QuestConfiguration : IEntityTypeConfiguration<Quest>
{
    public void Configure(EntityTypeBuilder<Quest> builder)
    {
        builder.ToTable("Quests");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(q => q.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(q => q.Category)
            .IsRequired()
            .HasMaxLength(50)
            .HasConversion<string>();

        builder.Property(q => q.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasConversion<string>();

        builder.Property(q => q.SourceType)
            .IsRequired()
            .HasMaxLength(50)
            .HasConversion<string>();

        builder.Property(q => q.RegistrationMode)
            .HasMaxLength(50)
            .HasConversion<string>();

        builder.Property(q => q.Difficulty)
            .IsRequired()
            .HasMaxLength(50)
            .HasConversion<string>();

        builder.Property(q => q.XpAward)
            .IsRequired();

        builder.Property(q => q.LocationDescription)
            .HasMaxLength(500);

        builder.Property(q => q.Latitude)
            .HasPrecision(9, 6);

        builder.Property(q => q.Longitude)
            .HasPrecision(9, 6);

        builder.Property(q => q.ExternalSourceUrl)
            .HasMaxLength(2000);

        builder.Property(q => q.ExternalSourceStatus)
            .HasMaxLength(50)
            .HasConversion<string>();

        // Check constraints
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Quests_XpAward_NonNegative", "\"XpAward\" >= 0"));
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Quests_Capacity_NonNegative", "\"Capacity\" IS NULL OR \"Capacity\" >= 0"));
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Quests_Coordinates_Paired",
            "(\"Latitude\" IS NULL AND \"Longitude\" IS NULL) OR " +
            "(\"Latitude\" IS NOT NULL AND \"Longitude\" IS NOT NULL)"));
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Quests_Latitude_Range",
            "\"Latitude\" IS NULL OR \"Latitude\" BETWEEN -90 AND 90"));
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Quests_Longitude_Range",
            "\"Longitude\" IS NULL OR \"Longitude\" BETWEEN -180 AND 180"));

        // Region FK with Restrict
        builder.HasOne(q => q.LocationRegion)
            .WithMany(r => r.Quests)
            .HasForeignKey(q => q.LocationRegionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Creator Identity FK with Restrict
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(q => q.CreatedByUserId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        // Optimistic concurrency via PostgreSQL xmin
        builder.Property(q => q.Version)
            .IsRowVersion()
            .HasConversion<uint>();

        // Indexes for public reads
        builder.HasIndex(q => new { q.Status, q.StartAtUtc })
            .HasDatabaseName("IX_Quests_Status_StartAtUtc");
        builder.HasIndex(q => new { q.Status, q.Category })
            .HasDatabaseName("IX_Quests_Status_Category");
        builder.HasIndex(q => new { q.Status, q.SourceType })
            .HasDatabaseName("IX_Quests_Status_SourceType");
        builder.HasIndex(q => new { q.Status, q.Difficulty })
            .HasDatabaseName("IX_Quests_Status_Difficulty");
        builder.HasIndex(q => new { q.Status, q.LocationRegionId })
            .HasDatabaseName("IX_Quests_Status_LocationRegionId");

        // FK lookup indexes with their existing names. These were created by
        // EF's ForeignKeyIndexConvention; they are declared explicitly because
        // the convention is removed (KiwimpactDbContext.ConfigureConventions)
        // to keep the XpTransactions index set exactly as approved.
        builder.HasIndex(q => q.CreatedByUserId)
            .HasDatabaseName("IX_Quests_CreatedByUserId");
        builder.HasIndex(q => q.LocationRegionId)
            .HasDatabaseName("IX_Quests_LocationRegionId");
    }
}
