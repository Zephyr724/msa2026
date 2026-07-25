namespace Kiwimpact.Core.Services;

public interface IProgressionService
{
    Task<MyProgressionState> GetMyProgressionAsync(
        Guid actorId,
        CancellationToken ct = default);
}
