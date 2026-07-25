# Prompt 41 — Slice 4A Quest Participation Core Implementation

- **Date:** 2026-07-25
- **Tool/model:** OpenAI Codex (GPT-5)
- **Role:** Sole implementation owner
- **Review status:** APPROVED AFTER INDEPENDENT REVIEW

## Actual implementation instruction

The human supplied the following implementation instruction in an attached text
file and directed Codex to read and act on it:

> # Implement Slice 4A — Quest Participation Core
>
> Act as the sole implementation owner.
>
> Implement exactly:
>
> `specs/implementation/04a-quest-participation-core.md`
>
> The contract has completed independent design review. Original findings
> M1–M4 are closed, and the remaining schema, product, authorization, and
> concurrency decisions have explicit human approval.
>
> This is a high-risk full-stack Slice involving authorization, PostgreSQL
> transactions, row locking, migration guarantees, and concurrent capacity
> enforcement.
>
> Do not redesign or expand the Slice.

The instruction required:

- precondition checks for branch, worktree, recent history, diff errors, and
  untracked files, with a stop condition for unexpected state;
- reading only `AGENTS.md`, the approved Slice contract, directly relevant
  accepted specifications, and current Quest/auth/data/controller/frontend/test
  infrastructure;
- an additive `QuestParticipations` schema with retained cancelled history,
  Restrict Quest and Identity-user FKs, `JoinedAt`, nullable `CancelledAt`,
  PostgreSQL `xmin`, the active partial unique index on `(UserId, QuestId)`,
  and the active-capacity index on `QuestId`;
- explicit endpoint authorization for Member, Organizer, and Admin without role
  inheritance assumptions, with identity derived only from the authenticated
  session `NameIdentifier`;
- creator self-join rejection for every role, returning `409 Conflict` before
  Draft visibility and all other eligibility rules;
- one authoritative join transaction using one scoped `KiwimpactDbContext`, one
  connection, one active EF transaction, a materialized parameterized
  PostgreSQL `SELECT ... FOR UPDATE`, same-transaction eligibility and capacity
  counting, `SaveChangesAsync` while the lock is held, commit only after save,
  rollback on every failure, and PostgreSQL `23505` translation to `409`;
- exactly `POST /api/v1/quests/{questId}/join`,
  `POST /api/v1/quests/{questId}/cancel`, and
  `GET /api/v1/quests/{questId}/participation`, with no client user ID;
- exact current-user participation-state fields `status`, `canJoin`,
  `ineligibilityReason`, and `capacityFull`, with accepted status/reason values,
  precedence, visibility, privacy, and latest-cancelled ordering;
- cancellation of only the current user's active row, retained history, and a
  new row on rejoin, including cancellation after Quest start/end;
- Quest detail integration with anonymous CTA, TanStack Query server state,
  join, joined/cancel confirmation, OwnQuest, full/ineligible/loading/pending/
  success/error states, stale `409` resync, CSRF through `apiFetch`, no optimistic
  success, and no Zustand participation state;
- focused unit, real PostgreSQL API/persistence/migration/constraint tests, and
  frontend tests covering the contract;
- a deterministic final-slot test that externally holds the Quest row, starts
  two independent authenticated joins, proves both are blocked before release,
  then asserts exactly one `201`, one capacity `409`, and one active row;
- final backend/frontend gates, repository inspection, a real browser smoke
  where possible, implementation evidence, and a completion report;
- no completion, proof, XP, participant management, notifications, waitlist,
  new dependencies, unrelated refactoring, git state mutation, deployment, or
  pull request creation.

## Files changed

### Backend production

- `backend/src/Kiwimpact.Core/Entities/Quest.cs`
- `backend/src/Kiwimpact.Core/Entities/QuestParticipation.cs`
- `backend/src/Kiwimpact.Core/Repositories/IQuestParticipationRepository.cs`
- `backend/src/Kiwimpact.Core/Services/IQuestParticipationService.cs`
- `backend/src/Kiwimpact.Core/Services/QuestParticipationModels.cs`
- `backend/src/Kiwimpact.Core/Services/QuestParticipationService.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/QuestParticipationConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestParticipationRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260724174740_AddQuestParticipation.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260724174740_AddQuestParticipation.Designer.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`
- `backend/src/Kiwimpact.Api/Contracts/QuestParticipationContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/QuestParticipationController.cs`
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`
- `backend/src/Kiwimpact.Api/Program.cs`

### Backend tests

- `backend/tests/Kiwimpact.UnitTests/Core/QuestParticipationDomainTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Api/QuestParticipationControllerTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestParticipationApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/QuestParticipationMigrationUpgradeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/QuestParticipationPersistenceTests.cs`

### Frontend production

- `frontend/src/types/participation.ts`
- `frontend/src/lib/validation/participationDto.ts`
- `frontend/src/lib/api/participation.ts`
- `frontend/src/hooks/useParticipation.ts`
- `frontend/src/components/quest/QuestParticipationPanel.tsx`
- `frontend/src/pages/QuestDetailPage.tsx`

### Frontend tests

- `frontend/tests/integration/QuestDetailPage.test.tsx`
- `frontend/tests/integration/QuestParticipationPanel.test.tsx`
- `frontend/tests/unit/apiFetch.test.ts`
- `frontend/tests/unit/participationDto.test.ts`
- `frontend/tests/unit/useParticipation.test.tsx`

### Evidence

- `specs/ai/prompts/41-slice-4a-quest-participation-core-implementation.md`
- `specs/implementation/reports/04a-quest-participation-core-completion.md`

## Migration summary

`20260724174740_AddQuestParticipation` adds only the
`QuestParticipations` table. It contains the approved UUID identifiers and UTC
timestamps, maps `Version` to PostgreSQL `xmin`, adds Restrict FKs to
`AspNetUsers` and `Quests`, creates
`UX_QuestParticipations_UserId_QuestId_Active` with predicate
`"CancelledAt" IS NULL`, and creates
`IX_QuestParticipations_QuestId_Active` with the same active predicate. No
completion, proof, XP, achievement, streak, attendance, or leaderboard column
was added.

## Verification commands and observed results

- `dotnet build Kiwimpact.slnx` — passed; 0 warnings, 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — passed; 77/77 tests.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — passed; 123/123 tests against PostgreSQL Testcontainers.
- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — passed; 15 files, 119/119 tests.
- `npm run build` — passed; Vite built 1,868 modules.
- Focused participation unit run — passed; 28/28 tests.
- Focused participation PostgreSQL run — passed; 28/28 tests.
- Focused participation frontend run — passed; 5 files, 30/30 tests.
- `git diff --check HEAD` before evidence creation — passed.

The deterministic contention test observed two independent join database
sessions blocked on the externally held Quest `FOR UPDATE` lock before release,
then observed exactly one `201 Created`, one capacity `409 Conflict`, and one
active participation.

## Browser smoke result

Observed against a dedicated temporary PostgreSQL database and the local Vite
frontend/API:

- registered and signed in a Member;
- opened an eligible Native Quest, joined, reloaded, and observed Joined;
- opened inline cancellation, cancelled, reloaded, and observed Cancelled with
  `Join again`;
- signed in as Organizer, created/published a Quest, and observed the OwnQuest
  explanation with no Join control;
- set that Quest to capacity zero, signed back in as Member, and observed the
  capacity-full state with no participant count;
- set a 390×844 mobile viewport and observed no horizontal overflow; the
  participation panel and full-width action remained inside the viewport;
- observed native button semantics and focusability (`button`, `tabIndex=0`);
- observed no browser console warnings or errors.

The browser driver's synthetic Enter key did not dispatch the native button
activation, so real-browser keyboard activation was not claimed. The focused
Testing Library test did observe Enter activating the Join button. The temporary
database was dropped and local services were stopped after the smoke. The
pre-existing development database was not reset or repaired after startup
found Identity tables without matching migration history; no existing
application data was deliberately altered.

## Limitations

- No independent implementation review has occurred in this implementation
  session; that must be performed by a different reviewer.
- Full browser keyboard activation could not be observed because the browser
  driver's synthetic Enter event did not dispatch; focusability/native control
  semantics and the frontend user-event path were observed instead.
- The existing local development database has pre-existing migration-history
  inconsistency. Verification used isolated Testcontainers databases and a
  dedicated temporary browser-smoke database; no repair of that unrelated local
  database was attempted.

## Review status

APPROVED AFTER INDEPENDENT REVIEW
