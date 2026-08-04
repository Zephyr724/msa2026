using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using IPNetwork = System.Net.IPNetwork;

namespace Kiwimpact.Api.Hosting;

/// <summary>
/// Restricts Railway edge forwarding to the provider's documented private
/// proxy range instead of trusting forwarded headers from arbitrary peers.
/// </summary>
public static class RailwayForwardedHeaders
{
    public const string SectionName = "Hosting:Railway";
    public const string DataProtectionKeyPath = "/var/lib/kiwimpact/keys";

    public static void ValidateDataProtectionConfiguration(
        IConfiguration configuration)
    {
        var configuredKeyPath = configuration["DataProtection:KeyPath"];
        if (!string.Equals(
            configuredKeyPath,
            DataProtectionKeyPath,
            StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Railway hosting requires DataProtection:KeyPath to be " +
                $"'{DataProtectionKeyPath}'.");
        }

        var mountedPath = configuration["RAILWAY_VOLUME_MOUNT_PATH"];
        if (!string.Equals(
            mountedPath,
            DataProtectionKeyPath,
            StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Railway hosting requires RAILWAY_VOLUME_MOUNT_PATH to be " +
                $"'{DataProtectionKeyPath}'.");
        }
    }

    public static void Configure(ForwardedHeadersOptions options)
    {
        options.ForwardedHeaders =
            ForwardedHeaders.XForwardedFor |
            ForwardedHeaders.XForwardedProto;
        options.ForwardedForHeaderName = "X-Real-IP";
        options.ForwardLimit = 1;
        options.KnownIPNetworks.Add(new IPNetwork(
            IPAddress.Parse("100.0.0.0"), 8));
    }
}
