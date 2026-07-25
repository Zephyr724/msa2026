namespace Kiwimpact.Core.Entities;

public sealed class CompletionCode
{
    public const int MaxCodeHashLength = 256;

    internal CompletionCode()
    {
        CodeHash = string.Empty;
    }

    public Guid Id { get; internal set; }
    public Guid QuestId { get; internal set; }
    public string CodeHash { get; internal set; }
    public DateTimeOffset ValidFrom { get; internal set; }
    public DateTimeOffset? ValidTo { get; internal set; }
    public bool IsActive { get; internal set; }
    public bool IsRevoked { get; internal set; }
    public Guid CreatedByUserId { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }

    public Quest? Quest { get; internal set; }

    public static CompletionCode Create(
        Guid questId,
        string codeHash,
        DateTimeOffset validFrom,
        DateTimeOffset? validTo,
        Guid createdByUserId,
        DateTimeOffset now)
    {
        if (questId == Guid.Empty)
            throw new ArgumentException("Quest is required.", nameof(questId));
        if (createdByUserId == Guid.Empty)
            throw new ArgumentException("Authenticated creator is required.", nameof(createdByUserId));
        ArgumentException.ThrowIfNullOrWhiteSpace(codeHash);
        if (codeHash.Length > MaxCodeHashLength)
            throw new ArgumentOutOfRangeException(nameof(codeHash));

        var fromUtc = validFrom.ToUniversalTime();
        var toUtc = validTo?.ToUniversalTime();
        if (toUtc.HasValue && toUtc.Value <= fromUtc)
            throw new ArgumentException("Completion Code validity window must not be empty.");

        return new CompletionCode
        {
            Id = Guid.NewGuid(),
            QuestId = questId,
            CodeHash = codeHash,
            ValidFrom = fromUtc,
            ValidTo = toUtc,
            IsActive = true,
            IsRevoked = false,
            CreatedByUserId = createdByUserId,
            CreatedAt = now.ToUniversalTime(),
        };
    }

    public void Revoke()
    {
        IsActive = false;
        IsRevoked = true;
    }
}
