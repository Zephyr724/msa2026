using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class PublicPassportService : IPublicPassportService
{
    private readonly IPublicPassportRepository _repository;

    public PublicPassportService(IPublicPassportRepository repository) =>
        _repository = repository;

    public async Task<PublicPassportSettings> GetSettingsAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        ValidateUser(userId);
        return await _repository.GetSettingsAsync(userId, ct)
            ?? throw Error(PublicPassportError.NotFound, "Passport not found.");
    }

    public async Task<PublicPassportSettings> UpdateSettingsAsync(
        Guid userId,
        bool isEnabled,
        IReadOnlyList<Guid> featuredAchievementIds,
        CancellationToken ct = default)
    {
        ValidateUser(userId);
        ArgumentNullException.ThrowIfNull(featuredAchievementIds);
        if (featuredAchievementIds.Count > FeaturedPassportAchievement.MaxFeaturedAchievements)
            throw Error(PublicPassportError.Validation, "Select no more than 5 achievements.");
        if (featuredAchievementIds.Any(id => id == Guid.Empty) ||
            featuredAchievementIds.Distinct().Count() != featuredAchievementIds.Count)
        {
            throw Error(PublicPassportError.Validation, "Featured achievements must be unique.");
        }

        return await _repository.UpdateSettingsAsync(
            userId,
            isEnabled,
            featuredAchievementIds,
            DateTimeOffset.UtcNow,
            ct) ?? throw Error(PublicPassportError.NotFound, "Passport not found.");
    }

    public async Task<PublicPassportView> GetPublicAsync(
        Guid shareId,
        CancellationToken ct = default)
    {
        if (shareId == Guid.Empty)
            throw Error(PublicPassportError.NotFound, "Public Passport not found.");
        return await _repository.GetPublicAsync(shareId, ct)
            ?? throw Error(PublicPassportError.NotFound, "Public Passport not found.");
    }

    public async Task<VerifiedStoryContext> GetVerifiedStoryContextAsync(
        Guid userId,
        Guid completionId,
        CancellationToken ct = default)
    {
        ValidateUser(userId);
        if (completionId == Guid.Empty)
            throw Error(PublicPassportError.NotFound, "Verified completion not found.");
        return await _repository.GetVerifiedStoryContextAsync(userId, completionId, ct)
            ?? throw Error(PublicPassportError.NotFound, "Verified completion not found.");
    }

    private static void ValidateUser(Guid userId)
    {
        if (userId == Guid.Empty)
            throw Error(PublicPassportError.NotFound, "Passport not found.");
    }

    private static PublicPassportException Error(PublicPassportError error, string message) =>
        new(error, message);
}
