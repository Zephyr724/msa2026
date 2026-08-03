using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class SocialCommentConfiguration : IEntityTypeConfiguration<SocialComment>
{
    public void Configure(EntityTypeBuilder<SocialComment> builder)
    {
        builder.ToTable("SocialComments", table =>
        {
            table.HasCheckConstraint(
                "CK_SocialComments_NotSelfParent",
                "\"ParentCommentId\" IS NULL OR \"ParentCommentId\" <> \"Id\"");
        });

        builder.HasKey(comment => comment.Id);
        builder.Property(comment => comment.Content)
            .HasMaxLength(SocialComment.MaxContentLength)
            .IsRequired();

        builder.HasOne(comment => comment.Post)
            .WithMany(post => post.Comments)
            .HasForeignKey(comment => comment.PostId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(comment => comment.AuthorUserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(comment => comment.ParentComment)
            .WithMany(comment => comment.Replies)
            .HasForeignKey(comment => comment.ParentCommentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(comment => new
            {
                comment.PostId,
                comment.ParentCommentId,
                comment.CreatedAt,
                comment.Id,
            })
            .HasDatabaseName("IX_SocialComments_Post_Parent_CreatedAt_Id");
        builder.HasIndex(comment => comment.AuthorUserId)
            .HasDatabaseName("IX_SocialComments_AuthorUserId");
        builder.HasIndex(comment => comment.ParentCommentId)
            .HasDatabaseName("IX_SocialComments_ParentCommentId");
    }
}
