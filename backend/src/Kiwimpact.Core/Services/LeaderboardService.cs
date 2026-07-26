using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class LeaderboardService : ILeaderboardService
{
    public const string SupportedScope = "nz";
    public const string SupportedPeriod = "allTime";
    public const int RowLimit = 10;

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
        string? scope,
        string? period,
        string? page,
        string? pageSize,
        CancellationToken ct = default)
    {
        var resolvedScope = scope ?? SupportedScope;
        var resolvedPeriod = period ?? SupportedPeriod;
        if (!string.Equals(resolvedScope, SupportedScope, StringComparison.Ordinal) ||
            !string.Equals(resolvedPeriod, SupportedPeriod, StringComparison.Ordinal) ||
            page is not null ||
            pageSize is not null)
        {
            throw new LeaderboardException(
                LeaderboardError.InvalidParameters,
                "This staged leaderboard supports only scope=nz and " +
                "period=allTime with a fixed Top 10; page and pageSize " +
                "are not supported.");
        }

        if (await _xpLedgerRepository.HasRewardPendingCompletionsAsync(ct))
        {
            throw new LeaderboardException(
                LeaderboardError.NotReady,
                "Leaderboard state is not ready yet.");
        }

        var rows = await _leaderboardRepository
            .GetTopPeopleNzAllTimeAsync(RowLimit, ct);
        var rankedRows = rows
            .Select((row, index) => new RankedLeaderboardRow(
                index + 1,
                row.DisplayName,
                row.TotalXp,
                row.VerifiedCompletionCount))
            .ToList();

        return new PeopleLeaderboard(
            SupportedScope,
            SupportedPeriod,
            rankedRows);
    }
}
