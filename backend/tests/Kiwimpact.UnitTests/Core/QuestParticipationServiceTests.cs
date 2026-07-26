using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Core;

public sealed class QuestParticipationServiceTests
{
    private readonly QuestParticipationService _service =
        new(new UnusedParticipationRepository());

    [Fact]
    public async Task ListMine_RejectsEmptyAuthenticatedActor()
    {
        var exception = await Assert.ThrowsAsync<QuestParticipationException>(
            () => _service.ListMineAsync(
                Guid.Empty,
                MyQuestParticipationFilter.All,
                TestContext.Current.CancellationToken));

        Assert.Equal(QuestParticipationError.NotFound, exception.Error);
    }

    [Fact]
    public async Task ListMine_RejectsUndefinedFilter()
    {
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
            () => _service.ListMineAsync(
                Guid.NewGuid(),
                (MyQuestParticipationFilter)999,
                TestContext.Current.CancellationToken));
    }

    private sealed class UnusedParticipationRepository : IQuestParticipationRepository
    {
        public Task<QuestParticipation> JoinAsync(
            Guid questId,
            Guid actorId,
            DateTimeOffset now,
            CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<QuestParticipation> CancelAsync(
            Guid questId,
            Guid actorId,
            DateTimeOffset now,
            CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<MyQuestParticipationState> GetStateAsync(
            Guid questId,
            Guid actorId,
            DateTimeOffset now,
            CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<QuestParticipation>> ListMineAsync(
            Guid actorId,
            MyQuestParticipationFilter filter,
            CancellationToken ct = default) =>
            throw new NotSupportedException();
    }
}
