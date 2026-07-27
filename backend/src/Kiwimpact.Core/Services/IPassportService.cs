namespace Kiwimpact.Core.Services;

public interface IPassportService
{
    Task<PassportSummary> GetMySummaryAsync(
        Guid actorId,
        CancellationToken ct = default);

    Task<(IReadOnlyList<PassportCompletionItem> Items, int TotalCount)>
        GetMyCompletionsAsync(
            Guid actorId,
            int page,
            int pageSize,
            CancellationToken ct = default);

    Task<IReadOnlyList<PassportCommunityParticipation>>
        GetMyCommunityParticipationAsync(
            Guid actorId,
            CancellationToken ct = default);
}
