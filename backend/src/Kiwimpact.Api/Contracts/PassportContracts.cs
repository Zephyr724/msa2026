namespace Kiwimpact.Api.Contracts;

public sealed record PassportCompletionItemDto(
    Guid CompletionId,
    Guid QuestId,
    string QuestTitle,
    string QuestCategory,
    string QuestStatus,
    string Status,
    string Method,
    string CompletedAtUtc,
    string? VerifiedAtUtc,
    int? XpAmount);
