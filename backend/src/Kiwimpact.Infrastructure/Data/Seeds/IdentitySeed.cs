using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

public sealed record DemoAccountSeedPersona(
    string Email,
    string DisplayName,
    string Role);

public sealed record DemoAccountSeedOptions(
    bool Enabled,
    string? Password,
    IReadOnlyList<DemoAccountSeedPersona> Accounts)
{
    public static readonly IReadOnlyList<DemoAccountSeedPersona> StandardPersonas =
    [
        new("member1@kiwimpact.test", "Test Member 1", AppRoles.Member),
        new("member2@kiwimpact.test", "Test Member 2", AppRoles.Member),
        new("member3@kiwimpact.test", "Test Member 3", AppRoles.Member),
        new("external1@kiwimpact.test", "External Organizer 1", AppRoles.Organizer),
        new("external2@kiwimpact.test", "External Organizer 2", AppRoles.Organizer),
        new("external3@kiwimpact.test", "External Organizer 3", AppRoles.Organizer),
        new("admin1@kiwimpact.test", "Test Admin 1", AppRoles.Admin),
        new("admin2@kiwimpact.test", "Test Admin 2", AppRoles.Admin),
        new("admin3@kiwimpact.test", "Test Admin 3", AppRoles.Admin),
    ];
}

public sealed class AssessmentAccountSeedPersona
{
    public AssessmentAccountSeedPersona(
        string email,
        string displayName,
        string role,
        string password)
    {
        Email = email;
        DisplayName = displayName;
        Role = role;
        Password = password;
    }

    public string Email { get; }
    public string DisplayName { get; }
    public string Role { get; }
    public string Password { get; }
}

public sealed record AssessmentAccountSeedOptions(
    bool Enabled,
    IReadOnlyList<AssessmentAccountSeedPersona> Accounts);

public static class IdentitySeed
{
    private static readonly Guid[] AssessmentAccountIds =
    [
        new("63000000-0000-4000-8000-000000000001"),
        new("63000000-0000-4000-8000-000000000002"),
        new("63000000-0000-4000-8000-000000000003"),
        new("63000000-0000-4000-8000-000000000004"),
        new("63000000-0000-4000-8000-000000000005"),
        new("63000000-0000-4000-8000-000000000006"),
    ];

    public static async Task SeedRolesAsync(
        RoleManager<ApplicationRole> roleManager,
        CancellationToken cancellationToken = default)
    {
        foreach (var roleName in AppRoles.All)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new ApplicationRole
            {
                Name = roleName,
            });

            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Unable to seed the {roleName} application role.");
            }
        }
    }

    public static async Task SeedDemoAccountsAsync(
        KiwimpactDbContext db,
        UserManager<ApplicationUser> userManager,
        DemoAccountSeedOptions options,
        CancellationToken cancellationToken = default)
    {
        if (!options.Enabled)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(options.Password))
        {
            throw new InvalidOperationException(
                "Development demo-account seeding requires DemoAccounts:Password.");
        }

        var accounts = options.Accounts
            .Select(account => new AssessmentAccountSeedPersona(
                account.Email,
                account.DisplayName,
                account.Role,
                options.Password))
            .ToArray();
        ValidateAccounts(accounts, requireAssessmentRoleDistribution: false);
        await SeedAccountsAtomicallyAsync(
            db,
            userManager,
            accounts,
            fixedUserIds: null,
            cancellationToken);
    }

    public static async Task SeedAssessmentAccountsAsync(
        KiwimpactDbContext db,
        UserManager<ApplicationUser> userManager,
        AssessmentAccountSeedOptions options,
        CancellationToken cancellationToken = default)
    {
        if (!options.Enabled)
        {
            return;
        }

        ValidateAccounts(options.Accounts, requireAssessmentRoleDistribution: true);
        await SeedAccountsAtomicallyAsync(
            db,
            userManager,
            options.Accounts,
            AssessmentAccountIds,
            cancellationToken);
    }

    private static async Task SeedAccountsAtomicallyAsync(
        KiwimpactDbContext db,
        UserManager<ApplicationUser> userManager,
        IReadOnlyList<AssessmentAccountSeedPersona> accounts,
        IReadOnlyList<Guid>? fixedUserIds,
        CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            for (var index = 0; index < accounts.Count; index++)
            {
                await SeedAccountAsync(
                    db,
                    userManager,
                    accounts[index],
                    fixedUserIds?[index],
                    cancellationToken);
            }
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static async Task SeedAccountAsync(
        KiwimpactDbContext db,
        UserManager<ApplicationUser> userManager,
        AssessmentAccountSeedPersona account,
        Guid? fixedUserId,
        CancellationToken cancellationToken)
    {
        // Seeding reconciles existing configured identities as well as
        // creating new ones, keeping repeated one-shot starts deterministic.
        var normalizedEmail = account.Email.Trim();
        ApplicationUser? user;
        if (fixedUserId.HasValue)
        {
            var identityEmail = userManager.NormalizeEmail(normalizedEmail);
            var identityUserName = userManager.NormalizeName(normalizedEmail);
            var reserved = await db.Set<ApplicationUser>()
                .Where(item =>
                    item.Id == fixedUserId.Value ||
                    item.NormalizedEmail == identityEmail ||
                    item.NormalizedUserName == identityUserName)
                .ToListAsync(cancellationToken);
            if (reserved.Any(item => item.Id != fixedUserId.Value))
            {
                throw new InvalidOperationException(
                    "A configured assessment account email is already owned " +
                    "by another identity.");
            }

            user = reserved.SingleOrDefault(item => item.Id == fixedUserId.Value);
            if (user is not null &&
                (user.NormalizedEmail != identityEmail ||
                 user.NormalizedUserName != identityUserName))
            {
                throw new InvalidOperationException(
                    "A configured assessment account ID collides with a " +
                    "different identity.");
            }
        }
        else
        {
            user = await userManager.FindByEmailAsync(normalizedEmail);
        }

        if (user is null)
        {
            user = new ApplicationUser
            {
                Id = fixedUserId ?? Guid.NewGuid(),
                UserName = normalizedEmail,
                Email = normalizedEmail,
                EmailConfirmed = true,
                LockoutEnabled = true,
            };

            EnsureSucceeded(
                await userManager.CreateAsync(user, account.Password),
                "Unable to create a configured account.");
        }
        else
        {
            if (!user.EmailConfirmed)
            {
                user.EmailConfirmed = true;
                EnsureSucceeded(
                    await userManager.UpdateAsync(user),
                    "Unable to confirm a configured account.");
            }

            if (!await userManager.CheckPasswordAsync(user, account.Password))
            {
                if (await userManager.HasPasswordAsync(user))
                {
                    EnsureSucceeded(
                        await userManager.RemovePasswordAsync(user),
                        "Unable to rotate a configured password.");
                }
                EnsureSucceeded(
                    await userManager.AddPasswordAsync(user, account.Password),
                    "Unable to set a configured password.");
            }
        }

        IReadOnlyList<string> desiredRoles = account.Role == AppRoles.Member
            ? [AppRoles.Member]
            // Organizer and Admin personas retain the baseline Member
            // capabilities in addition to their elevated role.
            : [AppRoles.Member, account.Role];
        var currentRoles = await userManager.GetRolesAsync(user);
        var rolesToRemove = currentRoles
            .Where(role =>
                AppRoles.All.Contains(role, StringComparer.Ordinal)
                && !desiredRoles.Contains(role, StringComparer.Ordinal))
            .ToArray();
        if (rolesToRemove.Length > 0)
        {
            EnsureSucceeded(
                await userManager.RemoveFromRolesAsync(user, rolesToRemove),
                "Unable to remove an obsolete configured role.");
        }

        foreach (var role in desiredRoles)
        {
            if (!await userManager.IsInRoleAsync(user, role))
            {
                EnsureSucceeded(
                    await userManager.AddToRoleAsync(user, role),
                    "Unable to assign a configured role.");
            }
        }

        var now = DateTimeOffset.UtcNow;
        var profile = await db.UserProfiles.SingleOrDefaultAsync(
            item => item.Id == user.Id,
            cancellationToken);
        if (profile is null)
        {
            db.UserProfiles.Add(UserProfile.Create(
                user.Id,
                account.DisplayName,
                now));
        }
        else if (!string.Equals(
            profile.DisplayName,
            account.DisplayName.Trim(),
            StringComparison.Ordinal))
        {
            profile.UpdateDisplayName(account.DisplayName, now);
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateAccounts(
        IReadOnlyList<AssessmentAccountSeedPersona> accounts,
        bool requireAssessmentRoleDistribution)
    {
        ArgumentNullException.ThrowIfNull(accounts);
        if (accounts.Count == 0)
        {
            throw new InvalidOperationException(
                "Configured account seeding requires at least one account.");
        }

        for (var index = 0; index < accounts.Count; index++)
        {
            var account = accounts[index];
            if (string.IsNullOrWhiteSpace(account.Email) ||
                string.IsNullOrWhiteSpace(account.DisplayName) ||
                string.IsNullOrWhiteSpace(account.Password) ||
                !AppRoles.All.Contains(account.Role, StringComparer.Ordinal))
            {
                throw new InvalidOperationException(
                    $"Configured account {index + 1} is incomplete or has an invalid role.");
            }
        }

        if (accounts
            .Select(account => account.Email.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count() != accounts.Count)
        {
            throw new InvalidOperationException(
                "Configured account emails must be unique.");
        }

        if (!requireAssessmentRoleDistribution)
        {
            return;
        }

        if (accounts.Count != 6 || AppRoles.All.Any(role =>
                accounts.Count(account => account.Role == role) != 2))
        {
            throw new InvalidOperationException(
                "Assessment account seeding requires exactly six accounts: " +
                "two Member, two Organizer, and two Admin personas.");
        }
    }

    private static void EnsureSucceeded(IdentityResult result, string message)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(message);
        }
    }
}
