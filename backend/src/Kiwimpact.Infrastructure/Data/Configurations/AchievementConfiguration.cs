using Kiwimpact.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class AchievementConfiguration : IEntityTypeConfiguration<Achievement>
{
    public void Configure(EntityTypeBuilder<Achievement> builder)
    {
        builder.ToTable("Achievements");

        builder.HasKey(achievement => achievement.Id);

        builder.Property(achievement => achievement.Code)
            .IsRequired()
            .HasMaxLength(Achievement.MaxCodeLength);
        builder.Property(achievement => achievement.Name)
            .IsRequired()
            .HasMaxLength(Achievement.MaxNameLength);
        builder.Property(achievement => achievement.Description)
            .IsRequired()
            .HasMaxLength(Achievement.MaxDescriptionLength);
        builder.Property(achievement => achievement.IconUrl)
            .HasMaxLength(Achievement.MaxIconUrlLength);
        builder.Property(achievement => achievement.Category)
            .IsRequired()
            .HasMaxLength(Achievement.MaxCategoryLength);
        builder.Property(achievement => achievement.IsActive)
            .IsRequired()
            .HasDefaultValue(true);
        builder.Property(achievement => achievement.CreatedAt)
            .IsRequired();

        builder.HasIndex(achievement => achievement.Code)
            .IsUnique()
            .HasDatabaseName("UX_Achievements_Code");
    }
}
