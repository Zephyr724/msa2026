using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Security;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Achievements;
using Kiwimpact.Infrastructure.Data;
using Kiwimpact.Infrastructure.Data.Seeds;
using Kiwimpact.Infrastructure.Identity;
using Kiwimpact.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kiwimpact.IntegrationTests.Persistence;

public sealed class TrustedCompletionPersistenceTests(
    TestDatabaseFixture fixture) : IClassFixture<TestDatabaseFixture>
{
    [Fact]
    public async Task SelfReportClaimApprovalAndPassportPrecedenceAreAtomic()
    {
        using var scope = await fixture.CreateSeededScopeAsync();
        var db = scope.ServiceProvider.GetRequiredService<KiwimpactDbContext>();
        await AchievementSeed.SeedAndValidateAsync(
            db,
            TestContext.Current.CancellationToken);
        var now = DateTimeOffset.Parse("2026-07-27T00:00:00Z");
        var organizer = User();
        var member = User();
        var reviewer = User();
        db.Users.AddRange(organizer, member, reviewer);
        db.UserProfiles.AddRange(
            UserProfile.Create(organizer.Id, "Organizer", now),
            UserProfile.Create(member.Id, "Member", now),
            UserProfile.Create(reviewer.Id, "Reviewer", now));

        var quest = Quest.CreateOrganizerOwned(
            organizer.Id,
            new QuestDetails(
                "Harbour restoration", "Restore the harbour edge.",
                QuestCategory.RestoreNature, RegistrationMode.Native,
                QuestDifficulty.Medium, 20, now, now.AddDays(2),
                null, "Auckland", null),
            new QuestCoverImageDetails(
                "/images/quests/quest-fallback.svg", "Harbour", null, null, null),
            now);
        quest.Publish(now);
        db.Quests.Add(quest);
        db.QuestParticipations.Add(
            QuestParticipation.CreateActive(member.Id, quest.Id, now));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        var repository = new QuestCompletionRepository(
            db,
            new CompletionCodeProtector(Enumerable.Range(1, 32)
                .Select(value => (byte)value).ToArray()),
            new AchievementAwardService(db));

        var self = await repository.SelfReportAsync(
            quest.Id, member.Id, now, now,
            TestContext.Current.CancellationToken);
        Assert.Equal(MyQuestCompletionStatus.SelfReported, self.Status);
        Assert.Empty(await db.XpTransactions.ToListAsync(
            TestContext.Current.CancellationToken));

        var claim = await repository.SubmitClaimAsync(
            quest.Id, member.Id,
            new EvidenceClaimInput(
                "Removed litter and planted sedges.",
                "https://example.test/private-evidence", true, now),
            now, TestContext.Current.CancellationToken);
        Assert.Equal(QuestCompletionStatus.Pending, claim.Status);
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Quests\" SET \"Category\" = {QuestCategory.LearnShare.ToString()} WHERE \"Id\" = {quest.Id}",
            TestContext.Current.CancellationToken);

        var approved = await repository.ReviewClaimAsync(
            claim.ClaimId, reviewer.Id, true, "Evidence is sufficient.",
            now.AddHours(1), TestContext.Current.CancellationToken);
        Assert.Equal(QuestCompletionStatus.Verified, approved.Status);
        Assert.Single(await db.XpTransactions.ToListAsync(
            TestContext.Current.CancellationToken));
        Assert.Equal(100, (await db.UserProfiles.SingleAsync(
            item => item.Id == member.Id,
            TestContext.Current.CancellationToken)).TotalXp);
        var award = Assert.Single(await db.UserAchievements
            .Where(item => item.UserId == member.Id)
            .ToListAsync(TestContext.Current.CancellationToken));
        Assert.Equal(
            Kiwimpact.Core.Achievements.AchievementCatalog.FirstSteps.Id,
            award.AchievementId);
        var verifiedCompletion = await db.QuestCompletions.SingleAsync(
            item => item.Id == claim.ClaimId,
            TestContext.Current.CancellationToken);
        Assert.Equal(
            QuestCategory.RestoreNature,
            verifiedCompletion.QuestCategorySnapshot);

        var passport = new PassportRepository(db);
        var (items, total) = await passport.GetCompletionPageAsync(
            member.Id, 1, 12, TestContext.Current.CancellationToken);
        Assert.Equal(1, total);
        Assert.Equal(QuestCompletionStatus.Verified, Assert.Single(items).Status);
        Assert.Equal(CompletionMethod.EvidenceClaim, items[0].Method);
        Assert.Equal(QuestCategory.LearnShare, items[0].QuestCategory);
        var summary = await passport.GetSummaryAsync(
            member.Id,
            TestContext.Current.CancellationToken);
        var categoryImpact = Assert.Single(summary!.CategoryImpact);
        Assert.Equal(QuestCategory.RestoreNature, categoryImpact.Category);
    }

    private static ApplicationUser User() => new()
    {
        Id = Guid.NewGuid(),
        UserName = $"{Guid.NewGuid():N}@example.test",
        Email = $"{Guid.NewGuid():N}@example.test",
        EmailConfirmed = true,
    };
}
