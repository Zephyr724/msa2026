using Kiwimpact.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class SocialPostTagConfiguration : IEntityTypeConfiguration<SocialPostTag>
{
    public void Configure(EntityTypeBuilder<SocialPostTag> builder)
    {
        builder.ToTable("SocialPostTags");
        builder.HasKey(tag => new { tag.PostId, tag.NormalizedName });
        builder.Property(tag => tag.Name)
            .HasMaxLength(SocialPost.MaxTagLength)
            .IsRequired();
        builder.Property(tag => tag.NormalizedName)
            .HasMaxLength(SocialPost.MaxTagLength)
            .IsRequired();
        builder.HasOne(tag => tag.Post)
            .WithMany(post => post.Tags)
            .HasForeignKey(tag => tag.PostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
