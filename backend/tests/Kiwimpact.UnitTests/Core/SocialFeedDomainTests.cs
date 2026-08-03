using Kiwimpact.Core.Entities;

namespace Kiwimpact.UnitTests.Core;

public sealed class SocialFeedDomainTests
{
    private static readonly DateTimeOffset Now =
        new(2026, 7, 31, 20, 0, 0, TimeSpan.FromHours(12));

    [Fact]
    public void PostCreate_NormalizesContentImageAndTimestamp()
    {
        var post = SocialPost.Create(
            Guid.NewGuid(),
            "  Planted native seedlings today.  ",
            "  https://images.example.test/seedlings.jpg  ",
            "  Native seedlings beside a walking track  ",
            Now);

        Assert.Equal("Planted native seedlings today.", post.Content);
        Assert.Equal("https://images.example.test/seedlings.jpg", post.ImageUrl);
        Assert.Equal("Native seedlings beside a walking track", post.ImageAltText);
        Assert.Equal(TimeSpan.Zero, post.CreatedAt.Offset);
        Assert.Equal(post.CreatedAt, post.UpdatedAt);
    }

    [Theory]
    [InlineData("http://images.example.test/photo.jpg")]
    [InlineData("/images/photo.jpg")]
    [InlineData("https://user:secret@images.example.test/photo.jpg")]
    public void PostCreate_RejectsUnsafeImageUrl(string imageUrl)
    {
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(),
            "Post content",
            imageUrl,
            "A useful description",
            Now));
    }

    [Fact]
    public void PostCreate_RequiresAltTextExactlyWhenImageExists()
    {
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(),
            "Post content",
            "https://images.example.test/photo.jpg",
            null,
            Now));
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(),
            "Post content",
            null,
            "Orphaned alternative text",
            Now));
    }

    [Fact]
    public void PostCreate_RejectsBlankOrOversizedContent()
    {
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(), "  ", null, null, Now));
        Assert.Throws<ArgumentOutOfRangeException>(() => SocialPost.Create(
            Guid.NewGuid(),
            new string('x', SocialPost.MaxContentLength + 1),
            null,
            null,
            Now));
    }

    [Fact]
    public void CommentCreate_NormalizesContentAndSupportsRootOrReply()
    {
        var postId = Guid.NewGuid();
        var parentId = Guid.NewGuid();
        var root = SocialComment.Create(
            postId, Guid.NewGuid(), null, "  Great work!  ", Now);
        var reply = SocialComment.Create(
            postId, Guid.NewGuid(), parentId, "  Thank you.  ", Now);

        Assert.Null(root.ParentCommentId);
        Assert.Equal(parentId, reply.ParentCommentId);
        Assert.Equal("Great work!", root.Content);
        Assert.Equal("Thank you.", reply.Content);
        Assert.Equal(TimeSpan.Zero, reply.CreatedAt.Offset);
    }

    [Fact]
    public void CommentCreate_RejectsInvalidIdentifiersAndContent()
    {
        Assert.Throws<ArgumentException>(() => SocialComment.Create(
            Guid.Empty, Guid.NewGuid(), null, "Comment", Now));
        Assert.Throws<ArgumentException>(() => SocialComment.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.Empty, "Comment", Now));
        Assert.Throws<ArgumentOutOfRangeException>(() => SocialComment.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            new string('x', SocialComment.MaxContentLength + 1),
            Now));
    }
}
