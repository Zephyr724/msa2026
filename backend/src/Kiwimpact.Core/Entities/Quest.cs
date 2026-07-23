using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Entities;

public sealed class Quest
{
    internal Quest()
    {
        Title = string.Empty;
        Description = string.Empty;
    }

    public Guid Id { get; internal set; }
    public string Title { get; internal set; }
    public string Description { get; internal set; }
    public QuestCategory Category { get; internal set; }
    public QuestStatus Status { get; internal set; }
    public QuestSourceType SourceType { get; internal set; }
    public RegistrationMode? RegistrationMode { get; internal set; }
    public QuestDifficulty Difficulty { get; internal set; }
    public int XpAward { get; internal set; }
    public int? Capacity { get; internal set; }
    public DateTimeOffset? StartAtUtc { get; internal set; }
    public DateTimeOffset? EndAtUtc { get; internal set; }
    public Guid? LocationRegionId { get; internal set; }
    public string? LocationDescription { get; internal set; }
    public string? ExternalSourceUrl { get; internal set; }
    public ExternalSourceStatus? ExternalSourceStatus { get; internal set; }
    public DateTimeOffset? SourceCheckedAt { get; internal set; }
    public DateTimeOffset? NextCheckDueAt { get; internal set; }
    public Guid CreatedByUserId { get; internal set; }
    public uint Version { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    // Navigation properties
    public Region? LocationRegion { get; internal set; }
    public ICollection<QuestImage> Images { get; internal set; } = new List<QuestImage>();
}