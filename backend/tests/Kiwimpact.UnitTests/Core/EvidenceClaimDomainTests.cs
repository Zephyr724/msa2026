using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;

namespace Kiwimpact.UnitTests.Core;

public sealed class EvidenceClaimDomainTests
{
    [Fact]
    public void EvidenceRequiresDeclarationAndHttps()
    {
        var completionId = Guid.NewGuid();
        Assert.Throws<ArgumentException>(() => EvidenceClaimDetail.Create(
            completionId, "Planted native trees.", null, false));
        Assert.Throws<ArgumentException>(() => EvidenceClaimDetail.Create(
            completionId, "Planted native trees.", "http://example.test/evidence", true));

        var detail = EvidenceClaimDetail.Create(
            completionId, "  Planted native trees.  ",
            "https://example.test/evidence", true);
        Assert.Equal("Planted native trees.", detail.Description);
        Assert.Equal("https://example.test/evidence", detail.EvidenceUrl);
    }

    [Fact]
    public void ReviewSchedulesPurgeAndPurgeClearsOnlySensitiveFields()
    {
        var detail = EvidenceClaimDetail.Create(
            Guid.NewGuid(), "Evidence", "https://example.test/evidence", true);
        var reviewer = Guid.NewGuid();
        var reviewedAt = DateTimeOffset.Parse("2026-07-27T00:00:00Z");
        detail.RecordReview(reviewer, "Approved.", reviewedAt);

        Assert.Equal(reviewedAt.AddDays(90), detail.EvidencePurgeDueAt);
        detail.Purge(reviewedAt.AddDays(91));
        Assert.Null(detail.Description);
        Assert.Null(detail.EvidenceUrl);
        Assert.Null(detail.ReviewNote);
        Assert.Equal(reviewer, detail.ReviewedByUserId);
        Assert.True(detail.UserDeclaration);
        Assert.NotNull(detail.EvidencePurgedAt);
    }
}
