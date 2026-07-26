using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class PassportService : IPassportService
{
    private readonly IPassportRepository _repository;

    public PassportService(IPassportRepository repository)
    {
        _repository = repository;
    }

    public async Task<(IReadOnlyList<PassportCompletionItem> Items, int TotalCount)>
        GetMyCompletionsAsync(
            Guid actorId,
            int page,
            int pageSize,
            CancellationToken ct = default)
    {
        if (actorId == Guid.Empty)
            throw new PassportException(
                PassportError.NotFound,
                "Profile not found.");

        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 12 : Math.Min(pageSize, 50);

        // The existence check precedes any page composition so a principal
        // without a profile always receives the bounded 404.
        if (!await _repository.ProfileExistsAsync(actorId, ct))
            throw new PassportException(
                PassportError.NotFound,
                "Profile not found.");

        // Caller-scoped invariant check: a Verified completion without its
        // verification timestamp is unprocessable by design and must never
        // be rendered with an invented timestamp.
        if (await _repository.HasNullTimestampVerifiedCompletionAsync(actorId, ct))
            throw new PassportException(
                PassportError.NotReady,
                "Progression state is not ready yet.");

        return await _repository.GetCompletionPageAsync(actorId, page, pageSize, ct);
    }
}
