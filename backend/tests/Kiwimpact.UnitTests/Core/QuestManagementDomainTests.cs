using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Core;

public sealed class QuestManagementDomainTests
{
    private static readonly Guid OwnerId = new("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static readonly DateTimeOffset Now = new(2026, 7, 24, 6, 0, 0, TimeSpan.Zero);

    [Fact]
    public void CreateOrganizerOwned_SetsServerFieldsAndRequiredCover()
    {
        var quest = CreateQuest();

        Assert.Equal(OwnerId, quest.CreatedByUserId);
        Assert.Equal(QuestSourceType.OrganizerOwned, quest.SourceType);
        Assert.Equal(QuestStatus.Draft, quest.Status);
        Assert.Equal(0, quest.XpAward);
        var cover = Assert.Single(quest.Images);
        Assert.True(cover.IsCover);
        Assert.Equal(0, cover.SortOrder);
        Assert.Equal("/images/quests/cover.svg", cover.ImageUrl);
    }

    [Fact]
    public void Ownership_AllowsOwnerAndAdminOnly()
    {
        var quest = CreateQuest();
        var anotherUser = Guid.NewGuid();

        Assert.True(QuestManagementAuthorization.CanManage(quest, OwnerId, isAdmin: false));
        Assert.False(QuestManagementAuthorization.CanManage(quest, anotherUser, isAdmin: false));
        Assert.True(QuestManagementAuthorization.CanManage(quest, anotherUser, isAdmin: true));
    }

    [Theory]
    [InlineData("", 10, 1)]
    [InlineData("Valid", -1, 1)]
    [InlineData("Valid", 10, 999)]
    public void Create_InvalidFields_Throws(string title, int capacity, int categoryValue)
    {
        var details = ValidDetails() with
        {
            Title = title,
            Capacity = capacity,
            Category = (QuestCategory)categoryValue,
        };

        Assert.Throws<ArgumentException>(() =>
            Quest.CreateOrganizerOwned(OwnerId, details, ValidCover(), Now));
    }

    [Fact]
    public void Create_EndBeforeStart_Throws()
    {
        var details = ValidDetails() with
        {
            StartAtUtc = Now.AddHours(2),
            EndAtUtc = Now.AddHours(1),
        };

        Assert.Throws<ArgumentException>(() =>
            Quest.CreateOrganizerOwned(OwnerId, details, ValidCover(), Now));
    }

    [Theory]
    [InlineData("http://example.test/quest", "/images/quests/cover.svg")]
    [InlineData("https://example.test/quest", "http://example.test/cover.svg")]
    [InlineData("https://example.test/quest", "//example.test/cover.svg")]
    public void Create_InvalidUrls_Throws(string externalUrl, string imageUrl)
    {
        var details = ValidDetails() with { ExternalSourceUrl = externalUrl };
        var cover = ValidCover() with { ImageUrl = imageUrl };

        Assert.Throws<ArgumentException>(() =>
            Quest.CreateOrganizerOwned(OwnerId, details, cover, Now));
    }

    [Fact]
    public void Update_PreservesServerFieldsAndCanUpdateCover()
    {
        var quest = CreateQuest();

        quest.UpdateDetails(
            ValidDetails() with { Title = " Updated title " },
            ValidCover() with { AltText = "Updated cover" },
            Now.AddMinutes(1));

        Assert.Equal("Updated title", quest.Title);
        Assert.Equal(OwnerId, quest.CreatedByUserId);
        Assert.Equal(QuestSourceType.OrganizerOwned, quest.SourceType);
        Assert.Equal(QuestStatus.Draft, quest.Status);
        Assert.Equal(0, quest.XpAward);
        Assert.Equal("Updated cover", Assert.Single(quest.Images).AltText);
    }

    [Fact]
    public void Lifecycle_EnforcesAcceptedTransitions()
    {
        var quest = CreateQuest();

        Assert.Throws<InvalidOperationException>(() => quest.Archive(Now));
        quest.Publish(Now.AddMinutes(1));
        Assert.Equal(QuestStatus.Published, quest.Status);
        Assert.Throws<InvalidOperationException>(() => quest.Publish(Now.AddMinutes(2)));
        Assert.Throws<InvalidOperationException>(() => quest.EnsureCanDelete());
        quest.Cancel(Now.AddMinutes(3));
        quest.Archive(Now.AddMinutes(4));
        Assert.Equal(QuestStatus.Archived, quest.Status);
    }

    [Fact]
    public void EndedPublishedQuest_CanArchiveDirectly()
    {
        var quest = Quest.CreateOrganizerOwned(
            OwnerId,
            ValidDetails() with { StartAtUtc = Now.AddHours(-2), EndAtUtc = Now.AddHours(-1) },
            ValidCover(),
            Now.AddHours(-3));
        quest.Publish(Now.AddHours(-2));

        quest.Archive(Now);

        Assert.Equal(QuestStatus.Archived, quest.Status);
    }

    private static Quest CreateQuest() =>
        Quest.CreateOrganizerOwned(OwnerId, ValidDetails(), ValidCover(), Now);

    private static QuestDetails ValidDetails() => new(
        "Community cleanup",
        "Help restore a local stream.",
        QuestCategory.RestoreNature,
        RegistrationMode.Native,
        QuestDifficulty.Easy,
        20,
        Now.AddDays(1),
        Now.AddDays(1).AddHours(2),
        null,
        "Community reserve",
        "https://example.test/quest");

    private static QuestCoverImageDetails ValidCover() => new(
        "/images/quests/cover.svg",
        "Volunteers beside a stream",
        "Kiwimpact",
        "https://example.test/source",
        "Project-owned image");
}
