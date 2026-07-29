using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Kiwimpact.Api.Hubs;

[AllowAnonymous]
public sealed class LeaderboardHub : Hub
{
    public const string ImpactChangedEvent = "ImpactChanged";
}
