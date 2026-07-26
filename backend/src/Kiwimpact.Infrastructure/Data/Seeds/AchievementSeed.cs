using Kiwimpact.Core.Achievements;
using Kiwimpact.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Every-environment, concurrency-safe seed and fail-closed validation for
/// the approved achievement catalog. The catalog is a hard precondition of
/// the award core: seeding is serialized across application instances with a
/// dedicated advisory lock, only the product-visible display fields are
/// upserted (identity fields and <c>IsActive</c> are never mutated), and the
/// complete one-to-one rule/catalog mapping is validated immediately after
/// seeding. Any defect — missing or partial catalog, conflicting identity,
/// duplicate code/ID, invalid category, or rule/catalog mismatch — throws
/// and fails application startup. An empty catalog is never treated as
/// ready or as a reason to skip awards.
/// </summary>
public static class AchievementSeed
{
    // Fixed compiled advisory-lock key, identical for every instance and
    // distinct from the XP reconciliation and achievement backfill keys.
    public const long AdvisoryLockKey = 727_414_900_000_006_001L;

    public static async Task SeedAndValidateAsync(
        KiwimpactDbContext db,
        CancellationToken ct = default)
    {
        await db.Database.OpenConnectionAsync(ct);
        var connection = (NpgsqlConnection)db.Database.GetDbConnection();
        await AcquireAdvisoryLockAsync(connection, ct);
        try
        {
            await UpsertCatalogAsync(db, ct);
            await ValidateCatalogAsync(db, ct);
        }
        finally
        {
            // Explicit release on success, cancellation, and failure;
            // connection disposal is the backstop.
            await ReleaseAdvisoryLockBestEffortAsync(connection);
        }
    }

    private static async Task UpsertCatalogAsync(KiwimpactDbContext db, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var definition in AchievementCatalog.Definitions)
        {
            // AsNoTracking: the display-field comparison must read the
            // committed row, never a stale instance tracked by an earlier
            // seed run on this context.
            var existing = await db.Achievements
                .AsNoTracking()
                .SingleOrDefaultAsync(achievement => achievement.Id == definition.Id, ct);
            if (existing is null)
            {
                // A row carrying the approved code under another id is a
                // conflicting identity: never "repaired" — validation below
                // fails startup for it.
                var codeConflict = await db.Achievements
                    .AsNoTracking()
                    .AnyAsync(achievement => achievement.Code == definition.Code, ct);
                if (!codeConflict)
                {
                    db.Achievements.Add(Achievement.Create(
                        definition.Id,
                        definition.Code,
                        definition.Name,
                        definition.Description,
                        iconUrl: null,
                        definition.Category,
                        isActive: true,
                        now));
                }
                continue;
            }

            if (existing.Code == definition.Code &&
                existing.Category == definition.Category &&
                (existing.Name != definition.Name ||
                 existing.Description != definition.Description ||
                 existing.IconUrl is not null))
            {
                // Deterministic display-field upsert only. Id, Code,
                // Category, and IsActive are never mutated by reseeding.
                // Reload first: a stale instance tracked by an earlier seed
                // run on this context would otherwise mask the drift and
                // suppress the UPDATE.
                var tracked = await db.Achievements
                    .SingleAsync(achievement => achievement.Id == definition.Id, ct);
                await db.Entry(tracked).ReloadAsync(ct);
                tracked.UpdateDisplayFields(
                    definition.Name,
                    definition.Description,
                    iconUrl: null);
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task ValidateCatalogAsync(KiwimpactDbContext db, CancellationToken ct)
    {
        var rows = await db.Achievements.AsNoTracking().ToListAsync(ct);
        var defects = new List<string>();

        var definitions = AchievementCatalog.Definitions;
        if (definitions.Select(definition => definition.Id).Distinct().Count() != definitions.Count ||
            definitions.Select(definition => definition.Code).Distinct().Count() != definitions.Count)
        {
            defects.Add("duplicate static rule definitions");
        }

        // One-to-one rule/catalog mapping for every required definition.
        foreach (var definition in definitions)
        {
            var byId = rows.Where(row => row.Id == definition.Id).ToList();
            var byCode = rows.Where(row => row.Code == definition.Code).ToList();
            if (byId.Count == 0 && byCode.Count == 0)
            {
                defects.Add($"missing required catalog row '{definition.Code}'");
                continue;
            }
            if (byId.Count != 1 || byCode.Count != 1 ||
                byId[0].Code != definition.Code || byCode[0].Id != definition.Id)
            {
                defects.Add($"conflicting identity for rule '{definition.Code}'");
                continue;
            }
            if (byId[0].Category != definition.Category)
            {
                defects.Add(
                    $"invalid category '{byId[0].Category}' for '{definition.Code}'");
            }
        }

        // Exact set match: no rows beyond the approved definitions.
        var definitionIds = definitions.Select(definition => definition.Id).ToHashSet();
        var definitionCodes = definitions.Select(definition => definition.Code).ToHashSet();
        foreach (var row in rows)
        {
            if (!definitionIds.Contains(row.Id) || !definitionCodes.Contains(row.Code))
            {
                defects.Add(
                    $"unexpected catalog row (id {row.Id}, code '{row.Code}')");
            }
        }

        if (defects.Count > 0)
        {
            throw new InvalidOperationException(
                "Achievement catalog validation failed: " +
                string.Join("; ", defects));
        }
    }

    private static async Task AcquireAdvisoryLockAsync(
        NpgsqlConnection connection,
        CancellationToken ct)
    {
        await using var command = new NpgsqlCommand(
            "SELECT pg_advisory_lock(@key);", connection);
        command.Parameters.AddWithValue("key", AdvisoryLockKey);
        await command.ExecuteScalarAsync(ct);
    }

    private static async Task ReleaseAdvisoryLockBestEffortAsync(NpgsqlConnection connection)
    {
        try
        {
            await using var command = new NpgsqlCommand(
                "SELECT pg_advisory_unlock(@key);", connection);
            command.Parameters.AddWithValue("key", AdvisoryLockKey);
            await command.ExecuteScalarAsync();
        }
        catch
        {
            // Connection disposal is the backstop.
        }
    }
}
