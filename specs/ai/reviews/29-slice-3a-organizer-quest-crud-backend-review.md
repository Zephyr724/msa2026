# Slice 3A Organizer Quest CRUD Backend Independent Review

- **Date:** 2026-07-24
- **Slice:** Slice 3A — Organizer-Owned Quest CRUD Backend
- **Reviewer:** Kimi K3 Max
- **Mode:** Read-only
- **Original verdict:** TARGETED FIX REQUIRED
- **Final accepted verdict:** APPROVE (after targeted correction and targeted
  closure check)

One independent read-only review was performed, followed by one bounded
correction pass and one targeted closure check limited to the original
unresolved Blocker, per the accepted important-task workflow.

## Actual independent review prompt

```text
# Slice 3A Organizer Quest CRUD Backend — Independent Commit Review

Act as the independent security, authorization, data-integrity, and
commit-readiness reviewer for:

Slice 3A — Organizer-Owned Quest CRUD Backend

This is a bounded read-only review.

## Permissions

Do not:

- modify, create, delete, rename, format, or rewrite files;
- implement fixes;
- add or change tests;
- add migrations or dependencies;
- stage, commit, push, reset, revert, merge, or switch branches;
- expand into frontend work, participation, completion, XP, leaderboard,
  SignalR, Cypress, Storybook, Slice 2B, or gallery-image management.

## Evidence limits

Read only:

1. AGENTS.md
2. specs/product/04-phase-2-delivery-scope.md
3. specs/implementation/03a-organizer-quest-crud-backend.md
4. the current branch diff
5. directly changed production files
6. directly changed unit and integration tests
7. specs/implementation/reports/03a-organizer-quest-crud-backend-completion.md

You may also read directly referenced existing files only when required to
verify:

- Quest persistence configuration;
- Identity role constants;
- public Quest read behavior;
- global antiforgery behavior;
- existing ProblemDetails conventions.

Do not read:

- historical prompts or reviews;
- Slice 1 or Slice 2 review evidence;
- unrelated ADRs;
- future Slice 3B or 3C planning;
- unrelated frontend files.

Do not inspect more than 35 files without human approval.
Do not repeatedly reopen unchanged files.
Do not repeatedly run `git status`.
Do not rerun all successful full test suites.
Stop tool use and return a verdict when sufficient evidence exists.

## Claimed implementation results

The implementation session reported:

- backend build: passed with 0 warnings and 0 errors;
- unit tests: 49 passed;
- PostgreSQL integration tests: 93 passed;
- targeted Slice 3A integration tests: 11 passed;
- `git diff --check HEAD`: passed;
- no frontend files changed;
- no migration or dependency changes;
- no files staged or committed.

Do not repeat all full suites merely to reproduce these results.

You may run focused tests or lightweight repository commands when required to
verify a concrete concern.

## Review requirements

Verify only the following.

### A. Authentication and role authorization

1. Anonymous callers receive `401` for management endpoints.
2. Member-only callers receive `403`.
3. Organizer and Admin authorization uses the accepted Identity roles.
4. Public registration or client-controlled data cannot grant Organizer or
   Admin privileges.
5. State-changing endpoints remain protected by the accepted antiforgery
   behavior.

### B. Resource ownership

6. Organizer-created Quests use the authenticated Organizer as owner.
7. Client input cannot choose or replace `CreatedByUserId`.
8. Organizer list queries are filtered at the database level by ownership.
9. Organizer cannot read another Organizer's management resource.
10. Organizer cannot update, publish, cancel, archive, or delete another
    Organizer's Quest.
11. Ownership is rechecked server-side and is not enforced only in the UI.
12. Admin may manage any Quest only within the accepted project rules.
13. Admin actions do not silently replace the original owner.

### C. Server-controlled fields

14. The client cannot directly control:

- owner identity;
- source type;
- lifecycle status;
- XP reward;
- concurrency token other than returning the accepted token for comparison.

15. Unknown or extra client fields cannot produce privilege or lifecycle
    escalation.
16. DTO-to-domain mapping does not mass-assign protected entity properties.

### D. Quest lifecycle

17. Create starts in the accepted initial status.
18. Publish is permitted only from allowed states.
19. Cancel is permitted only from allowed states.
20. Archive is permitted only from allowed states.
21. Invalid state transitions fail consistently.
22. Draft deletion follows the accepted hard-delete rule.
23. Non-Draft deletion does not bypass the accepted lifecycle semantics.
24. Existing public Quest read behavior still returns only the accepted public
    statuses.

### E. Validation

25. Required names, descriptions, dates, Region, URLs, capacity, cover image,
    and other accepted fields are validated.
26. Start/end date relationships are valid.
27. Capacity cannot enter an invalid range.
28. Region references are verified rather than trusted blindly.
29. URL and image metadata validation follows existing project conventions.
30. XP remains server-controlled and uses the accepted conservative behavior.
31. Validation failures use the existing ProblemDetails conventions.

### F. Cover image behavior

32. Quest creation requires one accepted nested cover-image metadata object.
33. Quest and cover image persist consistently within one application
    operation.
34. Quest update can update or replace the single cover image without creating
    gallery-management behavior.
35. Cover-image ownership follows the parent Quest.
36. No standalone gallery add/edit/delete/reorder endpoints were introduced.
37. Cover-image updates do not leave invalid or orphaned records.

### G. Concurrency and persistence

38. PostgreSQL `xmin` remains the optimistic concurrency token.
39. Update, lifecycle, and delete operations reject stale concurrency tokens.
40. Stale requests return the accepted conflict response rather than silently
    overwriting newer data.
41. Concurrency tokens are mapped correctly between persistence and API DTOs.
42. No migration was required by the implementation.
43. Existing migrations and model snapshots were not modified.
44. The repository implementation preserves atomicity for Quest and cover-image
    changes.
45. Controllers do not access `DbContext` directly.

### H. Architecture and implementation boundaries

46. API depends on Core abstractions rather than directly on Infrastructure
    persistence details.
47. The new write repository is focused on Quest management.
48. No generic repository, CQRS framework, MediatR, or new architecture was
    introduced.
49. Quest encapsulation was preserved.
50. Entity setters were not made public merely to simplify mapping.
51. Domain methods protect lifecycle and ownership-sensitive behavior.
52. Public read repositories and APIs were not unintentionally changed.

### I. API contracts and status codes

53. The eight intended operations exist:

- GET `/api/v1/organizer/quests`
- POST `/api/v1/organizer/quests`
- GET `/api/v1/organizer/quests/{id}`
- PUT `/api/v1/organizer/quests/{id}`
- DELETE `/api/v1/organizer/quests/{id}`
- POST `/api/v1/organizer/quests/{id}/publish`
- POST `/api/v1/organizer/quests/{id}/cancel`
- POST `/api/v1/organizer/quests/{id}/archive`

54. No unintended management endpoints were added.
55. `401`, `403`, `404`, `409`, validation, and success responses match the
    accepted task contract.
56. Forbidden cross-owner access does not leak unnecessary resource
    information beyond the accepted behavior.
57. Scalar/OpenAPI accurately documents the management endpoints and DTOs.
58. DTO `*Utc` names map to existing entity timestamp properties without
    renaming persistence fields.

### J. Tests and evidence

59. Unit tests exercise domain validation and lifecycle behavior.
60. PostgreSQL integration tests exercise real role and ownership boundaries.
61. Tests cover:

- Organizer create;
- owned list filtering;
- cross-owner denial;
- anonymous denial;
- Member denial;
- Admin behavior;
- cover persistence/update;
- stale concurrency;
- lifecycle transitions;
- Draft delete;
- OpenAPI scope.

62. Tests do not pass only because authorization or antiforgery was disabled.
63. The completion report accurately describes the current branch.
64. No secret, generated output, dependency change, migration, or unrelated
    scope was introduced.

## Focused verification policy

You may run:

- `git diff --check HEAD`;
- targeted unit or integration tests for a concrete concern;
- lightweight searches for endpoints, authorization attributes, ownership
  checks, or dependency changes.

Do not rerun the entire build, all unit tests, and all integration tests unless
you find a concrete contradiction in the reported evidence.

## Blocking policy

Classify as Blocker only when there is:

- authentication bypass;
- privilege escalation;
- Organizer cross-owner modification;
- destructive data-integrity defect;
- unusable core CRUD flow;
- committed secret;
- destructive or unapproved migration.

Classify as Major when there is:

- an unmet Slice 3A Definition of Done requirement;
- missing server-side ownership enforcement;
- incorrect Admin or Organizer authorization;
- client control of protected fields;
- broken lifecycle transition rules;
- ineffective optimistic concurrency;
- Quest/cover-image non-atomic persistence;
- public Quest read behavior regression;
- accepted architecture violation;
- materially false completion evidence;
- failed required backend gate.

Classify as Minor when there is:

- a real but non-blocking maintainability issue;
- error-message or ProblemDetails inconsistency;
- test clarity weakness;
- documentation mismatch;
- isolated UX/API polish issue that does not affect correctness or security.

Do not block for:

- naming preferences;
- optional refactoring;
- additional tests beyond the accepted Definition of Done;
- frontend work;
- future gallery-image management;
- Slice 2B;
- participation or gamification;
- theoretical concerns without concrete evidence.

## Required output

Return exactly:

1. Blockers
2. Majors
3. Minors
4. Verification performed
5. Final verdict

For every Blocker or Major include:

- exact file and line;
- violated Slice 3A requirement;
- concrete evidence;
- why current tests do not close the finding;
- smallest required correction.

Use one final verdict only:

APPROVE

or

TARGETED FIX REQUIRED

Return `APPROVE` when:

- Blockers = 0;
- Majors = 0;
- the reported required gates remain credible.

Do not request another full review.
Do not modify files.
```

## Independent review result

- **Blockers:** 1 (B-1)
- **Majors:** 0
- **Minors:** 1 (M-1, deferred)
- **Verdict:** TARGETED FIX REQUIRED

### Blocker B-1 — `Quest.UpdateDetails` silently NULLs `LocationRegionId` on the standard edit path

- **File/line:** `backend/src/Kiwimpact.Core/Entities/Quest.cs:99-100`
  (pre-correction), which assigned `LocationRegionId` and then set
  `LocationRegion = null`.
- **Evidence:** `GetByIdAsync` returns a tracked Quest with the
  `LocationRegion` navigation loaded. When a PUT retains the same Region (the
  default edit flow, and exactly what every integration test sent), the FK
  assignment is a no-op for change tracking, and nulling the loaded navigation
  triggers EF Core relationship fixup that sets the FK to `NULL` at
  `DetectChanges`; `SaveChanges` then persists the null. The reviewer confirmed
  the mechanism empirically with two in-memory EF change-tracking probes
  against the branch's own compiled assemblies: FK changed to a different
  Region kept the new FK; FK assigned the same value with the navigation
  nulled produced `LocationRegionId = NULL`; explicit clear produced NULL
  (correct behavior). The response DTO then reported `locationRegion: null`
  and the row permanently lost its Region.
- **Why tests did not close it:** unit tests run the domain without EF change
  tracking; integration updates resent the same Region id but asserted only
  title/sourceType/owner/status codes, never the Region after update.
- **Required correction:** remove the navigation-null assignment, keep FK-only
  assignment, reload the Region reference from the persisted FK, and add a
  regression test.

### Deferred Minor M-1

`DtoMapping.ToManagementDetail` throws `InvalidOperationException` (producing
an unhandled 500) if a managed Quest has no cover image. Slice 3A creation
requires a cover and all seeded demo Quests have covers, so this is reachable
only with out-of-band data. Deferred as non-blocking robustness work; not
implemented in the correction pass.

### Verification performed by the reviewer

- Read the permitted specifications, completion report, full branch diff
  (6 modified + 12 new files), all changed production and test files, and the
  referenced existing files needed for persistence, roles, antiforgery,
  public-read, and ProblemDetails verification (within the 35-file limit).
- Verified review items A–J against code: role gate and server-side ownership,
  server-controlled fields, lifecycle guards, validation, atomic Quest+cover
  persistence, `xmin` concurrency, architecture boundaries, eight endpoints,
  OpenAPI scope, and test coverage.
- Ran `git diff --check HEAD` (clean) and the two EF fixup probes; did not
  rerun the reported full suites, which remained credible.

## Targeted correction performed

By the implementation owner (Codex), one bounded correction pass:

- Removed only the explicit `LocationRegion = null` assignment in
  `Quest.UpdateDetails` (`backend/src/Kiwimpact.Core/Entities/Quest.cs`).
- `QuestWriteRepository.ReloadAsync` now resolves `LocationRegion` from the
  reloaded `LocationRegionId`, assigns the matching tracked reference, and
  assigns null only when the FK is null (`IsLoaded = true`), so no stale
  navigation can be returned.
- Added two focused PostgreSQL management API regression tests:
  `Put_RetainingLocationRegion_PreservesForeignKeyAndReturnedRegion` and
  `Put_ChangingLocationRegion_PersistsAndReturnsNewRegion`
  (`backend/tests/Kiwimpact.IntegrationTests/Api/OrganizerQuestsApiTests.cs`),
  each asserting the PUT response DTO, the persisted FK, and a later
  management GET.
- No API, setter-visibility, schema, dependency, or architecture change.
- Reported post-correction gates: build 0 warnings/0 errors, unit 49/49,
  PostgreSQL integration 95/95, targeted regressions 2/2.

## Targeted closure check prompt

```text
# Slice 3A B-1 Targeted Closure Check — Read Only

Verify only whether the original Blocker B-1 from the Slice 3A review is closed.

Do not perform another full review.
Do not search for new findings.
Do not reopen the deferred Minor.
Do not inspect unrelated files.
Do not modify files.
Do not rerun all test suites.

Review only:

- backend/src/Kiwimpact.Core/Entities/Quest.cs
- backend/src/Kiwimpact.Infrastructure/Repositories/QuestWriteRepository.cs
- the changed Slice 3A regression tests
- the relevant correction diff
- the updated completion report

Verify:

1. `Quest.UpdateDetails` no longer severs the loaded `LocationRegion`
   navigation in a way that can null the FK.
2. PUT retaining the same Region preserves `LocationRegionId`.
3. PUT changing the Region persists and returns the new Region.
4. Repository reload behavior does not return a stale navigation.
5. Focused PostgreSQL regression coverage closes the original assertion gap.
6. No unrelated scope was introduced.

Return exactly:

1. B-1 status: CLOSED or OPEN
2. Evidence
3. Remaining original Blockers
4. Remaining original Majors
5. Final verdict

Use:

APPROVE

only when B-1 is CLOSED and the remaining original Blocker/Major counts are
zero.

Do not identify new Minor, Major, or Blocker findings.
Stop after this closure check.
```

## Closure check result

- **B-1 status:** CLOSED.
- The severance line is removed; `UpdateDetails` assigns only the FK.
- `ReloadAsync` sets the Region reference from the reloaded FK and cannot
  return the stale pre-update navigation.
- Both regression tests assert response DTO, persisted FK, and reread GET;
  the reviewer executed them: 2 passed, 0 failed, projects rebuilt cleanly.
- No unrelated scope was introduced; the deferred Minor was not touched.
- **Remaining original Blockers:** 0.
- **Remaining original Majors:** 0.
- **Verdict:** APPROVE.

## Human decision

- Accept the closure-check result: B-1 CLOSED, remaining Blockers 0,
  remaining Majors 0.
- Final accepted verdict: APPROVE after targeted correction.
- M-1 remains deferred and non-blocking.
- Do not request another review.
- Slice 3A is ready for human staging and commit inspection; no staging or
  commit without explicit human approval.
