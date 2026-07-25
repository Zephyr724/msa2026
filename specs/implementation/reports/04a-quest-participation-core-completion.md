# Slice 4A — Quest Participation Core Completion Report

- **Date:** 2026-07-25
- **Status:** Implementation complete; pending independent review
- **Review status:** PENDING INDEPENDENT REVIEW

## Implemented scope

- Added persisted Quest participation with active/cancelled state, retained
  cancellation history, new-row rejoin, Restrict relationships, partial active
  indexes, and PostgreSQL `xmin` concurrency.
- Added current-user join, cancel, and participation-state endpoints with
  explicit Member/Organizer/Admin authorization and session-only identity.
- Enforced missing/creator/Draft precedence, all approved eligibility rules,
  creator self-join prevention for every role, current-user cancellation
  isolation, capacity, and duplicate-active prevention.
- Implemented join as a single-context PostgreSQL transaction with a
  materialized parameterized Quest `FOR UPDATE` lock, same-transaction count,
  save before commit, rollback on failure, and `23505` conflict translation.
- Added the Quest-detail participation experience through `apiFetch`, TanStack
  Query, and local-only cancel confirmation state.
- Added focused domain/controller, PostgreSQL API/persistence/migration/
  concurrency, and frontend UI/hook/transport/validator tests.
- Did not add completion, proof, attendance, XP, achievement, streak,
  leaderboard, participant-management, waitlist, notification, or tracking
  behavior.

## Files changed

Backend production:

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

Backend tests:

- `backend/tests/Kiwimpact.UnitTests/Core/QuestParticipationDomainTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Api/QuestParticipationControllerTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestParticipationApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/QuestParticipationMigrationUpgradeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/QuestParticipationPersistenceTests.cs`

Frontend production and tests:

- `frontend/src/types/participation.ts`
- `frontend/src/lib/validation/participationDto.ts`
- `frontend/src/lib/api/participation.ts`
- `frontend/src/hooks/useParticipation.ts`
- `frontend/src/components/quest/QuestParticipationPanel.tsx`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/tests/integration/QuestDetailPage.test.tsx`
- `frontend/tests/integration/QuestParticipationPanel.test.tsx`
- `frontend/tests/unit/apiFetch.test.ts`
- `frontend/tests/unit/participationDto.test.ts`
- `frontend/tests/unit/useParticipation.test.tsx`

Evidence:

- `specs/ai/prompts/41-slice-4a-quest-participation-core-implementation.md`
- `specs/implementation/reports/04a-quest-participation-core-completion.md`

## Schema and migration

Migration `20260724174740_AddQuestParticipation` is additive. It creates:

- `QuestParticipations(Id, UserId, QuestId, JoinedAt, CancelledAt, xmin)`;
- Restrict FK `UserId → AspNetUsers.Id`;
- Restrict FK `QuestId → Quests.Id`;
- unique partial index
  `UX_QuestParticipations_UserId_QuestId_Active` on `(UserId, QuestId)` where
  `CancelledAt IS NULL`;
- partial capacity index `IX_QuestParticipations_QuestId_Active` on `QuestId`
  where `CancelledAt IS NULL`.

Real PostgreSQL tests observed the clean migration and the upgrade from
`20260724083505_AddUserProfileForAuthCore`. Catalogue, behavior, and EF metadata
tests observed the accepted index definitions, `23505` duplicate-active
failure, cancelled-history-plus-active allowance, both Restrict delete
failures with retained history, and store-generated concurrency-token `xmin`
mapping without an application `Version` column.

## API, authorization, and transaction behavior

- `POST /api/v1/quests/{questId}/join` returns `201 Created` and Location
  `/api/v1/quests/{questId}/participation`.
- `POST /api/v1/quests/{questId}/cancel` returns the cancelled participation.
- `GET /api/v1/quests/{questId}/participation` returns exactly `status`,
  `canJoin`, `ineligibilityReason`, and `capacityFull`.
- All routes explicitly authorize Member, Organizer, and Admin.
- Actor identity is read only from `NameIdentifier`; join/cancel have no request
  DTO and ignore extra JSON identity fields.
- Creator self-join is rejected before Draft visibility and all eligibility
  checks for Member, Organizer, and Admin; it creates no row and consumes no
  capacity.
- Organizer/Admin role-only sessions can join another creator's eligible Quest.
- The join repository begins one EF transaction, materializes one parameterized
  Quest `SELECT ... FOR UPDATE`, applies visibility/eligibility, checks the
  current user's active row, counts active rows with the same context and
  transaction, saves before commit, and rolls back every failure.
- Cancellation changes only the current user's active row and remains allowed
  after start/end. Rejoin appends a new row and retains the cancelled row.

## Frontend behavior

- Anonymous Native Quest detail shows a sign-in CTA.
- Authenticated participation state is queried only when a session exists.
- Eligible, Joined, inline cancellation, Cancelled/rejoin, OwnQuest,
  capacity-full, unsupported, loading, error, pending, and stale-`409` states
  are rendered.
- Mutations set `retry: false`, perform no optimistic success, prevent duplicate
  actions while pending, and invalidate authoritative Quest and participation
  Query data on success or `409`.
- `apiFetch` provides Cookie and CSRF behavior. Participation/Quest/identity
  server state is not stored in Zustand.

## Verification commands and observed results

Backend:

- `dotnet build Kiwimpact.slnx` — passed; 0 warnings, 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — passed; 77 passed, 0 failed, 0 skipped.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — passed; 123 passed, 0 failed, 0 skipped.

Frontend:

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — passed; 15 files and 119 tests.
- `npm run build` — passed; 1,868 modules transformed.

Focused checks during implementation:

- participation unit tests — 28 passed;
- participation PostgreSQL integration tests — 28 passed;
- participation frontend tests — 5 files and 30 tests passed;
- `git diff --check HEAD` before evidence creation — passed.

## Deterministic contention result

The real PostgreSQL test seeded one available slot, externally held the Quest
row with `SELECT ... FOR UPDATE`, started two independent authenticated join
requests, and polled `pg_stat_activity` until two database sessions were
observed active and waiting on the Quest lock. Neither HTTP task had completed
before release. After release the observed outcome was exactly one `201`, one
capacity `409`, and one active row; active count did not exceed capacity.

## Browser smoke result

Observed on 2026-07-25 using a temporary isolated browser-smoke database:

- Member registration/sign-in and eligible Native Quest detail;
- join, reload, persisted Joined state;
- inline cancel confirmation, cancel, reload, Cancelled/Join-again state;
- Organizer-created Published Quest showing OwnQuest with no Join control;
- capacity-zero Quest showing capacity full to a different Member without a
  participant count;
- 390×844 viewport with no horizontal overflow and the action contained within
  the participation panel;
- native focusable button semantics (`button`, `tabIndex=0`);
- no browser console warnings or errors.

The browser driver's synthetic Enter did not dispatch activation, so browser
keyboard activation is not claimed. A focused Testing Library user-event test
did observe Enter activating Join. The temporary database was removed and the
local processes/container were stopped. The unrelated pre-existing development
database was not reset or repaired after startup found existing Identity tables
without matching migration history; no existing application data was
deliberately altered.

## Known limitations

- Independent implementation review is still required before commit.
- Full real-browser keyboard activation was not observed because of the browser
  driver limitation described above; native focusability and automated
  user-event activation were observed.
- The unrelated local development database requires separate repair or reset by
  the human if it is to be used; Slice verification did not alter it.

## Review status

PENDING INDEPENDENT REVIEW

## Independent-review closure

- **Final verdict:** APPROVE
- **Remaining Blockers:** 0
- **Remaining Majors:** 0
- **Deferred Minors:** 2 non-blocking findings: capacity-full user copy and
  dedicated latest-cancelled ordering test clarity.
- **Commit readiness:** Slice 4A is ready for human staging and commit
  inspection.
