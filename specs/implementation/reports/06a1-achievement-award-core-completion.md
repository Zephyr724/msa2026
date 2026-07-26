# Slice 6A-1 — Achievement Award Core Completion Report

- **Date:** 2026-07-26
- **Slice:** 6A-1 — Achievement Award Core
- **Initial implementation owner:** Kimi K3 (sole owner under the original Prompt 49)
- **Concentrated correction owner:** Codex (explicit human-directed role switch after Review 41)
- **Implementation prompt record:** `specs/ai/prompts/49-slice-6a1-achievement-award-core-implementation.md` (original prompt plus the actual human correction instruction and bounded execution context)
- **Approved plan:** `specs/implementation/06a-simple-achievements-backend.md` (Review-40-corrected; D1–D8 human-approved 2026-07-26)
- **Branch:** `feat/slice-6a-simple-achievements-backend`
- **Baseline HEAD at implementation start:** `2706e0cd968a3b254910552df34f288c0013b21f` (Slice 5B merge; Slice 5A `7eea4fe` and 5B are merged ancestors)
- **Branch advance during implementation:** the human committed the five
  planning/evidence files (`PROJECT_STATUS.md`, Prompt 48, Prompt 49,
  Review 40, the 6A plan) as `b3502603be633c56d4f1ab0a0fa699602b4d79dc`
  (2026-07-26 14:21 +0800). No implementation file of this task was
  included in that commit; all implementation work below remains
  uncommitted on top of `b350260`.
- **Independent implementation review status:** Review 41 found 0 Blockers,
  1 Major, and 0 Minors (`CHANGES REQUIRED`). Codex implemented the single
  concentrated M1 correction after the human explicitly switched roles;
  Kimi K3 targeted closure review of original M1 is PENDING.

## Implementation status

Implementation of the approved Slice 6A-1 contract and the Review 41 M1
concentrated correction is complete: catalog
persistence and fail-closed seeding/validation, pure milestone rules, the
additive migration, atomic award integration on both XP-creation paths, and
the bounded historical backfill — with the full unit and PostgreSQL
integration test matrix executed and observed (below). Nothing was staged,
committed, pushed, merged, deployed, or added to a pull request. Slice 6A-2
(HTTP read APIs) remains entirely unimplemented: no controller, DTO,
contract, read service, read repository, or OpenAPI operation was created
(verified by source search — no achievement HTTP artifact exists).

## Approved scope delivered

- **Catalog and rules:** exactly three cumulative verified-rewarded-completion
  milestones at thresholds 1, 3, 5 (`AchievementCatalog.cs`: definitions +
  pure evaluator, one file as approved). Eligibility derives only from
  committed `XpTransaction` rows; no criteria columns, no rules engine.
- **Schema (approved staged form):** `Achievements` and `UserAchievements`
  per the approved plan §9. `SourceCommunityChallengeId` is deliberately
  omitted (Deferred Community Challenge); the accepted partial unique index
  is staged as plain unique `UX_UserAchievements_UserId_AchievementId`.
- **Trigger and award semantics (Review 40 M1):** eligibility from the
  committed XP count; trigger resolved at award-creation time from the
  transactionally stable snapshot visible under the held profile lock
  (committed rows + the staged row on the live path), ordered
  `(CreatedAt, Id)`; `XpTransactionId` and `AwardedAt = trigger.CreatedAt`
  persisted immutably; later backdated or equal-timestamp rows never rewrite
  an existing award (integration-observed); every eligible-but-missing
  active milestone is awarded in threshold order (catch-up).
- **Atomicity and idempotency (Review 40 M2/M4):** live redemption commits
  completion + XP + progression + achievements in the existing single
  `SaveChangesAsync()`; reconciliation stages achievements in its per-row
  transaction's second flush; backfill uses per-user transactions. Every
  path acquires the profile `FOR UPDATE` lock first, re-reads existing
  awards after the lock, and stages only missing awards. An unexpected
  `UserAchievement` `23505` rolls back the entire enclosing transaction
  (observed on all three paths with a forced-conflict trigger) and is never
  reported as awarded; the affected operation retries through its existing
  semantics (redemption request retry; later reconciliation/backfill pass).
  The benign `UX_XpTransactions_SourceCompletionId` reconciliation handling
  is unchanged. The approved lock sequences are preserved; the two 5A write
  paths received only the directly necessary hook insertions.
- **Catalog seed and validation (Review 40 M3):** every-environment
  `AchievementSeed.SeedAndValidateAsync` runs before `app.Run()` (and before
  any hosted pass): dedicated advisory lock `727414900000006001L`
  serializes seeding across instances; deterministic upsert of `Name`,
  `Description`, `IconUrl` only; `IsActive` never reactivated; `Id`/`Code`/
  `Category`/thresholds immutable; complete one-to-one rule/catalog
  validation fails startup for missing/partial catalog, conflicting
  identity, duplicate code/ID, invalid category, or rule/catalog mismatch.
  No fail-open path exists.
- **Historical backfill:** `AchievementBackfillRunner` (Infrastructure
  singleton) + thin `AchievementBackfillHostedService` (Api), validated
  `AchievementBackfillOptions` (`Enabled` default true, `BatchSize` 100,
  `InitialDelay` 15s, `IdleInterval` 24h, `MaxConsecutiveRowFailures` 10,
  `ValidateOnStart()`), dedicated advisory lock `727414900000006002L`,
  bounded candidate batches, at most one attempt per user per pass,
  per-user transaction with profile lock and post-lock re-read,
  consecutive-failure circuit breaker, next-pass healing, strict no-op when
  nothing is missing, bounded logging (counts and exception types at
  Information and above; user IDs at Debug only — proven by a
  capturing-logger test). After Review 41 M1, PostgreSQL applies the
  eligible-and-missing predicate for each active milestone before the
  distinct `UserId` order and batch limit; fully awarded users no longer
  enter `ScannedUserIds` or the pass-scoped attempted set.

## Migration

- `20260726063609_AddSimpleAchievements`, generated with the project EF
  tooling (`dotnet ef migrations add`, local tool manifest version 10.0.10).
  No hand edits to the migration or Designer file; no data backfill;
  `Down()` drops both tables.
- Observed on real PostgreSQL (`postgres:17-alpine`, Testcontainers,
  isolated databases):
  - clean-schema migration creates the exact approved shape (8 `Achievements`
    columns incl. `IsActive` default `true`, 5 `UserAchievements` columns
    with no `SourceCommunityChallengeId`, `UX_Achievements_Code`,
    `UX_UserAchievements_UserId_AchievementId`,
    `IX_UserAchievements_AchievementId`,
    `IX_UserAchievements_XpTransactionId`, all three FKs observed as
    `RESTRICT` delete rules);
  - upgrade from `20260725144430_AddXpLedgerAndProgression` on a database
    holding a 5B-era awarded graph adds both tables and leaves existing
    rows byte-identical, with zero catalog/award rows created by the
    migration itself;
  - `Down()` drops both tables while the pre-existing ledger graph
    (completion + XP row) remains.

## Verification commands and observed results

Run from `backend/` on 2026-07-26:

- `dotnet build Kiwimpact.slnx` — Build succeeded, 0 warnings, 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — Passed: 216, Failed: 0, Skipped: 0 (38 new 6A-1 cases across
  `AchievementCatalogTests`, `AchievementAwardEvaluatorTests`, and
  `UserAchievementDomainTests`).
- Targeted during implementation:
  `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --filter "FullyQualifiedName~Achievement"`
  — Passed: 38;
  `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build --filter "FullyQualifiedName~Achievement"`
  — Passed: 33, Failed: 0.
- Targeted during the Review 41 M1 concentrated correction:
  `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --filter FullyAwardedUsers --no-restore`
  — Passed: 1, Failed: 0;
  `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build --filter FullyQualifiedName~AchievementBackfillTests`
  — Passed: 10, Failed: 0.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — Passed: 247, Failed: 0, Skipped: 0 (34 new 6A-1 cases:
  `AchievementMigrationUpgradeTests` 3, `AchievementPersistenceTests` 12,
  `AchievementAwardPathTests` 6, `AchievementBackfillTests` 9,
  `AchievementConcurrencyTests` 3, plus 1 Review 41 M1 candidate-query
  regression case in `AchievementBackfillTests`; the full pre-existing suite — auth,
  quests, participation, completion codes, XP ledger, reconciliation,
  concurrency, progression, Passport — re-ran green).

Diff hygiene (repository root):

- `git diff --check HEAD` — exit 0, no findings.
- Every untracked text file checked with
  `git diff --no-index --check /dev/null <file>` — no whitespace findings.

No frontend gates were run: there are no frontend changes (verified — no
frontend file was modified).

## Behavior evidence actually observed

- **Live milestones:** five sequential redemptions (increasing real-time
  timestamps inside the code validity window) produced exactly 1/1/2/2/3
  award rows after each step; triggers are the 1st/3rd/5th snapshot rows
  with `AwardedAt = trigger.CreatedAt` (microsecond tolerance).
- **Atomicity/rollback:** a rejecting XP-insert trigger rolled back
  completion + XP + progression + achievements together (zero rows of all
  four kinds; profile totals unchanged).
- **Forced-conflict (M2) on all three paths:** a
  `pg_trigger_depth`-guarded trigger forcing `23505` on
  `UX_UserAchievements_UserId_AchievementId` rolled back (a) the entire
  redemption (no completion/XP/progression/award; a clean retry then
  succeeded), (b) the reconciliation per-row transaction (row counted
  failed, no XP row, healed next pass), and (c) the backfill user
  transaction (user counted failed, healed next pass).
- **Backdated reconciliation (M1):** a live award created first, then a
  backdated completion reconciled — the existing award's
  `XpTransactionId`/`AwardedAt` were unchanged (immutable), and no new
  milestone was awarded at count 2.
- **Backfill matrix:** users seeded pre-6A-style at 0/1/2/3/4/6 XP rows
  received exactly 0/1/1/2/2/3 awards in one pass; triggers for the 6-row
  user are the 1st/3rd/5th rows by `(CreatedAt, Id)`; a repeated pass is a
  strict no-op; externally held advisory lock skips; circuit breaker aborts
  at 2 consecutive failures with the third user never attempted; a user
  with XP but no profile is counted failed and never awarded; a
  reward-pending completion (no XP row) earns nothing.
- **Backfill candidate filtering (Review 41 M1):** three fully awarded users
  with deterministic IDs (more than the configured batch size of two) were
  ordered before a genuinely eligible-missing user. Direct candidate
  discovery returned only the missing user in both `ScannedUserIds` and
  `EligibleUserIds`, proving the missing-award predicate executes before
  ordering and limiting rather than filtering complete users in memory.
- **Equal timestamps:** two ledger rows with identical `CreatedAt` are
  tie-broken by `Id` (unit and integration observed).
- **Concurrency (no timing sleeps):** two concurrent same-user redemptions
  serialize on the profile lock and attach milestone 1 exactly once with the
  snapshot-first trigger; live redemption vs backfill serialize on the
  profile lock and milestones 1 and 3 are awarded exactly once each
  regardless of lock winner; two lock-free backfill workers award the same
  user exactly once (winner awarded, loser already-awarded via the
  post-lock re-read — never via 23505 control flow); the full 5A
  deadlock/overlap suite re-ran green.
- **Seed/validation:** exact three-row catalog content; repetition strict
  no-op; concurrent seed across two contexts yields one catalog; partial
  catalog completed; conflicting ID/code identity, invalid category, and
  unexpected extra row each fail validation; display-field drift is restored
  while `IsActive = false` is preserved.

## Files changed

Production (new, 11 hand-maintained + 2 tooling-generated):

- `backend/src/Kiwimpact.Core/Entities/Achievement.cs`
- `backend/src/Kiwimpact.Core/Entities/UserAchievement.cs`
- `backend/src/Kiwimpact.Core/Achievements/AchievementCatalog.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/AchievementConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserAchievementConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/AchievementSeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Achievements/AchievementAwardService.cs`
- `backend/src/Kiwimpact.Infrastructure/Reconciliation/AchievementBackfillOptions.cs`
- `backend/src/Kiwimpact.Infrastructure/Reconciliation/AchievementBackfillRunner.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260726063609_AddSimpleAchievements.cs` (+ `.Designer.cs`, tooling-generated)
- `backend/src/Kiwimpact.Api/Reconciliation/AchievementBackfillHostedService.cs`

Production (modified, 6):

- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs` (two DbSets)
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs` (award hook + constructor)
- `backend/src/Kiwimpact.Infrastructure/Repositories/XpLedgerRepository.cs` (award hook + constructor)
- `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs` (award service scoped, backfill runner singleton)
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs` (tooling-generated)
- `backend/src/Kiwimpact.Api/Program.cs` (backfill options + hosted wrapper, every-environment achievement seed/validation block)

Tests (new, 8):

- `backend/tests/Kiwimpact.UnitTests/Core/AchievementCatalogTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/AchievementAwardEvaluatorTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/UserAchievementDomainTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementMigrationUpgradeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementPersistenceTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementAwardPathTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementBackfillTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementConcurrencyTests.cs`

Tests (modified, 7):

- `backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs` (`AchievementBackfill:Enabled=false`)
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpLedgerTestHelpers.cs` (additive helpers: repository factories, `SeedLegacyAwardedCompletionAsync`)
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpLedgerPersistenceTests.cs` (constructor call-site updates only)
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpReconciliationTests.cs` (constructor call-site updates + `AchievementAwardService` DI registration)
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpConcurrencyTests.cs` (constructor call-site updates + `AchievementAwardService` DI registration)
- `backend/tests/Kiwimpact.IntegrationTests/Api/ProgressionApiTests.cs` (constructor call-site update only)
- `backend/tests/Kiwimpact.IntegrationTests/Api/PassportApiTests.cs` (constructor call-site update only)

Accepted documents amended (approved 6A-1 set only):

- `specs/architecture/02-core-domain-data-model.md` (§3.11 implemented
  three-row catalog; §3.12 staged `SourceCommunityChallengeId` omission and
  staged unique index; §9 deferred bullet narrowed to richer content)

## Adjustments relative to the approved 6A-1 file map

All inside the approved boundary, recorded per Prompt 49:

1. **Test constructor call sites (7 modified test files).** The approved
   constructor injection of `AchievementAwardService` into both 5A
   repositories required mechanical call-site updates in pre-existing tests
   (`new XpLedgerRepository(db)` / `new QuestCompletionRepository(db,
   protector)` → new parameter) and `AchievementAwardService` DI
   registrations in the two test-local service providers
   (`XpReconciliationTests`, `XpConcurrencyTests`). No pre-existing test
   logic, assertion, or behavior was changed. The approved file map
   anticipated `XpLedgerTestHelpers` and `CustomWebApplicationFactory`; the
   five further files are the direct compile consequence of the approved
   hook design.
2. **Deterministic redemption timestamps in tests.** Live-redemption tests
   pass increasing real-time `now` values (the Completion Code validity
   window is seeded around real now); ordering remains deterministic
   because each step's timestamp is strictly increasing.
3. **Forced-conflict trigger uses `pg_trigger_depth() = 1`.** The
   M2-forcing trigger inserts a conflicting row inside the statement; the
   depth guard prevents recursive self-firing (an unguarded version errors
   with `54001` instead of producing the required `23505`). Test-only
   artifact.
4. **Seed upsert reloads before update.** `AchievementSeed` reads the
   committed row `AsNoTracking` and reloads the tracked instance before
   applying display-field upserts, so a stale tracked instance cannot mask
   drift and suppress the UPDATE (caught by the seed tests).
5. **Review 41 M1 concentrated correction.** Candidate discovery now builds
   one PostgreSQL-translatable threshold-and-missing-award query per active
   milestone, combines them with `UNION`, then excludes pass attempts,
   orders, and limits. This preserves the approved catalog-driven behavior
   without a new dependency or any transaction/lock/schema change.

## Known limitations and unrun verification

- The `503` readiness interplay, exact DTOs, and both read endpoints are
  Slice 6A-2 scope and remain unimplemented; callers cannot yet read the
  catalog or earned awards over HTTP.
- Non-Development environments do not auto-migrate; startup validation
  (correctly, by design) fails if the `Achievements` table is missing. The
  production migration/startup ordering procedure remains the pending
  project-level decision recorded as plan risk R5.
- The catalog table carries no criteria columns by design; thresholds live
  only in `AchievementCatalog`. A future catalog addition with a new rule
  kind requires its own approved plan.
- `AchievementBackfillOptions.InitialDelay` is 15s (XP reconciliation is
  10s); both hosted services are advisory-lock protected, so ordering
  between them is not correctness-relevant.
- Deployment/rollback of a real environment was not performed; migration
  behavior was observed on Testcontainers PostgreSQL only.
- CI has not been run for this change; all gates above were observed
  locally.

## Confirmation

- No frontend, 6A-2 HTTP surface, Community Challenge,
  `SourceCommunityChallengeId`, streak, leaderboard, Share Card, SignalR,
  theme, Docker/deployment, account-lifecycle, Admin achievement CRUD,
  rules-engine, dependency, or unrelated-refactor change was made.
- `Kiwimpact.Infrastructure.csproj`, `Kiwimpact.Api.csproj`, and all
  dependency manifests/lockfiles are unchanged.
- `PROJECT_STATUS.md` was not modified by this task.
- Nothing was staged, committed, pushed, merged, reverted, deployed, or
  opened as a pull request.
- Prompt 48, Review 40, and the 6A plan are preserved unchanged; Review 41
  received only a trailing-whitespace cleanup with no content change; Prompt
  49 was appended only with the actual concentrated-correction instruction
  and execution context.
- Ready for Kimi K3's targeted closure review limited to original Review 41
  M1 and its directly affected tests.
