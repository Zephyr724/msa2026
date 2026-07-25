using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kiwimpact.Infrastructure.Data.Configurations;

public sealed class QuestParticipationConfiguration
    : IEntityTypeConfiguration<QuestParticipation>
{
    public void Configure(EntityTypeBuilder<QuestParticipation> builder)
    {
        builder.ToTable("QuestParticipations");

        builder.HasKey(participation => participation.Id);

        builder.Property(participation => participation.UserId)
            .IsRequired();
        builder.Property(participation => participation.QuestId)
            .IsRequired();
        builder.Property(participation => participation.JoinedAt)
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(participation => participation.UserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne(participation => participation.Quest)
            .WithMany(quest => quest.Participations)
            .HasForeignKey(participation => participation.QuestId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.Property(participation => participation.Version)
            .IsRowVersion()
            .HasConversion<uint>();

        builder.HasIndex(participation => new
            {
                participation.UserId,
                participation.QuestId,
            })
            .IsUnique()
            .HasFilter("\"CancelledAt\" IS NULL")
            .HasDatabaseName("UX_QuestParticipations_UserId_QuestId_Active");

        builder.HasIndex(participation => participation.QuestId)
            .HasFilter("\"CancelledAt\" IS NULL")
            .HasDatabaseName("IX_QuestParticipations_QuestId_Active");
    }
}
