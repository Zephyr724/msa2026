namespace Kiwimpact.Core.Entities;

public sealed class SocialPostTag
{
    internal SocialPostTag()
    {
        Name = string.Empty;
        NormalizedName = string.Empty;
    }

    public Guid PostId { get; internal set; }
    public string Name { get; internal set; }
    public string NormalizedName { get; internal set; }
    public SocialPost? Post { get; internal set; }

    internal static SocialPostTag Create(Guid postId, string value)
    {
        var name = (value ?? string.Empty).Trim().TrimStart('#').Trim();
        if (name.Length == 0)
            throw new ArgumentException("Tags cannot be blank.");
        if (name.Length > SocialPost.MaxTagLength)
            throw new ArgumentException($"Tags must be at most {SocialPost.MaxTagLength} characters.");
        if (name.Any(char.IsControl))
            throw new ArgumentException("Tags cannot contain control characters.");
        var normalizedName = name.ToUpperInvariant();
        if (normalizedName.Length > SocialPost.MaxTagLength)
            throw new ArgumentException($"Normalized tags must be at most {SocialPost.MaxTagLength} characters.");

        return new SocialPostTag
        {
            PostId = postId,
            Name = name,
            NormalizedName = normalizedName,
        };
    }
}
