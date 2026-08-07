using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Security;
using Kiwimpact.Core.Services;
using Kiwimpact.Core.Progression;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using Npgsql;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class QuestCompletionRepository : IQuestCompletionRepository
{
    public const string VerifiedCompletionConstraint =
        "UX_QuestCompletions_UserId_QuestId_Verified";
    public const string ActiveCodeConstraint = "UX_CompletionCodes_QuestId_Active";
    public const string PendingClaimConstraint =
        "UX_QuestCompletions_UserId_QuestId_PendingClaim";
    public const string SelfReportedConstraint =
        "UX_QuestCompletions_UserId_QuestId_SelfReported";

    private readonly KiwimpactDbContext _db;
    private readonly CompletionCodeProtector _protector;
    private readonly AchievementAwardService _achievementAwards;

    public QuestCompletionRepository(
        KiwimpactDbContext db,
        CompletionCodeProtector protector,
        AchievementAwardService achievementAwards)
    {
        _db = db;
        _protector = protector;
        _achievementAwards = achievementAwards;
    }

    public async Task<GeneratedCompletionCode> GenerateOrRotateAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        try
        {
            // Rotation is atomic: consumers can never observe two active codes
            // for the same Quest, even under concurrent organizer requests.
            var quest = await LockQuestAsync(questId, ct)
                ?? throw Error(QuestCompletionError.NotFound, "Quest not found.");
            EnsureManagementAccess(quest, actorId, isAdmin);
            QuestCompletionEligibility.EnsureCodeManagementQuest(quest);

            var validity = CompletionCodeValidity.Derive(
                quest.StartAtUtc,
                quest.EndAtUtc,
                now);
            var normalizedCode = _protector.GenerateNormalizedCode();
            var codeHash = _protector.ComputeHash(questId, normalizedCode);

            var activeCode = await _db.CompletionCodes.SingleOrDefaultAsync(
                code =>
                    code.QuestId == questId &&
                    code.IsActive &&
                    !code.IsRevoked,
                ct);
            activeCode?.Revoke();

            var replacement = CompletionCode.Create(
                questId,
                codeHash,
                validity.ValidFromUtc,
                validity.ValidToUtc,
                actorId,
                now);
            _db.CompletionCodes.Add(replacement);

            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return new GeneratedCompletionCode(
                CompletionCodeProtector.FormatForDisplay(normalizedCode),
                replacement.ValidFrom,
                replacement.ValidTo);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: ActiveCodeConstraint,
            })
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestCompletionError.Concurrency,
                "Completion Code configuration changed during this request.");
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestCompletionError.Concurrency,
                "Completion Code configuration changed during this request.");
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<CompletionCodeStatus> GetCodeStatusAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var quest = await _db.Quests
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == questId, ct)
            ?? throw Error(QuestCompletionError.NotFound, "Quest not found.");
        EnsureManagementAccess(quest, actorId, isAdmin);

        var active = await _db.CompletionCodes
            .AsNoTracking()
            .Where(code =>
                code.QuestId == questId &&
                code.IsActive &&
                !code.IsRevoked)
            .OrderByDescending(code => code.CreatedAt)
            .ThenByDescending(code => code.Id)
            .SingleOrDefaultAsync(ct);

        return active is null
            ? new CompletionCodeStatus(false, null, null, null)
            : new CompletionCodeStatus(
                true,
                active.ValidFrom,
                active.ValidTo,
                active.CreatedAt);
    }

    public async Task<CompletionRedemptionResult> RedeemAsync(
        Guid questId,
        Guid actorId,
        string? submittedCode,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        try
        {
            // The Quest and member profile locks serialize both the one-award
            // rule and progression updates for concurrent redemption attempts.
            var quest = await LockQuestAsync(questId, ct)
                ?? throw Error(QuestCompletionError.NotFound, "Quest not found.");
            QuestCompletionEligibility.EnsureRedemptionQuest(quest, actorId);

            var participation = await _db.QuestParticipations.SingleOrDefaultAsync(
                item =>
                    item.UserId == actorId &&
                    item.QuestId == questId &&
                    item.CancelledAt == null,
                ct);
            if (participation is null)
                throw Error(
                    QuestCompletionError.NoActiveParticipation,
                    "An active Quest participation is required.");

            var existing = await _db.QuestCompletions
                .AsNoTracking()
                .AnyAsync(
                    item =>
                        item.UserId == actorId &&
                        item.QuestId == questId &&
                        item.Status == QuestCompletionStatus.Verified,
                    ct);
            if (existing)
                throw Error(
                    QuestCompletionError.AlreadyCompleted,
                    "You have already completed this Quest.");

            var timestamp = now.ToUniversalTime();
            var activeCode = await _db.CompletionCodes
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    code =>
                        code.QuestId == questId &&
                        code.IsActive &&
                        !code.IsRevoked &&
                        code.ValidFrom <= timestamp &&
                        (!code.ValidTo.HasValue || code.ValidTo.Value > timestamp),
                    ct);

            var verified = _protector.Verify(
                questId,
                submittedCode,
                activeCode?.CodeHash);
            if (activeCode is null || !verified)
                throw Error(
                    QuestCompletionError.InvalidCompletionCode,
                    "The completion code is invalid.");

            var profile = await LockUserProfileAsync(actorId, ct)
                ?? throw new InvalidOperationException(
                    "The authenticated user has no profile row.");
            var completion = QuestCompletion.CreateVerifiedWithCode(
                actorId,
                quest,
                participation,
                profile.HomeCommunityRegionId,
                timestamp);
            var xp = XpTransaction.CreateFromVerifiedCompletion(completion);
            var previousProgression = new CompletionRewardProgression(
                profile.TotalXp,
                profile.Level,
                ProgressionRules.RankTitleFor(profile.Level));
            profile.ApplyXpAward(xp.XpAmount, timestamp);
            _db.QuestCompletions.Add(completion);
            _db.XpTransactions.Add(xp);
            var unlockedDefinitions =
                await _achievementAwards.StageMissingAutomaticAwardsAsync(
                profile,
                xp,
                completion.QuestCategorySnapshot,
                ct);
            var rewardEvent = await StageRewardEventAsync(
                profile,
                completion,
                quest,
                xp,
                previousProgression,
                unlockedDefinitions,
                timestamp,
                ct);

            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return new CompletionRedemptionResult(
                MyQuestCompletionState.FromCompletion(completion),
                ToRewardRecord(rewardEvent));
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: VerifiedCompletionConstraint,
            })
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestCompletionError.AlreadyCompleted,
                "You have already completed this Quest.");
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(ct);
            throw Error(
                QuestCompletionError.Concurrency,
                "Completion state changed during this request.");
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<IReadOnlyList<MemberRewardEventRecord>>
        ListUnseenRewardEventsAsync(
            Guid actorId,
            int take,
            CancellationToken ct = default)
    {
        var events = await _db.MemberRewardEvents
            .AsNoTracking()
            .Include(item => item.UnlockedAchievements)
            .Where(item => item.UserId == actorId && item.SeenAtUtc == null)
            .OrderBy(item => item.CreatedAt)
            .ThenBy(item => item.Id)
            .Take(take)
            .ToListAsync(ct);
        return events.Select(ToRewardRecord).ToArray();
    }

    public async Task<MemberRewardEventRecord> MarkRewardEventSeenAsync(
        Guid rewardEventId,
        Guid actorId,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        var rewardEvent = await _db.MemberRewardEvents
            .Include(item => item.UnlockedAchievements)
            .SingleOrDefaultAsync(
                item => item.Id == rewardEventId && item.UserId == actorId,
                ct)
            ?? throw Error(QuestCompletionError.NotFound, "Reward event not found.");
        rewardEvent.MarkSeen(now);
        await _db.SaveChangesAsync(ct);
        return ToRewardRecord(rewardEvent);
    }

    public async Task<MemberRewardEventRecord?> GetQuestRewardEventAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default)
    {
        var rewardEvent = await _db.MemberRewardEvents
            .AsNoTracking()
            .Include(item => item.UnlockedAchievements)
            .Where(item => item.QuestId == questId && item.UserId == actorId)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .FirstOrDefaultAsync(ct);
        return rewardEvent is null ? null : ToRewardRecord(rewardEvent);
    }

    public async Task<MyQuestCompletionState> GetStateAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default)
    {
        var questExists = await _db.Quests
            .AsNoTracking()
            .AnyAsync(
                quest => quest.Id == questId && quest.Status != QuestStatus.Draft,
                ct);
        if (!questExists)
            throw Error(QuestCompletionError.NotFound, "Quest not found.");

        var completion = await _db.QuestCompletions
            .AsNoTracking()
            .Where(item =>
                item.UserId == actorId &&
                item.QuestId == questId)
            // Surface the most consequential state when multiple historical
            // attempts exist for the same Quest.
            .OrderBy(item => item.Status == QuestCompletionStatus.Verified ? 0 :
                item.Status == QuestCompletionStatus.Pending ? 1 :
                item.Status == QuestCompletionStatus.SelfReported ? 2 : 3)
            .ThenByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync(ct);
        return completion is null
            ? MyQuestCompletionState.None
            : MyQuestCompletionState.FromCompletion(completion);
    }

    public async Task<EvidenceClaimRecord> SubmitClaimAsync(
        Guid questId,
        Guid actorId,
        EvidenceClaimInput input,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            EnsureCompletionDate(input.CompletedAtUtc, now);
            var quest = await LockQuestAsync(questId, ct)
                ?? throw Error(QuestCompletionError.NotFound, "Quest not found.");
            var participationId = await EnsureClaimEligibleAsync(quest, actorId, ct);
            if (await HasVerifiedAsync(questId, actorId, ct))
                throw Error(QuestCompletionError.AlreadyCompleted,
                    "You have already completed this Quest.");
            var profile = await LockUserProfileAsync(actorId, ct)
                ?? throw Error(QuestCompletionError.Forbidden, "Member profile not found.");

            var completion = QuestCompletion.CreateEvidenceClaim(
                actorId, quest, participationId, profile.HomeCommunityRegionId,
                input.CompletedAtUtc, now);
            var detail = EvidenceClaimDetail.Create(
                completion.Id, input.Description, input.EvidenceUrl, input.UserDeclaration);
            completion.EvidenceClaimDetail = detail;
            detail.QuestCompletion = completion;
            _db.QuestCompletions.Add(completion);
            _db.EvidenceClaimDetails.Add(detail);
            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return ToClaimRecord(completion, detail, quest.Title);
        }
        catch (ArgumentException exception)
        {
            await transaction.RollbackAsync(ct);
            throw Error(QuestCompletionError.InvalidEvidence, exception.Message);
        }
        catch (DbUpdateException exception) when (IsUnique(exception, PendingClaimConstraint))
        {
            await transaction.RollbackAsync(ct);
            throw Error(QuestCompletionError.PendingClaimExists,
                "A pending evidence claim already exists for this Quest.");
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<MyQuestCompletionState> SelfReportAsync(
        Guid questId,
        Guid actorId,
        DateTimeOffset completedAtUtc,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        try
        {
            EnsureCompletionDate(completedAtUtc, now);
            var quest = await _db.Quests.SingleOrDefaultAsync(item => item.Id == questId, ct)
                ?? throw Error(QuestCompletionError.NotFound, "Quest not found.");
            var participationId = await EnsureClaimEligibleAsync(quest, actorId, ct);
            if (await HasVerifiedAsync(questId, actorId, ct))
                throw Error(QuestCompletionError.AlreadyCompleted,
                    "You have already completed this Quest.");
            var completion = QuestCompletion.CreateSelfReported(
                actorId, quest, participationId, completedAtUtc, now);
            _db.QuestCompletions.Add(completion);
            await _db.SaveChangesAsync(ct);
            return MyQuestCompletionState.FromCompletion(completion);
        }
        catch (DbUpdateException exception) when (IsUnique(exception, SelfReportedConstraint))
        {
            throw Error(QuestCompletionError.SelfReportExists,
                "This Quest has already been self-reported.");
        }
    }

    public async Task<IReadOnlyList<EvidenceClaimSummary>> ListMyClaimsAsync(
        Guid actorId,
        QuestCompletionStatus? status,
        CancellationToken ct = default)
    {
        var query = _db.QuestCompletions
            .AsNoTracking()
            .Where(completion =>
                completion.Method == CompletionMethod.EvidenceClaim &&
                completion.UserId == actorId);
        if (status.HasValue)
            query = query.Where(completion => completion.Status == status.Value);
        return await query
            .OrderByDescending(completion => completion.CreatedAt)
            .ThenBy(completion => completion.Id)
            .Select(completion => new EvidenceClaimSummary(
                completion.Id, completion.UserId, completion.QuestId,
                completion.Quest!.Title, completion.Status, completion.CompletedAt,
                completion.CreatedAt, completion.EvidenceClaimDetail!.ReviewedAt))
            .ToListAsync(ct);
    }

    public async Task<EvidenceClaimRecord> GetClaimAsync(
        Guid claimId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var completion = await _db.QuestCompletions
            .AsNoTracking()
            .Include(item => item.Quest)
            .Include(item => item.EvidenceClaimDetail)
            .SingleOrDefaultAsync(item =>
                item.Id == claimId &&
                item.Method == CompletionMethod.EvidenceClaim, ct)
            ?? throw Error(QuestCompletionError.NotFound, "Claim not found.");
        if (!isAdmin && completion.UserId != actorId)
            // Hide ownership information by returning the same result as a
            // genuinely missing claim.
            throw Error(QuestCompletionError.NotFound, "Claim not found.");
        return ToClaimRecord(
            completion,
            completion.EvidenceClaimDetail!,
            completion.Quest!.Title);
    }

    public async Task<EvidenceClaimRecord> UpdateClaimAsync(
        Guid claimId,
        Guid actorId,
        EvidenceClaimInput input,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        var completion = await _db.QuestCompletions
            .Include(item => item.Quest)
            .Include(item => item.EvidenceClaimDetail)
            .SingleOrDefaultAsync(item =>
                item.Id == claimId &&
                item.UserId == actorId &&
                item.Method == CompletionMethod.EvidenceClaim, ct)
            ?? throw Error(QuestCompletionError.NotFound, "Claim not found.");
        try
        {
            EnsureCompletionDate(input.CompletedAtUtc, now);
            completion.UpdatePendingClaim(input.CompletedAtUtc, now);
            completion.EvidenceClaimDetail!.Update(
                input.Description, input.EvidenceUrl, input.UserDeclaration);
            await _db.SaveChangesAsync(ct);
            return ToClaimRecord(
                completion,
                completion.EvidenceClaimDetail,
                completion.Quest!.Title);
        }
        catch (InvalidOperationException exception)
        {
            throw Error(QuestCompletionError.ClaimAlreadyReviewed, exception.Message);
        }
        catch (ArgumentException exception)
        {
            throw Error(QuestCompletionError.InvalidEvidence, exception.Message);
        }
    }

    public async Task WithdrawClaimAsync(
        Guid claimId,
        Guid actorId,
        CancellationToken ct = default)
    {
        var completion = await _db.QuestCompletions
            .SingleOrDefaultAsync(item =>
                item.Id == claimId &&
                item.UserId == actorId &&
                item.Method == CompletionMethod.EvidenceClaim, ct)
            ?? throw Error(QuestCompletionError.NotFound, "Claim not found.");
        if (completion.Status != QuestCompletionStatus.Pending)
            throw Error(QuestCompletionError.ClaimAlreadyReviewed,
                "Reviewed claims cannot be withdrawn.");
        _db.QuestCompletions.Remove(completion);
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw Error(QuestCompletionError.ClaimAlreadyReviewed,
                "The claim changed while it was being withdrawn.");
        }
    }

    public async Task<IReadOnlyList<EvidenceClaimSummary>> ListPendingClaimsAsync(
        CancellationToken ct = default) =>
        await _db.QuestCompletions
            .AsNoTracking()
            .Where(completion =>
                completion.Method == CompletionMethod.EvidenceClaim &&
                completion.Status == QuestCompletionStatus.Pending)
            .OrderBy(completion => completion.CreatedAt)
            .ThenBy(completion => completion.Id)
            .Select(completion => new EvidenceClaimSummary(
                completion.Id, completion.UserId, completion.QuestId,
                completion.Quest!.Title, completion.Status, completion.CompletedAt,
                completion.CreatedAt, completion.EvidenceClaimDetail!.ReviewedAt))
            .ToListAsync(ct);

    public async Task<EvidenceClaimRecord> ReviewClaimAsync(
        Guid claimId,
        Guid reviewerId,
        bool approve,
        string? reviewNote,
        DateTimeOffset now,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            // Locking the claim makes review single-use and keeps approval,
            // evidence retention, XP, and achievement awards atomic.
            var completion = await _db.QuestCompletions
                .FromSqlInterpolated($$"""
                    SELECT c.*, c.xmin
                    FROM "QuestCompletions" AS c
                    WHERE c."Id" = {{claimId}}
                    FOR UPDATE
                    """)
                .SingleOrDefaultAsync(ct)
                ?? throw Error(QuestCompletionError.NotFound, "Claim not found.");
            if (completion.Method != CompletionMethod.EvidenceClaim)
                throw Error(QuestCompletionError.NotFound, "Claim not found.");
            if (completion.UserId == reviewerId)
                throw Error(QuestCompletionError.Forbidden,
                    "An Admin cannot review their own claim.");
            if (completion.Status != QuestCompletionStatus.Pending)
                throw Error(QuestCompletionError.ClaimAlreadyReviewed,
                    "This claim has already been reviewed.");
            var detail = await _db.EvidenceClaimDetails
                .SingleAsync(item => item.QuestCompletionId == claimId, ct);
            var quest = await _db.Quests.SingleAsync(item => item.Id == completion.QuestId, ct);

            detail.RecordReview(reviewerId, reviewNote, now);
            if (approve)
            {
                if (await HasVerifiedAsync(completion.QuestId, completion.UserId, ct))
                    throw Error(QuestCompletionError.AlreadyCompleted,
                        "The member already has a verified completion.");
                var profile = await LockUserProfileAsync(completion.UserId, ct)
                    ?? throw new InvalidOperationException("Member profile not found.");
                var previousProgression = new CompletionRewardProgression(
                    profile.TotalXp,
                    profile.Level,
                    ProgressionRules.RankTitleFor(profile.Level));
                completion.ApproveEvidenceClaim(now);
                var xp = XpTransaction.CreateFromVerifiedCompletion(completion);
                profile.ApplyXpAward(xp.XpAmount, now);
                _db.XpTransactions.Add(xp);
                var unlockedDefinitions =
                    await _achievementAwards.StageMissingAutomaticAwardsAsync(
                    profile,
                    xp,
                    completion.QuestCategorySnapshot,
                    ct);
                await StageRewardEventAsync(
                    profile,
                    completion,
                    quest,
                    xp,
                    previousProgression,
                    unlockedDefinitions,
                    now,
                    ct);
            }
            else
            {
                completion.RejectEvidenceClaim(now);
            }

            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return ToClaimRecord(completion, detail, quest.Title);
        }
        catch (DbUpdateException exception) when (IsUnique(exception, VerifiedCompletionConstraint))
        {
            await transaction.RollbackAsync(ct);
            throw Error(QuestCompletionError.AlreadyCompleted,
                "The member already has a verified completion.");
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    private async Task<MemberRewardEvent> StageRewardEventAsync(
        UserProfile profile,
        QuestCompletion completion,
        Quest quest,
        XpTransaction xp,
        CompletionRewardProgression previousProgression,
        IReadOnlyList<Kiwimpact.Core.Achievements.AchievementDefinition> unlockedDefinitions,
        DateTimeOffset now,
        CancellationToken ct)
    {
        var previousTimestamps = await _db.XpTransactions
            .AsNoTracking()
            .Where(item => item.UserId == profile.Id)
            .Select(item => item.CreatedAt)
            .ToListAsync(ct);
        var previousStreak = WeeklyStreakCalculator.Calculate(previousTimestamps, now);
        var currentStreak = WeeklyStreakCalculator.Calculate(
            previousTimestamps.Append(xp.CreatedAt),
            now);
        var community = await GetCommunityRewardSnapshotAsync(
            xp.CommunityRegionIdAtAward,
            xp.CreatedAt,
            ct);
        var celebration = await SelectCelebrationCopyAsync(ct);
        var rewardEvent = MemberRewardEvent.Create(
            xp,
            completion,
            quest.Title,
            previousProgression.TotalXp,
            previousProgression.Level,
            previousProgression.RankTitle,
            profile.TotalXp,
            profile.Level,
            ProgressionRules.RankTitleFor(profile.Level),
            previousStreak.CurrentWeeks,
            previousStreak.HasVerifiedImpactThisWeek,
            currentStreak.CurrentWeeks,
            currentStreak.HasVerifiedImpactThisWeek,
            celebration.Title,
            celebration.Message,
            community,
            now);
        for (var index = 0; index < unlockedDefinitions.Count; index++)
        {
            var definition = unlockedDefinitions[index];
            rewardEvent.UnlockedAchievements.Add(
                MemberRewardEventAchievement.Create(
                    rewardEvent.Id,
                    definition.Id,
                    definition.Code,
                    definition.Name,
                    index));
        }
        _db.MemberRewardEvents.Add(rewardEvent);
        return rewardEvent;
    }

    private async Task<(string Title, string Message)> SelectCelebrationCopyAsync(
        CancellationToken ct)
    {
        var copies = await _db.CompletionCelebrationCopies
            .AsNoTracking()
            .Where(item => item.IsActive)
            .OrderBy(item => item.SortOrder)
            .Select(item => new { item.Kind, item.Text })
            .ToListAsync(ct);
        var titles = copies
            .Where(item => item.Kind == CompletionCelebrationCopyKind.Title)
            .Select(item => item.Text)
            .ToArray();
        var messages = copies
            .Where(item => item.Kind == CompletionCelebrationCopyKind.Message)
            .Select(item => item.Text)
            .ToArray();
        if (titles.Length == 0 || messages.Length == 0)
        {
            throw new InvalidOperationException(
                "Active completion celebration titles and messages are required.");
        }
        return (
            titles[RandomNumberGenerator.GetInt32(titles.Length)],
            messages[RandomNumberGenerator.GetInt32(messages.Length)]);
    }

    private async Task<CommunityRewardSnapshot?> GetCommunityRewardSnapshotAsync(
        Guid? communityRegionId,
        DateTimeOffset awardedAt,
        CancellationToken ct)
    {
        if (!communityRegionId.HasValue) return null;
        var timestamp = awardedAt.ToUniversalTime();
        // Serialize the count-and-snapshot operation for this community. At
        // read-committed isolation, the next waiter sees the prior award after
        // its transaction commits instead of persisting the same N -> N+1
        // transition for two simultaneous members.
        var challenge = await _db.CommunityChallenges
            .FromSqlInterpolated($$"""
                SELECT c.*, c.xmin
                FROM "CommunityChallenges" AS c
                WHERE c."LocalAreaRegionId" = {{communityRegionId.Value}}
                  AND c."Status" = {{ChallengeStatus.Active.ToString()}}
                  AND c."PeriodStart" <= {{timestamp}}
                  AND c."PeriodEnd" > {{timestamp}}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(ct);
        if (challenge is null) return null;
        var communityName = await _db.Regions
            .AsNoTracking()
            .Where(region => region.Id == challenge.LocalAreaRegionId)
            .Select(region => region.Name)
            .SingleAsync(ct);
        var previousProgress = await _db.XpTransactions
            .AsNoTracking()
            .LongCountAsync(item =>
                item.CommunityRegionIdAtAward == communityRegionId.Value &&
                item.CreatedAt >= challenge.PeriodStart &&
                item.CreatedAt < challenge.PeriodEnd,
                ct);
        return new CommunityRewardSnapshot(
            challenge.Id,
            communityName,
            previousProgress,
            previousProgress + 1,
            challenge.TargetValue);
    }

    private static MemberRewardEventRecord ToRewardRecord(MemberRewardEvent item)
    {
        var community = item.CommunityChallengeId.HasValue
            ? new CompletionRewardCommunityChallenge(
                item.CommunityChallengeId.Value,
                item.CommunityName!,
                item.CommunityChallengePreviousProgress!.Value,
                item.CommunityChallengeProgress!.Value,
                item.CommunityChallengeTarget!.Value)
            : null;
        return new MemberRewardEventRecord(
            item.Id,
            item.QuestCompletionId,
            item.QuestId,
            item.QuestTitle,
            item.CelebrationTitle,
            item.CelebrationMessage,
            item.VerificationMethod,
            item.XpAwarded,
            new CompletionRewardProgression(
                item.PreviousTotalXp,
                item.PreviousLevel,
                item.PreviousRankTitle),
            new CompletionRewardProgression(
                item.TotalXp,
                item.Level,
                item.RankTitle),
            new CompletionRewardStreak(
                item.PreviousStreakWeeks,
                item.PreviousHasVerifiedImpactThisWeek,
                item.StreakWeeks,
                item.HasVerifiedImpactThisWeek),
            community,
            item.UnlockedAchievements
                .OrderBy(achievement => achievement.SortOrder)
                .ThenBy(achievement => achievement.Id)
                .Select(achievement => new CompletionRewardAchievement(
                    achievement.AchievementId,
                    achievement.Code,
                    achievement.Name))
                .ToArray(),
            item.CreatedAt,
            item.SeenAtUtc);
    }

    private Task<Quest?> LockQuestAsync(Guid questId, CancellationToken ct) =>
        _db.Quests
            .FromSqlInterpolated($$"""
                SELECT q.*, q.xmin
                FROM "Quests" AS q
                WHERE q."Id" = {{questId}}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(ct);

    private Task<UserProfile?> LockUserProfileAsync(Guid userId, CancellationToken ct) =>
        _db.UserProfiles
            .FromSqlInterpolated($$"""
                SELECT p.*
                FROM "UserProfiles" AS p
                WHERE p."Id" = {{userId}}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(ct);

    private async Task<Guid?> EnsureClaimEligibleAsync(
        Quest quest, Guid actorId, CancellationToken ct)
    {
        if (quest.CreatedByUserId == actorId)
            throw Error(QuestCompletionError.OwnQuest,
                "You cannot claim completion for a Quest you created.");
        if (quest.Status == QuestStatus.Draft)
            throw Error(QuestCompletionError.NotFound, "Quest not found.");
        if (quest.Status != QuestStatus.Published)
            throw Error(QuestCompletionError.CancelledOrArchived,
                "Only a published Quest can be completed.");
        if (quest.RegistrationMode != RegistrationMode.Native)
            // External registration has no local participation row to require.
            return null;
        var participationId = await _db.QuestParticipations
            .Where(item => item.UserId == actorId &&
                item.QuestId == quest.Id && item.CancelledAt == null)
            .Select(item => (Guid?)item.Id)
            .SingleOrDefaultAsync(ct);
        if (!participationId.HasValue)
            throw Error(QuestCompletionError.NoActiveParticipation,
                "An active Quest participation is required.");
        return participationId;
    }

    private Task<bool> HasVerifiedAsync(Guid questId, Guid actorId, CancellationToken ct) =>
        _db.QuestCompletions.AsNoTracking().AnyAsync(item =>
            item.QuestId == questId && item.UserId == actorId &&
            item.Status == QuestCompletionStatus.Verified, ct);

    private static EvidenceClaimRecord ToClaimRecord(
        QuestCompletion completion, EvidenceClaimDetail detail, string questTitle) =>
        new(completion.Id, completion.UserId, completion.QuestId, questTitle,
            completion.Status, completion.CompletedAt, completion.CreatedAt,
            detail.Description, detail.EvidenceUrl, detail.UserDeclaration,
            detail.ReviewNote, detail.ReviewedByUserId, detail.ReviewedAt,
            detail.EvidencePurgedAt);

    private static bool IsUnique(DbUpdateException exception, string constraint) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: var constraintName,
        } && constraintName == constraint;

    private static void EnsureCompletionDate(DateTimeOffset completedAt, DateTimeOffset now)
    {
        var utc = completedAt.ToUniversalTime();
        if (utc < DateTimeOffset.UnixEpoch || utc > now.ToUniversalTime())
            throw Error(QuestCompletionError.InvalidEvidence,
                "Completion date must be a valid date that is not in the future.");
    }

    private static void EnsureManagementAccess(Quest quest, Guid actorId, bool isAdmin)
    {
        if (quest.Status == QuestStatus.Draft && quest.CreatedByUserId != actorId && !isAdmin)
            throw Error(QuestCompletionError.NotFound, "Quest not found.");
        if (!isAdmin && quest.CreatedByUserId != actorId)
            throw Error(QuestCompletionError.Forbidden, "You do not own this Quest.");
    }

    private static QuestCompletionException Error(
        QuestCompletionError error,
        string message) => new(error, message);
}
