# Review 76 — Slice 23 Richer Achievements, Rarity, Trophies, and Cosmetics

- **Date:** 2026-07-30
- **Reviewer:** Independent Codex reviewer agent
- **Mode:** Read-only implementation review with one targeted closure check
- **Branch:** `feat/richer-achievements-trophies`
- **Contract:** `specs/implementation/23-richer-achievements-trophies.md`
- **Prompt:** `specs/ai/prompts/79-slice-23-richer-achievements-trophies.md`
- **Completion report:**
  `specs/implementation/reports/23-richer-achievements-trophies-completion.md`
- **Initial verdict:** Changes requested
- **Closure verdict:** APPROVED
- **Remaining Blockers:** 0
- **Remaining Majors:** 0

## Scope reviewed

The reviewer read the Slice 23 contract, implementation prompt, completion
report, `AGENTS.md`, and current implementation diff. The read-only review
covered:

- the 45-definition typed catalog and automatic-rule boundaries;
- immutable completion-category facts, migration upgrade/rollback, and the
  documented historical approximation;
- live redemption, Evidence Claim approval, XP reconciliation, and bounded
  backfill transaction paths;
- Community Challenge reward validation, finalization, and idempotency;
- nationwide eligibility, numerator/denominator consistency, readiness,
  privacy, trophies, and cosmetics;
- API exact-key contracts, OpenAPI, strict frontend validation, Passport, and
  navigation failure isolation; and
- implementation evidence and working-tree scope.

The reviewer did not modify, create, format, stage, or commit any file.

## Initial verification observed by the reviewer

- `git branch --show-current && git status --short`
  - observed branch `feat/richer-achievements-trophies`;
  - observed the uncommitted Slice 23 working tree.
- `git diff --stat && git diff --name-status`
  - inspected the complete tracked and untracked Slice 23 scope.
- `git diff --check`
  - passed.
- Focused backend unit selection covering catalog, automatic evaluator,
  presentation rules, and profile progression:
  - 56/56 tests passed.
- Focused frontend selection covering strict DTO validation, navigation, and
  Passport composition:
  - 3/3 files and 63/63 tests passed.

The reviewer inspected the completion report's full-gate evidence but did not
repeat those heavier complete suites during the initial review.

## Initial findings

### Major 1 — legacy Community Challenge reward could bypass typed rules

New create/update validation accepted only active static
`CommunityChallengeReward` definitions, but an upgrade-era challenge could
already reference an automatic achievement. The finalizer trusted that
persisted ID, and automatic evaluation originally ignored community-sourced
awards when determining what the user had already earned. The two partial
unique indexes therefore allowed incorrect community provenance and a second
automatic award for the same Achievement ID.

### Major 2 — nationwide numerator and denominator used different snapshots

Nationwide Member count and award/trophy numerators were issued as separate SQL
statements under PostgreSQL's default `READ COMMITTED` behavior. Concurrent
membership changes could make one response combine values from different
database snapshots, contrary to the exact-count contract and, in the extreme,
could produce a numerator greater than its denominator.

### Minor 1 — catalog snapshot did not freeze complete rule metadata

The catalog identity test froze IDs and codes, but not every definition's
display fields, rule kind, threshold, Quest category, or cosmetic metadata.
The production catalog was correct; this was a regression-protection gap.

### Minor 2 — completion report omitted one changed evidence file

`PROJECT_STATUS.md` was modified but absent from the completion report's
changed-file inventory.

## Concentrated correction

### Major 1 correction

- `CommunityChallengeFinalizer` now intersects static
  `CommunityChallengeReward` IDs with active database rows before evaluating
  progress or changing state. An unknown, inactive, or automatic legacy reward
  fails closed: no status mutation or award occurs, and the challenge remains
  Active for explicit Admin cancellation.
- `AchievementAwardService` now treats every existing award for an Achievement
  ID as earned, regardless of its source, so a malformed legacy
  community-sourced automatic award cannot be issued again automatically.
- Regression coverage verifies both the fail-closed finalizer state and
  duplicate prevention.

### Major 2 correction

- `AchievementRepository.GetNationwideStatsAsync` reads active catalog IDs,
  eligible Member denominator, and per-achievement numerators in one
  PostgreSQL `REPEATABLE READ` transaction.
- `AchievementRepository.GetAchievementProfileAsync` reads the caller's
  lifetime awards, active catalog, nationwide denominator, and trophy
  numerator in one `REPEATABLE READ` transaction.
- A command-interceptor regression test verifies that both composite read paths
  execute their reader commands under `RepeatableRead`.

### Minor corrections

- A canonical SHA-256 snapshot now freezes all 45 definitions' identity,
  display, rule, category, and cosmetic metadata.
- The completion report now lists `PROJECT_STATUS.md`.

## Targeted closure check

The same reviewer performed one narrow read-only closure check limited to the
two original Majors and inspected the four correction locations plus their
three regression tests.

The reviewer independently ran:

```bash
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build \
  --filter "FullyQualifiedName~FinalizerFailsClosedForALegacyAutomaticRewardReference|FullyQualifiedName~LegacyCommunitySourcedAutomaticAwardIsNotAwardedAgain|FullyQualifiedName~CompositeRarityReadsUseOneRepeatableReadSnapshot"
```

Observed result: 3/3 tests passed, 0 failed.

Closure:

- Original Major 1: **Closed**.
- Original Major 2: **Closed**.
- Remaining original Blockers/Majors: **0**.

## Remaining accepted risks and observations

- The private achievement-profile endpoint intentionally uses caller-scoped
  readiness. Its nationwide trophy aggregate can be a temporary lower bound
  while a different profile awaits backfill; the anonymous stats endpoint
  remains globally fail-closed.
- Future catalog reactivation would need an evaluation-version/backfill rule.
  No application reactivation control exists in this Slice.
- No manual browser, deployment-environment, or production-data verification
  was performed.
- The existing Vite large-chunk advisory remains.

These are documented limitations, not remaining Blocker or Major findings for
Slice 23.

## Final verdict

**APPROVED.** The same independent reviewer confirmed both original Majors are
closed. Slice 23 satisfies the repository's review condition for commit
readiness and remains pending explicit human approval for any Git action.
