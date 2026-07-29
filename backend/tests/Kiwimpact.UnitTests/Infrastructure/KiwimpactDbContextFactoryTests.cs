using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.UnitTests.Infrastructure;

public sealed class KiwimpactDbContextFactoryTests
{
    [Fact]
    public void CreateDbContextPrefersComposeConnectionString()
    {
        const string environmentKey =
            "ConnectionStrings__DefaultConnection";
        const string expected =
            "Host=postgres;Port=5432;Database=kiwimpact;" +
            "Username=kiwimpact;Password=runtime-test-only";
        var original = Environment.GetEnvironmentVariable(environmentKey);

        try
        {
            Environment.SetEnvironmentVariable(environmentKey, expected);

            using var db = new KiwimpactDbContextFactory()
                .CreateDbContext([]);

            Assert.Equal(expected, db.Database.GetConnectionString());
        }
        finally
        {
            Environment.SetEnvironmentVariable(environmentKey, original);
        }
    }
}
