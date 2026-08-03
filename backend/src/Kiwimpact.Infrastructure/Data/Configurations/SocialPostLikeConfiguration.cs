using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class SocialPostLikeConfiguration : IEntityTypeConfiguration<SocialPostLike>
{
    public void Configure(EntityTypeBuilder<SocialPostLike> builder)
    {
        builder.ToTable("SocialPostLikes");
        builder.HasKey(like => new { like.PostId, like.UserId });

        builder.HasOne(like => like.Post)
            .WithMany(post => post.Likes)
            .HasForeignKey(like => like.PostId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(like => like.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(like => like.UserId)
            .HasDatabaseName("IX_SocialPostLikes_UserId");
    }
}
