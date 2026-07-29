using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Core;

public sealed class LeaderboardServiceTests
{
    [Fact]
    public async Task OmittedParametersDefaultToAucklandWeeklyAndRankRows()
    {
        var rows = new[]
        {
            new LeaderboardRepositoryRow(Guid.NewGuid(), "Second", 200, 2),
            new LeaderboardRepositoryRow(Guid.NewGuid(), "First", 100, 1),
        };
        var leaderboardRepository = new FakeLeaderboardRepository(rows, 2);
        var xpRepository = new FakeXpLedgerRepository();
        var service = new LeaderboardService(leaderboardRepository, xpRepository);

        var result = await service.GetPeopleLeaderboardAsync(
            null, null, null, null, null, TestContext.Current.CancellationToken);

        Assert.Equal("auckland", result.Scope);
        Assert.Equal("weekly", result.Period);
        Assert.Equal([1, 2], result.Rows.Select(row => row.Rank));
        Assert.Equal(["Second", "First"], result.Rows.Select(row => row.DisplayName));
        Assert.Equal(LeaderboardService.DefaultPageSize, leaderboardRepository.ObservedTake);
        Assert.True(leaderboardRepository.ObservedAucklandOnly);
        Assert.NotNull(leaderboardRepository.ObservedFromUtc);
        Assert.Equal(1, xpRepository.ReadinessCalls);
        Assert.All(result.Rows, row => Assert.False(row.IsCurrentUser));
    }

    [Fact]
    public async Task AuthenticatedReadMarksOnlyTheIdentitySafeActorRow()
    {
        var actorId = Guid.NewGuid();
        var rows = new[]
        {
            new LeaderboardRepositoryRow(Guid.NewGuid(), "Same name", 200, 2),
            new LeaderboardRepositoryRow(actorId, "Same name", 100, 1),
        };
        var service = new LeaderboardService(
            new FakeLeaderboardRepository(rows, 2),
            new FakeXpLedgerRepository());

        var result = await service.GetPeopleLeaderboardAsync(
            actorId,
            "auckland",
            "weekly",
            null,
            null,
            TestContext.Current.CancellationToken);

        Assert.False(result.Rows[0].IsCurrentUser);
        Assert.True(result.Rows[1].IsCurrentUser);
    }

    [Fact]
    public async Task SmallMyCommunitySuppressesCountsProgressAndRows()
    {
        var communityId = Guid.NewGuid();
        var repository = new FakeLeaderboardRepository(
            [new LeaderboardRepositoryRow(Guid.NewGuid(), "Hidden", 100, 1)],
            1)
        {
            HomeCommunityId = communityId,
        };
        var service = new LeaderboardService(repository, new FakeXpLedgerRepository());

        var result = await service.GetPeopleLeaderboardAsync(
            Guid.NewGuid(),
            "myCommunity",
            "monthly",
            null,
            null,
            TestContext.Current.CancellationToken);

        Assert.True(result.IsPrivacyProtected);
        Assert.Empty(result.Rows);
        Assert.Equal(0, result.TotalCount);
        Assert.Null(result.CollectiveProgress);
        Assert.Equal(communityId, repository.ObservedCommunityId);
    }

    [Fact]
    public async Task MyCommunityWithoutSelectionFallsBackToAuckland()
    {
        var repository = new FakeLeaderboardRepository([], 0);
        var service = new LeaderboardService(repository, new FakeXpLedgerRepository());

        var result = await service.GetPeopleLeaderboardAsync(
            Guid.NewGuid(),
            "myCommunity",
            "weekly",
            null,
            null,
            TestContext.Current.CancellationToken);

        Assert.Equal("auckland", result.Scope);
        Assert.True(repository.ObservedAucklandOnly);
    }

    [Fact]
    public async Task AnonymousMyCommunityIsUnauthorized()
    {
        var repository = new FakeLeaderboardRepository([], 0);
        var service = new LeaderboardService(repository, new FakeXpLedgerRepository());

        var exception = await Assert.ThrowsAsync<LeaderboardException>(() =>
            service.GetPeopleLeaderboardAsync(
                null,
                "myCommunity",
                "weekly",
                null,
                null,
                TestContext.Current.CancellationToken));

        Assert.Equal(LeaderboardError.Unauthorized, exception.Error);
    }

    [Theory]
    [InlineData("", "weekly", null, null)]
    [InlineData("NZ", "weekly", null, null)]
    [InlineData("nz", "", null, null)]
    [InlineData("nz", "Weekly", null, null)]
    [InlineData("nz", "weekly", "", null)]
    [InlineData("nz", "weekly", "0", null)]
    [InlineData("nz", "weekly", null, "51")]
    public async Task InvalidParametersFailBeforeReadiness(
        string? scope,
        string? period,
        string? page,
        string? pageSize)
    {
        var repository = new FakeLeaderboardRepository([], 0);
        var xpRepository = new FakeXpLedgerRepository { RewardPending = true };
        var service = new LeaderboardService(repository, xpRepository);

        var exception = await Assert.ThrowsAsync<LeaderboardException>(() =>
            service.GetPeopleLeaderboardAsync(
                null,
                scope,
                period,
                page,
                pageSize,
                TestContext.Current.CancellationToken));

        Assert.Equal(LeaderboardError.InvalidParameters, exception.Error);
        Assert.Equal(0, xpRepository.ReadinessCalls);
    }

    [Fact]
    public async Task RewardPendingFailsClosedBeforeRankingQuery()
    {
        var repository = new FakeLeaderboardRepository([], 0);
        var xpRepository = new FakeXpLedgerRepository { RewardPending = true };
        var service = new LeaderboardService(repository, xpRepository);

        var exception = await Assert.ThrowsAsync<LeaderboardException>(() =>
            service.GetPeopleLeaderboardAsync(
                null, null, null, null, null, TestContext.Current.CancellationToken));

        Assert.Equal(LeaderboardError.NotReady, exception.Error);
        Assert.Equal(0, repository.Calls);
    }

    private sealed class FakeLeaderboardRepository(
        IReadOnlyList<LeaderboardRepositoryRow> rows,
        int participantCount)
        : ILeaderboardRepository
    {
        public Guid? HomeCommunityId { get; init; }
        public int Calls { get; private set; }
        public int ObservedTake { get; private set; }
        public bool ObservedAucklandOnly { get; private set; }
        public Guid? ObservedCommunityId { get; private set; }
        public DateTimeOffset? ObservedFromUtc { get; private set; }

        public Task<Guid?> GetHomeCommunityIdAsync(
            Guid userId,
            CancellationToken ct = default) =>
            Task.FromResult(HomeCommunityId);

        public Task<PeopleLeaderboardRepositoryResult> GetPeopleAsync(
            Guid? communityRegionId,
            bool aucklandOnly,
            DateTimeOffset? fromUtc,
            int skip,
            int take,
            CancellationToken ct = default)
        {
            Calls++;
            ObservedTake = take;
            ObservedAucklandOnly = aucklandOnly;
            ObservedCommunityId = communityRegionId;
            ObservedFromUtc = fromUtc;
            return Task.FromResult(new PeopleLeaderboardRepositoryResult(
                rows,
                participantCount,
                rows.Sum(row => row.TotalXp),
                rows.Sum(row => row.VerifiedCompletionCount)));
        }

        public Task<IReadOnlyList<CommunityLeaderboardRepositoryRow>>
            GetCommunitiesAsync(
                bool aucklandOnly,
                DateTimeOffset? fromUtc,
                CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<CommunityLeaderboardRepositoryRow>>([]);
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
            CancellationToken ct = default) => throw new NotSupportedException();
        public Task<IReadOnlyList<QuestCompletion>> GetAwardEligibleBatchAsync(
            int batchSize,
            IReadOnlyCollection<Guid> attemptedIds,
            CancellationToken ct = default) => throw new NotSupportedException();
        public Task<XpAwardOutcome> AwardVerifiedCompletionAsync(
            QuestCompletion completion,
            DateTimeOffset now,
            CancellationToken ct = default) => throw new NotSupportedException();
        public Task<MyProgressionState?> FindProgressionAsync(
            Guid userId,
            CancellationToken ct = default) => throw new NotSupportedException();
    }
}
