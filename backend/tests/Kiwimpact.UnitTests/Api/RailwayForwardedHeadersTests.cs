using System.Net;
using Kiwimpact.Api.Hosting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using IPNetwork = System.Net.IPNetwork;

namespace Kiwimpact.UnitTests.Api;

public sealed class RailwayForwardedHeadersTests
{
    [Fact]
    public void ConfigureTrustsOnlyOneRailwayEdgeHop()
    {
        var options = new ForwardedHeadersOptions();

        RailwayForwardedHeaders.Configure(options);

        Assert.Equal(
            ForwardedHeaders.XForwardedFor |
            ForwardedHeaders.XForwardedProto,
            options.ForwardedHeaders);
        Assert.Equal("X-Real-IP", options.ForwardedForHeaderName);
        Assert.Equal(1, options.ForwardLimit);
        Assert.Contains(
            new IPNetwork(IPAddress.Parse("100.0.0.0"), 8),
            options.KnownIPNetworks);
    }

    [Fact]
    public void RailwayDataProtectionConfigurationAcceptsTheMountedApprovedPath()
    {
        var configuration = CreateConfiguration(
            RailwayForwardedHeaders.DataProtectionKeyPath,
            RailwayForwardedHeaders.DataProtectionKeyPath);

        RailwayForwardedHeaders.ValidateDataProtectionConfiguration(
            configuration);
    }

    [Theory]
    [InlineData(null, "/var/lib/kiwimpact/keys")]
    [InlineData("/", "/var/lib/kiwimpact/keys")]
    [InlineData("/var/lib/kiwimpact/keys", null)]
    [InlineData("/var/lib/kiwimpact/keys", "/wrong")]
    public void RailwayDataProtectionConfigurationRejectsMissingOrWrongPaths(
        string? keyPath,
        string? mountedPath)
    {
        var configuration = CreateConfiguration(keyPath, mountedPath);

        Assert.Throws<InvalidOperationException>(() =>
            RailwayForwardedHeaders.ValidateDataProtectionConfiguration(
                configuration));
    }

    [Fact]
    public async Task TrustedRailwayProxyRestoresSchemeAndClientAddress()
    {
        var context = CreateForwardedContext("100.64.0.10");

        await CreateMiddleware().Invoke(context);

        Assert.Equal("https", context.Request.Scheme);
        Assert.Equal(
            IPAddress.Parse("203.0.113.42"),
            context.Connection.RemoteIpAddress);
    }

    [Fact]
    public async Task UntrustedPeerCannotSpoofSchemeOrClientAddress()
    {
        var context = CreateForwardedContext("192.168.10.25");

        await CreateMiddleware().Invoke(context);

        Assert.Equal("http", context.Request.Scheme);
        Assert.Equal(
            IPAddress.Parse("192.168.10.25"),
            context.Connection.RemoteIpAddress);
    }

    private static DefaultHttpContext CreateForwardedContext(string peerAddress)
    {
        var context = new DefaultHttpContext();
        context.Request.Scheme = "http";
        context.Connection.RemoteIpAddress = IPAddress.Parse(peerAddress);
        context.Request.Headers["X-Forwarded-Proto"] = "https";
        context.Request.Headers["X-Real-IP"] = "203.0.113.42";
        return context;
    }

    private static ForwardedHeadersMiddleware CreateMiddleware()
    {
        var options = new ForwardedHeadersOptions();
        RailwayForwardedHeaders.Configure(options);
        return new ForwardedHeadersMiddleware(
            _ => Task.CompletedTask,
            NullLoggerFactory.Instance,
            Options.Create(options));
    }

    private static IConfiguration CreateConfiguration(
        string? keyPath,
        string? mountedPath) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DataProtection:KeyPath"] = keyPath,
                ["RAILWAY_VOLUME_MOUNT_PATH"] = mountedPath,
            })
            .Build();
}
