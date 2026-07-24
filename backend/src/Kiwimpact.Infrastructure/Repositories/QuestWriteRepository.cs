using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Repositories;
using Kiwimpact.Core.Services;
using Kiwimpact.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

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
}
