# Slice 5A Codex Independent Design Review

- **Date:** 2026-07-25
- **Slice:** 5A — XP Ledger and Progression Core
- **Reviewer:** Codex (independent from the Kimi K3 planning session)
- **Mode:** Read-only design review; review evidence only was added
- **Branch:** `05a-xp-ledger-and-progression-core`
- **Reviewed HEAD:** `4c73968`
- **Initial verdict:** `CHANGES REQUIRED`
- **Final verdict:** `APPROVE` after targeted closure
- **Blockers:** 0
- **Initial Majors:** 4
- **Remaining Majors:** 0
- **Minors:** 3

## Review instruction and scope

The human asked Kimi K3 to produce the first-version Slice 5A plan from Prompt
44 and then returned it to Codex for independent review.

This review:

- read `AGENTS.md`, Prompt 44, and the complete proposed plan;
- checked the directly relevant accepted 4B completion, core-domain, API, and
  community-attribution rules;
- inspected the current `QuestCompletion`, `UserProfile`, EF configurations,
  migration snapshot, and redemption repository;
- reviewed the proposed schema, progression rules, future-redemption
  transaction, reconciliation loop, lock ordering, rollout/read semantics,
  test matrix, file map, and approval checklist;
- did not modify the proposed plan, production code, migrations, tests,
  dependencies, accepted specifications, configuration, or Git history.

## Findings

### Blockers

None.

### Majors

#### M1 — Future redemption can permanently snapshot a stale Home Community

- **Location:** `specs/implementation/05a-xp-ledger-and-progression-core.md:293-301`,
  `:545-556`; current baseline at
  `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs:193-203`
- **Requirement:** D3 and inherited 4B rules require future awards to copy the
  immutable completion-time community snapshot. The snapshot must represent
  the profile state serialized with that completion.
- **Issue:** the proposed flow preserves the current unlocked community
  projection at step 6 and only locks/materializes `UserProfiles` at step 7.
  A concurrent profile update can commit between those operations. The later
  `FOR UPDATE` then returns the new profile row, but
  `communityRegionId` still contains the earlier value.
- **Failure scenario:** redemption reads community A; a profile request changes
  the Home Community to B and commits; redemption then acquires the profile
  lock and creates an immutable completion and XP transaction attributed to A.
  The historical ledger is permanently wrong even though the profile change
  precedes the award commit.
- **Required correction:** acquire the profile row once with
  `FOR UPDATE` after the Quest lock, then read
  `profile.HomeCommunityRegionId` from that locked entity when creating the
  completion. Remove the preceding unlocked projection. Add a deterministic
  real-PostgreSQL test that overlaps Home Community update and redemption and
  proves the snapshot comes from the serialized profile state.

#### M2 — A persistent reconciliation failure can create an unbounded hot loop

- **Location:** `specs/implementation/05a-xp-ledger-and-progression-core.md:614-633`
- **Requirement:** D4 calls for bounded, retryable reconciliation with a
  consecutive-failure circuit breaker and no real-time busy retry.
- **Issue:** `consecutiveFailures = 0` is initialized inside the batch loop.
  Failed rows remain eligible. Once a persistent bad row is the only row left,
  every new batch resets the counter to zero, retries the row once, and queries
  it again immediately. The threshold can never be reached.
- **Impact:** one malformed or otherwise permanently failing completion can
  spin indefinitely, generate repeated database traffic/logs, prevent the pass
  from reaching its idle interval, and defeat the stated failure containment.
- **Required correction:** define pass-level failure accounting outside the
  batch loop, ensure a row is attempted at most once per pass (for example with
  a stable cursor or an in-pass failed-ID exclusion), and specify the exact
  abort/next-pass behavior. Add a deterministic test with one permanent
  failure proving bounded attempts, prompt pass termination, and retry only on
  the next explicitly invoked pass.

#### M3 — The proposed read endpoint exposes incomplete progression during backfill

- **Location:** `specs/implementation/05a-xp-ledger-and-progression-core.md:658-674`,
  `:702-728`, `:924-926`
- **Requirement:** approved 4B §18 says existing 4B completions must be
  processed before reward state is presented as complete.
- **Issue:** the exact three-key endpoint has no readiness/completeness field
  and no availability gate, yet the rollout explicitly returns totals while
  they grow during reconciliation. A caller receiving
  `{ totalXp, level, rankTitle }` has no way to distinguish a partial backfill
  from authoritative final state. Calling this transient behavior “approved”
  is also inaccurate: every D1–D7 choice is still proposed.
- **Required correction:** choose and document an enforceable boundary. Viable
  directions include:
  - keep 5A write-core only and defer D6 until reconciliation is confirmed;
  - use a two-phase rollout/feature gate so the route is unavailable until the
    global completion condition is satisfied; or
  - make the route reject with a bounded non-success response until an
    application-enforced readiness condition is true.

  A log line plus an optional operator SQL query is evidence, not an
  application gate. Add tests for the selected unavailable-before-ready and
  available-after-ready behavior.

#### M4 — Null verification timestamps are omitted from both award processing and the completion gate

- **Location:** `specs/implementation/05a-xp-ledger-and-progression-core.md:151-178`,
  `:241-245`, `:714-724`, `:808-812`, `:927-943`
- **Requirement:** every existing Verified completion without an XP
  transaction must be accounted for before reward state is considered
  complete.
- **Issue:** the award query and the operational completion query both require
  `VerifiedAtUtc IS NOT NULL`. A Verified row with a null timestamp is
  deliberately skipped and is also absent from the “expected 0” count. The
  system can therefore report reconciliation complete while that completion
  still lacks XP.
- **Current-data context:** the only current factory creates CompletionCode
  rows with a non-null timestamp, so no bad production row was observed during
  this planning review. However, the current database schema does not enforce
  the cross-field invariant, and the proposed tests explicitly make skipping
  such a row supported behavior.
- **Required correction:** keep processing-time fallback prohibited, but make
  every Verified-without-XP row part of the reconciliation/accounting
  boundary. An impossible row should produce a terminal failed count or
  unhealthy/not-ready state and must prevent the M3 readiness gate from
  opening. Update the completion SQL and tests accordingly. If implementation
  observes such a real row, retain the proposed stop-and-escalate behavior.

### Minors

#### m1 — Advisory-lock lifetime and release are underspecified

- **Location:** `specs/implementation/05a-xp-ledger-and-progression-core.md:266-268`,
  `:612-615`
- **Issue:** the design requests a session-level advisory lock on a dedicated
  connection but does not specify explicit unlock and `finally` behavior.
  Connection pooling and exceptional exits should not be left to the
  implementation owner to interpret.
- **Correction direction:** specify the exact lock key derivation, connection
  lifetime, and `pg_advisory_unlock` in `finally` (or select a clearly bounded
  alternative). Keep the lock an optimization only.

#### m2 — `bigint` does not remove the overflow class

- **Location:** `specs/implementation/05a-xp-ledger-and-progression-core.md:132-136`,
  `:480-488`, `:532-535`
- **Issue:** `bigint` makes overflow operationally remote but not impossible.
  “Progression writes never wrap” is not guaranteed unless addition is checked
  before mutation.
- **Correction direction:** require `checked(TotalXp + amount)` or an
  equivalent explicit upper-bound guard, define the invariant-failure behavior,
  and pin it with the existing proposed `long`-extreme tests.

#### m3 — The plan overstates database validation of the reward snapshot enum

- **Location:** `specs/implementation/05a-xp-ledger-and-progression-core.md:510-513`
- **Issue:** the current EF mapping stores
  `RewardDifficultySnapshot` as a bounded string but has no database `CHECK`
  restricting it to Easy/Medium/Hard. The claim that the snapshot is
  database-constrained to those names is false.
- **Correction direction:** correct the factual claim. Keep the domain guard
  and reconciliation failure/readiness behavior explicit. Adding a new check
  constraint would be an additional schema decision and must not be smuggled
  into implementation without human approval.

## Lock-order assessment

The proposed two-flush reconciliation shape does not have the initially
suspected same-profile lock-upgrade cycle:

- `XpTransaction.UserId` references `AspNetUsers`, not `UserProfiles`;
- the first XP insert therefore does not acquire a key-share lock on the
  profile row that is later locked `FOR UPDATE`;
- two different completions for one user serialize at the later profile lock;
- duplicate workers for one completion serialize at the unique
  `SourceCompletionId` insert;
- a reconciliation insert waiting for a Quest row does not hold a lock that
  the redemption path later needs exclusively.

This is consistent with PostgreSQL's row-lock conflict matrix: `FOR KEY SHARE`
conflicts with `FOR UPDATE` but not another `FOR KEY SHARE`, while `FOR UPDATE`
conflicts with all row-lock modes
([PostgreSQL 17 explicit-locking documentation](https://www.postgresql.org/docs/17/explicit-locking.html)).
The proposed Quest-before-profile invariant is therefore a viable design after
M1 is corrected so the locked profile is also the community-snapshot source.

## D1–D7 assessment

| Decision | Review assessment |
| --- | --- |
| D1 — persisted progression | Direction is reasonable: persist `TotalXp` and `Level`, derive Rank Title, keep ledger as audit source. Correct m2 before approval. |
| D2 — historical timestamp | Recommend approval after M4 correction: `CreatedAt = VerifiedAtUtc`; never invent processing-time history. |
| D3 — community attribution | Recommend approval of completion-snapshot attribution and the proposed accepted-document wording, after closing M1. |
| D4 — reconciliation mechanism | Hosted repeatable reconciliation is reasonable, but M2/M4 and m1 must be corrected before approval. |
| D5 — future transaction/lock order | One transaction/DbContext/flush for future redemption is sound in direction. Correct M1 and add the profile-update overlap test. |
| D6 — read API | Do not approve in its current form. Select an enforceable M3 readiness strategy or defer the endpoint. |
| D7 — document alignment | The listed amendments are broadly correct; add the final M1–M4 semantics after the plan is corrected. |

## Additional verified strengths

- The proposed ledger columns, positive-XP check, unique
  `SourceCompletionId`, composite indexes, and restrictive foreign keys match
  the accepted model.
- Reward amount and historical community inputs come from immutable completion
  snapshots, not current Quest difficulty, `Quest.XpAward`, or current profile
  community during reconciliation.
- Future redemption keeps completion, XP, and progression in one explicit
  transaction, one DbContext, and one `SaveChangesAsync()`.
- The level formula, Level 99 cap, and all rank bands are transcribed
  correctly.
- Rank Title is deterministically derived rather than redundantly persisted.
- The proposed XP DTO is self-only and exact-key, with no user/community
  identifier or private profile fields.
- Scope exclusions, implementation evidence requirements, PostgreSQL migration
  tests, rollback warning, error-constraint-name handling, and most of the
  concurrency matrix are appropriately explicit.
- No dependency, frontend, auth-architecture, deployment implementation, or
  out-of-scope product expansion is proposed.

## Verification performed

This was a planning review, so implementation test suites were not run.

- `git branch --show-current` — observed
  `05a-xp-ledger-and-progression-core`.
- `git status --short --branch` before this review record — branch matched its
  remote; only the proposed 5A plan was untracked.
- `git log -6 --oneline --decorate` — observed reviewed HEAD `4c73968`, a
  descendant of merged 4B-2 commit `6901fff`.
- Source and accepted-spec inspections listed in the review scope were
  completed.
- No runtime behavior is claimed from the proposed, unimplemented design.

## Verdict and bounded next step

`CHANGES REQUIRED`.

There are no Blockers, but M1–M4 must be corrected before the human approves
D1–D7 or implementation begins. Per `AGENTS.md`, the Kimi K3 planning owner
should perform one concentrated correction pass on the proposed plan. Codex
should then perform one targeted closure check limited to these four original
Major findings; that closure check is not a second full review.

The human should approve the corrected D1–D7 decision set only after the
targeted closure returns `APPROVE`. No implementation prompt should be issued
before then.

## Targeted closure check — 2026-07-25

- **Reviewer:** Codex, same independent design-review session
- **Mode:** Targeted read-only closure check
- **Scope:** Original M1–M4 only; this is not a second full review
- **Result:** All four original Majors CLOSED
- **Final verdict:** `APPROVE`

### M1 — CLOSED

The future-redemption flow now locks and materializes the `UserProfiles` row
after the Quest lock, then reads `HomeCommunityRegionId` only from that locked
entity. The prior unlocked projection is explicitly removed. Completion
creation copies that serialized value, and XP attribution continues to copy the
completion snapshot.

The proposed PostgreSQL concurrency test holds the profile row, changes the
community while redemption is blocked, commits, and requires the resumed
redemption to attribute both completion and XP to the newly serialized value.
This directly covers the original stale-snapshot race.

### M2 — CLOSED

Reconciliation counters and `attemptedIds` are now pass-scoped. Each batch
excludes every ID already attempted in the current pass, so a failed row can be
attempted only once before the pass ends. Batch boundaries no longer reset the
failure counter, and an incomplete/aborted pass retries failed work only in the
next scheduled or explicitly invoked pass.

The proposed permanent-failure test counts insert attempts, requires one
attempt per pass, and requires prompt pass termination with no same-pass busy
retry. The original unbounded hot-loop path is removed.

### M3 — CLOSED

D6 now has an application-enforced readiness gate. Every progression request
first evaluates the live reward-pending anti-join; any pending completion
returns bounded `503 progression-not-ready` before profile state is read. The
gate has no cache, opens automatically at zero, and re-closes if a pending row
appears.

The rollout section no longer calls partial progression an approved behavior.
The test matrix requires `503` while pending and `200` only after
reconciliation. Logs and operator SQL are correctly described as supporting
evidence rather than the gate itself.

### M4 — CLOSED

The plan now separates:

- award eligibility, which still requires non-null `VerifiedAtUtc` and never
  fabricates a timestamp; and
- reward-pending accounting, which includes every Verified completion without
  an XP row and has no timestamp filter.

A null-timestamp row is counted as unprocessable, makes the pass incomplete,
keeps the M3 gate closed, and prevents the completion SQL from returning zero.
The proposed raw-SQL impossible-state test pins all of those behaviors. The
stop-and-escalate rule remains in force if such a row is observed.

### Closure verification

This remained a planning-only review:

- inspected the corrected D2/D4/D5/D6 decisions and §§9–14 test/rollout
  details;
- confirmed the plan remains `Proposed`;
- confirmed the only working-tree paths are the proposed plan and this review
  record;
- ran tracked and untracked diff-hygiene checks with no whitespace findings;
- did not run implementation tests because no implementation exists;
- did not modify production code, migrations, tests, dependencies, accepted
  specifications, configuration, staging, Git history, or remote state.

### Final design readiness

There are 0 remaining Blockers and 0 remaining Majors. Slice 5A's corrected
first-version plan is `APPROVE` for the next governance step: explicit human
approval or rejection of D1–D7 and the §19 checklist.

This approval is for the design plan only. It does not authorize schema,
architecture, API, implementation, staging, commit, push, merge, PR, or
deployment changes.
