using Kiwimpact.Core.Repositories;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Reconciliation;
using Kiwimpact.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<KiwimpactDbContext>(options =>
            options.UseNpgsql(connectionString,
                npgsql => npgsql.MigrationsAssembly(
                    typeof(KiwimpactDbContext).Assembly.FullName)));

        // Repositories
        services.AddScoped<IRegionReadRepository, RegionReadRepository>();
        services.AddScoped<IQuestReadRepository, QuestReadRepository>();
        services.AddScoped<IQuestWriteRepository, QuestWriteRepository>();
        services.AddScoped<IQuestParticipationRepository, QuestParticipationRepository>();
        services.AddScoped<IQuestCompletionRepository, QuestCompletionRepository>();
        services.AddScoped<IXpLedgerRepository, XpLedgerRepository>();
        services.AddScoped<IPassportRepository, PassportRepository>();
        services.AddScoped<IAchievementRepository, AchievementRepository>();
        services.AddScoped<ILeaderboardRepository, LeaderboardRepository>();
        services.AddScoped<ISocialFeedRepository, SocialFeedRepository>();
        services.AddScoped<AchievementAwardService>();
        services.AddSingleton<XpReconciliationRunner>();
        services.AddSingleton<AchievementBackfillRunner>();

        return services;
    }
}
