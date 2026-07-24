using Kiwimpact.Core.Entities;

namespace Kiwimpact.Core.Services;

public interface IQuestManagementService
{
    Task<IReadOnlyList<Quest>> ListAsync(Guid actorId, bool isAdmin, CancellationToken ct = default);
    Task<Quest> CreateAsync(Guid actorId, CreateQuestCommand command, CancellationToken ct = default);
    Task<Quest> GetAsync(Guid actorId, bool isAdmin, Guid id, CancellationToken ct = default);
    Task<Quest> UpdateAsync(
        Guid actorId, bool isAdmin, Guid id, UpdateQuestCommand command, CancellationToken ct = default);
    Task DeleteAsync(
        Guid actorId, bool isAdmin, Guid id, uint version, CancellationToken ct = default);
    Task<Quest> PublishAsync(
        Guid actorId, bool isAdmin, Guid id, uint version, CancellationToken ct = default);
    Task<Quest> CancelAsync(
        Guid actorId, bool isAdmin, Guid id, uint version,
        bool confirmActiveParticipants, CancellationToken ct = default);
    Task<Quest> ArchiveAsync(
        Guid actorId, bool isAdmin, Guid id, uint version, CancellationToken ct = default);
}
