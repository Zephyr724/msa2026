# Prompt 49 — Slice 6A-1 Achievement Award Core Implementation

- **Date:** 2026-07-26
- **Target agent:** Kimi K3
- **Task type:** High-risk backend implementation
- **Implementation authority:** Slice 6A-1 only, within the approved corrected
  plan
- **Required reviewer:** One independent read-only Codex implementation review
  after implementation evidence is complete
- **Git authority:** No stage, commit, push, pull request, merge, or deployment

## Implementation prompt given to Kimi K3 (verbatim)

> # Slice 6A-1 — Achievement Award Core Implementation
>
> You are the sole implementation owner for Kiwimpact Slice 6A-1.
>
> Implement only the approved Achievement Award Core. Do not implement Slice
> 6A-2 HTTP read APIs or any frontend work.
>
> ## Authority and required sources
>
> Read the repository-root `AGENTS.md` completely before acting.
>
> Treat these records as the implementation contract:
>
> - `specs/implementation/06a-simple-achievements-backend.md`
> - `specs/ai/prompts/48-slice-6a-simple-achievements-backend-first-plan.md`
> - `specs/ai/reviews/40-slice-6a-codex-independent-design-review.md`
> - `specs/ai/prompts/49-slice-6a1-achievement-award-core-implementation.md`
>
> Read directly affected accepted sources and current implementation:
>
> - `specs/architecture/02-core-domain-data-model.md`
> - directly relevant reward, migration, concurrency, and evidence portions of
>   `specs/implementation/05a-xp-ledger-and-progression-core.md`
> - the current `Achievement`/`UserAchievement` accepted model sections
> - the current XP transaction, completion redemption, reconciliation, profile
>   locking, DbContext, configuration, seed orchestration, migration, and
>   PostgreSQL test code touched by this task
>
> Do not recursively read unrelated historical prompts or reviews. Follow the
> evidence limits in `AGENTS.md` and
> `specs/ai/03-deadline-execution-mode.md`.
>
> ## Required baseline
>
> Before editing:
>
> 1. Confirm the branch is
>    `feat/slice-6a-simple-achievements-backend`.
> 2. Confirm HEAD is
>    `2706e0cd968a3b254910552df34f288c0013b21f`.
> 3. Confirm Slice 5A and Slice 5B are merged ancestors.
> 4. Inspect the working tree.
> 5. The existing planning/evidence changes are expected:
>    - `PROJECT_STATUS.md`
>    - `specs/implementation/06a-simple-achievements-backend.md`
>    - `specs/ai/prompts/48-slice-6a-simple-achievements-backend-first-plan.md`
>    - `specs/ai/reviews/40-slice-6a-codex-independent-design-review.md`
>    - this Prompt 49 record
> 6. Preserve those records. Stop only for another unrelated modification,
>    wrong branch, or wrong HEAD.
> 7. Record the exact baseline in the completion report.
>
> The human approved on 2026-07-26:
>
> - D1–D8 of the corrected plan;
> - the exact three-row catalog;
> - the additive `Achievements` and `UserAchievements` schema;
> - staged omission of `SourceCommunityChallengeId`;
> - sequential 6A-1 → 6A-2 delivery;
> - the recorded 6A-1 size exception.
>
> No further schema or product approval is required for the exact 6A-1
> contract. Any expansion beyond it still requires human approval.
>
> ## Goal
>
> Deliver a persistent, server-authoritative Achievement Award Core:
>
> - exactly three verified-rewarded-completion milestones at counts 1, 3, and
>   5;
> - fixed, concurrency-safely seeded catalog rows;
> - fail-closed startup catalog validation;
> - durable and idempotent `UserAchievement` awards;
> - atomic integration with live Completion Code redemption;
> - atomic integration with per-row XP reconciliation;
> - bounded historical backfill for users who already have XP transactions;
> - real PostgreSQL migration, persistence, rollback, retry, and concurrency
>   coverage.
>
> ## Exact catalog
>
> Implement these approved definitions:
>
> | Id | Code | Name | Description | Category | Threshold | IconUrl |
> | --- | --- | --- | --- | --- | --- | --- |
> | `b5371794-ccd2-45fb-9a7a-f24ec2692bc2` | `verified-completions-1` | `First Steps` | `Complete your first verified eco quest.` | `Milestone` | 1 | null |
> | `ed2faa73-1947-4b4b-826a-af7384d4ed10` | `verified-completions-3` | `Building Momentum` | `Reach three verified quest completions.` | `Milestone` | 3 | null |
> | `23cb1a76-1cfb-4b53-b71b-cfee48c3f57b` | `verified-completions-5` | `Committed Contributor` | `Reach five verified quest completions.` | `Milestone` | 5 | null |
>
> Eligibility comes only from `XpTransaction` rows. Do not introduce
> criteria columns or a generic rules engine.
>
> ## Approved schema
>
> Add one generated additive migration after
> `20260725144430_AddXpLedgerAndProgression`.
>
> ### `Achievements`
>
> - `Id uuid` primary key
> - `Code text`, required, max 100, unique
> - `Name text`, required, max 200
> - `Description text`, required, max 500
> - `IconUrl text`, nullable, max 2000
> - `Category text`, required, max 50
> - `IsActive bool`, required, default true
> - `CreatedAt timestamp with time zone`, required
>
> ### `UserAchievements`
>
> - `Id uuid` primary key
> - `UserId uuid`, required, Restrict FK to `AspNetUsers`
> - `AchievementId uuid`, required, Restrict FK to `Achievements`
> - `AwardedAt timestamp with time zone`, required
> - `XpTransactionId uuid`, nullable in the schema, Restrict FK to
>   `XpTransactions`; every 6A-1 award sets it non-null
> - unique `(UserId, AchievementId)` named
>   `UX_UserAchievements_UserId_AchievementId`
> - explicit FK lookup indexes because `ForeignKeyIndexConvention` is removed
>
> Deliberately omit `SourceCommunityChallengeId`. Do not create
> `CommunityChallenge` or its FK/indexes.
>
> Generate the migration through the repository's EF tooling. Do not hand-edit
> the generated migration or Designer file.
>
> ## Trigger and award semantics
>
> Preserve the corrected Review 40 M1 semantics:
>
> - acquire/hold the user's profile lock before achievement evaluation;
> - build the transactionally stable ledger snapshot visible to that award
>   transaction;
> - live redemption snapshot = committed XP rows plus the staged new XP row;
> - XP reconciliation snapshot = committed XP rows including its already
>   flushed new row;
> - backfill snapshot = committed XP rows;
> - order the snapshot by `(CreatedAt ASC, Id ASC)`;
> - threshold N uses the Nth row as its trigger;
> - persist `XpTransactionId` and
>   `AwardedAt = trigger.CreatedAt`;
> - never rewrite an existing award when a later backdated or equal-timestamp
>   XP row appears;
> - award every active eligible-but-missing milestone in threshold order.
>
> Do not claim identical results for different ledger snapshots.
>
> ## Atomicity and idempotency
>
> Preserve the corrected Review 40 M2/M4 contract.
>
> On every award path:
>
> 1. acquire the profile `FOR UPDATE` lock;
> 2. re-read existing awards after acquiring the lock;
> 3. stage only missing awards;
> 4. use the unique index as an invariant backstop, not normal control flow.
>
> An unexpected `UserAchievement` `23505` aborts and rolls back the entire
> enclosing transaction:
>
> - live redemption: completion, XP, profile progression, and achievements all
>   roll back; the request fails and a clean request retry may succeed;
> - XP reconciliation: the per-row XP transaction rolls back, the row is
>   counted failed, and a later pass retries it;
> - achievement backfill: the current user transaction rolls back, the user is
>   counted failed, and a later pass retries it.
>
> Never report an aborted transaction as awarded or already awarded.
>
> Keep the existing accepted benign handling for
> `UX_XpTransactions_SourceCompletionId` in XP reconciliation distinct and
> unchanged.
>
> Preserve the actual lock sequences:
>
> - live: Quest lock → profile lock → single completion/XP/progression/
>   achievement flush;
> - XP reconciliation: XP flush/FK locks → profile lock → progression and
>   achievement flush;
> - backfill: profile lock → achievement flush.
>
> Do not restructure the two reviewed 5A write paths beyond the directly
> necessary achievement hooks.
>
> ## Catalog seed and validation
>
> Implement an every-environment, concurrency-safe seed and validation phase
> before `app.Run()` and before any hosted service can execute:
>
> - serialize seed work across app instances with a dedicated advisory-lock key
>   distinct from XP reconciliation and achievement backfill;
> - insert missing approved rows;
> - deterministically update only `Name`, `Description`, and `IconUrl` for a
>   matching stable identity;
> - do not automatically reactivate `IsActive`;
> - never mutate `Id`, `Code`, `Category`, or rule threshold;
> - after seeding, validate the complete one-to-one rule/catalog mapping;
> - fail startup for missing/partial catalog, conflicting identity, duplicate
>   code/ID, invalid category, or rule/catalog mismatch;
> - never treat an empty catalog as ready or as a reason to skip awards.
>
> Ensure lock release and connection disposal on success, cancellation, and
> failure.
>
> ## Historical backfill
>
> Implement the bounded runner/options/thin hosted-wrapper design in the
> approved plan:
>
> - enabled by validated configuration;
> - dedicated advisory lock distinct from the seed and XP keys;
> - bounded candidate batches of users with eligible missing milestones;
> - at most one attempt per user per pass;
> - per-user transaction and profile lock;
> - post-lock existing-award re-read;
> - locked-snapshot trigger evaluation;
> - full rollback and failed count on unexpected UserAchievement `23505`;
> - bounded consecutive-failure circuit breaker;
> - safe next-pass healing;
> - strict no-op when nothing is missing;
> - counts and exception types only at Information and above; user IDs only at
>   Debug; no sensitive profile or XP details.
>
> Do not introduce Hangfire, another dependency, another public mutation
> endpoint, or an unbounded retry loop.
>
> ## Approved production boundary
>
> Follow the 6A-1 file map in plan §16. Consolidate definitions, milestone
> rules, and the pure evaluator in
> `Kiwimpact.Core/Achievements/AchievementCatalog.cs` as approved.
>
> Directly necessary deviations inside the approved 6A-1 boundary must be
> recorded in the completion report. Stop rather than expanding into 6A-2 or
> another product/architecture decision.
>
> Amend only this accepted specification during 6A-1:
>
> - `specs/architecture/02-core-domain-data-model.md`
>
> Record the implemented three-row catalog and the staged
> `SourceCommunityChallengeId` omission truthfully. Do not amend the API
> contract in 6A-1.
>
> ## Required tests
>
> Implement the plan §15 6A-1 matrix, including:
>
> - exact catalog definitions and rule validation;
> - evaluator counts 0–6, catch-up, equal timestamps, and stable ordering;
> - immutable existing award after later backdated reconciliation;
> - entity factory validation;
> - clean migration and upgrade from the 5B migration;
> - exact columns, named indexes, explicit Restrict FKs, and no unexpected
>   concurrency tokens;
> - seed repetition and concurrent seed;
> - partial catalog completion;
> - conflicting ID/code/category and rule mismatch startup failure;
> - first, third, and fifth live milestone awards;
> - single-transaction live atomicity and rollback;
> - XP reconciliation integration and retry;
> - historical backfill at 0, 1, 2, 3, 4, and 5+ transactions;
> - repeated backfill no-op, advisory-lock skip, bounded failure, and healing;
> - forced UserAchievement conflict rollback and later retry on all three
>   paths;
> - same-user concurrent live awards;
> - live award versus backfill serialization;
> - retained 5A mixed-flow deadlock/overlap coverage;
> - one focused real-PostgreSQL overlap test using externally held locks and
>   `pg_stat_activity`, never timing sleeps.
>
> Use real PostgreSQL for migration, constraint, lock, concurrency, and
> transaction behavior. Do not substitute SQLite.
>
> Run targeted filters during implementation. After implementation is complete,
> run the applicable full gates once from `backend/`:
>
> ```bash
> dotnet build Kiwimpact.slnx
> dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
> dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
> ```
>
> Do not run frontend gates because 6A-1 must not change frontend files.
> Never claim a result that was not executed and observed.
>
> ## Evidence and review
>
> Preserve this file as the actual implementation prompt record.
>
> Create after final verification succeeds:
>
> `specs/implementation/reports/06a1-achievement-award-core-completion.md`
>
> It must record observed facts only:
>
> - implemented scope;
> - exact files changed;
> - migration name and observed upgrade behavior;
> - targeted and full commands with observed results;
> - atomicity, backfill, seed-validation, and concurrency evidence actually
>   observed;
> - known limitations;
> - confirmation that 6A-2 remains unimplemented;
> - review status.
>
> Do not request independent implementation review until production
> implementation, tests, applicable full gates, Prompt 49, the accepted
> data-model amendment, and the completion report are complete.
>
> After evidence is complete, stop and return the implementation for the one
> independent read-only Codex review required by `AGENTS.md`. Do not perform
> your own independent review.
>
> ## Explicit exclusions
>
> Do not implement:
>
> - either achievement HTTP endpoint;
> - achievement DTOs/controllers/OpenAPI operations;
> - frontend achievement UI or query code;
> - progress-toward-next-achievement API data;
> - streaks, category/level/community achievements, Community Challenge,
>   leaderboard, Share Card, SignalR, theme work, Docker, deployment, or
>   account-lifecycle work;
> - `SourceCommunityChallengeId`;
> - Admin achievement CRUD;
> - a general-purpose rules engine;
> - a new dependency;
> - unrelated refactors.
>
> ## Stop conditions
>
> Stop and return to the human before expanding if:
>
> - the branch/HEAD or expected working-tree boundary is wrong;
> - implementation requires an unapproved schema or accepted-document change;
> - the 5A atomicity or lock-order invariant cannot be preserved;
> - Community Challenge or a dependency appears necessary;
> - the safe backfill cannot fit the approved 6A-1 boundary;
> - an HTTP/frontend requirement appears;
> - unrelated user changes overlap the approved files.
>
> ## Git and final return
>
> Do not stage, commit, push, merge, open or update a pull request, deploy, or
> perform a destructive Git operation.
>
> When implementation and evidence are complete, report:
>
> - exact files changed;
> - migration created;
> - implemented behavior;
> - targeted and full verification with observed results;
> - known limitations and stop-condition decisions;
> - confirmation that Slice 6A-2 remains unimplemented;
> - confirmation that no prohibited Git or deployment action occurred;
> - readiness for the single independent implementation review.

## Concentrated correction prompt — 2026-07-26

Actual human instruction, verbatim:

> 换一下角色，你来写代码，k3审核，你直接修好这个问题

Execution context applied by Codex:

- Codex becomes the implementation owner for the single concentrated
  correction; Kimi K3 becomes the targeted closure reviewer.
- Fix only Review 41 M1:
  `specs/ai/reviews/41-slice-6a1-codex-independent-implementation-review.md`.
- Make PostgreSQL apply the eligible-and-missing milestone predicate before
  deterministic `UserId` ordering and `BatchSize`.
- Keep candidate IDs distinct, preserve the per-pass at-most-once rule, and
  do not change schema, migration, seed, transaction, lock, dependency, HTTP,
  or 6A-2 behavior.
- Add a real-PostgreSQL integration test proving fully awarded users are
  absent from candidate discovery, including more than one batch of fully
  awarded users ordered before a genuinely missing user.
- Run the directly affected tests and all three backend gates, update the
  completion evidence with observed results, and leave all work uncommitted
  for Kimi K3's targeted closure review.

## Post-closure CI test correction — 2026-07-26

The human supplied two GitHub Actions failures from:

`AchievementConcurrencyTests.SameUserConcurrentLiveAwardsAttachTheMilestoneExactlyOnce`

Both failures showed that the persisted award trigger differed from the
first row of the final `(CreatedAt, Id)`-ordered two-row ledger snapshot.
Codex was asked to address the CI failure before merge.

Bounded correction:

- diagnose whether production behavior or the concurrency assertion violates
  the approved locked-creation-snapshot and immutable-award semantics;
- change production code only if the implementation is wrong;
- otherwise correct only the invalid test expectation;
- repeatedly run the failing test, its directly related concurrency and
  award-path suites, and the complete backend gates;
- update the completion evidence truthfully;
- do not change schema, migration, seed, dependencies, HTTP, or 6A-2.
