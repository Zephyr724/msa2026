using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Api.Reconciliation;

public sealed class CommunityChallengeFinalizer
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CommunityChallengeFinalizer> _logger;

    public CommunityChallengeFinalizer(
        IServiceScopeFactory scopeFactory,
        ILogger<CommunityChallengeFinalizer> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<int> FinalizePassAsync(CancellationToken ct = default)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        var now = DateTimeOffset.UtcNow;
        var challenges = await db.CommunityChallenges
            .Where(item =>
                item.Status == ChallengeStatus.Active &&
                item.PeriodEnd <= now)
            .OrderBy(item => item.PeriodEnd)
            .Take(100)
            .ToListAsync(ct);
        var finalized = 0;
        foreach (var challenge in challenges)
        {
            var eligible = db.XpTransactions.AsNoTracking().Where(item =>
                item.CommunityRegionIdAtAward == challenge.LocalAreaRegionId &&
                item.CreatedAt >= challenge.PeriodStart &&
                item.CreatedAt < challenge.PeriodEnd);
            var progress = await eligible.LongCountAsync(ct);
            challenge.Finalize(progress, now);
            if (challenge.Status == ChallengeStatus.Completed &&
                challenge.RewardAchievementId.HasValue)
            {
                var userIds = await eligible
                    .Select(item => item.UserId)
                    .Distinct()
                    .ToListAsync(ct);
                var alreadyAwarded = await db.UserAchievements
                    .AsNoTracking()
                    .Where(item =>
                        item.SourceCommunityChallengeId == challenge.Id &&
                        item.AchievementId == challenge.RewardAchievementId.Value)
                    .Select(item => item.UserId)
                    .ToListAsync(ct);
                foreach (var userId in userIds.Except(alreadyAwarded))
                {
                    db.UserAchievements.Add(
                        UserAchievement.CreateFromCommunityChallenge(
                            userId,
                            challenge.RewardAchievementId.Value,
                            challenge.Id,
                            challenge.PeriodEnd));
                }
            }
            await db.SaveChangesAsync(ct);
            finalized++;
        }
        if (finalized > 0)
            _logger.LogInformation(
                "Community challenge finalizer completed {Count} challenge(s).",
                finalized);
        return finalized;
    }
}

public sealed class CommunityChallengeFinalizerHostedService : BackgroundService
{
    private readonly CommunityChallengeFinalizer _finalizer;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CommunityChallengeFinalizerHostedService> _logger;

    public CommunityChallengeFinalizerHostedService(
        CommunityChallengeFinalizer finalizer,
        IConfiguration configuration,
        ILogger<CommunityChallengeFinalizerHostedService> logger)
    {
        _finalizer = finalizer;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_configuration.GetValue("CommunityChallenges:FinalizerEnabled", true))
            return;
        var interval = _configuration.GetValue(
            "CommunityChallenges:FinalizerInterval",
            TimeSpan.FromMinutes(15));
        using var timer = new PeriodicTimer(interval);
        do
        {
            try
            {
                await _finalizer.FinalizePassAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    "Community challenge finalization failed ({ExceptionType}).",
                    exception.GetType().Name);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
