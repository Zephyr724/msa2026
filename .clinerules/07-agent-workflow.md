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
| TypeScript source    | Targeted test, `npm run typecheck`, `npm run lint`                 |
| Route/service        | Targeted test, API integration, `npm run typecheck`, `npm run lint`|
| Database/migration   | Migration test, repository integration, `npm run typecheck`, `npm run lint` |
| Dependency/lockfile  | `npm ci`, audit triage, full test, `npm run build`                 |
| CI/config            | Config syntax validation, dry run of affected commands             |
| Release candidate    | All gates including E2E and coverage                               |

- Run targeted checks after a coherent change set.
- Run full applicable gates once before completion.
- Do not repeatedly run an unchanged failing command.
- If a required command is not defined in `package.json`, report it rather
  than inventing one.

## 7.2 Error Recovery

- If a test fails after a change, identify the root cause:
  1. Implementation bug → fix the source code
  2. Incorrect test assumption → verify contract before modifying test
  3. Stale fixture → update fixture, not the production code
  4. Environment issue (port conflict, stale DB) → clean up and retry
- If type-check or lint fails, fix issues before proceeding to the next change.
- If a migration fails, do NOT modify an already-applied migration. Create a
  new migration that corrects the state.

## 7.3 Agent Self-Review Checklist

Before marking any task as complete, verify only the items relevant to the
actual change. Mark non-applicable items as N/A.

- [ ] Does the change follow the layered architecture (routes → services → db)?
- [ ] Are all SQL queries parameterized (`?` placeholders, no string concatenation)?
- [ ] Is all user input validated with Zod before reaching services?
- [ ] Are error responses consistent with the API envelope format?
- [ ] Do new functions include JSDoc for public APIs?
- [ ] Are symbols exported only when another module needs them?
- [ ] Do tests cover both happy path and error cases?
- [ ] Are any dangerous patterns (`eval`, `exec`, raw HTML) introduced?
- [ ] Has `npm run typecheck` passed?
- [ ] Has `npm run lint` passed?
- [ ] Has `npm test` passed (when code was changed)?
- [ ] Do not leave newly introduced TODO/FIXME markers unless they include an
  issue reference, owner, or explicit follow-up explanation.