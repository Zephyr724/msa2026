# Slice 6A-1 Codex Independent Implementation Review

Date: 2026-07-26
Reviewer: Codex (independent of the Kimi K3 implementation session)
Scope: Slice 6A-1 Achievement Award Core only
Verdict: **CHANGES REQUIRED**

## Review summary

- Blockers: 0
- Majors: 1
- Minors: 0

The schema, deterministic catalog, fail-closed startup seed and validation,
award snapshot semantics, three transaction paths, uniqueness-conflict
rollback behavior, lock serialization, migration shape, and the exclusion of
all 6A-2 HTTP work match the approved design based on the reviewed diff and
independently executed gates.

One backfill candidate-discovery defect must be corrected before Slice 6A-1 is
ready for commit.

## Major finding

### M1 — Backfill candidate discovery rescans the full historical population

The approved contract requires candidate discovery to return distinct users
that have at least one eligible-but-missing milestone, in bounded batches
(`specs/implementation/06a-simple-achievements-backend.md`, §10).

`AchievementAwardService.FindBackfillCandidatesAsync` instead:

1. queries a batch of every user whose XP count reaches the lowest active
   threshold;
2. excludes only pass-scoped `attemptedIds`;
3. loads their existing awards; and
4. filters eligible-but-missing users in memory.

Evidence:

- `backend/src/Kiwimpact.Infrastructure/Achievements/AchievementAwardService.cs:127-163`
- `backend/src/Kiwimpact.Infrastructure/Reconciliation/AchievementBackfillRunner.cs:94-120`

At steady state, when all historical users are already fully awarded, every
startup or scheduled pass still walks the complete qualifying user population
batch by batch. `attemptedIds` grows to that population size and is sent back
through every subsequent query. This defeats the approved eligible-missing
candidate query and makes a nominal no-op pass scale with all historical
rewarded users.

Required correction:

- perform the eligible-and-missing predicate in PostgreSQL before
  `OrderBy(UserId)` and `Take(BatchSize)`;
- keep the result distinct and deterministically ordered;
- retain at-most-one attempt per user per pass for failures and overlap;
- do not add a dependency or change the approved transaction/lock protocol;
- add an integration test that calls candidate discovery with fully awarded
  users and proves they are absent from `ScannedUserIds`, including a case
  where more than one batch of fully awarded users precedes a genuinely
  missing user by `UserId`;
- retain the existing empty/repeat-pass, failure, concurrency, and advisory
  lock coverage.

## Independently observed verification

Executed from `backend/` after the review:

```text
dotnet build Kiwimpact.slnx
Build succeeded. 0 Warning(s), 0 Error(s).

dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
Passed: 216, Failed: 0, Skipped: 0.

dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
Passed: 246, Failed: 0, Skipped: 0.
```

`git diff --check HEAD` was clean before the gates. The gates did not alter
the implementation working tree.

## Closure boundary

Use the single concentrated correction pass permitted by `AGENTS.md` for M1
only. After the correction, the independent targeted closure check must be
limited to this original Major finding and its directly affected tests.

No implementation, migration, configuration, dependency, Git staging, commit,
push, merge, or pull-request action was performed by this review. This review
added only this evidence record.
