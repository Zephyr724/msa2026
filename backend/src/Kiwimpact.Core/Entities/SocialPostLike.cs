namespace Kiwimpact.Core.Entities;

public sealed class SocialPostLike
{
    internal SocialPostLike()
    {
    }

    public Guid PostId { get; internal set; }
    public Guid UserId { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }

    public SocialPost? Post { get; internal set; }

    public static SocialPostLike Create(Guid postId, Guid userId, DateTimeOffset now)
    {
        if (postId == Guid.Empty)
            throw new ArgumentException("A post is required.");
        if (userId == Guid.Empty)
            throw new ArgumentException("An authenticated user is required.");

        return new SocialPostLike
        {
            PostId = postId,
            UserId = userId,
            CreatedAt = now.ToUniversalTime(),
        };
    }
}
