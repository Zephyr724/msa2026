using Kiwimpact.Api.Mapping;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Api;

/// <summary>
/// Mapping tests for the Passport completion history item DTO: enum and
/// timestamp formatting plus the nullable XP amount.
/// </summary>
public sealed class PassportMappingTests
{
    private static readonly DateTimeOffset CompletedAt =
        new(2026, 7, 20, 10, 15, 30, 123, TimeSpan.Zero);
    private static readonly DateTimeOffset VerifiedAt =
        new(2026, 7, 21, 12, 30, 45, 456, TimeSpan.Zero);

    [Fact]
    public void ItemMapsEnumsAndTimestampsInTheContractFormats()
    {
        var item = NewItem() with
        {
            QuestCategory = QuestCategory.ProtectWildlife,
            QuestStatus = QuestStatus.Cancelled,
            XpAmount = 150,
        };

        var dto = item.ToDto();

        Assert.Equal(item.CompletionId, dto.CompletionId);
        Assert.Equal(item.QuestId, dto.QuestId);
        Assert.Equal("Quest title", dto.QuestTitle);
        Assert.Equal("ProtectWildlife", dto.QuestCategory);
        Assert.Equal("Cancelled", dto.QuestStatus);
        Assert.Equal("Verified", dto.Status);
        Assert.Equal("CompletionCode", dto.Method);
        Assert.Equal(CompletedAt.ToString("O"), dto.CompletedAtUtc);
        Assert.Equal(VerifiedAt.ToString("O"), dto.VerifiedAtUtc);
        Assert.Equal("2026-07-20T10:15:30.1230000+00:00", dto.CompletedAtUtc);
        Assert.Equal("2026-07-21T12:30:45.4560000+00:00", dto.VerifiedAtUtc);
        Assert.Equal(150, dto.XpAmount);
    }

    [Fact]
    public void NullXpAmountStaysNull()
    {
        var dto = NewItem() with { XpAmount = null };

        Assert.Null(dto.ToDto().XpAmount);
    }

    private static PassportCompletionItem NewItem() =>
        new(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Quest title",
            QuestCategory.RestoreNature,
            QuestStatus.Published,
            QuestCompletionStatus.Verified,
            CompletionMethod.CompletionCode,
            CompletedAt,
            VerifiedAt,
            50);
}
