using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.Infrastructure;

/// <summary>
/// Infrastructure-layer dependency injection registration.
/// Invoked by the composition root in Kiwimpact.Api/Program.cs.
/// Does not resolve services, call BuildServiceProvider, or contain
/// runtime application behavior.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Registers the EF Core DbContext with PostgreSQL.
    /// The connection string is read from standard ASP.NET Core configuration.
    /// </summary>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddDbContext<KiwimpactDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}