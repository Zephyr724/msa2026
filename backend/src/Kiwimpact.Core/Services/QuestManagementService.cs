using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Enums;
using Kiwimpact.Core.Repositories;

namespace Kiwimpact.Core.Services;

public sealed class QuestManagementService : IQuestManagementService
{
    private readonly IQuestWriteRepository _repository;

    public QuestManagementService(IQuestWriteRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<Quest>> ListAsync(
        Guid actorId, bool isAdmin, CancellationToken ct = default)
    {
        EnsureActor(actorId);
        return _repository.ListManagedAsync(actorId, isAdmin, ct);
    }

    public async Task<Quest> CreateAsync(
        Guid actorId, CreateQuestCommand command, CancellationToken ct = default)
    {
        EnsureActor(actorId);
        ArgumentNullException.ThrowIfNull(command);
        await EnsureRegionAsync(command.LocationRegionId, ct);

        try
        {
            var quest = Quest.CreateOrganizerOwned(
                actorId,
                ToDetails(command),
                ToCoverDetails(command.CoverImage),
                DateTimeOffset.UtcNow);
            _repository.Add(quest);
            await SaveAsync(ct);
            await _repository.ReloadAsync(quest, ct);
            return quest;
        }
        catch (ArgumentException ex)
        {
            throw Error(QuestManagementError.Validation, ex.Message);
        }
    }

    public async Task<Quest> GetAsync(
        Guid actorId, bool isAdmin, Guid id, CancellationToken ct = default)
    {
        EnsureActor(actorId);
        var quest = await _repository.GetByIdAsync(id, ct)
            ?? throw Error(QuestManagementError.NotFound, "Quest not found.");
        EnsureOwnership(quest, actorId, isAdmin);
        return quest;
    }

    public async Task<Quest> UpdateAsync(
        Guid actorId,
        bool isAdmin,
        Guid id,
        UpdateQuestCommand command,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        EnsureActor(actorId);
        await using var transaction = await _repository.BeginTransactionAsync(ct);
        try
        {
            if (!await _repository.LockQuestAsync(id, ct))
                throw Error(QuestManagementError.NotFound, "Quest not found.");

            var quest = await GetAsync(actorId, isAdmin, id, ct);
            EnsureVersion(quest, command.Version);
            await EnsureRegionAsync(command.LocationRegionId, ct);
            var originalStartAtUtc = quest.StartAtUtc;
            var originalEndAtUtc = quest.EndAtUtc;

            quest.UpdateDetails(
                ToDetails(command),
                command.CoverImage is null ? null : ToCoverDetails(command.CoverImage),
                DateTimeOffset.UtcNow);

            if (quest.StartAtUtc != originalStartAtUtc || quest.EndAtUtc != originalEndAtUtc)
                await _repository.RevokeActiveCompletionCodesAsync(quest.Id, ct);

            await SaveAsync(ct);
            await _repository.ReloadAsync(quest, ct);
            await transaction.CommitAsync(ct);
            return quest;
        }
        catch (ArgumentException ex)
        {
            await transaction.RollbackAsync(ct);
            throw Error(QuestManagementError.Validation, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await transaction.RollbackAsync(ct);
            throw Error(QuestManagementError.Conflict, ex.Message);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task DeleteAsync(
        Guid actorId,
        bool isAdmin,
        Guid id,
        uint version,
        CancellationToken ct = default)
    {
        var quest = await GetAsync(actorId, isAdmin, id, ct);
        EnsureVersion(quest, version);
        try
        {
            quest.EnsureCanDelete();
        }
        catch (InvalidOperationException ex)
        {
            throw Error(QuestManagementError.Conflict, ex.Message);
        }

        _repository.Remove(quest);
        await SaveAsync(ct);
    }

    public Task<Quest> PublishAsync(
        Guid actorId, bool isAdmin, Guid id, uint version, CancellationToken ct = default) =>
        ChangeStatusAsync(actorId, isAdmin, id, version, quest => quest.Publish(DateTimeOffset.UtcNow), ct);

    public Task<Quest> CancelAsync(
        Guid actorId,
        bool isAdmin,
        Guid id,
        uint version,
        bool confirmActiveParticipants,
        CancellationToken ct = default)
    {
        _ = confirmActiveParticipants;
        return ChangeStatusAsync(
            actorId, isAdmin, id, version, quest => quest.Cancel(DateTimeOffset.UtcNow), ct);
    }

    public Task<Quest> ArchiveAsync(
        Guid actorId, bool isAdmin, Guid id, uint version, CancellationToken ct = default) =>
        ChangeStatusAsync(actorId, isAdmin, id, version, quest => quest.Archive(DateTimeOffset.UtcNow), ct);

    private async Task<Quest> ChangeStatusAsync(
        Guid actorId,
        bool isAdmin,
        Guid id,
        uint version,
        Action<Quest> change,
        CancellationToken ct)
    {
        var quest = await GetAsync(actorId, isAdmin, id, ct);
        EnsureVersion(quest, version);
        try
        {
            change(quest);
        }
        catch (InvalidOperationException ex)
        {
            throw Error(QuestManagementError.Conflict, ex.Message);
        }

        await SaveAsync(ct);
        await _repository.ReloadAsync(quest, ct);
        return quest;
    }

    private async Task EnsureRegionAsync(Guid? regionId, CancellationToken ct)
    {
        if (regionId.HasValue && !await _repository.IsRegionActiveAsync(regionId.Value, ct))
            throw Error(QuestManagementError.Validation, "Region not found or inactive.");
    }

    private async Task SaveAsync(CancellationToken ct)
    {
        try
        {
            await _repository.SaveChangesAsync(ct);
        }
        catch (QuestWriteConcurrencyException)
        {
            throw Error(QuestManagementError.Conflict, "Quest was changed by another request.");
        }
    }

    private static QuestDetails ToDetails(CreateQuestCommand command) => new(
        command.Title ?? string.Empty,
        command.Description ?? string.Empty,
        ParseEnum<QuestCategory>(command.Category, "category"),
        ParseEnum<RegistrationMode>(command.RegistrationMode, "registrationMode"),
        ParseEnum<QuestDifficulty>(command.Difficulty, "difficulty"),
        command.Capacity,
        command.StartAtUtc,
        command.EndAtUtc,
        command.LocationRegionId,
        command.LocationDescription,
        command.ExternalSourceUrl);

    private static QuestDetails ToDetails(UpdateQuestCommand command) => new(
        command.Title ?? string.Empty,
        command.Description ?? string.Empty,
        ParseEnum<QuestCategory>(command.Category, "category"),
        ParseEnum<RegistrationMode>(command.RegistrationMode, "registrationMode"),
        ParseEnum<QuestDifficulty>(command.Difficulty, "difficulty"),
        command.Capacity,
        command.StartAtUtc,
        command.EndAtUtc,
        command.LocationRegionId,
        command.LocationDescription,
        command.ExternalSourceUrl);

    private static QuestCoverImageDetails ToCoverDetails(QuestCoverImageCommand? cover)
    {
        if (cover is null)
            throw Error(QuestManagementError.Validation, "Cover image is required.");
        return new QuestCoverImageDetails(
            cover.ImageUrl ?? string.Empty,
            cover.AltText ?? string.Empty,
            cover.CreatorName,
            cover.SourceUrl,
            cover.LicenceNote);
    }

    private static T ParseEnum<T>(string? value, string field) where T : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value) ||
            long.TryParse(value, out _) ||
            ulong.TryParse(value, out _) ||
            !Enum.TryParse<T>(value, true, out var parsed) ||
            !Enum.IsDefined(parsed))
        {
            throw Error(QuestManagementError.Validation, $"Invalid {field} value.");
        }
        return parsed;
    }

    private static void EnsureActor(Guid actorId)
    {
        if (actorId == Guid.Empty)
            throw Error(QuestManagementError.Forbidden, "Authenticated user cannot manage Quests.");
    }

    private static void EnsureOwnership(Quest quest, Guid actorId, bool isAdmin)
    {
        if (!QuestManagementAuthorization.CanManage(quest, actorId, isAdmin))
            throw Error(QuestManagementError.Forbidden, "You do not own this Quest.");
    }

    private static void EnsureVersion(Quest quest, uint version)
    {
        if (version == 0)
            throw Error(QuestManagementError.Validation, "Version is required.");
        if (quest.Version != version)
            throw Error(QuestManagementError.Conflict, "Quest was changed by another request.");
    }

    private static QuestManagementException Error(QuestManagementError error, string message) =>
        new(error, message);
}
