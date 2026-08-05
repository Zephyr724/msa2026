using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Development-only, idempotent activity graph for the configured demo
/// personas. The seed gives the UI enough truthful persisted state to exercise
/// Mission Board, Passport, streak, People/Communities leaderboards, and
/// community challenges without weakening production privacy thresholds.
/// Supporting neighbours have no password, roles, claims, logins, or tokens.
/// </summary>
public static class DemoActivitySeed
{
    public static readonly Guid WellingtonId =
        new("60000000-0000-4000-8000-000000000001");
    public static readonly Guid ChristchurchId =
        new("60000000-0000-4000-8000-000000000002");
    public static readonly Guid WellingtonCentralId =
        new("60000000-0000-4000-8000-000000000101");
    public static readonly Guid ChristchurchCentralId =
        new("60000000-0000-4000-8000-000000000102");

    private static readonly DateTimeOffset LegacySeedNow =
        new(2026, 7, 28, 8, 0, 0, TimeSpan.Zero);

    private static readonly Guid[] QuestIds =
    [
        new("11111111-1111-4111-8111-111111111101"),
        new("11111111-1111-4111-8111-111111111102"),
        new("11111111-1111-4111-8111-111111111104"),
        new("11111111-1111-4111-8111-111111111105"),
        new("11111111-1111-4111-8111-111111111109"),
        new("11111111-1111-4111-8111-111111111106"),
    ];

    private static readonly Guid[] CommunityIds =
    [
        RegionSeed.HendersonMasseyId,
        RegionSeed.AlbertEdenId,
        RegionSeed.WaitemataId,
        WellingtonCentralId,
        ChristchurchCentralId,
    ];

    public static async Task SeedAsync(
        KiwimpactDbContext db,
        IReadOnlyList<DemoAccountSeedPersona> personas,
        DateTimeOffset? now = null,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(personas);
        var seedNow = (now ?? DateTimeOffset.UtcNow).ToUniversalTime();

        await EnsureDemoRegionsAsync(db, seedNow, ct);
        await db.SaveChangesAsync(ct);

        var quests = await db.Quests
            .Where(quest => QuestIds.Contains(quest.Id))
            .ToDictionaryAsync(quest => quest.Id, ct);
        var missingQuestIds = QuestIds.Except(quests.Keys).ToArray();
        if (missingQuestIds.Length > 0)
        {
            throw new InvalidOperationException(
                "Demo activity seeding requires the configured demo Quests. " +
                $"Missing: {string.Join(", ", missingQuestIds)}.");
        }

        var personaEmails = personas
            .Select(persona => persona.Email.Trim().ToUpperInvariant())
            .ToArray();
        var personaUsers = await db.Set<ApplicationUser>()
            .Where(user =>
                user.NormalizedEmail != null &&
                personaEmails.Contains(user.NormalizedEmail))
            .OrderBy(user => user.NormalizedEmail)
            .ToListAsync(ct);
        if (personaUsers.Count != personas.Count)
        {
            throw new InvalidOperationException(
                "Demo activity seeding requires every configured demo account.");
        }

        var users = new List<(ApplicationUser User, Guid CommunityId, int QuestCount)>();
        for (var index = 0; index < personaUsers.Count; index++)
        {
            users.Add((
                personaUsers[index],
                CommunityIds[index % CommunityIds.Length],
                index == 0 ? 5 : Math.Min(5, 1 + (index % 5))));
        }

        for (var communityIndex = 0; communityIndex < CommunityIds.Length; communityIndex++)
        {
            for (var neighbourIndex = 0; neighbourIndex < 10; neighbourIndex++)
            {
                var ordinal = 101 + (communityIndex * 10) + neighbourIndex;
                var userId = Guid.Parse(
                    $"50000000-0000-4000-8000-{ordinal:D12}");
                var user = await db.Set<ApplicationUser>()
                    .SingleOrDefaultAsync(item => item.Id == userId, ct);
                if (user is null)
                {
                    user = new ApplicationUser
                    {
                        Id = userId,
                        UserName = $"demo-neighbour-{ordinal}",
                        NormalizedUserName = $"DEMO-NEIGHBOUR-{ordinal}",
                        Email = $"demo-neighbour-{ordinal}@kiwimpact.invalid",
                        NormalizedEmail = $"DEMO-NEIGHBOUR-{ordinal}@KIWIMPACT.INVALID",
                        EmailConfirmed = false,
                        PasswordHash = null,
                        LockoutEnabled = true,
                    };
                    db.Set<ApplicationUser>().Add(user);
                }

                users.Add((
                    user,
                    CommunityIds[communityIndex],
                    1 + (neighbourIndex % 3)));
            }
        }

        await EnsureProfilesAsync(db, users, seedNow, ct);
        await db.SaveChangesAsync(ct);

        var userIds = users.Select(item => item.User.Id).ToArray();
        var profiles = await db.UserProfiles
            .Where(profile => userIds.Contains(profile.Id))
            .ToDictionaryAsync(profile => profile.Id, ct);
        var verifiedCompletions = await db.QuestCompletions
            .Where(completion =>
                userIds.Contains(completion.UserId) &&
                QuestIds.Contains(completion.QuestId) &&
                completion.Status == QuestCompletionStatus.Verified)
            .ToListAsync(ct);
        var verifiedByKey = verifiedCompletions.ToDictionary(
            completion => (completion.UserId, completion.QuestId));
        var completionIds = verifiedCompletions
            .Select(completion => completion.Id)
            .ToArray();
        var xpByCompletionId = await db.XpTransactions
            .Where(transaction =>
                completionIds.Contains(transaction.SourceCompletionId))
            .ToDictionaryAsync(
                transaction => transaction.SourceCompletionId,
                ct);
        var activeParticipations = await db.QuestParticipations
            .Where(participation =>
                userIds.Contains(participation.UserId) &&
                QuestIds.Contains(participation.QuestId) &&
                participation.CancelledAt == null)
            .ToListAsync(ct);
        var activeByKey = activeParticipations.ToDictionary(
            participation => (participation.UserId, participation.QuestId));

        for (var userIndex = 0; userIndex < users.Count; userIndex++)
        {
            var plan = users[userIndex];
            var isPrimaryPersona = userIndex < personaUsers.Count;
            for (var questOffset = 0; questOffset < plan.QuestCount; questOffset++)
            {
                var questId = QuestIds[(userIndex + questOffset) % QuestIds.Length];
                var verifiedAt = isPrimaryPersona && userIndex == 0
                    ? seedNow.AddDays(-(questOffset * 7))
                    : seedNow.AddMinutes(-(userIndex * 3 + questOffset));

                if (verifiedByKey.TryGetValue(
                        (plan.User.Id, questId),
                        out var existingCompletion))
                {
                    RebaseSeedAward(
                        db,
                        existingCompletion,
                        xpByCompletionId.GetValueOrDefault(existingCompletion.Id),
                        verifiedAt);
                    continue;
                }

                if (!activeByKey.TryGetValue((plan.User.Id, questId), out var participation))
                {
                    participation = QuestParticipation.CreateActive(
                        plan.User.Id,
                        questId,
                        seedNow.AddDays(-35));
                    db.QuestParticipations.Add(participation);
                    activeByKey[(plan.User.Id, questId)] = participation;
                }

                // The first demo persona spans five consecutive weeks so the
                // weekly-streak UI has an observable non-zero state. Every
                // other seeded user has current-week verified activity.
                var completion = QuestCompletion.CreateVerifiedWithCode(
                    plan.User.Id,
                    quests[questId],
                    participation,
                    plan.CommunityId,
                    verifiedAt);
                var xp = XpTransaction.CreateFromVerifiedCompletion(completion);
                db.QuestCompletions.Add(completion);
                db.XpTransactions.Add(xp);
                profiles[plan.User.Id].ApplyXpAward(xp.XpAmount, verifiedAt);
                verifiedByKey[(plan.User.Id, questId)] = completion;
            }
        }

        var primaryPersona = users[0];
        var readyQuestId = QuestIds[^1];
        if (
            !verifiedByKey.ContainsKey((primaryPersona.User.Id, readyQuestId)) &&
            !activeByKey.ContainsKey((primaryPersona.User.Id, readyQuestId))
        )
        {
            db.QuestParticipations.Add(QuestParticipation.CreateActive(
                primaryPersona.User.Id,
                readyQuestId,
                seedNow.AddDays(-2)));
        }

        await EnsureCurrentChallengesAsync(db, seedNow, ct);

        await db.SaveChangesAsync(ct);
        await AssessmentActivitySeed.SeedAutomaticAchievementsAsync(
            db,
            profiles.Values,
            ct);
        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoRegionsAsync(
        KiwimpactDbContext db,
        DateTimeOffset seedNow,
        CancellationToken ct)
    {
        await EnsureRegionAsync(
            db,
            WellingtonId,
            "Wellington",
            RegionType.AdministrativeArea,
            RegionSeed.NewZealandId,
            seedNow,
            ct);
        await EnsureRegionAsync(
            db,
            ChristchurchId,
            "Christchurch",
            RegionType.AdministrativeArea,
            RegionSeed.NewZealandId,
            seedNow,
            ct);
        await EnsureRegionAsync(
            db,
            WellingtonCentralId,
            "Wellington Central",
            RegionType.LocalArea,
            WellingtonId,
            seedNow,
            ct);
        await EnsureRegionAsync(
            db,
            ChristchurchCentralId,
            "Christchurch Central",
            RegionType.LocalArea,
            ChristchurchId,
            seedNow,
            ct);
    }

    private static async Task EnsureRegionAsync(
        KiwimpactDbContext db,
        Guid id,
        string name,
        RegionType type,
        Guid parentId,
        DateTimeOffset seedNow,
        CancellationToken ct)
    {
        if (await db.Regions.AnyAsync(region => region.Id == id, ct))
            return;

        var errors = Region.Validate(name, type, parentId, getParentType: null);
        if (errors.Count > 0)
        {
            throw new InvalidOperationException(
                $"Demo region '{name}' is invalid: {string.Join("; ", errors)}");
        }

        var region = (Region)Activator.CreateInstance(
            typeof(Region),
            nonPublic: true)!;
        SetRegionProperty(region, nameof(Region.Id), id);
        SetRegionProperty(region, nameof(Region.Name), name);
        SetRegionProperty(region, nameof(Region.Type), type);
        SetRegionProperty(region, nameof(Region.ParentRegionId), parentId);
        SetRegionProperty(region, nameof(Region.IsActive), true);
        SetRegionProperty(region, nameof(Region.CreatedAt), seedNow);
        SetRegionProperty(region, nameof(Region.UpdatedAt), seedNow);
        db.Regions.Add(region);
    }

    private static void SetRegionProperty(
        Region region,
        string propertyName,
        object value)
    {
        typeof(Region)
            .GetProperty(propertyName)!
            .SetValue(region, value);
    }

    private static async Task EnsureProfilesAsync(
        KiwimpactDbContext db,
        IReadOnlyList<(ApplicationUser User, Guid CommunityId, int QuestCount)> users,
        DateTimeOffset seedNow,
        CancellationToken ct)
    {
        var userIds = users.Select(item => item.User.Id).ToArray();
        var existing = await db.UserProfiles
            .Where(profile => userIds.Contains(profile.Id))
            .ToDictionaryAsync(profile => profile.Id, ct);

        for (var index = 0; index < users.Count; index++)
        {
            var plan = users[index];
            if (!existing.TryGetValue(plan.User.Id, out var profile))
            {
                var displayName = plan.User.Email?.EndsWith(
                    "@kiwimpact.invalid",
                    StringComparison.OrdinalIgnoreCase) == true
                    ? $"Community Neighbour {index + 1}"
                    : plan.User.Email?.Split('@')[0] ?? $"Demo Member {index + 1}";
                profile = UserProfile.Create(plan.User.Id, displayName, seedNow);
                db.UserProfiles.Add(profile);
                existing[plan.User.Id] = profile;
            }

            if (!profile.HomeCommunityRegionId.HasValue)
            {
                profile.UpdateCommunity(
                    plan.CommunityId,
                    showCommunityOnPassport: true,
                    seedNow,
                    TimeSpan.FromDays(30));
            }
        }
    }

    private static void RebaseSeedAward(
        KiwimpactDbContext db,
        QuestCompletion completion,
        XpTransaction? xp,
        DateTimeOffset verifiedAt)
    {
        // The verified (UserId, QuestId) pair is the stable business key for
        // this Development-only fixture. Rebasing its event timestamps keeps
        // weekly/monthly UI states observable without adding duplicate ledger
        // rows or inflating TotalXp on every application restart.
        var completionEntry = db.Entry(completion);
        completionEntry.Property(nameof(QuestCompletion.CompletedAt))
            .CurrentValue = verifiedAt;
        completionEntry.Property(nameof(QuestCompletion.VerifiedAtUtc))
            .CurrentValue = verifiedAt;
        completionEntry.Property(nameof(QuestCompletion.CreatedAt))
            .CurrentValue = verifiedAt;
        completionEntry.Property(nameof(QuestCompletion.UpdatedAt))
            .CurrentValue = verifiedAt;

        if (xp is not null)
        {
            db.Entry(xp)
                .Property(nameof(XpTransaction.CreatedAt))
                .CurrentValue = verifiedAt;
        }
    }

    private static async Task EnsureCurrentChallengesAsync(
        KiwimpactDbContext db,
        DateTimeOffset seedNow,
        CancellationToken ct)
    {
        var (periodStart, periodEnd) = AucklandMonth(seedNow);

        foreach (var communityId in CommunityIds)
        {
            var challengeId = StableChallengeId(communityId, periodStart);
            var current = await db.CommunityChallenges
                .SingleOrDefaultAsync(challenge => challenge.Id == challengeId, ct);
            if (current is not null)
                continue;

            var active = await db.CommunityChallenges.SingleOrDefaultAsync(
                challenge =>
                    challenge.LocalAreaRegionId == communityId &&
                    challenge.Status == ChallengeStatus.Active,
                ct);
            if (active is not null)
            {
                if (!IsDemoChallenge(active))
                {
                    // Never displace an administrator-created Development
                    // challenge merely to install visual fixture data.
                    continue;
                }

                if (seedNow >= active.PeriodEnd)
                {
                    var progress = await db.XpTransactions.LongCountAsync(
                        transaction =>
                            transaction.CommunityRegionIdAtAward == communityId &&
                            transaction.CreatedAt >= active.PeriodStart &&
                            transaction.CreatedAt < active.PeriodEnd,
                        ct);
                    active.Finalize(progress, seedNow);
                }
                else
                {
                    // Upgrade the original fixed-date Slice 19 fixture to its
                    // month-scoped stable record.
                    active.Cancel(seedNow);
                }

                // Release the filtered unique Active index before inserting
                // this month's stable challenge, while remaining inside the
                // caller's transaction.
                await db.SaveChangesAsync(ct);
            }

            var challenge = CommunityChallenge.Create(
                communityId,
                periodStart,
                periodEnd,
                targetValue: 50,
                rewardAchievementId: null,
                seedNow);
            db.Entry(challenge)
                .Property(nameof(CommunityChallenge.Id))
                .CurrentValue = challengeId;
            db.CommunityChallenges.Add(challenge);
        }
    }

    private static bool IsDemoChallenge(CommunityChallenge challenge)
    {
        if (challenge.TargetType != CommunityChallenge.VerifiedCompletionCountTarget ||
            challenge.TargetValue != 50 ||
            challenge.RewardAchievementId.HasValue)
        {
            return false;
        }

        return challenge.CreatedAt == LegacySeedNow ||
               challenge.Id == StableChallengeId(
                   challenge.LocalAreaRegionId,
                   challenge.PeriodStart);
    }

    private static (DateTimeOffset Start, DateTimeOffset End) AucklandMonth(
        DateTimeOffset now)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland");
        var localNow = TimeZoneInfo.ConvertTime(now, zone);
        var localStart = new DateTime(
            localNow.Year,
            localNow.Month,
            1,
            0,
            0,
            0,
            DateTimeKind.Unspecified);
        var localEnd = localStart.AddMonths(1);
        return (
            new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(localStart, zone)),
            new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(localEnd, zone)));
    }

    private static Guid StableChallengeId(
        Guid communityId,
        DateTimeOffset periodStart)
    {
        var input = System.Text.Encoding.UTF8.GetBytes(
            $"kiwimpact-demo-challenge:{communityId:N}:{periodStart:yyyy-MM}");
        var hash = System.Security.Cryptography.SHA256.HashData(input);
        return new Guid(hash.AsSpan(0, 16));
    }
}
