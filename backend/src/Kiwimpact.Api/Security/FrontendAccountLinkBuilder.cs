namespace Kiwimpact.Api.Security;

internal static class FrontendAccountLinkBuilder
{
    public static string Build(
        string root,
        string path,
        params (string Key, string Value)[] query)
    {
        var queryString = string.Join(
            "&",
            query.Select(item =>
                $"{Uri.EscapeDataString(item.Key)}={Uri.EscapeDataString(item.Value)}"));
        return $"{root.TrimEnd('/')}{path}?{queryString}";
    }
}
