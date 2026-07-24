namespace Kiwimpact.Core.Authorization;

public static class AppRoles
{
    public const string Member = "Member";
    public const string Organizer = "Organizer";
    public const string Admin = "Admin";

    public static readonly IReadOnlyList<string> All =
        [Member, Organizer, Admin];
}
