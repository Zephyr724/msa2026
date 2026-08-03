using Kiwimpact.Api.Security;

namespace Kiwimpact.UnitTests.Api;

public sealed class FrontendAccountLinkBuilderTests
{
    [Fact]
    public void BuildWithoutQuery_DoesNotAppendEmptyQuestionMark()
    {
        var link = FrontendAccountLinkBuilder.Build(
            "https://app.example.test/",
            "/passport");

        Assert.Equal("https://app.example.test/passport", link);
    }

    [Fact]
    public void Build_PercentEncodesReservedTokenCharacters()
    {
        var link = FrontendAccountLinkBuilder.Build(
            "http://localhost:5173/",
            "/confirm-email",
            ("userId", "member-id"),
            ("token", "abc+/="));

        Assert.Equal(
            "http://localhost:5173/confirm-email?userId=member-id&token=abc%2B%2F%3D",
            link);
    }
}
