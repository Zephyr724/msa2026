using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Entities;

/// <summary>
/// Curated copy eligible for one-time selection when a verified completion
/// creates its immutable member reward event.
/// </summary>
public sealed class CompletionCelebrationCopy
{
    public const int MaxTextLength = 280;

    internal CompletionCelebrationCopy()
    {
        Text = string.Empty;
    }

    public Guid Id { get; internal set; }
    public CompletionCelebrationCopyKind Kind { get; internal set; }
    public string Text { get; internal set; }
    public int SortOrder { get; internal set; }
    public bool IsActive { get; internal set; }
}
