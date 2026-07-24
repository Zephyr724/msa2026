# Slice 3A — Organizer-Owned Quest CRUD Backend Completion

- **Date:** 2026-07-24
- **Implementation owner:** Codex
- **Contract:** `specs/implementation/03a-organizer-quest-crud-backend.md`
- **Status:** APPROVED AFTER TARGETED CORRECTION — independent targeted closure
  check confirmed B-1 CLOSED; remaining Blockers 0, Majors 0

## 1. Scope delivered

Implemented the protected backend management surface for Organizer-owned Quest
CRUD and accepted Admin management. The Slice includes server-controlled owner,
source type, status, and XP; one required cover image through Quest create/update;
focused write/application layers; PostgreSQL `xmin` conflict handling; Problem
Details; antiforgery; OpenAPI/Scalar annotations; and focused tests.

Public `/api/v1/quests` code and behavior were not changed. No frontend,
gallery-management, participation, XP-award, leaderboard, SignalR, Cypress,
Storybook, or Slice 2B work was added.

## 2. Endpoints

| Method | Route |
| --- | --- |
| `GET` | `/api/v1/organizer/quests` |
| `POST` | `/api/v1/organizer/quests` |
| `GET` | `/api/v1/organizer/quests/{id}` |
| `PUT` | `/api/v1/organizer/quests/{id}` |
| `DELETE` | `/api/v1/organizer/quests/{id}` |
| `POST` | `/api/v1/organizer/quests/{id}/publish` |
| `POST` | `/api/v1/organizer/quests/{id}/cancel` |
| `POST` | `/api/v1/organizer/quests/{id}/archive` |

OpenAPI integration coverage observed eight management operations and no
management `/images` route.

## 3. Authorization and ownership

- Controller role gate accepts only `Organizer` or `Admin`.
- Anonymous management read returned `401` without redirect.
- Member-only management read returned `403`.
- Organizer list is filtered by `CreatedByUserId`.
- Resource mutation rechecks parent Quest ownership in the Core service.
- A second Organizer's update returned `403` and did not change the row.
- Admin read and updated another owner's Quest.
- Admin updated an existing `AdminCuratedExternal` Quest while preserving its
  source type and owner.
- Create ignored attempted client values for owner, source type, status, and XP;
  persisted values came from the authenticated actor and server defaults.
- Cover-image authorization follows the parent Quest operation.

## 4. Domain and persistence

- `Quest.CreateOrganizerOwned`, update, publish, cancel, archive, and Draft-delete
  guards preserve internal property setters.
- One cover row is created with the Quest in the same `SaveChangesAsync` call.
- Quest PUT optionally updates that cover metadata and does not expose gallery
  CRUD, ordering, or cover-selection endpoints.
- Focused `IQuestWriteRepository` and `IQuestManagementService` abstractions were
  added; controllers do not use `KiwimpactDbContext`.
- Existing `Quest.Version`/PostgreSQL `xmin` mapping is unchanged. Stale API
  versions returned `409 application/problem+json`.

## 5. Data, migrations, and dependencies

No entity column, EF configuration, model snapshot, migration, project file, or
package reference changed. No migration or dependency was created.

## 6. Tests added

### Unit

`QuestManagementDomainTests` covers:

- owner/Admin authorization decisions;
- server-controlled create defaults;
- required text, enum, capacity, date, and URL validation;
- cover creation/update;
- server-field preservation;
- publish/cancel/archive and Draft-delete guards.

### PostgreSQL integration/API

`OrganizerQuestsApiTests` covers:

- Organizer create and cover persistence;
- own-only list;
- cross-Organizer mutation denial;
- Member `403` and anonymous `401`;
- Admin cross-owner and curated-Quest management;
- stale-version `409`;
- cover metadata update;
- publish/cancel/archive and Draft delete;
- exact management operation count and absence of gallery routes.

## 7. Observed verification

Run from `backend/`:

```text
dotnet build Kiwimpact.slnx
Build succeeded. 0 Warning(s), 0 Error(s).

dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
Passed: 49, Failed: 0, Skipped: 0, Total: 49.

dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
Passed: 95, Failed: 0, Skipped: 0, Total: 95.
```

Targeted Slice 3A integration verification also passed 11/11 before the full
suite. `git diff --check` produced no output before this report was created.

## 8. Targeted correction — original Blocker B-1

### Finding

The independent review reported that `Quest.UpdateDetails` assigned the requested
`LocationRegionId` and then explicitly set `LocationRegion = null`. EF Core
relationship fixup could treat that as relationship removal and silently persist
a null Region FK during a normal PUT.

### Correction

- Removed only the explicit `LocationRegion = null` assignment.
- Preserved assignment through `LocationRegionId`.
- After scalar reload, the write repository now queries the Region identified by
  the reloaded FK and sets that reference; when the FK is null, it sets the
  navigation null.
- No API, setter visibility, schema, dependency, or architecture change occurred.

### Regression evidence

- PUT retaining the Henderson-Massey Region preserved the FK, returned that
  Region, and returned it again on a later management GET.
- PUT changing from Henderson-Massey to Albert-Eden persisted and returned
  Albert-Eden, not the previously loaded navigation, and returned it again on a
  later management GET.
- Focused PostgreSQL tests: 2 passed, 0 failed.
- Post-correction build: succeeded, 0 warnings, 0 errors.
- Post-correction unit suite: 49 passed, 0 failed.
- Post-correction PostgreSQL integration suite: 95 passed, 0 failed.

Status: **CLOSURE CHECK PASSED**. The Kimi K3 Max independent targeted closure
check (read-only) confirmed:

- B-1: CLOSED — the severance assignment was removed, `ReloadAsync` resolves
  the Region from the reloaded FK, and both regression tests assert the
  response DTO, persisted FK, and reread GET (observed 2/2 passed).
- Remaining Blockers: 0.
- Remaining Majors: 0.
- M-1 (missing-cover DTO-mapping robustness) remains deferred and
  non-blocking; it was not implemented.

## 9. Remaining blockers and majors

- Original Blocker B-1: CLOSED (targeted closure check).
- Remaining Blockers: 0.
- Remaining Majors: 0.
- Deferred Minor: missing-cover robustness in `DtoMapping.ToManagementDetail`
  (non-blocking).

## 10. Commit readiness

Slice 3A is review-clean: independent review APPROVED AFTER TARGETED
CORRECTION, B-1 CLOSED, remaining Blockers 0, remaining Majors 0. Slice 3A is
ready for human staging and commit inspection. No files were staged,
committed, pushed, merged, reset, reverted, or deployed; staging and commit
still require explicit human approval.
