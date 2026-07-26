# Review 43 — Slice 6A-2 Achievement Read API: Kimi K3 Independent Implementation Review

- **Date:** 2026-07-26
- **Reviewer:** Kimi K3 (independent, read-only; not the implementation session)
- **Implementation owner:** Codex
- **Branch:** `feat/slice-6a2-achievement-read-api`
- **Baseline:** `a35ee86` (PR #14 merge of Slice 6A-1); the slice is uncommitted
  working-tree content on top of the baseline, reviewed in full
- **Contract reviewed against:**
  `specs/implementation/06a-simple-achievements-backend.md` §13–§16 (task 6A-2),
  `specs/architecture/03-api-contract.md` §2.12 (as amended by this slice),
  `specs/ai/prompts/50-slice-6a2-achievement-read-api-implementation.md`,
  `specs/implementation/reports/06a2-achievement-read-api-completion.md`
- **Verdict:** `APPROVE`

## Findings summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Major    | 0     |
| Minor    | 1     |

## Minor findings

### m1 — `awardedAt ASC` primary ordering is never discriminated from `code ASC` in tests

- **Where:** `backend/tests/Kiwimpact.IntegrationTests/Api/AchievementsApiTests.cs`
  (`EarnedReadIsExactOrderedPrivateAndExcludesInactiveAwards`).
- **What:** the only ordering assertion equalizes all `AwardedAt` values via raw
  SQL first, so it proves the `code ASC` tie-break but never proves the primary
  `awardedAt ASC` sort against a counter-arrangement (e.g. timestamps in
  reverse code order). Because real award timestamps increase monotonically
  with milestone thresholds, the natural data always agrees with code order,
  so a regression that dropped `OrderBy(AwardedAt)` would stay green.
- **Contract impact:** §15 requires `(awardedAt, code)` ordering coverage; the
  production code (`AchievementRepository.GetEarnedAsync`,
  `OrderBy(row.award.AwardedAt).ThenBy(row.achievement.Code)`) is correct as
  written, so this is a test-evidence gap, not a behavior defect.
- **Suggested closure (next convenient pass, not blocking):** add one case with
  two earned rows whose `AwardedAt` order opposes their `code` order and
  assert the timestamp order wins.

## Verified contract points (no findings)

### `GET /api/v1/achievements`

- Truly anonymous: `[AllowAnonymous]` on `AchievementsController`
  (`backend/src/Kiwimpact.Api/Controllers/AchievementsController.cs:10`);
  anonymous 200 observed in the real-stack test.
- Active-only and `code ASC`: enforced in
  `AchievementRepository.GetActiveCatalogAsync`
  (`backend/src/Kiwimpact.Infrastructure/Repositories/AchievementRepository.cs:19-32`);
  both observed via the deactivate-and-requery test.
- Bare array, exactly six keys (`id`, `code`, `name`, `description`,
  `iconUrl`, `category`) asserted per item; `iconUrl: null` passthrough
  observed; `category` is the plain string `Milestone`.
- Only the 200 response is documented, matching §13's "no 401/404/503
  contract".

### `GET /api/v1/users/me/achievements`

- Class-level `[Authorize(Roles = Member,Organizer,Admin)]`; all three roles
  observed reaching their own (empty) list; anonymous 401 observed.
- Identity derives only from `ClaimTypes.NameIdentifier`
  (`UserAchievementsController.cs:36`); no route/query/body selector exists,
  and the test passing a foreign `?userId=` query still receives exactly the
  caller's rows — caller isolation observed.
- 404 (no `UserProfile`) precedes readiness in `AchievementService`
  (`backend/src/Kiwimpact.Core/Services/AchievementService.cs:22-36`) and the
  404-before-503 precedence is observed in a dedicated test.
- Both readiness conditions return the bounded
  `https://kiwimpact.app/problems/progression-not-ready` 503 via the existing
  `ProblemDetailsHelper.ProgressionNotReady()` (no counts or internals):
  reward-pending (Verified completion without its XP row, caller-scoped
  anti-join, no timestamp filter) and earned-but-unawarded (committed XP count
  reaching an active known milestone without the matching `UserAchievement`),
  each observed in its own real-PostgreSQL test. Readiness is evaluated live
  per request; the catalog endpoint has no readiness coupling.
- Active-earned only: the earned query inner-joins the active catalog;
  inactive earned rows persist but are excluded (observed).
- `(AwardedAt, Code)` ordering implemented in the repository (see m1 for the
  residual test-evidence gap on the primary key).
- Exactly seven keys (`achievementId`, `code`, `name`, `description`,
  `iconUrl`, `category`, `awardedAt`) asserted per item; `awardedAt` uses the
  round-trip (`"O"`) convention per the amended §2.12 and the codebase-wide
  `DateTimeOffset.ToString("O")` mapping convention.
- Privacy: no user ID, email, region/community, evidence, `SourceCompletionId`,
  `XpTransactionId`, or other-user state — the DTOs carry no such fields by
  construction, and the raw-body exclusion assertions (including a foreign
  user GUID) are observed in the integration test.

### Architecture and boundaries

- Dependency direction correct: abstractions, models, and the read service in
  Core; EF repository in Infrastructure; controllers/contracts/mapping in Api.
  `AchievementService` depends only on `IAchievementRepository`.
- Read-only: every query uses `AsNoTracking()`; no write, save, or side effect
  exists in the new code paths; no new logging.
- Full diff vs `a35ee86` contains only the declared files: 8 new production
  files, 3 hand-edited production files (`Program.cs`, `DependencyInjection.cs`,
  `DtoMapping.cs` — one registration / two `ToDto` extensions each, matching
  the §16 file map), 3 new test files, the §2.12 contract amendment, and
  evidence documents. No schema, migration, seed, award-write, backfill, XP
  path, dependency, frontend, or 6A-1 behavior change.
- No unnecessary abstraction: the service/repository split mirrors the
  existing Progression/Passport precedent; nothing speculative added.
- Exception-to-ProblemDetails flow, bare `Unauthorized()`, and profile-exists
  checks follow the established Passport/Progression conventions exactly.

### Tests and evidence

- The three new test files match the §15 6A-2 matrix: mapping unit tests
  (exact values, null `iconUrl`, `"O"` formatting), real-stack API tests
  (anonymous catalog, exact keys, active-only, ordering tie-break, 401, 404
  precedence, both bounded 503s, three-role access, caller isolation, privacy
  exclusions), and an OpenAPI test asserting both operations with the
  documented response codes.
- Prompt record (50) and completion report exist and are consistent with the
  observed diff; the report's claimed test counts match what this review
  independently observed (unit 218 = 216 + 2 new; integration 257 = 247 + 10
  new).

## Independent verification executed by this review (observed, from `backend/`)

- `dotnet build Kiwimpact.slnx` — succeeded, 0 warnings, 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — Passed 218/218, failed 0, skipped 0.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — Passed 257/257, failed 0, skipped 0 (real PostgreSQL via Testcontainers,
  43 s), covering all achievement API behavior cited above.

## Verdict

`APPROVE`. Zero Blocker, zero Major findings. The single Minor finding (m1) is
a non-blocking test-evidence gap on the primary sort key; the production
ordering is correct as written. Slice 6A-2 satisfies the §13/§14 contract and
stays inside the §16 6A-2 scope and stop conditions.

No staging, commit, push, merge, PR, or deployment action was performed by
this review.
