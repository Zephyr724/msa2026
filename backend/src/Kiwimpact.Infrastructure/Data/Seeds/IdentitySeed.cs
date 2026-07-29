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

public static class IdentitySeed
{
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

        foreach (var account in options.Accounts)
        {
            await SeedDemoAccountAsync(
                db,
                userManager,
                account,
                options.Password,
                cancellationToken);
        }
    }

    private static async Task SeedDemoAccountAsync(
        KiwimpactDbContext db,
        UserManager<ApplicationUser> userManager,
        DemoAccountSeedPersona account,
        string password,
        CancellationToken cancellationToken)
    {
        if (!AppRoles.All.Contains(account.Role, StringComparer.Ordinal))
            throw new InvalidOperationException("Configured demo account role is invalid.");

        // Seeding reconciles existing demo identities as well as creating new
        // ones, keeping repeated development starts deterministic.
        var normalizedEmail = account.Email.Trim();
        var user = await userManager.FindByEmailAsync(normalizedEmail);

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            if (user is null)
            {
                user = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = normalizedEmail,
                    Email = normalizedEmail,
                    EmailConfirmed = true,
                    LockoutEnabled = true,
                };

                var createResult = await userManager.CreateAsync(user, password);
                EnsureSucceeded(createResult, "Unable to create a configured demo account.");
            }
            else
            {
                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    EnsureSucceeded(
                        await userManager.UpdateAsync(user),
                        "Unable to confirm a configured demo account.");
                }

                if (!await userManager.CheckPasswordAsync(user, password))
                {
                    if (await userManager.HasPasswordAsync(user))
                    {
                        EnsureSucceeded(
                            await userManager.RemovePasswordAsync(user),
                            "Unable to rotate a configured demo password.");
                    }
                    EnsureSucceeded(
                        await userManager.AddPasswordAsync(user, password),
                        "Unable to set a configured demo password.");
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
                    "Unable to remove an obsolete configured demo role.");
            }

            foreach (var role in desiredRoles)
            {
                if (!await userManager.IsInRoleAsync(user, role))
                {
                    var roleResult = await userManager.AddToRoleAsync(user, role);
                    EnsureSucceeded(roleResult, "Unable to assign a configured demo role.");
                }
            }

            var profile = await db.UserProfiles.SingleOrDefaultAsync(
                item => item.Id == user.Id,
                cancellationToken);
            if (profile is null)
            {
                db.UserProfiles.Add(UserProfile.Create(
                    user.Id,
                    account.DisplayName,
                    DateTimeOffset.UtcNow));
            }
            else if (!string.Equals(
                profile.DisplayName,
                account.DisplayName.Trim(),
                StringComparison.Ordinal))
            {
                profile.UpdateDisplayName(account.DisplayName, DateTimeOffset.UtcNow);
            }
            await db.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
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
