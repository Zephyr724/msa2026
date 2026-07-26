# Slice 6A-1 Targeted Implementation Closure Review (K3)

- **Date:** 2026-07-26
- **Reviewer:** Kimi K3 (targeted closure reviewer per the explicit
  human-directed role switch; not a second full review)
- **Concentrated correction owner:** Codex
- **Branch:** `feat/slice-6a-simple-achievements-backend`
- **Scope:** Review 41 original Major M1 only —
  `specs/ai/reviews/41-slice-6a1-codex-independent-implementation-review.md`
- **Sources reviewed:** `AGENTS.md`;
  `specs/implementation/06a-simple-achievements-backend.md` §10;
  Review 41; the Prompt 49 concentrated-correction record;
  `specs/implementation/reports/06a1-achievement-award-core-completion.md`;
  `backend/src/Kiwimpact.Infrastructure/Achievements/AchievementAwardService.cs`;
  `backend/src/Kiwimpact.Infrastructure/Reconciliation/AchievementBackfillRunner.cs`;
  `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementBackfillTests.cs`

## Original M1: **CLOSED**

Review 41 M1 found that backfill candidate discovery batched every user
reaching the lowest threshold and filtered eligible-but-missing users in
memory, so a steady-state no-op pass rescaled with the full historical
rewarded population. The correction rewrites
`AchievementAwardService.FindBackfillCandidatesAsync` so the
eligible-and-missing predicate executes in PostgreSQL. Each closure point:

### 1. Eligible-and-missing predicate executes in PostgreSQL before distinct, `OrderBy(UserId)`, `Take(BatchSize)` — VERIFIED

`AchievementAwardService.cs:126-149`: for each active milestone an
`IQueryable` is built as `XpTransactions.GroupBy(UserId)` →
`Where(group.Count() >= threshold)` (SQL `HAVING`) →
`Where(!UserAchievements.Any(...))` (SQL anti-join `NOT EXISTS`); the
branches are combined with `Queryable.Union` (SQL `UNION`, distinct); only
then are the pass-scoped `attemptedIds` exclusion, `OrderBy(userId)`, and
`Take(batchSize)` appended. The entire predicate chain is composed before
materialization (`ToListAsync`) and executes as one SQL statement on real
PostgreSQL — proven behaviorally: with `BatchSize = 2` and three fully
awarded users ordered (by deterministic small GUIDs) before one genuinely
eligible-missing user, the direct query returned exactly `[missingUserId]`.
Had the missing-predicate been applied in memory after `Take`, the first
batch would have contained the two fully awarded users and the missing user
would not have appeared. Distinctness is proven by the boundary test: the
6-XP-row user is eligible on all three milestones yet counts once in
`Scanned`/`Awarded` (SQL `UNION`, not `UNION ALL`).

### 2. Fully awarded users never enter `ScannedUserIds` or the pass-scoped attempted set — VERIFIED

`ScannedUserIds` now contains only SQL-filtered eligible-missing users
(`AchievementAwardService.cs:145-153` returns the same list for both
fields). The runner adds only `scan.ScannedUserIds` to `attemptedIds`
(`AchievementBackfillRunner.cs:117-118`). The new regression test
(`AchievementBackfillTests.cs:98-151`,
`CandidateDiscoveryFiltersFullyAwardedUsersBeforeApplyingBatchLimit`)
asserts every fully awarded ID is absent from `ScannedUserIds`, and the
repeat-pass test continues to observe a strict no-op (`Scanned == 0`).

### 3. More than one batch of fully awarded users preceding a missing user — the missing user is still returned directly — VERIFIED

The regression test uses `BatchSize = 2` with three fully awarded users
(`...0101`–`...0103`) preceding the missing user (`...0200`) in `UserId`
order: fully awarded users exceed one batch. Direct candidate discovery
returned exactly the missing user, and a subsequent full pass awarded
exactly one user (`completed.Awarded == 1`).

### 4. At-most-once-per-pass, failure recovery, transaction, profile lock, and advisory lock protocols unchanged — VERIFIED

`AchievementBackfillRunner.cs` is byte-equivalent in behavior to the
reviewed implementation: pass-scoped `attemptedIds`, one attempt per user
per pass, consecutive-failure streak with reset on every non-failure
outcome, circuit breaker, advisory lock acquire/release in
`BackfillPassAsync`, and bounded logging. `AwardBackfillUserAsync` is
unchanged (per-user transaction, profile `FOR UPDATE` lock, post-lock
re-read, rollback-and-propagate). The production/test correction touched
only `AchievementAwardService.cs` and `AchievementBackfillTests.cs`; the
Prompt 49 record and completion report were updated as required evidence.
Review 41 additionally received a trailing-whitespace-only cleanup with no
content change, as disclosed by the completion report (correction window
16:07–16:10; runner 14:31, seed 15:06, migration 14:36, helpers 14:34
predate it).

### 5. No schema, migration, seed, dependency, HTTP, or 6A-2 change — VERIFIED

- Migration `20260726063609_AddSimpleAchievements` still contains only the
  two `CreateTable` operations and four `CreateIndex` operations (no data
  operations); the model-snapshot diff covers only the achievement model.
- `AchievementSeed.cs` retains the approved advisory-lock + upsert +
  fail-closed validation design (no correction-time change).
- No `*.csproj`/lockfile modification (clean in `git status`); no new
  package.
- No achievement controller, DTO, contract, read service, or read
  repository exists (source search).

## Independent verification executed

Run from `backend/` on 2026-07-26 by this reviewer:

```text
dotnet build Kiwimpact.slnx
  Build succeeded, 0 warnings, 0 errors.

dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
  --filter "FullyQualifiedName~AchievementBackfillTests|FullyQualifiedName~AchievementConcurrencyTests|FullyQualifiedName~AchievementAwardPathTests|FullyQualifiedName~XpConcurrencyTests|FullyQualifiedName~XpReconciliationTests"
  Passed: 34, Failed: 0, Skipped: 0.
  (Covers the M1 regression test, backfill matrix/no-op/advisory-lock/
  forced-conflict/circuit-breaker/logging, award paths, and both 5A
  concurrency/reconciliation protocol suites.)

dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
  Passed: 216, Failed: 0, Skipped: 0.

dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
  Passed: 247, Failed: 0, Skipped: 0.
```

Read-only evidence checks: `git diff --check` clean; correction-scope file
mtimes as listed above; migration/seed/HTTP/dependency invariance checks as
in point 5.

## Final verdict

**APPROVE — original Review 41 M1 is CLOSED.**

Slice 6A-1 satisfies review closure: the single Major finding is corrected
with directly observed evidence, the approved protocols are intact, and no
out-of-scope change occurred. The next step is only human approval of the
Git commit. No stage, commit, push, merge, or pull-request action was
performed by this review; this review added only this evidence record.
