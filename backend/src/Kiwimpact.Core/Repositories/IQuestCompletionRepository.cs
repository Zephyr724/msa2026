using Kiwimpact.Core.Services;

namespace Kiwimpact.Core.Repositories;

public interface IQuestCompletionRepository
{
    Task<GeneratedCompletionCode> GenerateOrRotateAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        DateTimeOffset now,
        CancellationToken ct = default);

    Task<CompletionCodeStatus> GetCodeStatusAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
        CancellationToken ct = default);

    Task<MyQuestCompletionState> RedeemAsync(
        Guid questId,
        Guid actorId,
        string? submittedCode,
        DateTimeOffset now,
        CancellationToken ct = default);

    Task<MyQuestCompletionState> GetStateAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default);
}
