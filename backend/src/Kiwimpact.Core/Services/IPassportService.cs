namespace Kiwimpact.Core.Services;

public interface IPassportService
{
    Task<(IReadOnlyList<PassportCompletionItem> Items, int TotalCount)>
        GetMyCompletionsAsync(
            Guid actorId,
            int page,
            int pageSize,
            CancellationToken ct = default);
}
