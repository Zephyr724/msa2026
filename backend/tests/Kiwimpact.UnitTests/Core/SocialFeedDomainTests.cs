using Kiwimpact.Core.Entities;

namespace Kiwimpact.UnitTests.Core;

public sealed class SocialFeedDomainTests
{
    private static readonly DateTimeOffset Now =
        new(2026, 7, 31, 20, 0, 0, TimeSpan.FromHours(12));

    [Fact]
    public void PostCreate_NormalizesQuestStoryImagesTagsAndTimestamp()
    {
        var questId = Guid.NewGuid();
        var post = SocialPost.Create(
            Guid.NewGuid(),
            questId,
            "  Our planting day  ",
            "  Planted native seedlings today.  ",
            [new SocialPostImageDetails(
                "  https://images.example.test/seedlings.jpg  ",
                "  Native seedlings beside a walking track  ")],
            [" #StreamCare ", "streamcare", "Auckland"],
            true,
            Now);

        Assert.Equal(questId, post.QuestId);
        Assert.Equal("Our planting day", post.Title);
        Assert.Equal("Planted native seedlings today.", post.Content);
        var image = Assert.Single(post.Images);
        Assert.Equal("https://images.example.test/seedlings.jpg", image.Url);
        Assert.Equal("Native seedlings beside a walking track", image.AltText);
        Assert.Equal(0, image.SortOrder);
        Assert.Equal(["Auckland", "StreamCare"], post.Tags.Select(tag => tag.Name).Order());
        Assert.True(post.IsHidden);
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
            Guid.NewGuid(),
            "Post title",
            "Post content",
            [new SocialPostImageDetails(imageUrl, "A useful description")],
            [],
            false,
            Now));
    }

    [Fact]
    public void PostCreate_RequiresAltTextExactlyWhenImageExists()
    {
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Post title",
            "Post content",
            [new SocialPostImageDetails("https://images.example.test/photo.jpg", "")],
            [],
            false,
            Now));
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Post title",
            "Post content",
            [new SocialPostImageDetails("", "Orphaned alternative text")],
            [],
            false,
            Now));
    }

    [Fact]
    public void PostCreate_RejectsMissingQuestBlankFieldsAndOversizedContent()
    {
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(), Guid.Empty, "Title", "Content", [], [], false, Now));
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(), Guid.NewGuid(), "  ", "Content", [], [], false, Now));
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Title", "  ", [], [], false, Now));
        Assert.Throws<ArgumentOutOfRangeException>(() => SocialPost.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Post title",
            new string('x', SocialPost.MaxContentLength + 1),
            [],
            [],
            false,
            Now));
    }

    [Fact]
    public void PostCreate_BoundsImagesAndTags()
    {
        var tooManyImages = Enumerable.Range(0, SocialPost.MaxImages + 1)
            .Select(index => new SocialPostImageDetails(
                $"https://images.example.test/{index}.jpg",
                $"Image {index}"))
            .ToArray();
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Title", "Content",
            tooManyImages, [], false, Now));
        Assert.Throws<ArgumentException>(() => SocialPost.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Title", "Content", [],
            Enumerable.Range(0, SocialPost.MaxTags + 1).Select(index => $"tag{index}").ToArray(),
            false, Now));
    }

    [Fact]
    public void PostVisibility_CanChangeAfterPublishing()
    {
        var post = SocialPost.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Title", "Content", [], [], false, Now);

        post.SetVisibility(true, Now.AddMinutes(5));

        Assert.True(post.IsHidden);
        Assert.Equal(Now.AddMinutes(5).ToUniversalTime(), post.UpdatedAt);
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
