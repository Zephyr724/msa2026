# 07 — Agent Task Workflow

> The base task execution protocol, ambiguity handling, approval boundaries,
> tool failure circuit breaker, context management, quality gate matrix,
> final diff review, completion report, and task handoff are defined in
> `00-harness-core.md`. This file extends it with project-specific workflow
> and recovery rules.

## 7.1 Quality Gate Matrix

Per `00-harness-core.md` §9, apply checks proportionally. For this project:

| Change Type          | Required Gates                                                     |
| -------------------- | ----------------------------------------------------------------- |
| Markdown/doc only    | Document review, Git diff                                          |
| Frontend source      | Targeted test, `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm run build` |
| Backend source       | Targeted test, `dotnet format --verify-no-changes`, `dotnet build`, `dotnet test` |
| Route/service        | Targeted test, API integration, `npm run typecheck`, `npm run lint`, `npm run build`, `dotnet build`, `dotnet test` |
| Database/migration   | Migration test, repository integration, `dotnet build`, `dotnet test` |
| Dependency/lockfile  | Frontend: `npm ci`, audit triage; Backend: `dotnet restore`; full test, `npm run build`, `dotnet build` |
| CI/config            | Config syntax validation, dry run of affected commands             |
| Architecture/import boundary | Targeted tests, `npm run typecheck`, `npm run lint`, `npm run build`, `dotnet build`, circular-dependency check |
| Release candidate    | All gates including E2E and coverage                               |

- When a change matches more than one category, apply the union of all
  applicable gates. Do not select only the least expensive category.
- Run targeted checks after a coherent change set.
- Run full applicable gates once before completion.
- Do not repeatedly run an unchanged failing command.
- If a required command is not defined, report it rather than inventing one.

## 7.2 Error Recovery

- If a test fails after a change, identify the root cause:
  1. Implementation bug → fix the source code
  2. Incorrect test assumption → verify contract before modifying test
  3. Stale fixture → update fixture, not the production code
  4. Environment issue (port conflict, stale DB) → clean up and retry
- If type-check or lint fails, fix issues before proceeding to the next change.
- If a migration fails:
  - Never modify a migration that has been successfully applied in any shared
    environment.
  - A local migration that failed before being recorded as applied may be fixed
    in place during development.
  - If the failed migration was already applied or shared, create a corrective
    migration instead.

## 7.3 Agent Self-Review Checklist

Before marking any task as complete, verify only the items relevant to the
actual change. Mark non-applicable items as N/A.

- [ ] Has the project code review checklist in `06-development-workflow.md`
  been applied to the actual change?
- [ ] Have all applicable gates selected from Section 7.1 passed?
- [ ] Do not leave newly introduced TODO/FIXME markers unless they include an
  issue reference, owner, or explicit follow-up explanation.
