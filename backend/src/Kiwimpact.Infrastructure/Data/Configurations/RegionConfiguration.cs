using Kiwimpact.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class RegionConfiguration : IEntityTypeConfiguration<Region>
{
    public void Configure(EntityTypeBuilder<Region> builder)
    {
        builder.ToTable("Regions");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.Type)
            .IsRequired()
            .HasMaxLength(50)
            .HasConversion<string>();

        builder.Property(r => r.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // Self-reference: parent FK with Restrict
        builder.HasOne(r => r.ParentRegion)
            .WithMany(r => r.ChildRegions)
            .HasForeignKey(r => r.ParentRegionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraint: (Name, Type, ParentRegionId) with NULLS NOT DISTINCT for PostgreSQL
        // Uses Npgsql EF Core extension to treat null ParentRegionId values as equal,
        // preventing duplicate root Regions at the database level.
        builder.HasIndex(r => new { r.Name, r.Type, r.ParentRegionId })
            .IsUnique()
            .AreNullsDistinct(false)
            .HasDatabaseName("IX_Regions_Name_Type_ParentRegionId");

        // Composite indexes
        builder.HasIndex(r => new { r.Type, r.IsActive })
            .HasDatabaseName("IX_Regions_Type_IsActive");

        builder.HasIndex(r => r.ParentRegionId)
            .HasDatabaseName("IX_Regions_ParentRegionId");
    }
}