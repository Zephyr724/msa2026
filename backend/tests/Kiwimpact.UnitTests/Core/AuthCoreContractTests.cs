using System.ComponentModel.DataAnnotations;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;

namespace Kiwimpact.UnitTests.Core;

public sealed class AuthCoreContractTests
{
    [Fact]
    public void Roles_HaveStableUniqueValues_AndMemberIsPublicDefault()
    {
        Assert.Equal("Member", AppRoles.Member);
        Assert.Equal("Organizer", AppRoles.Organizer);
        Assert.Equal("Admin", AppRoles.Admin);
        Assert.Equal(3, AppRoles.All.Distinct(StringComparer.Ordinal).Count());
        Assert.Equal(AppRoles.Member, AppRoles.All[0]);
    }

    [Fact]
    public void UserProfile_Create_NormalizesDisplayNameAndUsesPrivateDefaults()
    {
        var userId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var profile = UserProfile.Create(userId, "  Aroha  ", now);

        Assert.Equal(userId, profile.Id);
        Assert.Equal("Aroha", profile.DisplayName);
        Assert.Null(profile.HomeCommunityRegionId);
        Assert.Null(profile.LastCommunityChangeAt);
        Assert.False(profile.ShowCommunityOnPassport);
        Assert.Equal(now, profile.CreatedAt);
        Assert.Equal(now, profile.UpdatedAt);
    }

    [Fact]
    public void RegisterContract_RejectsInvalidShape_AndCannotAcceptARole()
    {
        var request = new RegisterRequest(
            "not-an-email",
            "short",
            "different",
            new string('x', UserProfile.MaxDisplayNameLength + 1));
        var results = new List<ValidationResult>();

        var valid = Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            results,
            validateAllProperties: true);

        Assert.False(valid);
        Assert.True(results.Count >= 4);
        Assert.DoesNotContain(
            typeof(RegisterRequest).GetProperties(),
            property => property.Name.Contains("Role", StringComparison.OrdinalIgnoreCase));
    }
}
