# Slice 6A-2 — Achievement Read API Completion Report

- **Date:** 2026-07-26
- **Implementation owner:** Codex
- **Branch:** `feat/slice-6a2-achievement-read-api`
- **Baseline:** `a35ee86` (PR #14 merge of Slice 6A-1)
- **Prompt:** `specs/ai/prompts/50-slice-6a2-achievement-read-api-implementation.md`
- **Plan:** `specs/implementation/06a-simple-achievements-backend.md`, task 6A-2
- **Review status:** Review 43 `APPROVE` — Blocker 0, Major 0, Minor 1

## Implemented scope

- Anonymous `GET /api/v1/achievements` returns only active catalog rows as a
  bare array, ordered by `code`, with exactly six contract keys.
- Authorized `GET /api/v1/users/me/achievements` derives identity only from
  `ClaimTypes.NameIdentifier` and returns only the caller's active earned
  achievements as a bare array ordered by `(AwardedAt, Code)`, with exactly
  seven contract keys.
- The self route explicitly checks profile existence first (`404`), then
  caller-scoped readiness:
  - any caller-owned Verified completion without its XP transaction;
  - enough committed XP transactions for an active known milestone without
    the matching earned row.
  Either readiness condition returns the existing bounded
  `progression-not-ready` `503`.
- Display fields are composed server-side from current active catalog rows.
  Inactive earned rows persist but are excluded.
- Responses omit user IDs, email, region/community data, completion evidence,
  source completion IDs, XP transaction IDs, and other users' state.
- Both operations and the earned route's 200/401/404/503 responses appear in
  `/openapi/v1.json`.

## Files changed

Production, new:

- `backend/src/Kiwimpact.Core/Repositories/IAchievementRepository.cs`
- `backend/src/Kiwimpact.Core/Services/IAchievementService.cs`
- `backend/src/Kiwimpact.Core/Services/AchievementModels.cs`
- `backend/src/Kiwimpact.Core/Services/AchievementService.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/AchievementRepository.cs`
- `backend/src/Kiwimpact.Api/Contracts/AchievementContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/AchievementsController.cs`
- `backend/src/Kiwimpact.Api/Controllers/UserAchievementsController.cs`

Production, modified:

- `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs`
- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`

Tests, new:

- `backend/tests/Kiwimpact.UnitTests/Api/AchievementMappingTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/AchievementsApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/OpenApiOperationTests.cs`

Documentation/evidence:

- `specs/architecture/03-api-contract.md`
- `PROJECT_STATUS.md`
- `specs/ai/prompts/50-slice-6a2-achievement-read-api-implementation.md`
- `specs/implementation/reports/06a2-achievement-read-api-completion.md`

## Verification performed

Run from `backend/`:

- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --filter FullyQualifiedName~Achievement --no-restore`
  — Passed 40/40.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --filter "FullyQualifiedName~AchievementsApiTests|FullyQualifiedName~OpenApiOperationTests" --no-restore`
  — Passed 10/10.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build --filter FullyQualifiedName~Achievement`
  — Passed 44/44.
- `dotnet build Kiwimpact.slnx`
  — succeeded with 0 warnings and 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — Passed 218/218, failed 0, skipped 0.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — Passed 257/257, failed 0, skipped 0.

The real API/PostgreSQL tests observed anonymous catalog access, three-role
self access, anonymous `401`, profile-first `404`, both bounded `503`
conditions, exact response keys, deterministic ordering, inactive exclusion,
caller isolation, privacy exclusions, and OpenAPI operations/response codes.

Post-review CI correction verification:

- the previously failing
  `EarnedReadIsExactOrderedPrivateAndExcludesInactiveAwards` test passed once
  with a build and then 5/5 consecutive `--no-build` repetitions;
- all Achievement integration tests passed 44/44;
- `dotnet build Kiwimpact.slnx` succeeded with 0 warnings and 0 errors;
- the exact CI command `dotnet test Kiwimpact.slnx --no-build` passed unit
  218/218 and integration 257/257 in the same invocation.

## Boundaries and limitations

- No schema, migration, seed, write-side award, backfill, reconciliation, XP
  path, configuration, dependency, or frontend change was made.
- No other-user read, write endpoint, progress-toward-next field, threshold,
  streak, richer achievement, or Community Challenge behavior was added.
- `iconUrl` remains null for the current seeded catalog.
- Review 43 Minor m1 originally recorded a non-blocking ordering-test gap.
  A post-review GitHub Actions failure then exposed a related test-only
  precision issue: `DateTimeOffset.UtcNow` carried a 100 ns tail that
  PostgreSQL `timestamp with time zone` correctly reduced to microsecond
  precision. The corrected test uses fixed microsecond-aligned timestamps,
  arranges `awardedAt` order opposite code order, and retains a tied pair for
  the code tie-break. This closes m1 and fixes CI evidence without changing
  production code.
- No frontend gates were run because no frontend file changed.
- Work remains uncommitted and unpushed. No PR, merge, or deployment action
  was performed.
- Review 43 independently approved Slice 6A-2. It is ready for explicit human
  approval of staging and commit.
