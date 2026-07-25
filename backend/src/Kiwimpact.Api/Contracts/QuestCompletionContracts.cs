namespace Kiwimpact.Api.Contracts;

public sealed record RedeemCompletionCodeRequest(string? Code);

public sealed record GeneratedCompletionCodeDto(
    string Code,
    string ValidFromUtc,
    string? ValidToUtc);

public sealed record CompletionCodeStatusDto(
    bool IsConfigured,
    string? ValidFromUtc,
    string? ValidToUtc,
    string? CreatedAtUtc);

public sealed record MyQuestCompletionDto(
    string Status,
    string? Method,
    string? CompletedAtUtc,
    string? VerifiedAtUtc);
