# Slice 3A — Organizer-Owned Quest CRUD Backend Implementation

- **Date:** 2026-07-24
- **Implementation owner:** Codex
- **Contract:** `specs/implementation/03a-organizer-quest-crud-backend.md`

## Task

Implement the approved backend-only Slice 3A contract as one bounded vertical
slice. Add Organizer/Admin Quest management, server-owned identity and lifecycle
fields, one required cover image through Quest create/update, focused write
abstractions, PostgreSQL `xmin` concurrency, Scalar/OpenAPI documentation, and
focused unit and PostgreSQL integration tests.

## Boundaries

- Preserve anonymous Published-only Quest reads.
- Do not add frontend work, dependencies, migrations, gallery management,
  participation, XP awarding, leaderboards, SignalR, Cypress, Storybook, or
  Slice 2B work.
- Preserve encapsulated Quest construction/mutation; controllers do not access
  `KiwimpactDbContext`.
- Do not stage, commit, push, merge, reset, revert, or deploy.

## Required verification

Run the backend solution build, unit tests, PostgreSQL integration tests, and
`git diff --check`. Record only observed results in the completion report.

## Targeted correction — original Blocker B-1

The Kimi K3 Max independent review found that `Quest.UpdateDetails` explicitly
set `LocationRegion = null` after assigning the FK. Under EF Core relationship
fixup, a normal PUT retaining its Region could therefore persist a null FK.

The targeted correction removed that navigation assignment. After scalar reload,
`QuestWriteRepository.ReloadAsync` now resolves `LocationRegion` directly from
the reloaded `LocationRegionId`, assigns the matching tracked reference, and
assigns null only when the FK is null.

Two real management API/PostgreSQL regressions were added: PUT retaining Region A
and PUT changing Region A to Region B. Both verify the response, persisted FK,
and a later management GET. Targeted tests passed 2/2; the post-correction build
succeeded with 0 warnings/errors, unit tests passed 49/49, and PostgreSQL
integration tests passed 95/95.

Independent review status: **APPROVED AFTER TARGETED CORRECTION**. The Kimi K3
Max targeted closure check confirmed B-1 CLOSED with remaining original
Blockers 0 and Majors 0; final verdict APPROVE. The missing-cover DTO-mapping
Minor remains deferred, non-blocking robustness work and was not implemented.
