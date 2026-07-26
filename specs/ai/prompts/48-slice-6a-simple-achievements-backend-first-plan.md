# Prompt 48 — Slice 6A Simple Achievements Backend First Plan (Record)

- **Date:** 2026-07-26
- **Executor:** Kimi K3 (planning only)
- **Output plan:** `specs/implementation/06a-simple-achievements-backend.md`

The actual prompt is recorded verbatim below. Truthful execution facts follow
after the verbatim prompt.

---

# Prompt 48 — Slice 6A Simple Achievements Backend First Plan

You are the planning owner for Kiwimpact Slice 6A.

This is a planning-only task. Do not implement production code, migrations, tests, dependencies, configuration, or accepted-specification amendments.

## Required repository baseline

Before planning:

1. Read the repository-root `AGENTS.md` completely.
2. Confirm the current branch is:
   `feat/slice-6a-simple-achievements-backend`
3. Record the exact reviewed HEAD. The expected baseline is the Slice 5B merge commit:
   `2706e0c`
4. Confirm Slice 5A and Slice 5B are merged into the branch.
5. Inspect the working tree.
6. The existing modification to `PROJECT_STATUS.md` is an expected human-authorized status update made before this task. Preserve it unchanged.
7. Apart from that expected file, stop and report any unrelated modification.
8. Do not create or switch branches.

Read directly relevant parts of these sources:

- `PROJECT_STATUS.md`
- `specs/00-project-profile.md`
- `specs/product/04-phase-2-delivery-scope.md`
- `specs/product/01-product-requirements.md`
- `specs/architecture/02-core-domain-data-model.md`
- `specs/architecture/03-api-contract.md`
- `specs/implementation/05a-xp-ledger-and-progression-core.md`
- `specs/implementation/05b-passport-lite.md`
- `specs/implementation/reports/05a-xp-ledger-and-progression-core-completion.md`
- `specs/implementation/reports/05b-passport-lite-completion.md`
- `specs/ai/reviews/39-slice-5b-codex-independent-implementation-review.md`
- the current `Achievement` and `UserAchievement` accepted model sections
- the merged XP transaction, completion redemption, reconciliation, progression, DbContext, entity-configuration, migration, API-contract, authorization, and PostgreSQL test code directly relevant to achievement awards

Follow the evidence limits in `AGENTS.md` and `specs/ai/03-deadline-execution-mode.md`. Do not recursively read historical prompts or reviews. Read no more than 25 files unless a concrete unresolved baseline question requires it.

Treat `specs/product/04-phase-2-delivery-scope.md` according to its actual recorded status. It controls current assessment scheduling but must not be misrepresented as an accepted architecture decision.

## Objective

Produce the first implementation plan for:

**Slice 6A — Simple Achievements Backend**

The Slice should deliver the smallest safe backend vertical slice supporting the P0 requirement for at least three simple persisted achievements.

The intended outcome is:

- a fixed catalog of at least three simple achievements;
- achievement criteria derived only from authoritative persisted reward data;
- idempotent and concurrency-safe awards;
- correct handling of users who already have XP transactions before the Slice 6A migration;
- public active-achievement catalog read;
- authenticated current-user earned-achievement read;
- exact DTOs, bounded errors, privacy controls, OpenAPI/Scalar coverage, and PostgreSQL tests;
- a clean backend contract for a separate Slice 6B frontend.

This plan may propose additive database-schema changes, but those changes remain unapproved. Do not create a migration or implement any schema change until the human explicitly approves the reviewed plan.

## Current baseline to verify

Verify these statements against merged source and correct any mismatch in the plan:

- P0 requires at least three simple achievements.
- Richer achievements and streaks are P1 and must not expand Slice 6A.
- `UserProfile` currently persists `TotalXp` and `Level`.
- `XpTransaction` is the authoritative verified-reward ledger.
- Every `XpTransaction` has a unique `SourceCompletionId`.
- XP amounts come from server-owned progression rules, not client input or mutable current Quest reward fields.
- `XpTransaction.CreatedAt` is the award-effective timestamp and equals the source completion’s immutable `VerifiedAtUtc`.
- Completion Code redemption creates the Verified completion, XP transaction, and profile progression update atomically.
- Historical XP reconciliation awards one eligible completion per transaction and is idempotent through the unique `SourceCompletionId`.
- Both live redemption and historical reconciliation are achievement-triggering paths that the plan must account for.
- The current source has no implemented `Achievement` or `UserAchievement` entity, configuration, migration, repository, service, controller, seed, or API.
- The accepted API document lists:
  - `GET /api/v1/achievements`
  - `GET /api/v1/users/me/achievements`
  but does not yet define an implemented exact DTO contract.
- The current Passport frontend has no achievement data or achievement UI.
- TanStack Query owns future achievement server state; Zustand must not store the achievement catalog or earned-achievement records.
- `CommunityChallenge` is Deferred and its table is not implemented.
- The accepted long-term `UserAchievement` model includes nullable `SourceCommunityChallengeId`, but its referenced `CommunityChallenge` table does not yet exist. Slice 6A must resolve this staged-schema issue explicitly rather than silently adding Deferred Community Challenge scope.

For each baseline finding, cite concrete files and relevant symbols or line locations.

## Recommended minimal direction to evaluate

Use this as the default proposal unless repository evidence supports a safer or smaller design:

- exactly three P0 cumulative verified-completion milestone achievements;
- suggested thresholds: 1, 3, and 5 verified rewarded completions;
- eligibility derived from `XpTransaction` count because each ledger row uniquely represents one verified completion;
- fixed stable codes, names, descriptions, categories, and IDs;
- no configurable rule engine and no achievement-criteria columns;
- no category, streak, community, leaderboard, level, season, or challenge achievements;
- deterministic award time and triggering `XpTransactionId`;
- a separate Slice 6B will render achievements in the Passport.

The exact achievement names, codes, thresholds, icons, and rule semantics are not pre-approved. Present a recommendation and require explicit human approval.

## Mandatory decisions

For every decision D1–D8, provide:

- recommended choice;
- alternatives considered;
- tradeoffs;
- concrete implementation consequences;
- an explicit `REQUIRES HUMAN APPROVAL` marker.

### D1 — Exact Slice and catalog boundary

Decide:

- whether Slice 6A contains exactly three achievements or a larger catalog;
- exact stable codes, names, descriptions, categories, thresholds, and optional icon representation;
- whether the minimal criteria are cumulative verified-completion milestones at 1, 3, and 5;
- whether inactive achievements are excluded from public and current-user reads;
- how later catalog additions remain additive.

Prefer the smallest demonstrable P0 catalog. Do not add richer achievement types merely to anticipate P1.

### D2 — Authoritative eligibility and award semantics

Define:

- the authoritative source used to evaluate eligibility;
- whether verified-completion milestones are counted exclusively from `XpTransaction`;
- why `QuestCompletion` without an XP transaction must not earn an achievement;
- the deterministic transaction that triggers each milestone;
- stable ordering when XP transactions share a timestamp;
- exact `AwardedAt` semantics;
- exact `XpTransactionId` semantics;
- whether multiple achievements may be awarded by one transaction;
- behavior when an achievement is inactive;
- behavior after catalog content changes.

Do not derive awards from current mutable Quest difficulty, current Quest XP, client values, or Passport UI state.

### D3 — Staged schema, migration, seeding, and historical backfill

Compare and decide how to implement the accepted `Achievement` and `UserAchievement` concepts without pulling Deferred Community Challenge into P0.

Explicitly compare at least:

1. omit `SourceCommunityChallengeId` in the Slice 6A physical schema and add it later with Community Challenge;
2. add the nullable column without its future FK;
3. add the Deferred `CommunityChallenge` table merely to satisfy the FK.

Recommend the smallest referentially honest design. Do not implement Community Challenge behavior.

Specify:

- exact proposed columns, types, lengths, nullability, FKs, delete behavior, indexes, and unique constraints;
- stable catalog seeding strategy;
- migration upgrade behavior from the current 5B schema;
- deterministic backfill for users who already have 1, 3, or 5 XP transactions;
- how the triggering transaction and historical `AwardedAt` are selected;
- migration rollback expectations;
- empty-database and upgrade-path behavior;
- future migration path to the full accepted long-term model.

Clearly flag every temporary staged-schema variance from the accepted long-term model.

### D4 — Atomicity, idempotency, and concurrency

Trace all current XP-creation paths and specify exactly where achievement evaluation occurs.

Cover:

- successful Completion Code redemption;
- hosted historical XP reconciliation;
- retries;
- two concurrent completions for the same user on different Quests;
- unique-constraint conflicts;
- transaction rollback;
- profile row locking;
- award ordering;
- avoidance of duplicate `UserAchievement` rows;
- behavior when multiple milestones are crossed in one transaction;
- behavior when catalog data is missing or malformed.

Decide whether completion, XP, profile progression, and newly earned achievements must commit atomically for live awards. If a different boundary is recommended, justify it and define visible consistency/readiness behavior.

Do not introduce another job framework or an unbounded background process.

### D5 — Exact API contracts, authorization, privacy, and readiness

Define exact routes and DTOs for:

- `GET /api/v1/achievements`
- `GET /api/v1/users/me/achievements`

Specify:

- exact response keys and types;
- ordering;
- whether the earned endpoint returns catalog display fields directly or requires client composition;
- active/inactive filtering;
- anonymous catalog access;
- Member, Organizer, and Admin access to their own earned achievements;
- no user-selectable ID for reading another person’s achievements;
- exact 401, 404, 503, and unexpected-error behavior;
- interaction with existing XP reconciliation readiness;
- privacy exclusions.

Do not expose email, user ID, Home Community, completion evidence, code material, source-completion ID, internal concurrency values, or another user’s achievement state.

Plan exact OpenAPI/Scalar annotations and runtime response behavior.

### D6 — Backend architecture and integration boundary

Specify proposed responsibilities and file placement for:

- entities and domain invariants;
- fixed achievement definitions or rules;
- EF Core configurations;
- DbContext;
- seeding;
- repository/query services;
- award evaluator;
- integration with live XP award;
- integration with reconciliation;
- controllers and DTO mapping;
- dependency registration;
- Problem Details mapping.

Preserve the existing Clean Architecture Lite dependency direction. Do not add a dependency or create a general-purpose rules engine.

Also describe the contract expected by the later Slice 6B frontend without implementing frontend code.

### D7 — Verification strategy

Provide a concrete test matrix.

At minimum cover:

- domain validation for both entities;
- exact catalog seed content;
- empty database migration;
- upgrade from the current 5B migration;
- historical backfill at 0, 1, 2, 3, 4, and 5+ transactions;
- deterministic tie ordering;
- unique constraints and FK behavior;
- live first/third/fifth milestone awards;
- multiple milestones crossed safely if allowed;
- no award for reward-pending or non-verified completion;
- live redemption atomicity and rollback;
- reconciliation awards and retries;
- concurrent same-user completions;
- duplicate-award idempotency;
- inactive or missing catalog behavior;
- catalog endpoint authorization and exact DTO keys;
- current-user endpoint isolation and privacy;
- missing profile;
- readiness/error behavior;
- OpenAPI operation presence.

List targeted commands and the applicable full backend gates from `AGENTS.md`.

Do not include frontend gates unless the approved plan unexpectedly changes frontend files. Do not claim any test or runtime result that was not executed.

### D8 — Documentation, evidence, risk, and follow-on boundary

List the minimal accepted documents that implementation would amend only after approval.

Implementation must later create:

- an implementation prompt record under `specs/ai/prompts/`;
- a completion report under `specs/implementation/reports/`;
- one independent read-only implementation review because this is a high-risk schema/reward task.

Define Slice 6B as a separate future frontend Slice. Specify what 6A guarantees to 6B and what remains intentionally unavailable.

## Explicit exclusions

Keep all of the following out of Slice 6A:

- frontend achievement components or Passport changes;
- achievement unlock animation, toast, modal, or sound;
- streaks;
- category-specific achievements;
- level/rank achievements unless explicitly chosen instead of the recommended completion milestones;
- community achievements;
- Community Challenge entities or behavior;
- leaderboard;
- Share Card;
- SignalR;
- theme switching;
- Zustand changes;
- Docker or deployment;
- account lifecycle or authentication redesign;
- evidence claims, Admin completion review, or self-reporting;
- Admin achievement CRUD;
- user-authored achievements;
- a generic expression/rules engine;
- dependency additions;
- unrelated refactors.

Do not claim any excluded feature as partially implemented.

## Required output

Create:

`specs/implementation/06a-simple-achievements-backend.md`

Its first line must be exactly:

`Status: Proposed — pending human decisions and independent Codex design review`

Include these sections:

1. Status and planning boundary
2. Executive summary
3. Verified merged baseline with file-level evidence
4. Goals
5. Non-goals
6. D1–D8 decision table
7. Exact proposed achievement catalog and criteria
8. Eligibility, ordering, and award-time semantics
9. Proposed staged schema and migration
10. Historical backfill design
11. Atomicity, idempotency, locking, and concurrency
12. Backend architecture and integration with both XP paths
13. Exact API contracts and DTOs
14. Authorization, privacy, readiness, logging, and errors
15. Detailed test matrix and verification commands
16. Proposed file map
17. Slice 6B handoff contract
18. Documentation and evidence changes after approval
19. Risks, alternatives, unknowns, and stop conditions
20. Human approval checklist

Also create:

`specs/ai/prompts/48-slice-6a-simple-achievements-backend-first-plan.md`

Record this actual prompt verbatim. Add only truthful execution facts after the verbatim prompt; do not invent results.

Do not modify:

- `PROJECT_STATUS.md`;
- accepted product, architecture, API, ADR, security, UX, or testing specifications;
- production source;
- tests;
- migrations;
- configuration;
- dependency manifests or lockfiles.

## Validation and stopping rule

Allowed validation:

- branch, HEAD, and working-tree inspection;
- read-only source and specification inspection;
- `git diff --check`;
- inventory and review of the two created planning files.

Do not run implementation test suites unless required to resolve a concrete disputed baseline fact.

Do not stage, commit, push, merge, open a pull request, create a migration, or implement code.

Stop and return to the human if:

- the branch or expected baseline is wrong;
- an unrelated working-tree modification exists;
- the plan cannot preserve the accepted XP atomicity or idempotency guarantees;
- the design requires Community Challenge implementation;
- a dependency or broader architecture change appears necessary;
- a safe historical backfill cannot be specified;
- the Slice cannot fit the normal bounded task size without splitting.

When complete, report:

- files created;
- exact reviewed branch and HEAD;
- confirmation that the existing `PROJECT_STATUS.md` change was preserved;
- verified baseline and any corrections;
- recommended D1–D8 decisions;
- all schema and product decisions requiring human approval;
- risks and unresolved questions;
- validation actually performed;
- confirmation that no implementation or Git mutation was performed.

Wait for one independent Codex design review and explicit human approval before implementation.

---

## Execution facts (recorded truthfully after the verbatim prompt)

- Reviewed branch: `feat/slice-6a-simple-achievements-backend`.
- Reviewed HEAD: `2706e0cd968a3b254910552df34f288c0013b21f` ("Merge pull
  request #13 from Zephyr724/05b-passport-lite"), matching the expected
  baseline `2706e0c`. Slice 5A (`7eea4fe`, PR #12) and Slice 5B (`2706e0c`,
  PR #13) are merged ancestors of HEAD.
- Working tree at inspection: exactly one modification,
  `PROJECT_STATUS.md` — the expected human-authorized status update. It was
  preserved unchanged (never written by this task). No unrelated
  modification existed; no stop condition triggered.
- Files read directly by the planning session (12): `AGENTS.md` (rendered
  project instructions), `PROJECT_STATUS.md`, `specs/00-project-profile.md`,
  `specs/product/04-phase-2-delivery-scope.md`,
  `specs/product/01-product-requirements.md`,
  `specs/architecture/02-core-domain-data-model.md`,
  `specs/architecture/03-api-contract.md`,
  `specs/implementation/05a-xp-ledger-and-progression-core.md` (first 1000
  lines),
  `specs/implementation/05b-passport-lite.md` (first 1000 lines),
  `specs/implementation/reports/05a-xp-ledger-and-progression-core-completion.md`,
  `specs/implementation/reports/05b-passport-lite-completion.md`,
  `specs/ai/reviews/39-slice-5b-codex-independent-implementation-review.md`,
  plus `specs/ai/03-deadline-execution-mode.md` for the evidence limits.
  Backend source inspection (XP award paths, configurations, migrations,
  controllers, services, test patterns, zero-match Achievement/
  CommunityChallenge search across `backend/`, and the zero-match
  achievement search across `frontend/src`) was performed read-only; the
  concrete findings are cited in plan §3.
- Files created (2):
  - `specs/implementation/06a-simple-achievements-backend.md`
  - `specs/ai/prompts/48-slice-6a-simple-achievements-backend-first-plan.md`
    (this file)
- No production source, test, migration, configuration, dependency
  manifest/lockfile, or accepted specification was modified. No branch was
  created or switched. Nothing was staged, committed, pushed, merged, or
  opened as a pull request.
- Validation actually performed: branch/HEAD/working-tree inspection
  (`git branch --show-current`, `git log`, `git status --porcelain`),
  read-only source and specification inspection as listed above, `git diff
  --check` on the working tree, and inventory/review of the two created
  planning files. No build, test suite, or migration command was run — no
  disputed baseline fact required one.
- The three deterministic catalog GUIDs proposed in plan §7 were freshly
  generated with `uuidgen` during this planning session; they are
  recommendations pending human approval, not accepted values.
- No implementation, schema, or Git mutation was performed.

---

## Correction pass record (Review 40, 2026-07-26)

After the first plan was completed, the human transmitted the independent
Codex design review and instructed the planning owner (this session) to
perform the single concentrated correction pass without pausing for human
decisions. The verbatim prompt above is unchanged; the facts below record
only what actually happened in the correction pass.

- Review recorded as `specs/ai/reviews/40-slice-6a-codex-independent-design-review.md`:
  verdict `CHANGES REQUIRED`; Blockers 0; Majors 5 (M1 trigger semantics,
  M2 `UserAchievement` 23505 handling, M3 fail-open catalog, M4 lock-order
  proof, M5 oversized implementation contract); Minors 1 (workflow order).
  The review content was produced by the independent Codex session and
  transmitted by the human; the planning owner recorded it in substance.
- Baseline re-verified before editing: branch
  `feat/slice-6a-simple-achievements-backend`, HEAD
  `2706e0cd968a3b254910552df34f288c0013b21f`, working tree containing only
  the pre-existing `PROJECT_STATUS.md` modification plus this task's
  untracked planning files.
- Files modified in the correction pass (2):
  - `specs/implementation/06a-simple-achievements-backend.md` — corrected in
    place: M1 snapshot-trigger semantics and award immutability (§2, §6 D2,
    §8, §10, §15, §19); M2 post-lock re-read idempotency protocol with
    `23505` as rollback-and-retry backstop, distinguished from
    `UX_XpTransactions_SourceCompletionId` (§6 D4, §10, §11, §15);
    M3 concurrency-safe seed, deterministic display-field upsert, and
    fail-closed startup validation replacing the empty-catalog fail-open
    behavior and the R5 warning-only mitigation (§6 D2/D3, §8, §9, §14,
    §15, §19); M4 actual per-path lock-order documentation and analysis
    replacing the identical-order claim (§6 D4, §11, §15); M5 umbrella plan
    restructured into sequential tasks 6A-1 (Achievement Award Core) and
    6A-2 (Achievement Read API) with full task contracts and file maps
    (§2, §6 D6/D7/D8, §15, §16, §18, §19, §20); Minor workflow order
    corrected (§20). One internal test-count typo in §16 was fixed
    immediately after the rewrite.
  - `specs/ai/prompts/48-slice-6a-simple-achievements-backend-first-plan.md`
    — this appended record only; the verbatim prompt is untouched.
- File created in the correction pass (1):
  - `specs/ai/reviews/40-slice-6a-codex-independent-design-review.md`.
- Directions explicitly not reopened were preserved: three milestones at
  1/3/5; `XpTransaction`-only eligibility; `SourceCommunityChallengeId`
  omitted until Community Challenge; no streak/leaderboard/Community
  Challenge/frontend/rules-engine/dependency/Docker/authentication
  expansion; public catalog and self-only earned API (now 6A-2); no API
  exposure of `xpTransactionId`.
- All decisions remain marked `REQUIRES HUMAN APPROVAL`; per the corrected
  workflow, one unified human approval of the corrected rules and schema
  follows the targeted closure check. No approval was requested or granted
  during this pass.
- `PROJECT_STATUS.md` was preserved unchanged (never written).
- Validation performed in the correction pass: read-only baseline
  re-inspection, `git diff --check` (clean), and whitespace checks of the
  created/modified planning files. No build, test suite, or migration
  command was run.
- No production source, test, migration, configuration, dependency, or
  accepted specification was modified. Nothing was staged, committed,
  pushed, merged, or opened as a pull request.
- Next action per the review: targeted Codex closure check limited to the
  original M1–M5.
