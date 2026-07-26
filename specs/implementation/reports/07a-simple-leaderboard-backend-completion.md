# Slice 7A — Simple Leaderboard Backend Completion Report

## Status

Implementation and applicable verification are complete. Independent Kimi K3
Review 48 approved the implementation with 0 Blockers, 0 Majors, and 2
non-blocking Minors. No Git write action has been performed.

## Implemented scope

- Added anonymous `GET /api/v1/leaderboards/people`.
- Added exact staged query handling: omitted `scope`/`period` default to
  `nz`/`allTime`; exact supported values succeed; empty/unsupported values and
  every supplied `page`/`pageSize` return bounded 400 Problem Details.
  Unrelated unknown query keys are ignored.
- Added a read-only EF Core aggregate over committed XP ledger rows using
  `SUM((long)XpAmount)` and `COUNT(*)`, inner-joined to profiles.
- Added deterministic SQL ordering: total XP descending, completion count
  descending, lower display name ascending, then internal UserId ascending,
  followed by server-side Top 10.
- Added ordinal rank assignment that preserves repository order.
- Added the exact privacy-bounded response:
  `scope`, `period`, and rows containing only `rank`, `displayName`,
  `totalXp`, and `verifiedCompletionCount`.
- Reused the global reward-pending accounting boundary and added bounded 503
  `leaderboard-not-ready` Problem Details.
- Added DI registrations and OpenAPI response/parameter documentation.
- Amended API contract §2.14 with the approved staged P0 limitation.
- Updated `PROJECT_STATUS.md` for the merged Slice 6B baseline and current
  locally implemented Slice 7A state.

## Files changed

Primary implementation files — 9 new:

1. `backend/src/Kiwimpact.Core/Repositories/ILeaderboardRepository.cs`
2. `backend/src/Kiwimpact.Core/Services/ILeaderboardService.cs`
3. `backend/src/Kiwimpact.Core/Services/LeaderboardModels.cs`
4. `backend/src/Kiwimpact.Core/Services/LeaderboardService.cs`
5. `backend/src/Kiwimpact.Infrastructure/Repositories/LeaderboardRepository.cs`
6. `backend/src/Kiwimpact.Api/Contracts/LeaderboardContracts.cs`
7. `backend/src/Kiwimpact.Api/Controllers/LeaderboardsController.cs`
8. `backend/tests/Kiwimpact.UnitTests/Core/LeaderboardServiceTests.cs`
9. `backend/tests/Kiwimpact.IntegrationTests/Api/LeaderboardsApiTests.cs`

Primary implementation files — 4 modified:

1. `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs`
2. `backend/src/Kiwimpact.Api/Program.cs`
3. `backend/src/Kiwimpact.Api/Helpers/ProblemDetailsHelper.cs`
4. `backend/tests/Kiwimpact.IntegrationTests/Api/OpenApiOperationTests.cs`

Approved documentation and evidence:

- `specs/architecture/03-api-contract.md`
- `PROJECT_STATUS.md`
- `specs/implementation/07-simple-persisted-leaderboard.md`
- `specs/ai/prompts/53-slice-7-simple-persisted-leaderboard-first-plan.md`
- `specs/ai/reviews/47-slice-7-codex-independent-design-review.md`
- `specs/ai/prompts/54-slice-7a-simple-leaderboard-backend-implementation.md`
- `specs/ai/reviews/48-slice-7a-k3-independent-implementation-review.md`
- `specs/ai/reviews/49-slice-7-codex-targeted-design-closure-review.md`
- this report

The observed baseline correction is that `ProblemDetailsHelper.cs` is under
the existing `Helpers/` directory. The plan file map was corrected in place;
the approved 13-primary-file count and behaviour boundary did not change.

## Verification performed

Targeted during implementation:

- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj
  --no-restore --filter FullyQualifiedName~LeaderboardServiceTests`
  — 15/15 passed.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj
  --filter "FullyQualifiedName~LeaderboardsApiTests|FullyQualifiedName~OpenApiOperationTests"`
  — 19/19 passed against Testcontainers PostgreSQL.

Full backend gates, run once after implementation:

- `dotnet build Kiwimpact.slnx` — succeeded with 0 errors and 5 EF1002
  warnings, all in unchanged pre-existing test files.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — 233/233 passed.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — 275/275 passed against Testcontainers PostgreSQL.

## Counter-directional evidence

- Empty, case-mismatched, unsupported, numeric and non-numeric staged
  parameters fail before readiness/repository access.
- Explicitly empty query values are distinguished from omitted values.
- A case-fold collision (`Aroha` vs `AROHA`) with controlled GUIDs proves the
  final internal ordering key without exposing IDs.
- Exact duplicate display names both remain present.
- Eleven equal-score users prove the deterministic Top-10 cut.
- Reward-pending data returns 503; a real reconciliation pass opens the gate
  and the ledger result appears.
- A ledger user lacking a profile is excluded by the inner join.
- Exact-key and negative-content assertions prove the response contains no
  identity, community, email, quest, transaction, or timestamp exposure.
- OpenAPI contains the route, four staged query parameters, and 200/400/503
  responses.

## Known limitations and boundaries

- P0 is NZ/all-time Top 10 only. Auckland, My Community, weekly/monthly,
  pagination, `/me`, contextual rank, movement, SignalR, and communities
  leaderboard remain unimplemented.
- The global aggregate intentionally uses the existing tables and indexes;
  no scale-driven index or materialized ranking was introduced.
- The full build currently reports five existing EF1002 warnings in unrelated
  test files. This implementation adds no warning.
- No frontend work is included; 7B starts only after reviewed 7A is
  human-approved and merged to `main`.
- Review 48 m1 (missing targeted design-closure evidence) is closed by
  Review 49. Review 48 m2 (block-scoped dual namespace in
  `LeaderboardContracts.cs`) is a non-blocking style observation and is
  deliberately deferred so production code is not changed after independent
  approval.

## Review and Git status

- Independent implementation reviewer: Kimi K3.
- Review status: Review 48 `APPROVED` — 0 Blockers, 0 Majors, 2 non-blocking
  Minors. Review 49 closes the evidence-only m1; cosmetic m2 is deferred.
- No staging, commit, push, merge, pull request, or deployment was performed.
