using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class LeaderboardService : ILeaderboardService
{
    public const int PrivacyThreshold = 10;
    public const int DefaultPageSize = 10;
    public const int MaximumPageSize = 50;

    private readonly ILeaderboardRepository _leaderboardRepository;
    private readonly IXpLedgerRepository _xpLedgerRepository;

    public LeaderboardService(
        ILeaderboardRepository leaderboardRepository,
        IXpLedgerRepository xpLedgerRepository)
    {
        _leaderboardRepository = leaderboardRepository;
        _xpLedgerRepository = xpLedgerRepository;
    }

    public async Task<PeopleLeaderboard> GetPeopleLeaderboardAsync(
        Guid? actorId,
        string? scope,
        string? period,
        string? page,
        string? pageSize,
        CancellationToken ct = default)
    {
        var resolvedScope = ParsePeopleScope(scope);
        var resolvedPeriod = ParsePeoplePeriod(period);
        var resolvedPage = ParsePositive(page, 1, "page");
        var resolvedPageSize = ParsePositive(pageSize, DefaultPageSize, "pageSize");
        if (resolvedPageSize > MaximumPageSize)
            throw Invalid($"pageSize must be between 1 and {MaximumPageSize}.");

        if (await _xpLedgerRepository.HasRewardPendingCompletionsAsync(ct))
            throw new LeaderboardException(
                LeaderboardError.NotReady,
                "Leaderboard state is not ready yet.");

        Guid? communityId = null;
        if (resolvedScope == "myCommunity")
        {
            if (!actorId.HasValue)
                throw new LeaderboardException(
                    LeaderboardError.Unauthorized,
                    "Sign in to view your community leaderboard.");
            communityId = await _leaderboardRepository
                .GetHomeCommunityIdAsync(actorId.Value, ct);
            if (!communityId.HasValue)
                resolvedScope = "auckland";
        }

        var result = await _leaderboardRepository.GetPeopleAsync(
            communityId,
            resolvedScope == "auckland",
            PeriodStartUtc(resolvedPeriod),
            checked((resolvedPage - 1) * resolvedPageSize),
            resolvedPageSize,
            ct);
        var privacyProtected =
            resolvedScope == "myCommunity" &&
            result.ParticipantCount < PrivacyThreshold;

        var rows = privacyProtected
            ? []
            : result.Rows
                .Select((row, index) => new RankedLeaderboardRow(
                    ((resolvedPage - 1) * resolvedPageSize) + index + 1,
                    row.DisplayName,
                    row.TotalXp,
                    row.VerifiedCompletionCount))
                .ToList();
        return new PeopleLeaderboard(
            resolvedScope,
            resolvedPeriod,
            resolvedPage,
            resolvedPageSize,
            privacyProtected ? 0 : result.ParticipantCount,
            privacyProtected,
            null,
            rows);
    }

    public async Task<CommunitiesLeaderboard> GetCommunitiesLeaderboardAsync(
        string? scope,
        string? period,
        CancellationToken ct = default)
    {
        var resolvedScope = scope ?? "auckland";
        if (resolvedScope is not ("auckland" or "nz"))
            throw Invalid("Communities scope must be auckland or nz.");
        var resolvedPeriod = period ?? "monthly";
        if (resolvedPeriod is not ("monthly" or "allTime"))
            throw Invalid("Communities period must be monthly or allTime.");
        if (await _xpLedgerRepository.HasRewardPendingCompletionsAsync(ct))
            throw new LeaderboardException(
                LeaderboardError.NotReady,
                "Leaderboard state is not ready yet.");

        var rows = await _leaderboardRepository.GetCommunitiesAsync(
            resolvedScope == "auckland",
            PeriodStartUtc(resolvedPeriod),
            ct);
        var ranked = rows
            .Select(row => new
            {
                Row = row,
                Ratio = row.ActiveContributors == 0
                    ? 0m
                    : decimal.Divide(
                        row.VerifiedCompletionCount,
                        row.ActiveContributors),
            })
            .OrderByDescending(item => item.Ratio)
            .ThenByDescending(item => item.Row.VerifiedCompletionCount)
            .ThenBy(item => item.Row.RegionName)
            .Select((item, index) =>
            {
                var protectedRow =
                    item.Row.ActiveContributors < PrivacyThreshold;
                return new RankedCommunityLeaderboardRow(
                    index + 1,
                    item.Row.RegionId,
                    item.Row.RegionName,
                    item.Row.VerifiedCompletionCount,
                    protectedRow ? null : item.Row.ActiveContributors,
                    protectedRow ? null : decimal.Round(item.Ratio, 2),
                    protectedRow);
            })
            .ToList();
        return new CommunitiesLeaderboard(
            resolvedScope,
            resolvedPeriod,
            ranked);
    }

    private static string ParsePeopleScope(string? scope)
    {
        var value = scope ?? "auckland";
        return value is "myCommunity" or "auckland" or "nz"
            ? value
            : throw Invalid("People scope must be myCommunity, auckland, or nz.");
    }

    private static string ParsePeoplePeriod(string? period)
    {
        var value = period ?? "weekly";
        return value is "weekly" or "monthly" or "allTime"
            ? value
            : throw Invalid("People period must be weekly, monthly, or allTime.");
    }

    private static int ParsePositive(string? input, int fallback, string field)
    {
        if (input is null)
            return fallback;
        if (!int.TryParse(input, out var value) || value < 1)
            throw Invalid($"{field} must be a positive integer.");
        return value;
    }

    public static DateTimeOffset? PeriodStartUtc(
        string period,
        DateTimeOffset? now = null)
    {
        if (period == "allTime")
            return null;
        var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland");
        var localNow = TimeZoneInfo.ConvertTime(now ?? DateTimeOffset.UtcNow, zone);
        var localDate = DateOnly.FromDateTime(localNow.DateTime);
        var startDate = period == "monthly"
            ? new DateOnly(localDate.Year, localDate.Month, 1)
            : localDate.AddDays(-(((int)localDate.DayOfWeek + 6) % 7));
        var unspecified = DateTime.SpecifyKind(
            startDate.ToDateTime(TimeOnly.MinValue),
            DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecified, zone);
    }

    private static LeaderboardException Invalid(string message) =>
        new(LeaderboardError.InvalidParameters, message);
}
