namespace Kiwimpact.Api.Security;

public sealed class CompletionCodeOptions
{
    public string? HmacKey { get; init; }

    public static bool HasValidHmacKey(CompletionCodeOptions options)
    {
        try
        {
            _ = Kiwimpact.Core.Security.CompletionCodeProtector.DecodeConfiguredKey(
                options.HmacKey);
            return true;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }
}
