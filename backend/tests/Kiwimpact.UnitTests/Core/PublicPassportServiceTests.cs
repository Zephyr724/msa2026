using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;

namespace Kiwimpact.UnitTests.Core;

public sealed class PublicPassportServiceTests
{
    [Fact]
    public async Task UpdateRejectsMoreThanFiveOrDuplicateFeaturedAchievements()
    {
        var repository = new FakePublicPassportRepository();
        var service = new PublicPassportService(repository);
        var userId = Guid.NewGuid();

        var tooMany = await Assert.ThrowsAsync<PublicPassportException>(() =>
            service.UpdateSettingsAsync(
                userId,
                true,
                Enumerable.Range(0, 6).Select(_ => Guid.NewGuid()).ToArray(),
                TestContext.Current.CancellationToken));
        var duplicateId = Guid.NewGuid();
        var duplicate = await Assert.ThrowsAsync<PublicPassportException>(() =>
            service.UpdateSettingsAsync(
                userId,
                true,
                [duplicateId, duplicateId],
                TestContext.Current.CancellationToken));

        Assert.Equal(PublicPassportError.Validation, tooMany.Error);
        Assert.Equal(PublicPassportError.Validation, duplicate.Error);
        Assert.Equal(0, repository.UpdateCalls);
    }

    [Fact]
    public async Task UpdatePreservesTheMemberSelectedOrder()
    {
        var ids = new[] { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
        var repository = new FakePublicPassportRepository
        {
            Updated = new PublicPassportSettings(true, Guid.NewGuid(), ids),
        };
        var service = new PublicPassportService(repository);

        var result = await service.UpdateSettingsAsync(
            Guid.NewGuid(),
            true,
            ids,
            TestContext.Current.CancellationToken);

        Assert.Equal(ids, result.FeaturedAchievementIds);
        Assert.Equal(ids, repository.ObservedFeaturedIds);
    }

    [Fact]
    public void PublicPassportShareIdIsStableAcrossDisableAndReenable()
    {
        var profile = UserProfile.Create(Guid.NewGuid(), "Aroha", DateTimeOffset.UtcNow);

        var first = profile.UpdatePublicPassportVisibility(true, DateTimeOffset.UtcNow);
        profile.UpdatePublicPassportVisibility(false, DateTimeOffset.UtcNow.AddMinutes(1));
        var second = profile.UpdatePublicPassportVisibility(true, DateTimeOffset.UtcNow.AddMinutes(2));

        Assert.NotNull(first);
        Assert.Equal(first, second);
        Assert.True(profile.IsPublicPassportEnabled);
    }

    private sealed class FakePublicPassportRepository : IPublicPassportRepository
    {
        public int UpdateCalls { get; private set; }
        public IReadOnlyList<Guid>? ObservedFeaturedIds { get; private set; }
        public PublicPassportSettings? Updated { get; init; }

        public Task<PublicPassportSettings?> GetSettingsAsync(Guid userId, CancellationToken ct = default) =>
            Task.FromResult<PublicPassportSettings?>(null);

        public Task<PublicPassportSettings?> UpdateSettingsAsync(
            Guid userId,
            bool isEnabled,
            IReadOnlyList<Guid> featuredAchievementIds,
            DateTimeOffset now,
            CancellationToken ct = default)
        {
            UpdateCalls++;
            ObservedFeaturedIds = featuredAchievementIds.ToArray();
            return Task.FromResult(Updated);
        }

        public Task<PublicPassportView?> GetPublicAsync(Guid shareId, CancellationToken ct = default) =>
            Task.FromResult<PublicPassportView?>(null);

        public Task<VerifiedStoryContext?> GetVerifiedStoryContextAsync(
            Guid userId,
            Guid completionId,
            CancellationToken ct = default) =>
            Task.FromResult<VerifiedStoryContext?>(null);
    }
}
