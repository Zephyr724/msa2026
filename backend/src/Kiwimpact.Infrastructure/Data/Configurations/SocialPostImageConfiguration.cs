using Kiwimpact.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class SocialPostImageConfiguration : IEntityTypeConfiguration<SocialPostImage>
{
    public void Configure(EntityTypeBuilder<SocialPostImage> builder)
    {
        builder.ToTable("SocialPostImages", table =>
        {
            table.HasCheckConstraint(
                "CK_SocialPostImages_SortOrder",
                $"\"SortOrder\" >= 0 AND \"SortOrder\" < {SocialPost.MaxImages}");
        });
        builder.HasKey(image => new { image.PostId, image.SortOrder });
        builder.Property(image => image.Url)
            .HasMaxLength(SocialPost.MaxImageUrlLength)
            .IsRequired();
        builder.Property(image => image.AltText)
            .HasMaxLength(SocialPost.MaxImageAltTextLength)
            .IsRequired();
        builder.HasOne(image => image.Post)
            .WithMany(post => post.Images)
            .HasForeignKey(image => image.PostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
