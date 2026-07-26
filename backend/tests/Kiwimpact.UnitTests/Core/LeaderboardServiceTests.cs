using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Core;

public sealed class LeaderboardServiceTests
{
    [Fact]
    public async Task OmittedParametersDefaultAndRepositoryOrderGetsOrdinalRanks()
    {
        var rows = new[]
        {
            new LeaderboardRepositoryRow(Guid.NewGuid(), "Second", 200, 2),
            new LeaderboardRepositoryRow(Guid.NewGuid(), "First", 100, 1),
        };
        var leaderboardRepository = new FakeLeaderboardRepository(rows);
        var xpRepository = new FakeXpLedgerRepository();
        var service = new LeaderboardService(leaderboardRepository, xpRepository);

        var result = await service.GetPeopleLeaderboardAsync(
            null,
            null,
            null,
            null,
            TestContext.Current.CancellationToken);

        Assert.Equal("nz", result.Scope);
        Assert.Equal("allTime", result.Period);
        Assert.Equal([1, 2], result.Rows.Select(row => row.Rank));
        Assert.Equal(["Second", "First"], result.Rows.Select(row => row.DisplayName));
        Assert.Equal(LeaderboardService.RowLimit, leaderboardRepository.ObservedLimit);
        Assert.Equal(1, xpRepository.ReadinessCalls);
        Assert.Equal(1, leaderboardRepository.Calls);
    }

    [Fact]
    public async Task ExplicitSupportedParametersSucceed()
    {
        var leaderboardRepository = new FakeLeaderboardRepository([]);
        var service = new LeaderboardService(
            leaderboardRepository,
            new FakeXpLedgerRepository());

        var result = await service.GetPeopleLeaderboardAsync(
            "nz",
            "allTime",
            null,
            null,
            TestContext.Current.CancellationToken);

        Assert.Empty(result.Rows);
    }

    [Theory]
    [InlineData("", "allTime", null, null)]
    [InlineData("NZ", "allTime", null, null)]
    [InlineData("auckland", "allTime", null, null)]
    [InlineData("nz", "", null, null)]
    [InlineData("nz", "AllTime", null, null)]
    [InlineData("nz", "weekly", null, null)]
    [InlineData("nz", "allTime", "", null)]
    [InlineData("nz", "allTime", "1", null)]
    [InlineData("nz", "allTime", "not-a-number", null)]
    [InlineData("nz", "allTime", null, "")]
    [InlineData("nz", "allTime", null, "10")]
    [InlineData("nz", "allTime", null, "not-a-number")]
    public async Task InvalidStagedParametersFailBeforeReadinessAndQuery(
        string? scope,
        string? period,
        string? page,
        string? pageSize)
    {
        var leaderboardRepository = new FakeLeaderboardRepository([]);
        var xpRepository = new FakeXpLedgerRepository { RewardPending = true };
        var service = new LeaderboardService(leaderboardRepository, xpRepository);

        var exception = await Assert.ThrowsAsync<LeaderboardException>(() =>
            service.GetPeopleLeaderboardAsync(
                scope,
                period,
                page,
                pageSize,
                TestContext.Current.CancellationToken));

        Assert.Equal(LeaderboardError.InvalidParameters, exception.Error);
        Assert.Equal(0, xpRepository.ReadinessCalls);
        Assert.Equal(0, leaderboardRepository.Calls);
    }

    [Fact]
    public async Task RewardPendingFailsClosedBeforeRankingQuery()
    {
        var leaderboardRepository = new FakeLeaderboardRepository([]);
        var xpRepository = new FakeXpLedgerRepository { RewardPending = true };
        var service = new LeaderboardService(leaderboardRepository, xpRepository);

        var exception = await Assert.ThrowsAsync<LeaderboardException>(() =>
            service.GetPeopleLeaderboardAsync(
                null,
                null,
                null,
                null,
                TestContext.Current.CancellationToken));

        Assert.Equal(LeaderboardError.NotReady, exception.Error);
        Assert.Equal(1, xpRepository.ReadinessCalls);
        Assert.Equal(0, leaderboardRepository.Calls);
    }

    private sealed class FakeLeaderboardRepository(
        IReadOnlyList<LeaderboardRepositoryRow> rows)
        : ILeaderboardRepository
    {
        public int Calls { get; private set; }
        public int ObservedLimit { get; private set; }

        public Task<IReadOnlyList<LeaderboardRepositoryRow>>
            GetTopPeopleNzAllTimeAsync(
                int limit,
                CancellationToken ct = default)
        {
            Calls++;
            ObservedLimit = limit;
            return Task.FromResult(rows);
        }
    }

    private sealed class FakeXpLedgerRepository : IXpLedgerRepository
    {
        public bool RewardPending { get; init; }
        public int ReadinessCalls { get; private set; }

        public Task<bool> HasRewardPendingCompletionsAsync(
            CancellationToken ct = default)
        {
            ReadinessCalls++;
            return Task.FromResult(RewardPending);
        }

        public Task<int> CountUnprocessableRewardPendingAsync(
            CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<QuestCompletion>> GetAwardEligibleBatchAsync(
            int batchSize,
            IReadOnlyCollection<Guid> attemptedIds,
            CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<XpAwardOutcome> AwardVerifiedCompletionAsync(
            QuestCompletion completion,
            DateTimeOffset now,
            CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<MyProgressionState?> FindProgressionAsync(
            Guid userId,
            CancellationToken ct = default) =>
            throw new NotSupportedException();
    }
}
