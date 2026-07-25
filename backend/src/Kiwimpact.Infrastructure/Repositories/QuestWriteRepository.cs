using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Kiwimpact.Infrastructure.Repositories;

public sealed class QuestWriteRepository : IQuestWriteRepository
{
    private readonly KiwimpactDbContext _db;

    public QuestWriteRepository(KiwimpactDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Quest>> ListManagedAsync(
        Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        var query = _db.Quests
            .AsNoTracking()
            .Include(quest => quest.LocationRegion)
            .AsQueryable();

        if (!isAdmin)
            query = query.Where(quest => quest.CreatedByUserId == actorId);

        return await query
            .OrderByDescending(quest => quest.UpdatedAt)
            .ThenBy(quest => quest.Id)
            .ToListAsync(ct);
    }

    public Task<Quest?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Quests
            .Include(quest => quest.LocationRegion)
            .Include(quest => quest.Images)
            .FirstOrDefaultAsync(quest => quest.Id == id, ct);

    public Task<bool> IsRegionActiveAsync(Guid regionId, CancellationToken ct = default) =>
        _db.Regions.AsNoTracking().AnyAsync(
            region => region.Id == regionId && region.IsActive, ct);

    public async Task<IQuestWriteTransaction> BeginTransactionAsync(
        CancellationToken ct = default) =>
        new QuestWriteTransaction(await _db.Database.BeginTransactionAsync(ct));

    public Task<bool> LockQuestAsync(Guid id, CancellationToken ct = default) =>
        _db.Database.SqlQuery<Guid>($$"""
                SELECT "Id" AS "Value"
                FROM "Quests"
                WHERE "Id" = {{id}}
                FOR UPDATE
                """)
            .AnyAsync(ct);

    public async Task RevokeActiveCompletionCodesAsync(
        Guid questId,
        CancellationToken ct = default)
    {
        var activeCodes = await _db.CompletionCodes
            .Where(code =>
                code.QuestId == questId &&
                code.IsActive &&
                !code.IsRevoked)
            .ToListAsync(ct);
        foreach (var code in activeCodes)
            code.Revoke();
    }

    public void Add(Quest quest) => _db.Quests.Add(quest);

    public void Remove(Quest quest) => _db.Quests.Remove(quest);

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            throw new QuestWriteConcurrencyException(ex);
        }
    }

    public async Task ReloadAsync(Quest quest, CancellationToken ct = default)
    {
        await _db.Entry(quest).ReloadAsync(ct);

        var locationRegion = _db.Entry(quest).Reference(item => item.LocationRegion);
        locationRegion.CurrentValue = quest.LocationRegionId.HasValue
            ? await _db.Regions.SingleAsync(
                region => region.Id == quest.LocationRegionId.Value, ct)
            : null;
        locationRegion.IsLoaded = true;

        if (quest.Images.Count == 0)
            await _db.Entry(quest).Collection(item => item.Images).LoadAsync(ct);
    }

    private sealed class QuestWriteTransaction : IQuestWriteTransaction
    {
        private readonly IDbContextTransaction _transaction;

        public QuestWriteTransaction(IDbContextTransaction transaction)
        {
            _transaction = transaction;
        }

        public Task CommitAsync(CancellationToken ct = default) =>
            _transaction.CommitAsync(ct);

        public Task RollbackAsync(CancellationToken ct = default) =>
            _transaction.RollbackAsync(ct);

        public ValueTask DisposeAsync() => _transaction.DisposeAsync();
    }
}
