using System.Security.Cryptography;
using System.Text;

namespace Kiwimpact.Core.Security;

public sealed class CompletionCodeProtector
{
    // Ambiguous glyphs are intentionally omitted so codes remain easy to read
    // when displayed on-site or copied from a printed sign.
    public const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    public const int CodeLength = 10;
    public const int EntropyBits = 50;
    public const int MinimumKeyBytes = 32;
    public const int MaximumSubmittedLength = 128;

    private const string SafeDummyCode = "AAAAAAAAAA";
    private readonly byte[] _key;

    public CompletionCodeProtector(byte[] key)
    {
        ArgumentNullException.ThrowIfNull(key);
        if (key.Length < MinimumKeyBytes)
            throw new ArgumentException(
                $"Completion Code HMAC key must contain at least {MinimumKeyBytes} bytes.",
                nameof(key));
        _key = key.ToArray();
    }

    public static byte[] DecodeConfiguredKey(string? configuredKey)
    {
        if (string.IsNullOrWhiteSpace(configuredKey))
            throw new InvalidOperationException("CompletionCodes:HmacKey is not configured.");

        byte[] key;
        try
        {
            key = Convert.FromBase64String(configuredKey);
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException(
                "CompletionCodes:HmacKey must be valid Base64.",
                exception);
        }

        if (key.Length < MinimumKeyBytes)
            throw new InvalidOperationException(
                $"CompletionCodes:HmacKey must contain at least {MinimumKeyBytes} bytes.");
        return key;
    }

    public string GenerateNormalizedCode()
    {
        Span<char> characters = stackalloc char[CodeLength];
        for (var index = 0; index < characters.Length; index++)
            characters[index] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        return new string(characters);
    }

    public static string FormatForDisplay(string normalizedCode)
    {
        if (!TryNormalize(normalizedCode, out var normalized))
            throw new ArgumentException("Completion Code is invalid.", nameof(normalizedCode));
        return $"{normalized[..5]}-{normalized[5..]}";
    }

    public static bool TryNormalize(string? submittedCode, out string normalizedCode)
    {
        normalizedCode = string.Empty;
        if (submittedCode is null || submittedCode.Length > MaximumSubmittedLength)
            return false;

        var candidate = submittedCode.Trim()
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace(" ", string.Empty, StringComparison.Ordinal)
            .ToUpperInvariant();

        if (candidate.Length != CodeLength ||
            candidate.Any(character => !Alphabet.Contains(character, StringComparison.Ordinal)))
        {
            return false;
        }

        normalizedCode = candidate;
        return true;
    }

    public string ComputeHash(Guid questId, string normalizedCode)
    {
        if (questId == Guid.Empty)
            throw new ArgumentException("Quest is required.", nameof(questId));
        if (!TryNormalize(normalizedCode, out var normalized) || normalized != normalizedCode)
            throw new ArgumentException("A normalized Completion Code is required.", nameof(normalizedCode));

        return Convert.ToBase64String(ComputeHashBytes(questId, normalized));
    }

    public bool Verify(Guid questId, string? submittedCode, string? storedHash)
    {
        var isWellFormed = TryNormalize(submittedCode, out var normalized);
        // Hash a safe dummy for malformed input so invalid formats do not take
        // an observably shorter verification path than well-formed guesses.
        var computed = ComputeHashBytes(questId, isWellFormed ? normalized : SafeDummyCode);

        byte[] stored;
        try
        {
            stored = storedHash is null ? new byte[computed.Length] : Convert.FromBase64String(storedHash);
        }
        catch (FormatException)
        {
            stored = new byte[computed.Length];
        }

        var matches = stored.Length == computed.Length &&
            CryptographicOperations.FixedTimeEquals(computed, stored);
        return isWellFormed && matches;
    }

    private byte[] ComputeHashBytes(Guid questId, string normalizedCode)
    {
        // Binding the digest to the Quest prevents the same visible code from
        // being reusable against another Quest with a matching HMAC key.
        var canonicalQuestId = questId.ToString("D");
        var input = Encoding.UTF8.GetBytes($"{canonicalQuestId}:{normalizedCode}");
        return HMACSHA256.HashData(_key, input);
    }
}
