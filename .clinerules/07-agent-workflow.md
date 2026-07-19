# 07 — Agent Task Workflow

> The base task execution protocol, ambiguity handling, approval boundaries,
> tool failure circuit breaker, context management, quality gate matrix,
> final diff review, completion report, and task handoff are defined in
> `00-harness-core.md`. This file extends it with project-specific workflow
> and recovery rules.

## 7.1 Quality Gate Matrix

Per `00-harness-core.md` §10, apply checks proportionally. A command is active
only after it exists in repository configuration, has been executed
successfully at least once, and is marked active in `PROJECT_STATUS.md`.

| Change Type | Required Gates |
| --- | --- |
| Markdown/doc only | Document review, broken-reference search, Git diff |
| Frontend source | Targeted frontend tests + verified frontend scripts |
| Backend source | Targeted backend tests + verified dotnet commands |
| Backend API contract only | Backend unit/integration/build gates |
| Full-stack contract change | Backend gates + affected frontend gates |
| Database/migration | Migration application test + PostgreSQL integration tests |
| Dependency/lockfile | Verified restore/install + vulnerability/license review + affected build/tests |
| CI/config | Syntax validation + affected command dry run |
| Release candidate | All configured gates, including Cypress |

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
  4. Environment issue (port conflict, stale DB) → perform only
     non-destructive cleanup within the approved task scope. Database
     reset, container-volume deletion, process termination outside the
     task, or destructive cleanup requires approval.
- If type-check or lint fails:
  - If the failure was introduced by the current change, fix it before
    proceeding to the next change.
  - If it clearly predates the task or is unrelated, do not expand scope
    silently; record the failure, preserve evidence, and request direction
    when it blocks verification.
- If a migration fails:
  - Never modify a migration that has been successfully applied in any shared
    environment or relied upon by another branch or developer.
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