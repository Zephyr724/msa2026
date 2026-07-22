using System.Reflection;

namespace Kiwimpact.UnitTests.Architecture;

/// <summary>
/// Architecture tests verifying accepted project dependency direction.
/// </summary>
public class DependencyDirectionTests
{
    [Fact]
    public void KiwimpactCore_HasNoReferenceTo_Infrastructure()
    {
        var coreAssembly = typeof(Kiwimpact.Core.KiwimpactCore).Assembly;
        var references = coreAssembly.GetReferencedAssemblies()
            .Select(a => a.Name);

        Assert.DoesNotContain("Kiwimpact.Infrastructure", references);
    }

    [Fact]
    public void KiwimpactCore_HasNoReferenceTo_AspNetCore()
    {
        var coreAssembly = typeof(Kiwimpact.Core.KiwimpactCore).Assembly;
        var references = coreAssembly.GetReferencedAssemblies()
            .Select(a => a.Name);

        Assert.DoesNotContain("Microsoft.AspNetCore", references);
    }
}