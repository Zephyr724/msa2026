using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Authorization;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Idempotent fictional activity history for the six configured assessment
/// accounts. Real provider-backed Quest facts remain separate from the
/// fictional reviewer participation records. Four disabled supporting
/// contributors bring the shared Home Community to the accepted ten-member
/// privacy threshold without creating extra sign-in accounts.
/// </summary>
public static class AssessmentActivitySeed
{
    private const int SupportingContributorCount = 4;
    internal static readonly IReadOnlyList<Guid> SupportingContributorIds =
    [
        new("62000000-0000-4000-8000-000000000101"),
        new("62000000-0000-4000-8000-000000000102"),
        new("62000000-0000-4000-8000-000000000103"),
        new("62000000-0000-4000-8000-000000000104"),
    ];
    private static readonly IReadOnlyList<string> SupportingDisplayNames =
    [
        "Hana R.",
        "Wiremu K.",
        "Priya S.",
        "Finn M.",
    ];

    public static async Task SeedAsync(
        KiwimpactDbContext db,
        IReadOnlyList<AssessmentAccountSeedPersona> personas,
        DateTimeOffset? now = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(personas);
        if (personas.Count != 6)
        {
            throw new InvalidOperationException(
                "Assessment activity seeding requires all six configured accounts.");
        }

        var seedNow = (now ?? DateTimeOffset.UtcNow).ToUniversalTime();
        var normalizedEmails = personas
            .Select(persona => persona.Email.Trim().ToUpperInvariant())
            .ToArray();
        var configuredUsersByEmail = await db.Set<ApplicationUser>()
            .Where(user =>
                user.NormalizedEmail != null &&
                normalizedEmails.Contains(user.NormalizedEmail))
            .ToDictionaryAsync(
                user => user.NormalizedEmail!,
                cancellationToken);
        if (configuredUsersByEmail.Count != personas.Count)
        {
            throw new InvalidOperationException(
                "Assessment activity seeding requires every configured assessment account.");
        }

        var configuredUsers = personas
            .Select(persona => configuredUsersByEmail[
                persona.Email.Trim().ToUpperInvariant()])
            .ToArray();
        var reviewer = configuredUsers[personas
            .Select((persona, index) => (persona, index))
            .First(item => item.persona.Role == AppRoles.Admin)
            .index];

        var supportingUsers = await EnsureSupportingContributorsAsync(
            db,
            seedNow,
            cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var allUsers = configuredUsers.Concat(supportingUsers).ToArray();
        var allUserIds = allUsers.Select(user => user.Id).ToArray();
        var profiles = await db.UserProfiles
            .Where(profile => allUserIds.Contains(profile.Id))
            .ToDictionaryAsync(profile => profile.Id, cancellationToken);
        foreach (var profile in profiles.Values)
        {
            if (!profile.HomeCommunityRegionId.HasValue)
            {
                profile.UpdateCommunity(
                    RegionSeed.HendersonMasseyId,
                    showCommunityOnPassport: true,
                    seedNow,
                    TimeSpan.FromDays(30));
            }
        }
        await db.SaveChangesAsync(cancellationToken);

        var quests = await db.Quests
            .Where(quest =>
                AssessmentDataSeed.AssessmentHistoryQuestIds.Contains(quest.Id))
            .ToDictionaryAsync(quest => quest.Id, cancellationToken);
        if (quests.Count != AssessmentDataSeed.AssessmentHistoryQuestIds.Count)
        {
            throw new InvalidOperationException(
                "Assessment activity seeding requires every ongoing real activity Quest.");
        }

        var existingCompletions = await db.QuestCompletions
            .Where(completion =>
                allUserIds.Contains(completion.UserId) &&
                AssessmentDataSeed.AssessmentHistoryQuestIds.Contains(completion.QuestId) &&
                completion.Status == QuestCompletionStatus.Verified)
            .ToDictionaryAsync(
                completion => (completion.UserId, completion.QuestId),
                cancellationToken);
        var existingCompletionIds = existingCompletions.Values
            .Select(completion => completion.Id)
            .ToArray();
        var existingXpCompletionIds = (await db.XpTransactions
            .Where(transaction =>
                existingCompletionIds.Contains(transaction.SourceCompletionId))
            .Select(transaction => transaction.SourceCompletionId)
            .ToListAsync(cancellationToken))
            .ToHashSet();
        var completionCounts = new[] { 6, 5, 4, 6, 5, 4, 3, 2, 2, 1 };

        for (var userIndex = 0; userIndex < allUsers.Length; userIndex++)
        {
            var user = allUsers[userIndex];
            var profile = profiles[user.Id];
            for (var questOffset = 0;
                 questOffset < completionCounts[userIndex];
                 questOffset++)
            {
                var questId = AssessmentDataSeed.AssessmentHistoryQuestIds[
                    (userIndex + questOffset) %
                    AssessmentDataSeed.AssessmentHistoryQuestIds.Count];
                if (existingCompletions.TryGetValue(
                        (user.Id, questId),
                        out var existingCompletion))
                {
                    if (!existingXpCompletionIds.Contains(existingCompletion.Id))
                    {
                        throw new InvalidOperationException(
                            "An assessment completion exists without its XP ledger row.");
                    }
                    continue;
                }

                var completedAt = seedNow
                    .AddDays(-(1 + questOffset * 7))
                    .AddMinutes(-userIndex);
                var reviewedAt = completedAt.AddHours(12);
                var quest = quests[questId];
                var completion = QuestCompletion.CreateEvidenceClaim(
                    user.Id,
                    quest,
                    participationId: null,
                    profile.HomeCommunityRegionId,
                    completedAt,
                    completedAt);
                var detail = EvidenceClaimDetail.Create(
                    completion.Id,
                    "Fictional assessment history used to demonstrate verified Passport and achievement states.",
                    evidenceUrl: null,
                    userDeclaration: true);
                detail.RecordReview(
                    reviewer.Id,
                    "Approved assessment fixture; no real person or evidence is represented.",
                    reviewedAt);
                completion.ApproveEvidenceClaim(reviewedAt);
                var xp = XpTransaction.CreateFromVerifiedCompletion(completion);

                db.QuestCompletions.Add(completion);
                db.EvidenceClaimDetails.Add(detail);
                db.XpTransactions.Add(xp);
                profile.ApplyXpAward(xp.XpAmount, reviewedAt);
                existingCompletions[(user.Id, questId)] = completion;
                existingXpCompletionIds.Add(completion.Id);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        await SeedAutomaticAchievementsAsync(
            db,
            profiles.Values,
            cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task<ApplicationUser[]> EnsureSupportingContributorsAsync(
        KiwimpactDbContext db,
        DateTimeOffset seedNow,
        CancellationToken cancellationToken)
    {
        var users = new ApplicationUser[SupportingContributorCount];
        for (var index = 0; index < SupportingContributorCount; index++)
        {
            var id = SupportingContributorIds[index];
            var userName = $"assessment-supporter-{index + 1:D2}";
            var normalizedUserName = userName.ToUpperInvariant();
            var email = $"assessment-supporter-{index + 1:D2}@kiwimpact.invalid";
            var normalizedEmail = email.ToUpperInvariant();
            var reserved = await db.Set<ApplicationUser>()
                .Where(item =>
                    item.Id == id ||
                    item.NormalizedUserName == normalizedUserName ||
                    item.NormalizedEmail == normalizedEmail)
                .ToListAsync(cancellationToken);
            if (reserved.Any(item => item.Id != id))
            {
                throw new InvalidOperationException(
                    "An assessment supporting-contributor identity is " +
                    "reserved by another user.");
            }

            var user = reserved.SingleOrDefault(item => item.Id == id);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    Id = id,
                    UserName = userName,
                    NormalizedUserName = normalizedUserName,
                    Email = email,
                    NormalizedEmail = normalizedEmail,
                    EmailConfirmed = false,
                    PasswordHash = null,
                    SecurityStamp = null,
                    ConcurrencyStamp = null,
                    LockoutEnabled = true,
                };
                db.Set<ApplicationUser>().Add(user);
            }
            else
            {
                await EnsureSupportingContributorIsDisabledAsync(
                    db,
                    user,
                    normalizedUserName,
                    normalizedEmail,
                    cancellationToken);
            }

            var profile = await db.UserProfiles.SingleOrDefaultAsync(
                item => item.Id == id,
                cancellationToken);
            if (profile is null)
            {
                db.UserProfiles.Add(UserProfile.Create(
                    id,
                    SupportingDisplayNames[index],
                    seedNow));
            }
            else if (profile.DisplayName == $"Assessment Contributor {index + 1:D2}")
            {
                // Upgrade only the exact original placeholder. Any reviewer or
                // operator edit remains authoritative on later starts.
                profile.UpdateDisplayName(SupportingDisplayNames[index], seedNow);
            }
            users[index] = user;
        }
        return users;
    }

    private static async Task EnsureSupportingContributorIsDisabledAsync(
        KiwimpactDbContext db,
        ApplicationUser user,
        string normalizedUserName,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        if (user.NormalizedUserName != normalizedUserName ||
            user.NormalizedEmail != normalizedEmail ||
            user.PasswordHash is not null ||
            user.EmailConfirmed)
        {
            throw new InvalidOperationException(
                "An assessment supporting contributor does not match its " +
                "disabled identity contract.");
        }

        var hasAuthenticationArtifacts =
            await db.Set<IdentityUserRole<Guid>>()
                .AnyAsync(item => item.UserId == user.Id, cancellationToken) ||
            await db.Set<IdentityUserClaim<Guid>>()
                .AnyAsync(item => item.UserId == user.Id, cancellationToken) ||
            await db.Set<IdentityUserLogin<Guid>>()
                .AnyAsync(item => item.UserId == user.Id, cancellationToken) ||
            await db.Set<IdentityUserToken<Guid>>()
                .AnyAsync(item => item.UserId == user.Id, cancellationToken);
        if (hasAuthenticationArtifacts)
        {
            throw new InvalidOperationException(
                "An assessment supporting contributor has authentication artifacts.");
        }
    }

    internal static async Task SeedAutomaticAchievementsAsync(
        KiwimpactDbContext db,
        IEnumerable<UserProfile> profiles,
        CancellationToken cancellationToken)
    {
        var activeAchievementIds = (await db.Achievements
            .AsNoTracking()
            .Where(achievement => achievement.IsActive)
            .Select(achievement => achievement.Id)
            .ToListAsync(cancellationToken))
            .ToHashSet();
        var activeDefinitions = AchievementCatalog.Definitions
            .Where(definition =>
                definition.RuleKind != AchievementRuleKind.CommunityChallengeReward &&
                activeAchievementIds.Contains(definition.Id))
            .ToArray();

        foreach (var profile in profiles)
        {
            var earned = (await db.UserAchievements
                .AsNoTracking()
                .Where(achievement => achievement.UserId == profile.Id)
                .Select(achievement => achievement.AchievementId)
                .ToListAsync(cancellationToken))
                .ToHashSet();
            var ledger = await db.XpTransactions
                .AsNoTracking()
                .Where(transaction => transaction.UserId == profile.Id)
                .Join(
                    db.QuestCompletions.AsNoTracking(),
                    transaction => transaction.SourceCompletionId,
                    completion => completion.Id,
                    (transaction, completion) => new
                    {
                        transaction.Id,
                        transaction.CreatedAt,
                        completion.QuestCategorySnapshot,
                        transaction.XpAmount,
                    })
                .OrderBy(row => row.CreatedAt)
                .ThenBy(row => row.Id)
                .Select(row => new AchievementLedgerRow(
                    row.Id,
                    row.CreatedAt,
                    row.QuestCategorySnapshot,
                    row.XpAmount))
                .ToListAsync(cancellationToken);
            var awards = AchievementCatalog.EvaluateAutomaticAchievements(
                activeDefinitions,
                earned,
                ledger);
            foreach (var award in awards)
            {
                db.UserAchievements.Add(
                    UserAchievement.CreateFromMilestone(profile.Id, award));
            }
            profile.MarkAchievementsEvaluated(
                AchievementCatalog.CurrentEvaluationVersion);
        }
    }
}
