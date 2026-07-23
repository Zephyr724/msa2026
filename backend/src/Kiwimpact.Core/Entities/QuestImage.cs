namespace Kiwimpact.Core.Entities;

public sealed class QuestImage
{
    internal QuestImage()
    {
        ImageUrl = string.Empty;
        AltText = string.Empty;
    }

    public Guid Id { get; internal set; }
    public Guid QuestId { get; internal set; }
    public string ImageUrl { get; internal set; }
    public string AltText { get; internal set; }
    public int SortOrder { get; internal set; }
    public bool IsCover { get; internal set; }
    public string? CreatorName { get; internal set; }
    public string? SourceUrl { get; internal set; }
    public string? LicenceNote { get; internal set; }

    // Navigation properties
    public Quest Quest { get; internal set; } = null!;
}