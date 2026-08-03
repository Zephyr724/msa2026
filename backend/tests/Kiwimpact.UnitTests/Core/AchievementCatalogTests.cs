using System.Security.Cryptography;
using System.Text;
using Kiwimpact.Core.Achievements;

namespace Kiwimpact.UnitTests.Core;

public sealed class AchievementCatalogTests
{
    [Fact]
    public void CatalogContainsTheApprovedFortyFiveTypedDefinitions()
    {
        Assert.Equal(45, AchievementCatalog.Definitions.Count);
        Assert.Equal(
            new Dictionary<AchievementRuleKind, int>
            {
                [AchievementRuleKind.TotalVerifiedCompletions] = 8,
                [AchievementRuleKind.CategoryVerifiedCompletions] = 18,
                [AchievementRuleKind.AllCategoriesMinimum] = 3,
                [AchievementRuleKind.LongestWeeklyStreak] = 6,
                [AchievementRuleKind.LevelReached] = 7,
                [AchievementRuleKind.CommunityChallengeReward] = 3,
            },
            AchievementCatalog.Definitions
                .GroupBy(definition => definition.RuleKind)
                .ToDictionary(group => group.Key, group => group.Count()));
    }

    [Fact]
    public void CatalogKeepsEveryApprovedIdentityInStableDisplayOrder()
    {
        var expected = new (Guid Id, string Code)[]
        {
            (new("b5371794-ccd2-45fb-9a7a-f24ec2692bc2"), "verified-completions-1"),
            (new("ed2faa73-1947-4b4b-826a-af7384d4ed10"), "verified-completions-3"),
            (new("23cb1a76-1cfb-4b53-b71b-cfee48c3f57b"), "verified-completions-5"),
            (new("6c14011a-c884-4393-8b33-efc7de868a6e"), "verified-completions-10"),
            (new("8d051bf2-88b5-4533-b108-c1c7e905ee9c"), "verified-completions-25"),
            (new("6ec0f106-1bcb-41a6-a390-30f163655f1b"), "verified-completions-50"),
            (new("4ee9a479-33bb-472a-ae8b-2675f257ed32"), "verified-completions-100"),
            (new("c3d020dc-f400-4316-a3af-7eb6e2326537"), "verified-completions-250"),
            (new("f58f502b-ed5e-4cc0-aa9c-18a0ce6b80ec"), "restore-nature-3"),
            (new("2b098cc9-2660-41a5-acc5-2f5e07a7efff"), "restore-nature-10"),
            (new("0535dbaf-ff44-4793-a655-901eade197ce"), "restore-nature-25"),
            (new("fa0089a8-f113-40b7-a6ad-cc256ec3c7b8"), "protect-wildlife-3"),
            (new("5c13d81f-3154-407f-90d9-09cfb64eff3d"), "protect-wildlife-10"),
            (new("b53625d4-1709-4095-bed2-704b1d2dac72"), "protect-wildlife-25"),
            (new("a96f28e4-9ef0-4e11-850a-5c6390117ad4"), "clean-reduce-waste-3"),
            (new("174380f5-cf0e-49d7-b2db-e76c6405e125"), "clean-reduce-waste-10"),
            (new("20f4fc5d-a47e-456f-8f0a-7ede2e9249a9"), "clean-reduce-waste-25"),
            (new("178f9228-2fa0-45e8-91e2-d79b16cd1247"), "grow-compost-3"),
            (new("0f34929b-4089-44b6-80e4-f7228a071379"), "grow-compost-10"),
            (new("02d796ca-067f-43f2-a622-9779a18eb7dd"), "grow-compost-25"),
            (new("5152f860-c7ee-456c-912d-02b6f040c667"), "observe-measure-3"),
            (new("84e9a5b0-4d44-4e47-9a61-324a2b52ecc3"), "observe-measure-10"),
            (new("9c71596d-72c4-4c24-83fd-b60ee7a14292"), "observe-measure-25"),
            (new("3d5d2e73-d044-498e-9ddd-365aa80ccbd2"), "learn-share-3"),
            (new("5c65ede5-4d37-44bc-a90d-c08a51b20596"), "learn-share-10"),
            (new("89788f26-d8cd-4daf-b81c-3d44b0b4966d"), "learn-share-25"),
            (new("0635b766-2f72-44e4-9998-141bd7c269db"), "all-categories-1"),
            (new("1a0ad36e-316c-4bef-821b-b6d0590c9b38"), "all-categories-5"),
            (new("320c8fe3-1081-45db-9109-404c0dada3e4"), "all-categories-10"),
            (new("1498a3a6-63fa-4964-90cb-5a672ee093a6"), "weekly-streak-2"),
            (new("b9f660a6-a96c-42ba-a4b1-2ecac05eacfe"), "weekly-streak-4"),
            (new("317dae82-2848-4385-bf8e-47f7c62cd67d"), "weekly-streak-8"),
            (new("d25d7e74-ff93-49f4-a53d-14540f97af0a"), "weekly-streak-12"),
            (new("8e51c432-aa3a-40c0-95d1-1f68df0a0d18"), "weekly-streak-26"),
            (new("8a0f57c0-6a15-4c0a-b646-dee868d85e1b"), "weekly-streak-52"),
            (new("0361d1f4-f2c0-4a9b-9ccc-3ca3d1775b4b"), "level-5"),
            (new("b162297a-4e6d-4597-bffd-a0c029cfdafd"), "level-10"),
            (new("08921609-80f2-4ce6-8093-f0d53b6976b3"), "level-20"),
            (new("c9ac299d-0650-400e-b5b4-0917c4ad654f"), "level-30"),
            (new("f45bc7f1-3504-4e20-b8b7-f71434a3c77d"), "level-50"),
            (new("d30d4102-d1d7-49e8-aeb8-7d38d3a44005"), "level-75"),
            (new("9f43fec2-68ac-4d2f-8a88-5910b9d59951"), "level-99"),
            (new("275cd228-1f7c-446e-afe2-0a8ea124fa2f"), "community-spark"),
            (new("4862f53d-0316-4fa3-b62a-876b891a264d"), "community-catalyst"),
            (new("fec69c6c-7f5c-4de9-8d33-8e63d148ab42"), "community-legacy"),
        };

        Assert.Equal(
            expected,
            AchievementCatalog.Definitions
                .Select(definition => (definition.Id, definition.Code))
                .ToArray());
    }

    [Fact]
    public void CatalogKeepsTheApprovedRuleContentAndCosmeticMetadata()
    {
        var canonical = string.Join(
            '\n',
            AchievementCatalog.Definitions.Select(definition => string.Join(
                '|',
                definition.Id.ToString("D"),
                definition.Code,
                definition.Name,
                definition.Description,
                definition.Category,
                definition.Threshold,
                definition.RuleKind,
                definition.QuestCategory?.ToString() ?? "-",
                definition.CosmeticUnlock?.Kind.ToString() ?? "-",
                definition.CosmeticUnlock?.StyleCode ?? "-",
                definition.CosmeticUnlock?.Priority.ToString() ?? "-")));
        var fingerprint = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));

        Assert.Equal(
            "3B35E9E1D6931A512F5CF7830E981D9A3EF256C8D9D73667CC7B901BEF9A3137",
            fingerprint);
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
    public void DefinitionFamiliesAreInStableAscendingThresholdOrder()
    {
        Assert.Equal(
            [1, 3, 5, 10, 25, 50, 100, 250],
            Thresholds(AchievementRuleKind.TotalVerifiedCompletions));
        Assert.Equal(
            [1, 5, 10],
            Thresholds(AchievementRuleKind.AllCategoriesMinimum));
        Assert.Equal(
            [2, 4, 8, 12, 26, 52],
            Thresholds(AchievementRuleKind.LongestWeeklyStreak));
        Assert.Equal(
            [5, 10, 20, 30, 50, 75, 99],
            Thresholds(AchievementRuleKind.LevelReached));
    }

    [Fact]
    public void CodesAndIdsAreUnique()
    {
        var codes = AchievementCatalog.Definitions
            .Select(definition => definition.Code)
            .ToList();
        Assert.Equal(codes.Count, codes.Distinct(StringComparer.Ordinal).Count());
        Assert.Equal(
            AchievementCatalog.Definitions.Count,
            AchievementCatalog.Definitions.Select(definition => definition.Id).Distinct().Count());
    }

    [Fact]
    public void FindByCodeResolvesEveryApprovedDefinition()
    {
        foreach (var expected in AchievementCatalog.Definitions)
        {
            var definition = AchievementCatalog.FindByCode(expected.Code);
            Assert.Same(expected, definition);
        }
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

    private static int[] Thresholds(AchievementRuleKind kind) =>
        AchievementCatalog.Definitions
            .Where(definition => definition.RuleKind == kind)
            .Select(definition => definition.Threshold)
            .ToArray();
}
