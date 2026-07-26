using Kiwimpact.Core.Achievements;

namespace Kiwimpact.UnitTests.Core;

public sealed class AchievementCatalogTests
{
    [Fact]
    public void CatalogContainsExactlyTheThreeApprovedMilestones()
    {
        Assert.Equal(3, AchievementCatalog.Definitions.Count);
        Assert.All(
            AchievementCatalog.Definitions,
            definition => Assert.Equal(AchievementCatalog.CategoryMilestone, definition.Category));
    }

    [Fact]
    public void FirstStepsMatchesTheApprovedContent()
    {
        var definition = AchievementCatalog.FirstSteps;
        Assert.Equal(new Guid("b5371794-ccd2-45fb-9a7a-f24ec2692bc2"), definition.Id);
        Assert.Equal("verified-completions-1", definition.Code);
        Assert.Equal("First Steps", definition.Name);
        Assert.Equal("Complete your first verified eco quest.", definition.Description);
        Assert.Equal("Milestone", definition.Category);
        Assert.Equal(1, definition.Threshold);
    }

    [Fact]
    public void BuildingMomentumMatchesTheApprovedContent()
    {
        var definition = AchievementCatalog.BuildingMomentum;
        Assert.Equal(new Guid("ed2faa73-1947-4b4b-826a-af7384d4ed10"), definition.Id);
        Assert.Equal("verified-completions-3", definition.Code);
        Assert.Equal("Building Momentum", definition.Name);
        Assert.Equal("Reach three verified quest completions.", definition.Description);
        Assert.Equal("Milestone", definition.Category);
        Assert.Equal(3, definition.Threshold);
    }

    [Fact]
    public void CommittedContributorMatchesTheApprovedContent()
    {
        var definition = AchievementCatalog.CommittedContributor;
        Assert.Equal(new Guid("23cb1a76-1cfb-4b53-b71b-cfee48c3f57b"), definition.Id);
        Assert.Equal("verified-completions-5", definition.Code);
        Assert.Equal("Committed Contributor", definition.Name);
        Assert.Equal("Reach five verified quest completions.", definition.Description);
        Assert.Equal("Milestone", definition.Category);
        Assert.Equal(5, definition.Threshold);
    }

    [Fact]
    public void DefinitionsAreOrderedByStrictlyIncreasingThreshold()
    {
        var thresholds = AchievementCatalog.Definitions
            .Select(definition => definition.Threshold)
            .ToList();
        Assert.Equal([1, 3, 5], thresholds);
        Assert.Equal(thresholds.Count, thresholds.Distinct().Count());
    }

    [Fact]
    public void CodesAndIdsAreUniqueAndCodesOrderLikeThresholds()
    {
        var codes = AchievementCatalog.Definitions
            .Select(definition => definition.Code)
            .ToList();
        Assert.Equal(codes.Count, codes.Distinct(StringComparer.Ordinal).Count());
        Assert.Equal(
            codes.OrderBy(code => code, StringComparer.Ordinal),
            codes);
        Assert.Equal(
            AchievementCatalog.Definitions.Count,
            AchievementCatalog.Definitions.Select(definition => definition.Id).Distinct().Count());
    }

    [Theory]
    [InlineData("verified-completions-1")]
    [InlineData("verified-completions-3")]
    [InlineData("verified-completions-5")]
    public void FindByCodeResolvesEveryApprovedDefinition(string code)
    {
        var definition = AchievementCatalog.FindByCode(code);
        Assert.NotNull(definition);
        Assert.Equal(code, definition.Code);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("verified-completions-2")]
    [InlineData("VERIFIED-COMPLETIONS-1")]
    public void FindByCodeRejectsUnknownEmptyAndCaseMismatchedCodes(string? code)
    {
        Assert.Null(AchievementCatalog.FindByCode(code));
    }
}
