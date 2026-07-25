using Kiwimpact.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace Kiwimpact.Api.Controllers;

internal static class QuestCompletionProblemMapper
{
    public static ObjectResult ToProblem(
        ControllerBase controller,
        QuestCompletionException exception)
    {
        var problem = exception.Error switch
        {
            QuestCompletionError.NotFound =>
                ProblemDetailsHelper.NotFound(exception.Message),
            QuestCompletionError.Forbidden =>
                ProblemDetailsHelper.Forbidden(exception.Message),
            QuestCompletionError.UnsupportedQuest =>
                ProblemDetailsHelper.Validation(exception.Message),
            QuestCompletionError.InvalidCompletionCode =>
                ProblemDetailsHelper.InvalidCompletionCode(),
            QuestCompletionError.OwnQuest or
            QuestCompletionError.CancelledOrArchived or
            QuestCompletionError.QuestNotPublished or
            QuestCompletionError.NoActiveParticipation or
            QuestCompletionError.AlreadyCompleted or
            QuestCompletionError.EmptyValidityWindow or
            QuestCompletionError.Concurrency =>
                ProblemDetailsHelper.Conflict(exception.Message),
            _ => ProblemDetailsHelper.Conflict("Completion request failed."),
        };

        return controller.StatusCode(
            problem.Status ?? StatusCodes.Status500InternalServerError,
            problem);
    }
}
