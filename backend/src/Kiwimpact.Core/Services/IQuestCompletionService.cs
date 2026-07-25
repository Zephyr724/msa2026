namespace Kiwimpact.Core.Services;

public interface IQuestCompletionService
{
    Task<GeneratedCompletionCode> GenerateOrRotateAsync(
        Guid questId,
        Guid actorId,
        bool isAdmin,
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
        CancellationToken ct = default);

    Task<MyQuestCompletionState> GetStateAsync(
        Guid questId,
        Guid actorId,
        CancellationToken ct = default);
}
