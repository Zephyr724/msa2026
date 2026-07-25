# Slice 5A — XP Ledger and Progression Core Completion Report

- **Date:** 2026-07-25 (implementation), 2026-07-25 (Review 36 correction pass)
- **Status:** Backend implementation complete; Review 36 correction pass complete
- **Review status:** TARGETED CLOSURE CHECK PENDING — Review 36 (`TARGETED FIX
  REQUIRED`) Majors M1–M3 and Minors m1–m3 corrected in one concentrated
  correction pass; awaiting the Codex targeted closure check
- **Implementation prompt:** `specs/ai/prompts/45-slice-5a-xp-ledger-progression-core-implementation.md`
- **Approved plan:** `specs/implementation/05a-xp-ledger-and-progression-core.md` (D1–D7 approved by the human on 2026-07-25 after Review 35 `APPROVE`)
- **Implementation review:** `specs/ai/reviews/36-slice-5a-codex-independent-implementation-review.md`

## Implementation status

Complete per the approved plan and Prompt 45, followed by one concentrated
correction pass closing all six Review 36 findings. No staging, commit, push,
merge, pull request, deployment, or destructive operation was performed. No
frontend, authentication-architecture, Docker/deployment, dependency, or
out-of-scope product change was made.

## Review 36 correction pass

All six findings were addressed; nothing outside the six findings was changed.

- **M1 — dependency boundary: CLOSED.** The
  `Microsoft.Extensions.Hosting.Abstractions` package reference was removed
  from `Kiwimpact.Infrastructure.csproj` (the file is byte-identical to the
  pre-Slice HEAD). The reconciliation execution logic
  (`XpReconciliationRunner`, options, pass mechanics) remains in
  Infrastructure; only the thin `BackgroundService` lifecycle wrapper moved to
  the API project (`backend/src/Kiwimpact.Api/Reconciliation/XpReconciliationHostedService.cs`),
  which already has the hosting framework. Infrastructure registers the runner
  as a singleton; `Program.cs` registers the hosted wrapper. The human
  pre-approved this exact correction route.
- **M2 — canonical EF model: CLOSED.** `XpTransactions.QuestId` is now a full
  EF relationship (`HasOne<Quest>().WithMany().HasForeignKey(QuestId)`,
  Restrict). The migration, designer, and model snapshot were regenerated and
  agree: `FK_XpTransactions_Quests_QuestId` is model-generated. The approved
  three-secondary-index shape is retained through the documented supported
  mechanism — `ForeignKeyIndexConvention` is removed in
  `ConfigureConventions`, and the six FK lookup indexes the rest of the model
  relied on are re-declared explicitly with their existing database names
  (`IX_Quests_CreatedByUserId`, `IX_Quests_LocationRegionId`,
  `IX_AspNetUserRoles_RoleId`, `IX_AspNetUserLogins_UserId`,
  `IX_AspNetUserClaims_UserId`, `IX_AspNetRoleClaims_RoleId`). Proof that no
  unrelated index changed: the regenerated migration contains only the
  approved additive operations (verified by inspection: no Drop/Create
  outside `XpTransactions` and the two `UserProfiles` columns/checks), and
  the snapshot diff versus HEAD adds only the 5A model plus identical explicit
  names for those six indexes. A new persistence test asserts the runtime EF
  model contains the restrictive Quest relationship and no QuestId index.
- **M3 — bounded logging: CLOSED.** No `Information`/`Warning`/`Error` event
  carries the exception object or a completion ID anymore: row failures log
  the exception type only (`{ExceptionType}`), with the completion ID in a
  separate `Debug` event; the advisory-unlock failure and pass-level error
  events are likewise bounded to the exception type. A new capturing-logger
  test proves every event above `Debug` has a null exception and contains no
  completion/user/quest/community identifiers or exception detail text, while
  completion-ID correlation remains at `Debug`.
- **m1 — options validation: CLOSED.** `XpReconciliationOptions` binding now
  validates `BatchSize > 0`, `InitialDelay >= 0`, `IdleInterval > 0`, and
  `MaxConsecutiveRowFailures > 0` with `ValidateOnStart()`. Five invalid
  startup cases are rejected with the option name in the failure; one valid
  configuration starts.
- **m2 — failure streak: CLOSED.** Every non-failure outcome (`Awarded` and
  `AlreadyAwarded`) resets `consecutiveFailures`. A deterministic test drives
  failure → already-awarded (concurrent winner committed while the first
  failing attempt slept inside its insert) → failure and observes no abort at
  threshold 2 with exact outcome counters.
- **m3 — level consistency: CLOSED.** `UserProfile.ApplyXpAward` no longer
  accepts a level argument: it computes `Level` itself from the checked new
  total via `ProgressionRules.ComputeLevel`, so an in-range but inconsistent
  level cannot be supplied by any caller. A new unit test proves one award
  can skip levels (computed, never incremented); the existing guards
  (positive amount, negative result, checked overflow) are unchanged.

## Approved scope delivered (D1–D7)

- **D1 — Persisted progression:** `UserProfiles.TotalXp` (`bigint`, not null,
  default `0`, `CK_UserProfiles_TotalXp_NonNegative`) and `UserProfiles.Level`
  (`integer`, not null, default `1`, `CK_UserProfiles_Level_Range`). The ledger
  remains the audit source of truth; the two columns are a transactional
  projection. Rank Title is derived from `Level` at read time via
  `ProgressionRules.RankTitleFor` and never persisted. No new concurrency
  token. All XP addition is `checked(TotalXp + amount)` in
  `UserProfile.ApplyXpAward` — overflow throws `OverflowException` and rolls
  back the award; `TotalXp` is never wrapped or clamped; `Level` is always
  recomputed inside the aggregate (m3).
- **D2 — Award-effective timestamp:** `XpTransaction.CreatedAt =
  SourceCompletion.VerifiedAtUtc` for future and reconciled awards (enforced by
  the `XpTransaction.CreateFromVerifiedCompletion` factory guard; a null
  `VerifiedAtUtc` is rejected and never replaced with processing time).
- **D3 — Community attribution:** `XpTransaction.CommunityRegionIdAtAward =
  SourceCompletion.CommunityRegionIdAtCompletion` always. Future redemption
  locks/materializes the caller's `UserProfiles` row `FOR UPDATE` after the
  Quest lock and reads `HomeCommunityRegionId` only from that locked row; the
  previous unlocked projection was removed. Reconciliation never reads current
  Home Community.
- **D4 — Repeatable hosted reconciliation:** thin
  `XpReconciliationHostedService` wrapper (API project) over
  `XpReconciliationRunner` (Infrastructure) with validated
  `XpReconciliationOptions` (`Enabled` default true, `BatchSize` 100,
  `InitialDelay`, `IdleInterval` 24h, `MaxConsecutiveRowFailures` 10), the
  fixed compiled `bigint` advisory-lock key
  (`XpReconciliationRunner.AdvisoryLockKey`), `pg_try_advisory_lock` on a
  dedicated `NpgsqlConnection`, explicit `pg_advisory_unlock` in `finally`
  before disposal. Pass-scoped counters and `attemptedIds`; each batch
  excludes attempted IDs (at most one attempt per row per pass); every
  non-failure outcome resets `consecutiveFailures`; the pass aborts at the
  threshold. Reward-pending accounting (no timestamp filter) and
  award-eligible processing (`VerifiedAtUtc IS NOT NULL`) are distinct query
  shapes; null-timestamp rows are never attempted, counted `unprocessable`,
  and make the pass incomplete. Per-row transactions; `23505` on
  `UX_XpTransactions_SourceCompletionId` → benign already-awarded. No public
  or admin reward-mutation endpoint; no migration data backfill.
- **D5 — Future redemption transaction:** `QuestCompletionRepository.RedeemAsync`
  extended in place: Quest `FOR UPDATE` → existing 4B rules 1–8 →
  `UserProfiles FOR UPDATE` (new `LockUserProfileAsync`; missing row →
  `InvalidOperationException` = 500) → completion + XP construction + checked
  progression update → one `SaveChangesAsync()` → one commit. One DbContext,
  one connection, one explicit transaction. The redeem request/response DTO
  and all existing client-visible error classes are unchanged. `23505`
  translation is unchanged: only `UX_QuestCompletions_UserId_QuestId_Verified`
  → AlreadyCompleted; `UX_XpTransactions_SourceCompletionId` inside redemption
  is deliberately untranslated (invariant failure → 500).
- **D6 — Current-user progression endpoint:** `GET
  /api/v1/users/me/progression`, roles Member/Organizer/Admin, identity only
  from `ClaimTypes.NameIdentifier`, no route/query/body selector. The service
  evaluates the live reward-pending anti-join (no timestamp filter, never
  cached) before reading the profile: non-zero → bounded `503` ProblemDetails
  (`https://kiwimpact.app/problems/progression-not-ready`, no
  counts/internals); zero → `200 { totalXp, level, rankTitle }` (exactly three
  keys); missing profile → `404`; anonymous → `401`.
- **D7 — Accepted-document alignment:** amended exactly the three approved
  documents: `specs/architecture/02-core-domain-data-model.md` (§3.2 new
  columns; §3.4 `Quest.XpAward` docs-only "not a reward input" note; §3.10
  completion-snapshot attribution and `CreatedAt = VerifiedAtUtc`; §7 restored
  redemption atomicity plus the bounded reconciliation exception; §8 row-lock
  serialized progression, no new token), `specs/data/01-community-identity-data-model.md`
  (§4.2 attribution wording), `specs/architecture/03-api-contract.md` (§2.2
  progression route and its 401/404/503 conditions). The historical Slice 4B
  plan was not edited; no unrelated accepted decision was modified.

## Migration and schema evidence

- One additive, schema-only migration:
  `20260725144430_AddXpLedgerAndProgression`, generated with the project EF
  tooling (`dotnet ef migrations add`, local tool manifest version 10.0.10).
  No hand edits; no data backfill; `Down()` drops `XpTransactions` and the
  two columns. Migration, designer, and model snapshot agree, including the
  model-generated `FK_XpTransactions_Quests_QuestId` (Restrict).
- **Index-convention change (M2):** `ForeignKeyIndexConvention` is removed
  (documented EF mechanism); the six pre-existing convention-created FK lookup
  indexes are declared explicitly with their existing names. Verified: the
  regenerated migration contains no operation outside the approved additive
  set; the snapshot diff adds only the 5A model and those identical explicit
  names.
- Observed on real PostgreSQL (`postgres:17-alpine`, Testcontainers):
  - clean-schema migration creates the exact table (7 columns, nullability,
    `CK_XpTransactions_XpAmount_Positive`, the four Restrict FKs observed as
    `RESTRICT` delete rules, `UX_XpTransactions_SourceCompletionId`,
    `IX_XpTransactions_UserId_CreatedAt`,
    `IX_XpTransactions_CommunityRegionIdAtAward_CreatedAt`, no `QuestId`
    index, no `xmin`);
  - upgrade from `20260725063439_AddQuestCompletionCodes` adds the table and
    backfills an existing profile row to `TotalXp = 0`, `Level = 1`;
  - `Down()` on an isolated database with a seeded award graph drops the
    table and both columns while the completion row remains (destructive to
    ledger data, as documented in plan §13).
- `UserProfiles` gains `TotalXp`/`Level` with both `CHECK`s; no concurrency
  token on either table (EF model assertions). The runtime EF model contains
  the restrictive `XpTransaction → Quest` relationship (model assertion
  test).

## XP/progression and transaction behavior implemented

- Pure Core rules (`Kiwimpact.Core/Progression/ProgressionRules.cs`): Easy 50
  / Medium 100 / Hard 150; undefined difficulty → `ArgumentException`;
  cumulative `XP(L) = 5 × (L − 1) × (L + 7)` (valid 2..99); `ComputeLevel`
  caps at 99 while totals keep accruing; eleven rank bands with `99 →
  Kiwimpact Legend`; all invalid inputs guarded.
- `XpTransaction.CreateFromVerifiedCompletion` guards: non-null completion,
  `Status = Verified`, non-null `VerifiedAtUtc`, non-empty ids, defined
  difficulty snapshot; amount from `RewardDifficultySnapshot` only; community
  from `CommunityRegionIdAtCompletion` (null stays null); `CreatedAt =
  VerifiedAtUtc`.
- `UserProfile.ApplyXpAward(amount, now)`: positive-amount guard, checked
  addition (overflow → `OverflowException`, state unchanged), negative-result
  guard, `Level` recomputed internally from the new total, sets `UpdatedAt`.
- One redemption creates completion + XP row + profile update atomically; an
  injected `BEFORE INSERT` trigger failure rolls all three back (repository
  test) and surfaces a generic 500 at the API; a second raw insert with the
  same `SourceCompletionId` fails with `23505` naming
  `UX_XpTransactions_SourceCompletionId`; multiple awards produce exact
  totals/levels; later Quest difficulty/`XpAward` mutation, profile community
  change, or Region deactivation does not alter ledger rows.

## Reconciliation and readiness behavior implemented

- Per-row transaction: XP insert flushed first (FK `KEY SHARE` acquisitions
  precede the profile lock — the mandatory lock ordering), then profile
  `FOR UPDATE`, checked progression update, one commit. `23505` on
  `UX_XpTransactions_SourceCompletionId` → benign already-awarded without
  touching the profile.
- Pass behavior proven on real PostgreSQL: exact award of seeded 4B-style
  rows (amounts, timestamps, attribution, profile totals/levels); repeated
  pass is a strict no-op (counts, totals, `UpdatedAt` unchanged); multi-batch
  until-empty loop (BatchSize 2 over 5 rows); permanent failure attempted
  exactly once per pass (sequence-counted attempts survive rollback: 1 after
  pass one, 2 after pass two) and heals on the next explicitly invoked pass;
  circuit breaker aborts after 2 consecutive failures with the third row
  never attempted; `AlreadyAwarded` resets the failure streak
  (failure → already-awarded → failure does not abort at threshold 2);
  externally held advisory lock skips the pass with zero awards, and the next
  pass succeeds; a null-`VerifiedAtUtc` Verified row (raw-SQL impossible
  state) is never attempted, is counted `unprocessable` on every pass, makes
  the pass incomplete, and holds the readiness gate closed; a
  `SelfReported`-status row is outside every reward boundary.
- Logging: counts and exception types only at `Information` and above;
  completion IDs at `Debug`; no exception object, XP values, profile,
  community, or user data (proven by the capturing-logger test).
- The readiness gate is evaluated live per request (anti-join, no cache):
  pending → `503`; fully reconciled → `200`; new pending row re-closes;
  unprocessable row holds `503`; API fixtures disable hosted execution
  (`XpReconciliation:Enabled=false`) and invoke passes directly; invalid
  reconciliation options fail startup via `ValidateOnStart()`.

## Lock-order summary (D5)

Global invariant implemented: Quest-row acquisitions always precede the
`UserProfiles FOR UPDATE`; at most one profile row per transaction;
reconciliation flushes the XP insert (FK `KEY SHARE`) before the profile
lock. Deterministic real-overlap tests (externally held `FOR UPDATE` locks +
`pg_stat_activity` blocked-session observation, never `Task.WhenAll` alone)
proved: redemption vs Home Community update uses the serialized locked value;
same-user redemptions across Quests serialize exactly; two reconcilers for
one completion award exactly once (loser: already-awarded); two reconcilers
for different completions of one user increment exactly twice; reconciliation
vs redemption never double-awards; mixed flows complete without deadlock.

## Design-review M1–M4 closure preservation

- **M1:** the unlocked community projection was removed from `RedeemAsync`;
  the community snapshot is read from the profile row locked `FOR UPDATE`,
  and the overlap test proves a Home Community change committed before the
  lock is reflected (attributed to the new region), never the stale value.
- **M2:** counters and `attemptedIds` are pass-scoped; batch queries exclude
  attempted IDs; `consecutiveFailures` resets on every non-failure outcome
  (Review 36 m2 strengthened this); bounded-attempt and circuit-breaker tests
  observed exactly-once-per-pass attempts and prompt termination.
- **M3:** the progression route enforces the live readiness gate and returns
  bounded `503 progression-not-ready` before any profile read; API tests
  observe close/reopen/re-close from database state.
- **M4:** reward-pending accounting has no timestamp filter; null-timestamp
  rows are counted unprocessable, never attempted, keep passes incomplete,
  and hold the gate closed (persistence and API tests); no real such row was
  observed.

## Verification commands and observed results

Run from `backend/` on 2026-07-25 after the correction pass:

- `dotnet build Kiwimpact.slnx` — succeeded, 0 warnings, 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — Passed: 176, Failed: 0 (74 new Slice 5A cases:
  `ProgressionRulesTests` 57, `XpTransactionDomainTests` 8,
  `UserProfileProgressionTests` 9).
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — Passed: 195, Failed: 0 (47 new Slice 5A cases:
  `XpLedgerMigrationUpgradeTests` 3, `XpLedgerPersistenceTests` 11,
  `XpReconciliationTests` 9, `XpConcurrencyTests` 6, `ProgressionApiTests`
  18; the full pre-existing 4B/auth/participation/quest suite, including
  redemption, CSRF, authorization, rate-limit, and error-mapping
  regressions, re-ran green).

Diff hygiene (repository root):

- `git diff --check HEAD` — exit 0, no findings.
- Every untracked text file checked with
  `git diff --no-index --check /dev/null <file>` — no whitespace findings.

No frontend gates were run: there are no frontend changes.

## Files changed

Production (new):

- `backend/src/Kiwimpact.Core/Entities/XpTransaction.cs`
- `backend/src/Kiwimpact.Core/Progression/ProgressionRules.cs`
- `backend/src/Kiwimpact.Core/Repositories/IXpLedgerRepository.cs`
- `backend/src/Kiwimpact.Core/Services/IProgressionService.cs`
- `backend/src/Kiwimpact.Core/Services/ProgressionModels.cs`
- `backend/src/Kiwimpact.Core/Services/ProgressionService.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/XpTransactionConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Reconciliation/XpReconciliationOptions.cs`
- `backend/src/Kiwimpact.Infrastructure/Reconciliation/XpReconciliationRunner.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/XpLedgerRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260725144430_AddXpLedgerAndProgression.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260725144430_AddXpLedgerAndProgression.Designer.cs`
- `backend/src/Kiwimpact.Api/Contracts/ProgressionContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/ProgressionController.cs`
- `backend/src/Kiwimpact.Api/Reconciliation/XpReconciliationHostedService.cs`

Production (modified):

- `backend/src/Kiwimpact.Core/Entities/UserProfile.cs` (`TotalXp`, `Level`,
  `ApplyXpAward` with checked addition and internal level recompute)
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`
  (`DbSet<XpTransaction>`, `ForeignKeyIndexConvention` removal, four explicit
  Identity FK index declarations)
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/QuestConfiguration.cs`
  (two explicit FK index declarations with existing names)
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserProfileConfiguration.cs`
  (two columns + checks)
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs`
  (profile `FOR UPDATE` lock, XP + progression in the one flush; unlocked
  community projection removed)
- `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs`
  (repository + runner registration)
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`
- `backend/src/Kiwimpact.Api/Program.cs` (validated options binding, read
  service, hosted wrapper registration)
- `backend/src/Kiwimpact.Api/Helpers/ProblemDetailsHelper.cs`
  (`ProgressionNotReady`)
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs` (`MyProgressionDto`)

Note: `Kiwimpact.Infrastructure.csproj` is byte-identical to the pre-Slice
HEAD — the correction pass removed the only package addition.

Tests (new):

- `backend/tests/Kiwimpact.UnitTests/Core/ProgressionRulesTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/XpTransactionDomainTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/UserProfileProgressionTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpLedgerMigrationUpgradeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpLedgerPersistenceTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpReconciliationTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpConcurrencyTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpLedgerTestHelpers.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/ProgressionApiTests.cs`

Tests (modified):

- `backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs`
  (`XpReconciliation:Enabled=false`)
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/QuestCompletionPersistenceTests.cs`
  (the 4B-era "no XpTransactions table" absence assertion was removed and the
  test renamed to `CompletionHasOnlyApprovedIndexes`; the approved 5A schema
  creates that table and the new XP test classes assert it positively — a
  required consequence of the approved schema, not a behavior change)

Accepted documents amended (approved D7 set only):

- `specs/architecture/02-core-domain-data-model.md`
- `specs/architecture/03-api-contract.md`
- `specs/data/01-community-identity-data-model.md`

## Adjustments relative to the plan file map

1. **`ProgressionRules` placed under `Kiwimpact.Core/Progression/`** — the
   plan explicitly allowed `Kiwimpact.Core/Services` or
   `Kiwimpact.Core/Progression`.
2. **Runner/wrapper split (Review 36 M1):** the plan's file map placed the
   hosted service in Infrastructure; the dependency-free resolution keeps the
   runner (`XpReconciliationRunner`) in Infrastructure and places only the
   thin `BackgroundService` wrapper in the API project. The human pre-approved
   this route.
3. **`XpReconciliationRunner.ReconcilePassCoreAsync`** is the pass body
   without the courtesy advisory lock; `ReconcilePassAsync` wraps it with the
   lock. The hosted loop uses only `ReconcilePassAsync`; the core method
   exists so tests can force genuine worker overlap and prove correctness
   never depends on the lock (plan §10/§14 requirement).
4. **Rank Title derivation lives in `XpLedgerRepository.FindProgressionAsync`**
   (calls pure `ProgressionRules.RankTitleFor`); the service performs the
   readiness gate and identity guards. No behavior difference.
5. **`ApplyXpAward` computes `Level` internally** (Review 36 m3) instead of
   taking a `newLevel` argument as sketched in plan §7.2; the recompute
   invariant is now structural.

## Known limitations and unrun verification

- Reward UX is not part of 5A: no reward reveal in the redeem response, no
  frontend change, no leaderboard/achievement/streak consumption of the
  ledger, no Admin ledger read surface.
- Drift repair (recompute `TotalXp`/`Level` from the ledger) is a documented
  manual procedure (plan §13), not an implemented tool.
- `Quest.XpAward` remains as a dead-but-present column (docs-only
  deprecation); organizer creation keeps writing `0`, demo seeds untouched.
- Removing `ForeignKeyIndexConvention` means future new entities will not get
  automatic FK lookup indexes; they must be declared explicitly when a query
  needs one (recorded in `KiwimpactDbContext.ConfigureConventions`).
- Frontend gates were not run (no frontend changes). Deployment/rollback of
  a real environment was not performed; migration behavior was observed on
  Testcontainers PostgreSQL only.
- No real Verified completion with null `VerifiedAtUtc` was observed; if one
  appears in a real environment it stays unrewarded and gate-blocking per the
  stop condition.

## Confirmation

- No frontend, dependency, authentication-architecture, or deployment change.
- No scope expansion: no achievements, streaks, leaderboards, Community
  Challenge, Evidence Claim/Admin review, SelfReported, SignalR, Share Card,
  Admin ledger/reconciliation endpoint, public reward mutation, reward
  reveal UI, or destructive repair of historical rows.
- Nothing was staged, committed, pushed, merged, reverted, deployed, or
  opened as a pull request.
- Independent implementation review: Review 36 verdict `TARGETED FIX
  REQUIRED`; all three Majors and three Minors corrected in one concentrated
  pass; **targeted closure check PENDING**.
