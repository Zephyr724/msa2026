using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

public sealed record DemoAccountSeedOptions(
    bool Enabled,
    string? OrganizerEmail,
    string? OrganizerPassword,
    string? AdminEmail,
    string? AdminPassword);

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

        await SeedDemoAccountAsync(
            db,
            userManager,
            options.OrganizerEmail,
            options.OrganizerPassword,
            "Demo Organizer",
            AppRoles.Organizer,
            cancellationToken);

        await SeedDemoAccountAsync(
            db,
            userManager,
            options.AdminEmail,
            options.AdminPassword,
            "Demo Admin",
            AppRoles.Admin,
            cancellationToken);
    }

    private static async Task SeedDemoAccountAsync(
        KiwimpactDbContext db,
        UserManager<ApplicationUser> userManager,
        string? email,
        string? password,
        string displayName,
        string elevatedRole,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var normalizedEmail = email.Trim();
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

            foreach (var role in new[] { AppRoles.Member, elevatedRole })
            {
                if (!await userManager.IsInRoleAsync(user, role))
                {
                    var roleResult = await userManager.AddToRoleAsync(user, role);
                    EnsureSucceeded(roleResult, "Unable to assign a configured demo role.");
                }
            }

            if (!await db.UserProfiles.AnyAsync(
                    profile => profile.Id == user.Id,
                    cancellationToken))
            {
                db.UserProfiles.Add(UserProfile.Create(
                    user.Id,
                    displayName,
                    DateTimeOffset.UtcNow));
                await db.SaveChangesAsync(cancellationToken);
            }

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
