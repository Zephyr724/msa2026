using System.Security.Cryptography;
using System.Text;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Security;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Core;

public sealed class QuestCompletionDomainTests
{
    private static readonly DateTimeOffset Now =
        new(2026, 7, 25, 8, 0, 0, TimeSpan.Zero);
    private static readonly byte[] Key =
        Enumerable.Range(1, 32).Select(value => (byte)value).ToArray();

    [Fact]
    public void FormatGuaranteesTenCanonicalCharactersAndFiftyBits()
    {
        var protector = new CompletionCodeProtector(Key);
        var generated = Enumerable.Range(0, 128)
            .Select(_ => protector.GenerateNormalizedCode())
            .ToArray();

        Assert.Equal(32, CompletionCodeProtector.Alphabet.Length);
        Assert.Equal(10, CompletionCodeProtector.CodeLength);
        Assert.Equal(50, CompletionCodeProtector.EntropyBits);
        Assert.All(generated, code =>
        {
            Assert.Equal(10, code.Length);
            Assert.All(code, character =>
                Assert.Contains(character, CompletionCodeProtector.Alphabet));
            Assert.DoesNotContain('I', code);
            Assert.DoesNotContain('O', code);
            Assert.DoesNotContain('0', code);
            Assert.DoesNotContain('1', code);
            Assert.Equal($"{code[..5]}-{code[5..]}",
                CompletionCodeProtector.FormatForDisplay(code));
        });
    }

    [Theory]
    [InlineData("ABCDE23456", true, "ABCDE23456")]
    [InlineData("abcde-23456", true, "ABCDE23456")]
    [InlineData("  ABC DE-23456  ", true, "ABCDE23456")]
    [InlineData("ABCDE\t23456", false, "")]
    [InlineData("ABCDE–23456", false, "")]
    [InlineData("ABCDI23456", false, "")]
    [InlineData("ABCDO23456", false, "")]
    [InlineData("ABCD023456", false, "")]
    [InlineData("ABCD123456", false, "")]
    [InlineData("ABCD23456", false, "")]
    [InlineData("ABCDEF23456", false, "")]
    [InlineData("", false, "")]
    [InlineData(null, false, "")]
    public void NormalizationUsesOneCanonicalRule(
        string? submitted,
        bool expected,
        string expectedNormalized)
    {
        var result = CompletionCodeProtector.TryNormalize(submitted, out var normalized);

        Assert.Equal(expected, result);
        Assert.Equal(expectedNormalized, normalized);
    }

    [Fact]
    public void HmacUsesExactQuestBoundUtf8SerializationAndBase64Output()
    {
        var questId = Guid.Parse("00112233-4455-6677-8899-aabbccddeeff");
        const string code = "ABCDE23456";
        var protector = new CompletionCodeProtector(Key);
        var expectedInput = Encoding.UTF8.GetBytes(
            "00112233-4455-6677-8899-aabbccddeeff:ABCDE23456");
        var expected = Convert.ToBase64String(HMACSHA256.HashData(Key, expectedInput));

        var actual = protector.ComputeHash(questId, code);

        Assert.Equal(expected, actual);
        Assert.True(protector.Verify(questId, "abcde-23456", actual));
        Assert.False(protector.Verify(Guid.NewGuid(), code, actual));
        Assert.False(protector.Verify(questId, "ABCDE23457", actual));
        Assert.False(protector.Verify(questId, "malformed", actual));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-base64")]
    [InlineData("AQID")]
    public void StartupKeyValidationRejectsMissingInvalidOrShortValues(string? configured)
    {
        Assert.Throws<InvalidOperationException>(() =>
            CompletionCodeProtector.DecodeConfiguredKey(configured));
    }

    [Fact]
    public void StartupKeyValidationAcceptsAtLeastThirtyTwoDecodedBytes()
    {
        var decoded = CompletionCodeProtector.DecodeConfiguredKey(
            Convert.ToBase64String(Key));

        Assert.Equal(Key, decoded);
    }

    [Fact]
    public void ValidityUsesLaterStartAndSevenCalendarDayGrace()
    {
        var futureStart = Now.AddDays(1);
        var end = Now.AddDays(3);

        var future = CompletionCodeValidity.Derive(futureStart, end, Now);
        var immediate = CompletionCodeValidity.Derive(Now.AddDays(-1), end, Now);
        var noExpiry = CompletionCodeValidity.Derive(null, null, Now);

        Assert.Equal(futureStart, future.ValidFromUtc);
        Assert.Equal(end.AddDays(7), future.ValidToUtc);
        Assert.Equal(Now, immediate.ValidFromUtc);
        Assert.Null(noExpiry.ValidToUtc);
    }

    [Fact]
    public void EmptyValidityWindowIsRejectedAtAndAfterBoundary()
    {
        var end = Now.AddDays(-7);

        var exception = Assert.Throws<QuestCompletionException>(() =>
            CompletionCodeValidity.Derive(null, end, Now));

        Assert.Equal(QuestCompletionError.EmptyValidityWindow, exception.Error);
    }

    [Fact]
    public void CreatorRulePrecedesDraftAndUnsupportedMode()
    {
        var creatorId = Guid.NewGuid();
        var quest = CreateQuest(creatorId, RegistrationMode.External);

        var exception = Assert.Throws<QuestCompletionException>(() =>
            QuestCompletionEligibility.EnsureRedemptionQuest(quest, creatorId));

        Assert.Equal(QuestCompletionError.OwnQuest, exception.Error);
    }

    [Fact]
    public void VerifiedCompletionCapturesImmutableDifficultyAndCommunitySnapshots()
    {
        var creatorId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var communityId = Guid.NewGuid();
        var quest = CreateQuest(creatorId, RegistrationMode.Native);
        quest.Publish(Now.AddDays(-1));
        var participation = QuestParticipation.CreateActive(participantId, quest.Id, Now);
        var completion = QuestCompletion.CreateVerifiedWithCode(
            participantId,
            quest,
            participation,
            communityId,
            Now);

        quest.UpdateDetails(
            CreateDetails(RegistrationMode.Native, QuestDifficulty.Hard),
            null,
            Now.AddHours(1));

        Assert.Equal(QuestCompletionStatus.Verified, completion.Status);
        Assert.Equal(CompletionMethod.CompletionCode, completion.Method);
        Assert.Equal(participation.Id, completion.ParticipationId);
        Assert.Equal(QuestDifficulty.Easy, completion.RewardDifficultySnapshot);
        Assert.Equal(communityId, completion.CommunityRegionIdAtCompletion);
        Assert.Equal(completion.CompletedAt, completion.VerifiedAtUtc);
    }

    [Fact]
    public void CancelledParticipationCannotCreateVerifiedCompletion()
    {
        var quest = CreateQuest(Guid.NewGuid(), RegistrationMode.Native);
        quest.Publish(Now.AddDays(-1));
        var userId = Guid.NewGuid();
        var participation = QuestParticipation.CreateActive(userId, quest.Id, Now);
        participation.Cancel(Now.AddMinutes(1));

        Assert.Throws<ArgumentException>(() =>
            QuestCompletion.CreateVerifiedWithCode(
                userId, quest, participation, null, Now.AddMinutes(2)));
    }

    private static Quest CreateQuest(Guid creatorId, RegistrationMode registrationMode) =>
        Quest.CreateOrganizerOwned(
            creatorId,
            CreateDetails(registrationMode, QuestDifficulty.Easy),
            new QuestCoverImageDetails(
                "/images/quests/completion.svg",
                "Completion test cover",
                null,
                null,
                null),
            Now.AddDays(-2));

    private static QuestDetails CreateDetails(
        RegistrationMode registrationMode,
        QuestDifficulty difficulty) =>
        new(
            "Completion test Quest",
            "A focused Quest for completion domain behavior.",
            QuestCategory.RestoreNature,
            registrationMode,
            difficulty,
            10,
            Now.AddDays(-1),
            Now.AddDays(1),
            null,
            null,
            registrationMode == RegistrationMode.External
                ? "https://example.test/completion"
                : null);
}
