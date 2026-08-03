namespace Kiwimpact.Core.Entities;

public sealed class EvidenceClaimDetail
{
    public const int MaxDescriptionLength = 500;
    public const int MaxEvidenceUrlLength = 2000;
    public const int MaxReviewNoteLength = 500;

    internal EvidenceClaimDetail()
    {
    }

    public Guid Id { get; internal set; }
    public Guid QuestCompletionId { get; internal set; }
    public string? Description { get; internal set; }
    public string? EvidenceUrl { get; internal set; }
    public bool UserDeclaration { get; internal set; }
    public string? ReviewNote { get; internal set; }
    public Guid? ReviewedByUserId { get; internal set; }
    public DateTimeOffset? ReviewedAt { get; internal set; }
    public DateTimeOffset? EvidencePurgeDueAt { get; internal set; }
    public DateTimeOffset? EvidencePurgedAt { get; internal set; }

    public QuestCompletion? QuestCompletion { get; internal set; }

    public static EvidenceClaimDetail Create(
        Guid completionId,
        string? description,
        string? evidenceUrl,
        bool userDeclaration)
    {
        if (completionId == Guid.Empty)
            throw new ArgumentException("Completion is required.", nameof(completionId));
        if (!userDeclaration)
            throw new ArgumentException("The accuracy declaration is required.", nameof(userDeclaration));

        return new EvidenceClaimDetail
        {
            Id = Guid.NewGuid(),
            QuestCompletionId = completionId,
            Description = Required(description, MaxDescriptionLength, "Description"),
            EvidenceUrl = NormalizeHttpsUrl(evidenceUrl),
            UserDeclaration = true,
        };
    }

    public void Update(string? description, string? evidenceUrl, bool userDeclaration)
    {
        if (ReviewedAt.HasValue)
            throw new InvalidOperationException("Reviewed evidence cannot be changed.");
        if (!userDeclaration)
            throw new ArgumentException("The accuracy declaration is required.", nameof(userDeclaration));
        Description = Required(description, MaxDescriptionLength, "Description");
        EvidenceUrl = NormalizeHttpsUrl(evidenceUrl);
        UserDeclaration = true;
    }

    public void RecordReview(Guid reviewerId, string? reviewNote, DateTimeOffset now)
    {
        if (reviewerId == Guid.Empty)
            throw new ArgumentException("Reviewer is required.", nameof(reviewerId));
        if (ReviewedAt.HasValue)
            throw new InvalidOperationException("Evidence has already been reviewed.");
        var timestamp = now.ToUniversalTime();
        ReviewNote = Optional(reviewNote, MaxReviewNoteLength, "Review note");
        ReviewedByUserId = reviewerId;
        ReviewedAt = timestamp;
        // Sensitive evidence is retained only long enough to support review
        // and a bounded follow-up period.
        EvidencePurgeDueAt = timestamp.AddDays(90);
    }

    public void Purge(DateTimeOffset now)
    {
        if (!EvidencePurgeDueAt.HasValue || EvidencePurgeDueAt.Value > now.ToUniversalTime())
            throw new InvalidOperationException("Evidence is not due for purge.");
        // Preserve the audit timestamps while removing user-supplied content.
        Description = null;
        EvidenceUrl = null;
        ReviewNote = null;
        EvidencePurgedAt = now.ToUniversalTime();
    }

    private static string Required(string? value, int max, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{field} is required.");
        var normalized = value.Trim();
        if (normalized.Length > max)
            throw new ArgumentException($"{field} must be at most {max} characters.");
        return normalized;
    }

    private static string? Optional(string? value, int max, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var normalized = value.Trim();
        if (normalized.Length > max)
            throw new ArgumentException($"{field} must be at most {max} characters.");
        return normalized;
    }

    private static string? NormalizeHttpsUrl(string? value)
    {
        var normalized = Optional(value, MaxEvidenceUrlLength, "Evidence URL");
        if (normalized is null)
            return null;
        if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps)
        {
            throw new ArgumentException("Evidence URL must be an absolute HTTPS URL.");
        }
        return normalized;
    }
}
