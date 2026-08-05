using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class SocialPostConfiguration : IEntityTypeConfiguration<SocialPost>
{
    public void Configure(EntityTypeBuilder<SocialPost> builder)
    {
        builder.ToTable("SocialPosts", table =>
        {
            table.HasCheckConstraint(
                "CK_SocialPosts_ImageMetadata_Pair",
                "(\"ImageUrl\" IS NULL AND \"ImageAltText\" IS NULL) OR " +
                "(\"ImageUrl\" IS NOT NULL AND \"ImageAltText\" IS NOT NULL)");
        });

        builder.HasKey(post => post.Id);
        builder.Property(post => post.Title)
            .HasMaxLength(SocialPost.MaxTitleLength)
            .IsRequired();
        builder.Property(post => post.Content)
            .HasMaxLength(SocialPost.MaxContentLength)
            .IsRequired();
        builder.Property(post => post.IsHidden)
            .HasDefaultValue(false);
        builder.Property(post => post.ImageUrl)
            .HasMaxLength(SocialPost.MaxImageUrlLength);
        builder.Property(post => post.ImageAltText)
            .HasMaxLength(SocialPost.MaxImageAltTextLength);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(post => post.AuthorUserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(post => post.Quest)
            .WithMany()
            .HasForeignKey(post => post.QuestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(post => new { post.CreatedAt, post.Id })
            .HasDatabaseName("IX_SocialPosts_CreatedAt_Id");
        builder.HasIndex(post => post.AuthorUserId)
            .HasDatabaseName("IX_SocialPosts_AuthorUserId");
        builder.HasIndex(post => post.QuestId)
            .HasDatabaseName("IX_SocialPosts_QuestId");
    }
}
