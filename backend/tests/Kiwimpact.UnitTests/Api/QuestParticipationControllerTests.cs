using System.Security.Claims;
using Kiwimpact.Api.Contracts;
using Kiwimpact.Api.Controllers;
using Kiwimpact.Core.Entities;
using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.UnitTests.Api;

public sealed class QuestParticipationControllerTests
{
    private readonly Guid _actorId = Guid.NewGuid();
    private readonly Guid _questId = Guid.NewGuid();

    [Fact]
    public async Task Join_MapsCreatedDtoAndExactLocation()
    {
        var service = new StubParticipationService
        {
            JoinResult = QuestParticipation.CreateActive(
                _actorId,
                _questId,
                new DateTimeOffset(2026, 7, 25, 0, 0, 0, TimeSpan.Zero)),
        };
        var controller = CreateController(service);

        var action = await controller.Join(_questId, CancellationToken.None);

        var created = Assert.IsType<CreatedResult>(action);
        Assert.Equal($"/api/v1/quests/{_questId}/participation", created.Location);
        var dto = Assert.IsType<QuestParticipationDto>(created.Value);
        Assert.Equal(_questId, dto.QuestId);
        Assert.Equal("Active", dto.Status);
        Assert.Null(dto.CancelledAtUtc);
    }

    [Theory]
    [InlineData(QuestParticipationError.RegistrationModeNotSupported, 400)]
    [InlineData(QuestParticipationError.NotFound, 404)]
    [InlineData(QuestParticipationError.OwnQuest, 409)]
    [InlineData(QuestParticipationError.AlreadyParticipating, 409)]
    [InlineData(QuestParticipationError.QuestNotPublished, 409)]
    [InlineData(QuestParticipationError.QuestEnded, 409)]
    [InlineData(QuestParticipationError.CapacityFull, 409)]
    [InlineData(QuestParticipationError.NoActiveParticipation, 409)]
    [InlineData(QuestParticipationError.Concurrency, 409)]
    public async Task Join_MapsParticipationErrorsToProblemDetails(
        QuestParticipationError error,
        int expectedStatus)
    {
        var service = new StubParticipationService
        {
            Exception = new QuestParticipationException(error, "Mapped participation error."),
        };
        var controller = CreateController(service);

        var action = await controller.Join(_questId, CancellationToken.None);

        var result = Assert.IsType<ObjectResult>(action);
        Assert.Equal(expectedStatus, result.StatusCode);
        var problem = Assert.IsType<ProblemDetails>(result.Value);
        Assert.Equal("Mapped participation error.", problem.Detail);
    }

    [Fact]
    public async Task GetState_MapsExactParticipationStateValues()
    {
        var service = new StubParticipationService
        {
            StateResult = new MyQuestParticipationState(
                QuestParticipationStatus.Cancelled,
                false,
                ParticipationIneligibilityReason.CapacityFull,
                true),
        };
        var controller = CreateController(service);

        var action = await controller.GetState(_questId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(action);
        var dto = Assert.IsType<MyQuestParticipationDto>(ok.Value);
        Assert.Equal("Cancelled", dto.Status);
        Assert.False(dto.CanJoin);
        Assert.Equal("CapacityFull", dto.IneligibilityReason);
        Assert.True(dto.CapacityFull);
    }

    private QuestParticipationController CreateController(IQuestParticipationService service)
    {
        var controller = new QuestParticipationController(service)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, _actorId.ToString())],
                        "test")),
                },
            },
        };
        return controller;
    }

    private sealed class StubParticipationService : IQuestParticipationService
    {
        public QuestParticipation? JoinResult { get; init; }
        public MyQuestParticipationState? StateResult { get; init; }
        public QuestParticipationException? Exception { get; init; }

        public Task<QuestParticipation> JoinAsync(
            Guid questId, Guid actorId, CancellationToken ct = default) =>
            Exception is not null
                ? Task.FromException<QuestParticipation>(Exception)
                : Task.FromResult(Assert.IsType<QuestParticipation>(JoinResult));

        public Task<QuestParticipation> CancelAsync(
            Guid questId, Guid actorId, CancellationToken ct = default) =>
            JoinAsync(questId, actorId, ct);

        public Task<MyQuestParticipationState> GetStateAsync(
            Guid questId, Guid actorId, CancellationToken ct = default) =>
            Exception is not null
                ? Task.FromException<MyQuestParticipationState>(Exception)
                : Task.FromResult(Assert.IsType<MyQuestParticipationState>(StateResult));

        public Task<IReadOnlyList<QuestParticipation>> ListMineAsync(
            Guid actorId,
            MyQuestParticipationFilter filter,
            CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<QuestParticipation>>([]);
    }
}
