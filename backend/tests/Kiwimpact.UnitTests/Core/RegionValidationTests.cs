using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;

namespace Kiwimpact.UnitTests.Core;

public class RegionValidationTests
{
    [Fact]
    public void Country_MustHaveNoParent()
    {
        var errors = Region.Validate("New Zealand", RegionType.Country, Guid.NewGuid(), _ => RegionType.LocalArea);
        Assert.Contains(errors, e => e.Contains("Country") && e.Contains("no parent"));
    }

    [Fact]
    public void Country_WithNullParent_IsValid()
    {
        var errors = Region.Validate("New Zealand", RegionType.Country, null, _ => null);
        Assert.Empty(errors);
    }

    [Fact]
    public void NonCountry_MustHaveParent()
    {
        var errors = Region.Validate("Auckland", RegionType.AdministrativeArea, null, _ => null);
        Assert.Contains(errors, e => e.Contains("AdministrativeArea") && e.Contains("must have a parent"));
    }

    [Fact]
    public void AdministrativeArea_ParentMustBeCountry()
    {
        var errors = Region.Validate("Auckland", RegionType.AdministrativeArea, Guid.NewGuid(),
            _ => RegionType.LocalArea);
        Assert.Contains(errors, e => e.Contains("cannot have a parent of type"));
    }

    [Fact]
    public void AdministrativeArea_WithCountryParent_IsValid()
    {
        var errors = Region.Validate("Auckland", RegionType.AdministrativeArea, Guid.NewGuid(),
            _ => RegionType.Country);
        Assert.Empty(errors);
    }

    [Fact]
    public void LocalArea_ParentMustBeAdministrativeArea()
    {
        var errors = Region.Validate("Henderson-Massey", RegionType.LocalArea, Guid.NewGuid(),
            _ => RegionType.Country);
        Assert.Contains(errors, e => e.Contains("LocalArea") && e.Contains("cannot have a parent of type"));
    }

    [Fact]
    public void LocalArea_WithAdministrativeAreaParent_IsValid()
    {
        var errors = Region.Validate("Henderson-Massey", RegionType.LocalArea, Guid.NewGuid(),
            _ => RegionType.AdministrativeArea);
        Assert.Empty(errors);
    }

    [Fact]
    public void Name_MustNotBeEmpty()
    {
        var errors = Region.Validate("  ", RegionType.LocalArea, Guid.NewGuid(), _ => RegionType.AdministrativeArea);
        Assert.Contains(errors, e => e.Contains("name must not be empty"));
    }

    [Fact]
    public void Name_MustNotExceedMaxLength()
    {
        var longName = new string('A', Region.MaxNameLength + 1);
        var errors = Region.Validate(longName, RegionType.Country, null, _ => null);
        Assert.Contains(errors, e => e.Contains("at most") && e.Contains(Region.MaxNameLength.ToString()));
    }

    [Fact]
    public void ParentMustBeBroaderThanChild()
    {
        // Country (0) cannot have Country (0) parent — caught by parent-type check
        // but let's verify the broader-type rule. If someone tried LocalArea with a LocalArea parent:
        // (int)LocalArea = 2, (int)LocalArea = 2, 2 <= 2 is true, so error.
        var errors = Region.Validate("Test", RegionType.LocalArea, Guid.NewGuid(),
            _ => RegionType.LocalArea);
        Assert.Contains(errors, e => e.Contains("not broader"));
    }

    [Fact]
    public void ParentNotFound_ReturnsError()
    {
        var errors = Region.Validate("Auckland", RegionType.AdministrativeArea, Guid.NewGuid(),
            _ => null);
        Assert.Contains(errors, e => e.Contains("Parent region not found"));
    }
}