Status: Proposed — pending human decisions and independent Codex design review

# Slice 5A — XP Ledger and Progression Core

- **Date:** 2026-07-25
- **Risk:** High — reward idempotency, write concurrency, additive schema, historical reconciliation
- **Planning owner:** Kimi K3 (planning only; no implementation authority)
- **Intended implementation owner:** one implementation session per AGENTS.md routing
  (Codex default), assigned by the human after this plan is approved
- **Design reviewer:** Codex (independent read-only design review of this plan)
- **Planning prompt record:** `specs/ai/prompts/44-slice-5a-xp-progression-core-first-plan.md`

> This document is a proposal. No schema field, endpoint, background process, or
> transaction design described here is accepted until the human explicitly approves
> the reviewed plan. Intended behavior and currently implemented behavior are kept
> separate throughout: §3 records verified implementation facts; everything else is
> proposed.

## 1. Status and decision summary

First-version implementation plan for the server-authoritative XP ledger and
level/rank progression core. Every open implementation choice is surfaced as an
explicit decision (D1–D7, §5) with alternatives, a recommendation, and an approval
label. **All seven decisions require explicit human approval** before
implementation. No production code, migration, configuration, test, dependency, or
accepted specification was changed to produce this plan.

This revision (2026-07-25) applies the concentrated correction pass for the Codex
independent design review (`specs/ai/reviews/35-slice-5a-codex-independent-design-review.md`):
Major findings M1–M4 and Minor findings m1–m3 are corrected in place (§5 D1–D7,
§8–§14, §18–§19). The plan remains **Proposed** pending the Codex targeted closure
check and explicit human approval.

## 2. Goal and smallest useful vertical Slice

Deliver the smallest backend Slice in which:

1. one additive migration creates the accepted `XpTransactions` ledger
   (`02-core-domain-data-model.md` §3.10, §5.1) and adds persisted progression
   columns to `UserProfiles` (pending D1 approval);
2. every **future** Completion Code redemption creates the Verified completion, its
   `XpTransaction`, and the user's progression update in **one transaction, one
   DbContext, one `SaveChangesAsync()`** — restoring the accepted completion + XP
   atomicity (`02-core-domain-data-model.md` §7) that Slice 4B deliberately staged;
3. a bounded, retryable, overlap-safe reconciliation process finds every existing
   Slice 4B `Verified` completion without a ledger row and awards exactly one XP
   transaction per completion, using unique `SourceCompletionId` as the
   authoritative idempotency boundary;
4. reward amounts derive **only** from the immutable
   `QuestCompletion.RewardDifficultySnapshot`; community attribution copies only
   the immutable `QuestCompletion.CommunityRegionIdAtCompletion`;
5. (pending D6 approval) the smallest authenticated read surface lets the current
   user — and tests — observe server-authoritative XP, level, and rank title,
   gated by an application-enforced readiness check so partial backfill is never
   presented as authoritative (§11).

No reward UX, notification, animation, leaderboard, achievement, streak, Passport
UI, or frontend change is part of this Slice.

## 3. Current implementation baseline (verified against source)

Each item was inspected at HEAD `4c73968` (descendant of merge `6901fff`). All
baseline claims from the planning prompt were confirmed; no correction is needed.

| Fact | Evidence |
| --- | --- |
| Slice 4B creates `Verified` `CompletionCode` completions with immutable `RewardDifficultySnapshot` and `CommunityRegionIdAtCompletion`; `VerifiedAtUtc` is populated | `backend/src/Kiwimpact.Core/Entities/QuestCompletion.cs:11-23` (fields), `:29-68` (`CreateVerifiedWithCode` sets `CompletedAt = VerifiedAtUtc = now`, snapshot copies) |
| `QuestCompletionStatus` and `CompletionMethod` currently contain only `Verified` / `CompletionCode` | `backend/src/Kiwimpact.Core/Enums/QuestCompletionStatus.cs`, `backend/src/Kiwimpact.Core/Enums/CompletionMethod.cs` |
| No `XpTransactions` table or DbSet exists | `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs:12-18`; migrations directory contains four migrations, latest `20260725063439_AddQuestCompletionCodes`; absence asserted by 4B-1 migration tests (`specs/implementation/reports/04b1-completion-code-backend-completion.md` §"Schema and migration evidence") |
| `UserProfile` has no persisted total-XP or level fields, and no `xmin` concurrency token | `backend/src/Kiwimpact.Core/Entities/UserProfile.cs:12-18`; `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserProfileConfiguration.cs`; accepted token list (`02-core-domain-data-model.md` §8) names only `Quest`, `QuestParticipation`, `QuestCompletion`, `CommunityChallenge` |
| `UserProfile.Id` is both PK and 1:1 FK to `AspNetUsers` (Cascade) | `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserProfileConfiguration.cs:14,24-27` |
| `Quest.XpAward` exists; organizer-created Quests set it to `0`; demo seeds assign demo values; it is not a stable historical reward input | `backend/src/Kiwimpact.Core/Entities/Quest.cs:26` (field), `:69` (`XpAward = 0`), `:195` (non-negative invariant); `backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoQuestSeed.cs:266,290` |
| Slice 4B intentionally creates no XP transaction and shows no reward result | `specs/implementation/04b-simplified-quest-completion.md` §2, §17, §18; `specs/implementation/reports/04b1-completion-code-backend-completion.md` §"Deliberately excluded" |
| Redeem already uses one explicit PostgreSQL transaction and a materialized Quest-row `SELECT ... FOR UPDATE` | `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs:140` (`BeginTransactionAsync`), `:261-269` (`LockQuestAsync`, selects `q.*, q.xmin ... FOR UPDATE`) |
| Redeem currently reads the user's Home Community through an **unlocked** projection for the completion snapshot (review M1: the proposed flow removes this read and takes the snapshot from the row locked `FOR UPDATE`, §9 steps 6–7) | `QuestCompletionRepository.cs:193-197` |
| `23505` is translated to AlreadyCompleted only when it names `UX_QuestCompletions_UserId_QuestId_Verified`; `DbUpdateConcurrencyException` → generic `409` | `QuestCompletionRepository.cs:210-228` |
| `UX_QuestCompletions_UserId_QuestId_Verified` is the verified-completion uniqueness boundary (partial unique `(UserId, QuestId) WHERE "Status" = 'Verified'`) | `backend/src/Kiwimpact.Infrastructure/Data/Configurations/QuestCompletionConfiguration.cs:62-69` |
| No `GET /api/v1/users/me` implementation exists (accepted but unimplemented) | `backend/src/Kiwimpact.Api/Controllers/` contains no users controller; accepted surface in `specs/architecture/03-api-contract.md` §2.2 |
| No hosted/background service is registered today | `backend/src/Kiwimpact.Api/Program.cs`; `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs:20-24` (scoped repositories only) |
| Test infrastructure: Testcontainers `postgres:17-alpine`; migration-upgrade tests via `IMigrator` to a named migration then latest; deterministic contention tests via an externally held `FOR UPDATE` lock plus `pg_stat_activity` blocked-session observation | `backend/tests/Kiwimpact.IntegrationTests/Persistence/TestDatabaseFixture.cs`; `.../QuestCompletionMigrationUpgradeTests.cs:40-46`; `backend/tests/Kiwimpact.IntegrationTests/Api/QuestCompletionApiTests.cs:380-397,956-960`; `.../Api/CustomWebApplicationFactory.cs` |

## 4. Accepted inherited constraints

This plan must preserve, and proposes to implement, the following already-accepted
rules (sources cited; nothing here is re-decided):

1. **Slice 4B §18 obligations** (`specs/implementation/04b-simplified-quest-completion.md` §18): Slice 5A is the next main product Slice; rewards are calculated only from immutable completion snapshots; historical rewards are never reconstructed from current mutable Quest difficulty, current `Quest.XpAward`, current profile community, Quest dates, or another live field; every eligible `Verified` completion without an XP transaction is found; exactly one XP transaction per completion; unique `SourceCompletionId` is the authoritative reward-idempotency boundary; reconciliation stays safely retryable; existing 4B completions are processed before reward state is presented as complete; profile XP and level/rank progression stay transactionally consistent with the ledger; new verified-completion reward creation restores the accepted completion + XP atomicity.
2. **Reward amounts** (`specs/Kiwimpact_Final_Planning_Baseline_v1.0.md` §8): Easy → 50, Medium → 100, Hard → 150; only verified completions earn XP; SelfReported receives zero XP and no `XpTransaction` (`02-core-domain-data-model.md` §10 invariants 8–9).
3. **Progression formula** (baseline §8): cumulative threshold `XP(Level L) = 5 × (L - 1) × (L + 7)`; Level capped at 99; rank bands 1–9 Novice, 10–19 Scout, 20–29 Adventurer, 30–39 Ranger, 40–49 Pathfinder, 50–59 Guardian, 60–69 Vanguard, 70–79 Champion, 80–89 Hero, 90–98 Legend, 99 Kiwimpact Legend.
4. **Ledger model** (`02-core-domain-data-model.md`): columns and the positive-amount rule (§3.10); index set (§5.1); FK delete behaviors (§5.2: all Region FKs Restrict; all other FKs Restrict unless specifically excepted); ownership (§6: `XpTransaction` is System-owned and immutable; read by owning Member and Admin); transaction boundary (§7: Verified completion + `XpTransaction` atomic in one `SaveChangesAsync()`); idempotency via database unique constraints, not application retry (§8).
5. **Attribution immutability** (`specs/data/01-community-identity-data-model.md` §4; `02-core-domain-data-model.md` §10 invariant 10): `CommunityRegionIdAtAward` is never recalculated or updated after creation; unattributed (null) XP contributes only to personal progression and the NZ scope.
6. **Time rules** (`02-core-domain-data-model.md` §10): timestamps UTC `timestamptz`; `Pacific/Auckland` for display and business-week boundaries; leaderboard periods weekly/monthly/all-time (`specs/product/02-community-identity-and-gamification-scope-update.md` §2).
7. **Server authority**: the frontend never submits a trusted XP value (baseline §8; `02-core-domain-data-model.md` §10 invariant 8).
8. **P0 scheduling**: "Server-authoritative XP and level/rank progression" and "Passport-lite profile/dashboard" are P0 (`specs/product/04-phase-2-delivery-scope.md` §2.1 — note this document itself carries status "Proposed — pending design review"; recorded here as scheduling context, not re-approved by this plan).
9. **Background-service precedent** (baseline §7, evidence purge): `BackgroundService`, runs shortly after startup, periodic, batch size ≈ 100, idempotent, logs counts/failures rather than content.

## 5. Decision table D1–D7

Each decision lists viable alternatives, the recommendation, tradeoffs, and the
approval label. **None of these is approved yet; each requires explicit human
approval after the Codex design review.**

### D1 — Persisted progression state

**Question:** does `UserProfile` gain persisted `TotalXp` and `Level`, or is
progression derived from the immutable ledger on read?

**Alternatives:**

- **A. Fully derived** — no new columns; `TotalXp = SUM(XpAmount)` per user, level
  and rank computed on every read. Zero drift risk; but every progression read,
  Passport-lite summary, and future leaderboard row re-aggregates the ledger, and
  obligation 9 ("profile XP and level/rank progression must stay transactionally
  consistent with the XP ledger") becomes a read-time claim with no database-
  enforceable boundary.
- **B. Persist `TotalXp` + `Level`, derive Rank Title (recommended).**
- **C. Persist only `TotalXp`, derive Level + Rank** — viable middle ground; loses
  the database-level `CHECK` pinning of the accepted 1–99 cap and makes level a
  computed-afterthought in every query.

**Recommendation: B.** Add to `UserProfiles`:

- `TotalXp bigint NOT NULL DEFAULT 0` with `CK_UserProfiles_TotalXp_NonNegative
  ("TotalXp" >= 0)`;
- `Level integer NOT NULL DEFAULT 1` with `CK_UserProfiles_Level_Range
  ("Level" BETWEEN 1 AND 99)`.

Rationale and tradeoffs:

- **Correctness:** the ledger remains the audit source of truth; the two columns
  are a denormalized projection written only inside award transactions (D5/D4).
  `Level` is always **recomputed from the new `TotalXp`** via the accepted
  formula — never incremented — so a repair can recompute both columns from the
  ledger at any time (ops query documented in §13).
- **Concurrency:** updates are serialized by a `SELECT ... FOR UPDATE` row lock on
  the profile row inside the award transaction (D5). **No new concurrency token is
  added**: `UserProfile` is not in the accepted token list (`02` §8), and the 4B
  precedent treats unapproved token mappings as out of bounds. A lost-update race
  is impossible because every writer holds the row lock before reading the current
  total.
- **Overflow (corrected per review m2):** `TotalXp` is unbounded (XP keeps
  accruing after the Level 99 cap). `bigint` makes overflow operationally remote
  (an `int` would survive ~14 million Hard completions) but **not impossible**,
  so every progression addition is a checked operation: the new total is computed
  with `checked(TotalXp + amount)` arithmetic (or an equivalent explicit
  upper-bound guard), and an overflow throws `OverflowException` as an invariant
  failure — the award transaction rolls back (redemption → untranslated 500;
  reconciliation → bounded row failure per §10, holding the §11 readiness gate
  closed). Threshold arithmetic uses 64-bit integers throughout (§8); the §14.1
  `long`-extreme tests pin this behavior.
- **Migration:** constant defaults (`0`, `1`) backfill existing rows without a
  table rewrite on PostgreSQL ≥ 11; purely additive.
- **Operational:** reads are O(1); repair is a documented recompute; drift is
  detectable by comparing `SUM(XpAmount)` to `TotalXp`.
- **P0:** simplest demonstrable progression surface for Passport-lite later.
- **Rank Title:** deterministically derived from `Level` on every read
  (§8); never persisted, so a future title change is a code change, not a data
  migration.

**Approval: REQUIRES HUMAN APPROVAL** (new persisted columns; matches the
preferred direction in the planning prompt).

### D2 — Historical award timestamp

**Question:** what is `XpTransaction.CreatedAt` for reconciled Slice 4B
completions?

**Alternatives:**

- **A. Reconciliation processing time** — non-deterministic (retries produce
  different rows), misplaces awards into the wrong weekly/monthly leaderboard and
  Community Challenge period, and rewrites history to "when the deploy happened".
- **B. The completion's immutable `VerifiedAtUtc` (recommended).**

**Recommendation: B.** `XpTransaction.CreatedAt := SourceCompletion.VerifiedAtUtc`
for reconciled **and** future awards. The two rules coincide for future
redemptions because the award is created in the same transaction as the completion
(`CreatedAt == VerifiedAtUtc` there), so one uniform rule covers both paths.

Rationale and tradeoffs:

- **Correctness/historical accuracy:** weekly/monthly/all-time leaderboards and
  `CommunityChallenge` progress derive from `XpTransaction.CreatedAt`
  (`02` §3.13); the award must land in the period when the completion was
  verified, not when reconciliation ran.
- **Determinism/idempotency:** a reconciliation re-run constructs byte-identical
  candidate rows; tests can assert exact values.
- **Guard and accounting (corrected per review M4):** a processing-time fallback
  remains prohibited. Award-*processing* eligibility requires `Status = 'Verified'
  AND VerifiedAtUtc IS NOT NULL` — a null `VerifiedAtUtc` on a Verified row is an
  impossible state for the only implemented method (4B sets it at redemption) and
  such a row is **never** awarded any invented timestamp. But the
  reward-*accounting* boundary covers **every** Verified completion without an XP
  row, with **no** timestamp filter: an unprocessable row is counted as a terminal
  `unprocessable` failure on every pass (count only, never attempted), makes the
  pass incomplete, keeps the §11 readiness gate closed, and blocks the §13
  completion condition until a human resolves the row (§18 stop condition). The
  tests must never present silently skipping such a row as supported behavior.
- **Accepted-document impact:** the accepted model does not explicitly define
  `CreatedAt` as award-effective time; a one-line clarification is proposed in D7.
- **Approval: REQUIRES HUMAN APPROVAL** (matches the preferred direction in the
  planning prompt).

### D3 — Community attribution

**Question:** what value populates `XpTransaction.CommunityRegionIdAtAward`?

**Alternatives:**

- **A. User's current `HomeCommunityRegionId` at award time** — violates 4B §18
  obligation 3 for reconciliation (current profile community is a live field) and
  silently rewrites attribution for every 4B completer who changed community.
- **B. Copy `QuestCompletion.CommunityRegionIdAtCompletion` (recommended;
  required by the staged 4B design).**

**Recommendation: B.** Exact mapping:
`XpTransaction.CommunityRegionIdAtAward = SourceCompletion.CommunityRegionIdAtCompletion`
(null stays null; unattributed-XP rules of `01-community-identity-data-model.md`
§4.3 apply unchanged). The user's current Home Community is **never read** during
reconciliation. For future redemptions the completion snapshot is captured from
the profile row locked `FOR UPDATE` in the same transaction (§9 steps 6–7, review
M1), so copying the snapshot is identical to "community at award time" there.

**Conflict with older wording:** `02-core-domain-data-model.md` §3.10 and
`01-community-identity-data-model.md` §4.2 say "Snapshot of the user's Home
Community at XP award time." For 4B completions, award time and completion time
differ. Minimal amendment proposed (applied only after approval, in the
implementation Slice, not by this plan): redefine the column as *"copied from the
source completion's immutable `CommunityRegionIdAtCompletion`; for awards created
together with the completion this equals the Home Community at award time."* All
immutability, nullability, and leaderboard-query rules are untouched.

**Approval: REQUIRES HUMAN APPROVAL** (required direction per the planning prompt;
includes the wording amendment).

### D4 — Existing-completion reconciliation mechanism

**Alternatives:**

- **A. Data backfill inside the additive migration** — rejected: mixes data into
  schema history against repository convention (migrations are the canonical
  *schema* history; data lives in seed classes — `02` §10.2–10.5); duplicates
  reward/level domain logic in SQL; a failure blocks deployment; `Down()` becomes
  ambiguous; cannot reuse `ProgressionRules`.
- **B. One-shot application service run during startup** — rejected: blocks or
  complicates startup; overlapping instances during a rolling deploy are
  uncontrolled; failure handling couples to host startup; divergent behavior
  across environments.
- **C. Repeatable hosted `BackgroundService` (recommended).**
- **D. Explicit operational/admin-triggered endpoint** — rejected: the planning
  boundary forbids a public reward-mutation endpoint, and a manual step can be
  forgotten before reward state is presented as complete (4B §18 obligation 8).

**Recommendation: C — `XpReconciliationHostedService`**, following the accepted
baseline §7 background-service precedent. P0 design:

- **Options** (`XpReconciliationOptions`, bound from configuration, no secrets):
  `Enabled` (default `true`; the test factory sets `false` so hosted execution
  never races seeded API tests — reconciliation tests invoke the pass directly),
  `BatchSize` (default `100`), `InitialDelay` (default seconds; `0` in tests),
  `IdleInterval` (default `24`h), `MaxConsecutiveRowFailures` (default `10`).
- **Queries (deterministic; corrected per review M4):** two `AsNoTracking` query
  shapes per pass —
  - *reward-pending (accounting):* `Status = 'Verified' AND NOT EXISTS
    (XpTransaction with SourceCompletionId = Id)` — **no timestamp filter**, so
    every Verified-without-XP row is inside the accounting boundary;
  - *award-eligible (processing):* reward-pending **AND** `VerifiedAtUtc IS NOT
    NULL`, ordered by `(VerifiedAtUtc, Id)`. All selected fields are immutable
    after creation, so the no-tracking snapshot cannot go stale.
- **Per-completion transaction (the exactly-once core):** for each candidate, in
  its own transaction on its own scoped DbContext:
  1. build the `XpTransaction` from the immutable completion fields
     (`XpAmount = XpForDifficulty(RewardDifficultySnapshot)`;
     `CommunityRegionIdAtAward = CommunityRegionIdAtCompletion`; `CreatedAt =
     VerifiedAtUtc`);
  2. flush the insert **first** (`SaveChangesAsync` #1 — this is also the lock-
     ordering rule, §9): on `23505` naming `UX_XpTransactions_SourceCompletionId`,
     roll back and count the row as *already awarded* (a concurrent worker won);
     the profile is **not** touched on this path;
  3. otherwise lock the user's `UserProfiles` row `FOR UPDATE` (parameterized raw
     SQL, same style as `LockQuestAsync`), apply the **checked** addition
     `TotalXp + XpAmount` (m2: overflow → invariant failure, the row counts as
     failed) and `Level = ComputeLevel(newTotal)` (recomputed, never
     incremented), flush (`SaveChangesAsync` #2) and **commit once**. Both rows
     commit or neither does — one transaction is the atomicity boundary.
- **Batch loop with pass-level failure accounting (corrected per review M2):**
  counters (`awarded`, `alreadyAwarded`, `failed`, `consecutiveFailures`) and an
  in-pass `attemptedIds` set are scoped to the **whole pass** — initialized once
  before the first batch and never reset by a new batch. Each batch query takes
  `BatchSize` award-eligible rows **excluding `attemptedIds`** (stable
  `(VerifiedAtUtc, Id)` order), so a row is attempted **at most once per pass**
  even when it stays eligible after failing. A success resets
  `consecutiveFailures` to zero; a failure increments it; the pass **aborts**
  when it reaches `MaxConsecutiveRowFailures` consecutive failures
  (systemic-error circuit breaker). The pass ends when a batch returns empty
  (every eligible row was attempted once) or on abort; the next attempt happens
  only on the next scheduled or explicitly invoked pass.
- **Unprocessable rows (M4):** rows in reward-pending but not award-eligible
  (null `VerifiedAtUtc`) are never attempted; each pass counts them as
  `unprocessable`. A pass is **incomplete** when it aborted, `failed > 0`, or
  `unprocessable > 0`; an incomplete pass logs a `Warning`, keeps the §11
  readiness gate closed, and is retried only on the next pass — a permanently
  failing row can never spin inside one pass.
- **Overlap safety (m1 clarified):** correctness rests **only** on the unique
  `SourceCompletionId` index plus the conditional profile update (steps 2–3),
  never on the advisory lock. As a courtesy, each pass opens a dedicated
  `NpgsqlConnection` and takes a session-level `pg_try_advisory_lock(key)`; the
  key is one fixed `bigint` constant compiled into the application (identical
  for every instance, not configurable). A worker that does not acquire the lock
  skips the pass. `pg_advisory_unlock(key)` runs in a `finally` block before
  the connection is disposed at pass end (disposal is the backstop release, so
  pooling and exceptional exits cannot leak the lock). Tests must prove
  correctness with the courtesy lock unavailable.
- **Failure recovery:** per-row `try/catch` — a failed row is logged (count +
  completion id; no profile data), excluded from further attempts **within that
  pass**, and retried only on a later pass (eligibility is recomputed per pass);
  the hosted service never propagates an exception to the host.
- **Retryability/no-op property:** a pass over a fully reconciled database writes
  nothing and only scans; proven by the §14 repeat-pass test.
- **Logging:** per-pass `Information` counts (scanned, awarded, already-awarded,
  failed, unprocessable, complete/incomplete); completion ids at `Debug`; never
  display names, emails, or Home Community values.
- **No public surface:** no endpoint, no admin UI; operational confirmation is the
  log line plus the §13 SQL check.

**Approval: REQUIRES HUMAN APPROVAL.**

### D5 — Future redemption atomicity and lock order

**Question:** how is the existing redemption transaction extended so completion +
XP + progression commit or roll back together, without introducing a deadlock?

**Recommendation (design; full step list in §9):** extend
`QuestCompletionRepository.RedeemAsync` in place. One scoped `KiwimpactDbContext`,
one connection, one explicit transaction:

1. lock the Quest row `FOR UPDATE` (existing `LockQuestAsync`, unchanged);
2. evaluate the existing 4B rules 1–8 unchanged (eligibility, participation,
   duplicate, code verification);
3. lock the caller's `UserProfiles` row `FOR UPDATE` via parameterized raw SQL
   (new `LockUserProfileAsync`; missing row → `InvalidOperationException`, an
   impossible state surfaced as 500, never as a redemption error class) and read
   `HomeCommunityRegionId` from **that locked row** — it is the only community
   snapshot source; the current unlocked projection read is removed (review M1);
4. create the completion (existing factory, community from the locked profile),
   create the `XpTransaction` from the completion's immutable fields (D2/D3),
   recompute the profile's `TotalXp`/`Level` from the locked row with a checked
   addition (m2);
5. **one `SaveChangesAsync()`** — EF's topological insert order writes the
   completion before its dependent XP row;
6. commit; every failed path rolls back (existing catch structure extended).

**Exact PostgreSQL lock order (global invariant):** in every transaction, all
Quest-row acquisitions (`FOR UPDATE` or FK `FOR KEY SHARE`) precede the
`UserProfiles FOR UPDATE` acquisition, and no transaction ever locks more than one
`UserProfiles` row.

**Deadlock-freedom argument:**

- Redemption acquires: Quest `FOR UPDATE` → (reads) → UserProfiles `FOR UPDATE` →
  at save, FK `KEY SHARE` on `QuestParticipations`/`AspNetUsers`/`Regions`/its own
  Quest row (self-held). The community snapshot is read from the locked profile
  row, so a concurrent profile update serializes strictly before or after the
  whole award — never inside it (review M1).
- Reconciliation acquires: FK `KEY SHARE` on the completion's parent rows **at the
  XP insert**, *then* UserProfiles `FOR UPDATE` (insert precedes profile lock —
  this ordering is mandatory and is why D4 step 2 precedes step 3).
- `FOR KEY SHARE` conflicts only with `FOR UPDATE` (PostgreSQL lock matrix). The
  only cross-order hazard would be a transaction holding UserProfiles while
  requesting a Quest-row lock; neither flow does that, so no hold-and-wait cycle
  exists:
  - redemption vs redemption, same Quest: serialized at the Quest lock;
  - redemption vs redemption, same user, different Quests: serialized at the
    profile lock (waiter holds its Quest lock; the holder needs no further Quest
    lock — no cycle);
  - reconciliation vs redemption: the reconciler's `KEY SHARE` need may wait on a
    Quest `FOR UPDATE` holder, but at that moment the reconciler holds nothing the
    other transaction needs (its profile lock comes later), so the redemption
    completes and releases;
  - reconciliation vs reconciliation, same completion: the unique index serializes
    the inserts; the loser gets `23505` and skips the profile update;
  - reconciliation vs reconciliation, same user, different completions: serialized
    at the profile lock.
- The verified-completion partial unique index and the `SourceCompletionId` unique
  index are backstops; correctness never depends on lock timing.

**Error translation (deterministic):** redemption keeps translating `23505` to
AlreadyCompleted **only** for `UX_QuestCompletions_UserId_QuestId_Verified`;
`23505` naming `UX_XpTransactions_SourceCompletionId` inside redemption signals an
invariant violation and is deliberately **not** translated (surfaces as 500 via
`UseExceptionHandler`); `DbUpdateConcurrencyException` → generic `409`
(unchanged); reconciliation translates `23505` on
`UX_XpTransactions_SourceCompletionId` to the benign already-awarded skip; no
other constraint name is ever mapped anywhere.

**Approval: REQUIRES HUMAN APPROVAL.**

### D6 — Read API boundary

**Question:** is 5A backend reward-write core only, or does it add the smallest
authenticated read surface?

**Alternatives:**

- **A. No new read endpoint until Passport-lite** — rejected: P0 requires
  demonstrable server-authoritative progression, and the write core would have no
  observable surface other than database inspection.
- **B. Extend the accepted but not-yet-implemented `GET /api/v1/users/me`** —
  rejected for 5A: it forces the entire profile contract (display name, Home
  Community, privacy toggles, cooldown fields) into this Slice; the additive route
  mirrors the approved 4B §11 precedent (`GET /api/v1/quests/{questId}/completion`
  was added the same way). `users/me` can later include or link progression.
- **C. Additive current-user progression endpoint behind an application-enforced
  readiness gate (recommended, corrected per review M3).**

**Recommendation: C** — `GET /api/v1/users/me/progression`:

- Auth: `[Authorize(Roles = Member + "," + Organizer + "," + Admin)]` (explicit
  role list, existing convention); actor identity only from
  `ClaimTypes.NameIdentifier`; no route/query user selector ever exists.
- **Readiness gate (M3 — the enforceable boundary):** before reading the profile,
  the service evaluates the reward-pending count (§10 accounting query — **every**
  Verified completion without an XP row, **no** timestamp filter) live against the
  database on each request (an indexed anti-join; no cache that could outlive
  reconciliation). While the count is non-zero — including any unprocessable row
  (M4) — the route returns `503` with a bounded `progression-not-ready`
  ProblemDetails carrying no counts or internals. The gate opens automatically
  once reconciliation completes and re-closes if an unrewarded row ever appears.
  A log line or operator SQL remains supporting evidence, not the gate; this
  application check is what makes "existing 4B completions processed before
  reward state is presented as complete" (4B §18 obligation 8) enforceable.
- Response `200 MyProgressionDto` with exactly three camelCase keys:
  `{ totalXp, level, rankTitle }` — `totalXp` number (int64), `level` number,
  `rankTitle` string derived from persisted `Level` at read time.
- Errors: `401` anonymous; `503 progression-not-ready` while reward state is
  incomplete; authenticated user without a profile row (impossible state) →
  `404` ProblemDetails via the existing helper conventions.
- The redeem response DTO is **not** changed (no reward reveal; presentation is
  deferred to Passport-lite).
- Privacy: values are the caller's own server state; no email, user id, Home
  Community, or other-user data in the DTO (§12).

**Approval: REQUIRES HUMAN APPROVAL** (any new endpoint or DTO requires explicit
approval per the planning boundary).

### D7 — Accepted document alignment

**Question:** which minimal amendments are needed after approval? (None is edited
by this planning task.)

1. `02-core-domain-data-model.md` §3.2 — add the two `UserProfile` progression
   columns (if D1 approved); §3.10 — redefine `CommunityRegionIdAtAward` as copied
   from the completion's immutable snapshot (D3) and clarify `CreatedAt` as the
   award-effective time `= SourceCompletion.VerifiedAtUtc` (D2); §7 — record that
   5A restores completion + XP atomicity for redemptions and adds the bounded
   reconciliation path; §8 — note that progression columns are row-lock serialized
   with no new concurrency token.
2. `specs/data/01-community-identity-data-model.md` §4.2 — same "at award time"
   wording alignment (D3).
3. `specs/architecture/03-api-contract.md` §2.2 — add
   `GET /api/v1/users/me/progression` with its error conditions, including the
   `503 progression-not-ready` readiness response (if D6 approved);
   §2.8's redeem purpose ("Creates Verified QuestCompletion + XpTransaction")
   becomes literally true again — the 4B staged exception ends here, no wording
   change required there.
4. `specs/implementation/04b-simplified-quest-completion.md` — **no edit**
   (historical approved record); the 5A completion report records the exception's
   closure.
5. `02-core-domain-data-model.md` §3.4 `Quest.XpAward` — documentation-only
   deprecation note: "not a reward input; difficulty snapshots are; column
   retained pending a separate cleanup decision." No schema change, no value
   change, organizer creation keeps writing `0`, demo seeds untouched.
6. `specs/product/04-phase-2-delivery-scope.md` — no change (XP progression is
   already P0).
7. Final M1–M4 semantics are recorded in this plan (locked-profile snapshot,
   pass-level failure accounting, readiness gate, accounting boundary); if the
   targeted closure check changes any of them, the corresponding accepted-document
   amendments are updated in the same implementation Slice.

**Approval: REQUIRES HUMAN APPROVAL** (amendments executed only inside the
approved implementation Slice).

## 6. Proposed in-scope and out-of-scope boundaries

**In scope (backend only):**

- `XpTransaction` entity, EF Core configuration, one additive migration (§7).
- `UserProfiles.TotalXp` / `UserProfiles.Level` columns with defaults and checks
  (D1).
- Pure Core progression rules: difficulty→XP mapping, cumulative level formula,
  Level 99 cap, rank-title bands (§8).
- Redemption transaction extension (D5/§9) with unchanged request/response DTOs.
- `XpReconciliationHostedService` + options + per-completion award logic (D4/§10).
- `GET /api/v1/users/me/progression` with its readiness gate (D6, only if
  approved).
- Backend unit, persistence, concurrency, migration, and API tests (§14).

**Out of scope (kept out unless the human later approves expansion):** Passport UI
or completion-history UI; achievements; streaks; leaderboard implementation;
SignalR; Share Card; Evidence Claim and Admin review; SelfReported
implementation; notification/toast reward reveals; frontend reward animation;
theme work; Docker/deployment implementation; new dependencies; changing
authentication architecture; deleting or rewriting existing 4B completion
history; any frontend change at all (including no XP wording added to the
completion panel); any change to `Quest.XpAward` values; repeatable-Quest
completion (`QuestOccurrence`). Reward UX is **not** complete after 5A.

## 7. Proposed data model and one additive migration

One additive migration (generated during implementation, not planning; applies to
clean and current 4B schemas). Name proposal: `AddXpLedgerAndProgression`.

### 7.1 New table `XpTransactions` (accepted model `02` §3.10, §5.1 — no deviation)

| Column | Type | Constraints |
| --- | --- | --- |
| `Id` | `uuid` | PK; application-generated `Guid.NewGuid()` in the entity factory (existing convention) |
| `UserId` | `uuid` | NOT NULL; FK → `AspNetUsers.Id`, **Restrict** |
| `QuestId` | `uuid` | NOT NULL; FK → `Quests.Id`, **Restrict** |
| `SourceCompletionId` | `uuid` | NOT NULL; FK → `QuestCompletions.Id`, **Restrict** |
| `XpAmount` | `integer` | NOT NULL; `CK_XpTransactions_XpAmount_Positive ("XpAmount" > 0)` |
| `CommunityRegionIdAtAward` | `uuid` | NULL; FK → `Regions.Id`, **Restrict** |
| `CreatedAt` | `timestamptz` | NOT NULL; `= SourceCompletion.VerifiedAtUtc` (D2) |

Indexes (exactly the accepted §5.1 set, no extras):

- `UX_XpTransactions_SourceCompletionId` — UNIQUE (`SourceCompletionId`), the
  authoritative reward-idempotency boundary;
- `IX_XpTransactions_UserId_CreatedAt` — (`UserId`, `CreatedAt`);
- `IX_XpTransactions_CommunityRegionIdAtAward_CreatedAt` —
  (`CommunityRegionIdAtAward`, `CreatedAt`).

Deliberately absent: no `UpdatedAt` (immutable ledger), no `xmin`/concurrency
token (not in the accepted token list; rows are never updated), no extra `QuestId`
lookup index (no 5A query needs one; the accepted index set is final unless a
later approved query requires more).

Entity shape mirrors `QuestCompletion`: `internal` constructor/setters, factory
`XpTransaction.CreateFromVerifiedCompletion(QuestCompletion)` with guards
(completion non-null, `Status = 'Verified'`, `VerifiedAtUtc` non-null, ids
non-empty, defined `RewardDifficultySnapshot`); `XpAmount` derived from
`ProgressionRules.XpForDifficulty(completion.RewardDifficultySnapshot)`.

### 7.2 `UserProfiles` additions (D1)

| Column | Type | Constraints / update rules |
| --- | --- | --- |
| `TotalXp` | `bigint` | NOT NULL, DEFAULT `0`, `CK_UserProfiles_TotalXp_NonNegative`; written only inside award transactions as the **checked** addition `TotalXp + XpAmount` (overflow → `OverflowException` invariant failure, m2) |
| `Level` | `integer` | NOT NULL, DEFAULT `1`, `CK_UserProfiles_Level_Range (1–99)`; written only as `ProgressionRules.ComputeLevel(newTotalXp)` — recomputed, never incremented |

- No concurrency token added (D1). Updates serialized by the profile-row
  `FOR UPDATE` lock (§9, §10).
- Constant defaults backfill all existing rows without a table rewrite.
- Domain mutation lives on `UserProfile.ApplyXpAward(amount, newLevel, now)`
  with guards (`amount > 0`, `newLevel` in 1–99, `checked` addition so overflow
  throws instead of wrapping; sets `UpdatedAt`).

### 7.3 `Quest.XpAward` policy

Left **completely untouched**: no schema change, no value backfill, no semantic
change. It is deprecated in documentation only (D7 item 5) as "not a reward
input". Organizer creation continues to write `0`; demo seed values remain demo
data. Any later cleanup (column removal or server-populated values) requires its
own explicit approval and is not part of 5A.

### 7.4 Migration content boundary

The migration contains **schema only** — no data backfill, no reconciliation
(rejected D4-A). `Down()` drops `XpTransactions` and the two `UserProfiles`
columns; it is tested on real PostgreSQL but operationally discouraged (§13).

## 8. XP, Level, Rank Title calculation rules and overflow/cap behavior

All rules live in a pure, static Core type (proposal: `ProgressionRules`,
`Kiwimpact.Core/Services` or `Kiwimpact.Core/Progression`); no database access,
fully unit-testable.

- `MaxLevel = 99`.
- `XpForDifficulty(QuestDifficulty)` → Easy `50`, Medium `100`, Hard `150`; any
  undefined enum value → `ArgumentException` (impossible-state guard; corrected
  per review m3: `RewardDifficultySnapshot` is stored as a bounded string of max
  50 with **no** database `CHECK` restricting it to the three accepted names —
  this domain guard is the enforcement point, and reconciliation treats an
  undefined stored value as a bounded row failure per §10, never inventing an
  amount. Adding a database `CHECK` would be a separate schema decision
  requiring human approval and is **not** proposed).
- `RequiredXpForLevel(int level)` → `5L * (level - 1) * (level + 7)`, valid for
  `2..99`; computed with 64-bit arithmetic; invalid input → guard exception.
- `ComputeLevel(long totalXp)` → the largest `L` in `1..99` with
  `RequiredXpForLevel(L) <= totalXp` (`L = 1` requires `0`); any
  `totalXp >= 51,940` (`XP(99) = 5 × 98 × 106`) → `99`. Negative input → guard
  exception. Iteration over at most 98 thresholds is acceptable; no closed-form
  inversion is needed.
- `RankTitleFor(int level)` → the accepted bands: 1–9 Novice, 10–19 Scout,
  20–29 Adventurer, 30–39 Ranger, 40–49 Pathfinder, 50–59 Guardian,
  60–69 Vanguard, 70–79 Champion, 80–89 Hero, 90–98 Legend,
  99 `Kiwimpact Legend`; any level outside `1..99` → guard exception.

Reference boundary values (pinned by unit tests): `XP(2) = 45`, `XP(3) = 100`,
`XP(4) = 165`, `XP(5) = 240`, `XP(9) = 640`, `XP(10) = 765`, `XP(11) = 900`,
`XP(98) = 50,925`, `XP(99) = 51,940`. Sanity-checked against the baseline
experience targets: one Easy quest (50 XP) → Level 2 ✓; five Medium quests
(500 XP) → Level 7 ✓ (accepted range 5–8).

Cap and overflow behavior (m2): `TotalXp` is `bigint` and keeps accruing after
Level 99; `Level` is pinned at 99 by both `ComputeLevel` and the database
`CHECK`; every progression addition is performed with `checked` 64-bit
arithmetic (or an equivalent explicit upper-bound guard), so the operationally
unreachable but logically possible overflow raises `OverflowException`
(invariant failure → award rollback per §9/§10) instead of silently wrapping;
`TotalXp` is never clamped; rank title is a pure function of level, so the 99 ↔
`Kiwimpact Legend` boundary is exact.

## 9. Future redemption transaction and exact lock order

Proposed replacement flow inside `QuestCompletionRepository.RedeemAsync`
(structure mirrors the existing implementation; every existing rule and error
mapping is preserved):

```text
BeginTransactionAsync
 1. quest  = LockQuestAsync(questId)                       -- SELECT ... FOR UPDATE (Quests)          [existing]
 2. EnsureRedemptionQuest(quest, actorId)                  -- 4B rules 1–4                            [existing]
 3. participation = active participation or 409           -- rule 6                                  [existing]
 4. reject existing Verified completion (409)             -- rule 7                                  [existing]
 5. verify active in-window code (generic 400)            -- rules 5, 8                              [existing]
 6. profile = LockUserProfileAsync(actorId)               -- SELECT ... FROM "UserProfiles"
                                                           --  WHERE "Id" = @id FOR UPDATE           [NEW — lock #2]
    missing row → InvalidOperationException (500)
 7. communityRegionId = profile.HomeCommunityRegionId     -- read from the LOCKED profile row;       [CHANGED — M1]
                                                           --  the previous unlocked projection
                                                           --  read is removed
 8. completion = QuestCompletion.CreateVerifiedWithCode(..., communityRegionId, ...)               [existing factory]
    xp         = XpTransaction.CreateFromVerifiedCompletion(completion)              [NEW]
    profile.ApplyXpAward(xp.XpAmount,
        ComputeLevel(checked(profile.TotalXp + xp.XpAmount)), now)                   [NEW; m2 checked]
 9. Add(completion); Add(xp); SaveChangesAsync()          -- ONE flush: completion, then XP,        [NEW shape]
                                                           -- then profile UPDATE
10. CommitAsync                                            -- all three writes or none
catch 23505 on UX_QuestCompletions_UserId_QuestId_Verified → 409 AlreadyCompleted   [existing]
catch DbUpdateConcurrencyException                        → 409 Concurrency        [existing]
catch anything else                                       → rollback, rethrow      [existing]
```

Lock order (the D5 invariant, restated operationally):

1. `Quests` row `FOR UPDATE` — always first (step 1).
2. `UserProfiles` row `FOR UPDATE` — always after every Quest-row acquisition
   (step 6).
3. FK `FOR KEY SHARE` acquisitions happen only at the step-9 flush, on rows this
   transaction already holds (its Quest) or on rows no flow ever locks
   exclusively (`AspNetUsers`, `Regions`, `QuestParticipations` — participation
   cancellation updates take `FOR NO KEY UPDATE`, which does not conflict with
   `KEY SHARE`).

Interaction with the other flows:

- **Quest-row lock (existing):** unchanged; redemption, rotation, and Quest edits
  keep serializing on it.
- **UserProfile-row lock (new):** taken by redemption and by reconciliation only;
  at most one profile row per transaction; cross-Quest same-user redemptions
  serialize here with no cycle (D5 proof).
- **Profile updates concurrent with redemption (M1):** the community snapshot is
  read from the profile row locked `FOR UPDATE`, so the snapshot always reflects
  the serialized profile state at the award — a Home Community change that
  commits before the lock is acquired is included; one that commits after is
  excluded; no torn intermediate is possible. Implementation requirement
  recorded for the future profile-update Slice: any path that mutates
  `UserProfiles.HomeCommunityRegionId` must take the same `FOR UPDATE` row lock
  before writing, so mutation and award serialize on the same row.
- **`SourceCompletionId` uniqueness:** inside redemption the XP row is inserted in
  the same transaction as its completion, so no concurrent inserter can exist; the
  index is a pure backstop (an unexpected violation is an invariant failure →
  untranslated 500, §12).
- **Verified-completion partial unique index:** unchanged behavior; the duplicate
  redemption loser still gets deterministic `409` before any XP write.
- **Reconciliation concurrent with redemption:** reconciliation only sees
  committed completions; a completion committed by redemption already has its XP
  row, so it is never eligible. The flows interact only through bounded lock
  waits (D5 matrix), never through conflicting writes.
- **Unrelated unique violations:** never converted (existing rule extended to the
  new constraint, §12).

## 10. Historical reconciliation algorithm

Proposed `XpReconciliationHostedService : BackgroundService` (Infrastructure),
executing passes of an internal, directly invokable `ReconcilePassAsync` (the
hosted loop is a thin wrapper, so tests never need a running host or a real
sleep):

```text
ExecuteAsync:
  if (!options.Enabled) return;
  await Task.Delay(options.InitialDelay, stoppingToken);          -- 0 in tests
  while (!stoppingToken.IsCancellationRequested):
      try { await RunOnePassSafelyAsync(); }                      -- swallows/logs, never crashes host
      catch (Exception ex) { Log(error, counts only); }
      await Task.Delay(options.IdleInterval, stoppingToken);

RunOnePass (per pass):
  courtesy: connection = open dedicated NpgsqlConnection           -- m1
      acquired = pg_try_advisory_lock(FIXED_COMPILED_KEY)          -- session-level; skip pass if false
      finally at pass end: { pg_advisory_unlock(key); dispose connection }
  attemptedIds = {}; awarded = alreadyAwarded = failed = 0
  consecutiveFailures = 0                            -- pass-scoped; NEVER reset per batch (M2)
  aborted = false
  loop:
      batch = award-eligible completions             -- reward-pending AND VerifiedAtUtc NOT NULL,
              excluding attemptedIds, ordered (VerifiedAtUtc, Id), take BatchSize, AsNoTracking
      if batch empty → break
      foreach candidate in batch (new scope + DbContext per row):
          attemptedIds.add(candidate.Id)             -- at most one attempt per row per pass (M2)
          try:
              BeginTransaction
              xp = XpTransaction.CreateFromVerifiedCompletion(candidate)
              Add(xp); SaveChangesAsync()        -- flush #1: insert (KEY SHARE parents BEFORE profile lock)
              profile = LockUserProfileForUpdate(candidate.UserId)  -- FOR UPDATE
              profile.ApplyXpAward(xp.XpAmount,
                  ComputeLevel(checked(profile.TotalXp + xp.XpAmount)), now)      -- m2 checked
              SaveChangesAsync()                 -- flush #2: profile update
              Commit                              -- XP row + progression commit together
              awarded++; consecutiveFailures = 0  -- reset only on success, never on batch boundary
          catch 23505 on UX_XpTransactions_SourceCompletionId:
              Rollback; alreadyAwarded++          -- a concurrent worker or prior pass won; no profile touch
          catch (Exception ex):
              Rollback; failed++; consecutiveFailures++
              Log(warning: pass id, completion id, exception type)   -- no profile data
              if consecutiveFailures >= options.MaxConsecutiveRowFailures → { aborted = true; break }
      if aborted → break
  unprocessable = count of reward-pending rows that are NOT award-eligible   -- null VerifiedAtUtc (M4)
  passComplete = (!aborted && failed == 0 && unprocessable == 0)
  Log(information: scanned, awarded, alreadyAwarded, failed, unprocessable, passComplete)   -- counts only
  if (!passComplete) Log(warning: reward state incomplete; readiness gate stays closed)     -- M3/M4
```

Properties, restated as obligations:

- **Finds every eligible row:** the anti-join award-eligibility query plus the
  until-empty loop; the reward-pending accounting query (no timestamp filter)
  covers **every** Verified-without-XP row, so no completion can fall outside
  the boundary (M4).
- **Bounded attempts (M2):** a row is attempted at most once per pass (in-pass
  `attemptedIds` exclusion); `consecutiveFailures` is pass-scoped and never
  resets on a batch boundary; an aborted or incomplete pass retries only on the
  next scheduled or explicitly invoked pass — a permanently failing row costs
  exactly one attempt per pass, never an unbounded hot loop.
- **Unprocessable rows are terminal, not silent (M4):** null-`VerifiedAtUtc`
  Verified rows are never attempted, are counted `unprocessable` on every pass,
  make the pass incomplete, and hold the §11 readiness gate closed until a human
  resolves the row (§18 stop condition).
- **Retryable after process or database failure:** any row whose transaction did
  not commit is still eligible on the next pass; committed rows are never
  re-eligible.
- **Overlap-safe (two instances/workers):** unique `SourceCompletionId`
  serializes duplicate inserts; the profile update executes only in the
  transaction whose insert succeeded; the courtesy advisory lock is an
  optimization with explicit `finally` release (m1), never a correctness
  mechanism.
- **No double award, no double increment:** proven by the §14 forced-overlap
  tests.
- **Bounded batches:** `BatchSize` default 100; per-row transactions bound lock
  hold time and blast radius.
- **No public reward-mutation endpoint:** none exists.
- **Safe logging:** counts always; completion ids at `Debug`; never display
  names, emails, or community values.
- **Deterministic tests without real sleeps:** the pass method is invoked
  directly with `InitialDelay = 0`; overlap is forced with externally held row
  locks (§14), not `Task.Delay`.

## 11. Proposed current-user read contract

Only if D6 is approved (otherwise this section is the explicit justification
record for having no read endpoint, and 5A ships write-core only):

| Method | Route | Auth | Success | Errors |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/users/me/progression` | Member+Organizer+Admin | `200 MyProgressionDto` | `401` anonymous; `503 progression-not-ready` while reward state is incomplete (M3); `404` profile row missing (impossible state) |

- **Readiness gate (M3, application-enforced):** before reading the profile, the
  service evaluates the reward-pending count (§10 accounting query — every
  Verified completion without an XP row, **no** timestamp filter) live against
  the database on each request. While it is non-zero — including any
  unprocessable null-`VerifiedAtUtc` row (M4) — the route returns `503` with a
  bounded `progression-not-ready` ProblemDetails carrying no counts or
  internals. The gate opens automatically when reconciliation completes and
  re-closes if an unrewarded row ever appears; there is no cache that could
  outlive reconciliation.
- `MyProgressionDto` — exactly `{ totalXp, level, rankTitle }`:
  `totalXp` int64 ≥ 0; `level` int 1–99; `rankTitle` one of the eleven accepted
  titles, derived from the persisted `Level` at read time.
- Identity: `ClaimTypes.NameIdentifier` only; no user id in route, query, or
  body; there is no way to read another user's progression.
- Read path: readiness gate first, then `UserProfiles` `AsNoTracking` by session
  id → DTO. The ledger is not re-aggregated on read (D1 projection); a
  drift-detection query exists for operations (§13), not for this endpoint.
- Documentation: OpenAPI/Scalar annotations like existing controllers;
  `ProblemDetails` via the existing helper.

## 12. Authorization, privacy, logging, and error behavior

- **Authorization:** progression read uses the explicit three-role list (existing
  convention); redemption authorization is unchanged. `XpTransaction` remains
  System-owned and immutable (`02` §6): no endpoint creates, updates, deletes, or
  lists ledger rows in 5A; Admin ledger read surfaces are deferred (Passport/
  leaderboard Slices).
- **Privacy:** the DTO carries the caller's own `totalXp`, `level`, `rankTitle`
  only — no email, user id, Home Community id/label, display name, completion
  ids, or other-user data; exact-key assertions in tests (§14). The `503`
  readiness response is a bounded ProblemDetails with no counts or internals.
  Leaderboard-related privacy thresholds are irrelevant here (self read) and
  unchanged.
- **Logging:** reconciliation logs per-pass counts (scanned, awarded,
  already-awarded, failed, unprocessable, complete/incomplete) and per-row
  failures (completion id, exception type); redemption logs nothing new; no XP
  values, profile data, or user identifiers beyond internal completion ids at
  `Debug`.
- **Error behavior:** redemption adds no new client-visible error class; the new
  profile-lock step fails only as an impossible state (`500`). Translation matrix
  (final): `23505/UX_QuestCompletions_UserId_QuestId_Verified` → `409`
  AlreadyCompleted; `23505/UX_XpTransactions_SourceCompletionId` → translated to
  the benign skip **only** inside reconciliation, never in the API path;
  `DbUpdateConcurrencyException` → `409` Concurrency; reward-pending count
  non-zero → `503 progression-not-ready` on the progression route only (M3); any
  other constraint or database error → untranslated `500` via
  `UseExceptionHandler`. The frontend sees no redeem-response change, so no
  frontend error-mapping change is needed.

## 13. Migration upgrade/rollback and deployment sequencing

**Upgrade path (single deploy, no manual step):**

1. Deploy the application containing the additive migration and the hosted
   reconciliation service. (Development environments apply migrations at startup
   via the existing `db.Database.Migrate()` convention; other environments apply
   migrations per the deployment runbook, unchanged.)
2. New redemptions award XP immediately and atomically (§9) from the first
   request after deploy.
3. The hosted service reconciles existing 4B completions in bounded batches
   (§10) without blocking startup or requests.
4. **Completion gate (4B §18 obligation 8; corrected per review M4):** reward
   state is presented as complete only after **every** Verified completion has
   an XP row — no timestamp filter, so an unprocessable row also blocks
   completion. Operational confirmation = the pass log line plus this read-only
   check:

   ```sql
   SELECT COUNT(*) FROM "QuestCompletions" c
   WHERE c."Status" = 'Verified'
     AND NOT EXISTS (SELECT 1 FROM "XpTransactions" x
                     WHERE x."SourceCompletionId" = c."Id");
   -- expected: 0
   ```

5. During the deploy-to-reconciled window, the progression read route enforces
   the same boundary in the application (§11): it returns
   `503 progression-not-ready` while the reward-pending count is non-zero, so a
   caller can never mistake partial backfill for authoritative final state
   (review M3 — this behavior is proposed, pending approval, not yet accepted).

**Consistency audit (read-only, optional):**
`SELECT "Id" FROM "UserProfiles" p WHERE p."TotalXp" IS DISTINCT FROM COALESCE((SELECT SUM("XpAmount") FROM "XpTransactions" x WHERE x."UserId" = p."Id"), 0);`
— expected empty; any row indicates drift to be recomputed from the ledger
(repair procedure: recompute `TotalXp = SUM`, `Level = ComputeLevel(SUM)` per
user inside one transaction per user; documented, not implemented in 5A).

**Rollback:**

- Application rollback to the pre-5A build is safe: the old code ignores the new
  table and columns (fully additive, nullable or constant-defaulted).
- Database `Down()` drops `XpTransactions` and the progression columns and is
  therefore **destructive to ledger data**; prefer roll-forward. `Down()` is
  still implemented and observed in tests (§14) because migration reversibility
  must be proven, not assumed.
- Applied/shared migrations remain immutable; any correction lands as a new
  migration (`02` §10.3).

## 14. Unit, PostgreSQL integration, concurrency, migration, and API test matrix

All tests reuse the existing Testcontainers (`postgres:17-alpine`) fixtures,
`IMigrator` upgrade pattern, and externally-held-lock contention pattern; no new
dependency. Concurrency tests prove genuine overlap with deterministic locks and
`pg_stat_activity` blocked-session observation — never `Task.WhenAll` alone.

### 14.1 Unit tests (Core)

- `ProgressionRulesTests`: Easy/Medium/Hard → 50/100/150; undefined
  `QuestDifficulty` value rejected; `RequiredXpForLevel` boundary table (§8
  values); `ComputeLevel` at 0, 44, 45, 99, 100, 51,939, 51,940, and
  `long` extremes; exact Level 99 cap (level never exceeds 99, total keeps
  accruing); all eleven rank-title boundaries (1, 9, 10, 19, 20, 29, 30, 39, 40,
  49, 50, 59, 60, 69, 70, 79, 80, 89, 90, 98, 99); invalid level/total guard
  exceptions.
- `XpTransactionDomainTests`: factory creates from a Verified completion;
  amount taken from `RewardDifficultySnapshot` even when the source Quest's
  `Difficulty` and `XpAward` differ (mutable-field-ignored proof); community
  copied from the completion snapshot including null; `CreatedAt =
  VerifiedAtUtc`; guards reject non-Verified status, null `VerifiedAtUtc`,
  empty ids, undefined snapshot.
- `UserProfileProgressionTests`: `ApplyXpAward` accumulates, recomputes level,
  sets `UpdatedAt`; guards reject non-positive amounts, out-of-range levels,
  negative results; **overflow guard (m2):** a checked addition that would
  exceed `long.MaxValue` throws `OverflowException` and leaves the profile
  state unchanged.

### 14.2 PostgreSQL migration and schema tests

- Migration applies to a clean schema and over the current merged 4B schema
  (`IMigrator` to `20260725063439_AddQuestCompletionCodes`, then to latest —
  existing pattern).
- Catalogue + behavioral assertions on real PostgreSQL: exact `XpTransactions`
  columns/nullability; `CK_XpTransactions_XpAmount_Positive` rejects `0` and
  negative amounts; `UX_XpTransactions_SourceCompletionId` duplicate rejection;
  the two composite indexes exist with the accepted column order; all four FKs
  are `Restrict` (deletion of a referenced user/Quest/completion/Region is
  rejected); `UserProfiles` gains `TotalXp`/`Level` with both `CHECK`s and
  existing rows backfilled to `0`/`1`; no `xmin` on `XpTransactions` or
  `UserProfiles`.
- `Down()` observed: drops the table and both columns on a copied database;
  documented as destructive (§13).

### 14.3 PostgreSQL persistence and API tests

- One Verified redemption creates exactly one completion + one XP row + one
  profile update atomically; XP amount from the difficulty snapshot; community
  from the completion snapshot; `CreatedAt = VerifiedAtUtc`.
- Injected failure rolls back all three writes: a test-created PostgreSQL
  `BEFORE INSERT` trigger on `XpTransactions` raising for the target completion
  id forces the step-9 flush to fail; afterwards no completion row, no XP row,
  and unchanged profile exist; the client receives a generic failure; the
  trigger is dropped afterwards.
- `SourceCompletionId` prevents duplicates: a second raw insert referencing the
  same completion fails with `23505` naming the approved constraint.
- Multiple simultaneous rewards for one user (different Quests) produce the
  exact expected `TotalXp` and `Level`.
- SelfReported/non-Verified completions receive no reward (eligibility query
  never selects them; defensive factory guards fire).
- Later Quest mutation (difficulty, `XpAward`, dates), profile community change,
  or Region deactivation does not alter existing ledger rows (immutable-field
  assertions before/after).
- Reconciliation: seeds 4B-style completions (pre-ledger rows created via the
  existing 4B paths, then verified eligible), runs one pass, asserts exact rows,
  amounts, timestamps, attribution, and profile totals/levels; a repeated pass
  is a strict no-op (row counts, totals, and `UpdatedAt` unchanged).
- Unprocessable-row accounting (M4): a Verified row with null `VerifiedAtUtc`
  (inserted via raw SQL to simulate the impossible state) is **never attempted**
  and never awarded; it is counted `unprocessable` on every pass, makes the pass
  incomplete, appears in the reward-pending accounting count, and holds the
  readiness gate closed (progression read returns `503`) until the row is
  resolved.
- Persistent failure is bounded (M2): one permanently failing row (forced by a
  test trigger) is attempted exactly once per pass — proven by counting insert
  attempts — the pass terminates promptly at the circuit-breaker threshold, and
  the row is retried only when the next pass is explicitly invoked; no repeated
  attempts occur within one pass.
- Read API (if D6 approved): anonymous → `401`; with any reward-pending
  completion (including an unprocessable null-timestamp row) →
  `503 progression-not-ready`, bounded and exact-key, before any profile read;
  after reconciliation completes → Member, Organizer, and Admin each → `200`
  with own values; exact-key DTO assertion (`totalXp`, `level`, `rankTitle`
  only); values equal server-computed expectations after seeded awards; no
  identity or community fields present; no route/query user selector exists;
  session of user B never returns user A's progression.
- Regression: the existing 4B redeem/state contract, error mappings, rate
  limiting, and CSRF behavior are re-run unchanged (full gates, §16).

### 14.4 Concurrency tests (deterministic, real overlap)

- **Redemption vs Home Community update (M1):** externally hold the user's
  `UserProfiles` row `FOR UPDATE`; start a redemption and observe it blocked at
  the profile lock in `pg_stat_activity`; inside the external transaction update
  the Home Community to region B and commit; the redemption resumes and must
  create the completion and XP row attributed to B — the serialized profile
  state at the lock — never the stale pre-lock value A.
- **Redemption vs redemption (same user, two Quests):** externally hold the
  user's `UserProfiles` row `FOR UPDATE`; start both redemptions; observe both
  blocked in `pg_stat_activity`; release; assert both succeed, two XP rows, and
  one exact summed total/level.
- **Reconciliation vs reconciliation (same completion):** two workers (separate
  scopes/containers of DbContexts), externally hold the profile row to force the
  overlap window; release; assert exactly one XP row and exactly one increment;
  the loser logged already-awarded.
- **Reconciliation vs reconciliation (same user, different completions):** both
  XP rows created; profile incremented exactly twice; level exact.
- **Reconciliation vs redemption:** a redemption commits while a pass runs; the
  pass never selects that completion afterwards (committed pair), and a row the
  pass is processing concurrently is awarded exactly once across both flows.
- **No-deadlock soak:** the D5 lock matrix flows run against each other in a
  bounded loop with externally staggered locks; completion within the statement
  timeout is the pass condition (no `deadlock detected`).

### 14.5 Hosted-service control

- The API test factory disables the hosted service via
  `XpReconciliation:Enabled=false` so no background pass races seeded fixtures;
  reconciliation behavior is tested by invoking `ReconcilePassAsync` directly
  with `InitialDelay = 0` and controlled batch sizes (including a multi-batch
  pass proving the until-empty loop, and the M2 bounded-attempt
  permanent-failure pass proving one attempt per row per pass).

## 15. Implementation file map

Proposed (implementation owner confirms at execution; no file is created or
modified by this plan):

| File | Change |
| --- | --- |
| `backend/src/Kiwimpact.Core/Entities/XpTransaction.cs` | NEW — ledger entity + factory guards |
| `backend/src/Kiwimpact.Core/Entities/UserProfile.cs` | ADD `TotalXp`, `Level`, `ApplyXpAward` (checked addition) |
| `backend/src/Kiwimpact.Core/Services/ProgressionRules.cs` (or `Kiwimpact.Core/Progression/`) | NEW — §8 pure rules |
| `backend/src/Kiwimpact.Core/Services/ProgressionModels.cs` | NEW — `MyProgressionState` record (if D6) |
| `backend/src/Kiwimpact.Core/Repositories/IXpLedgerRepository.cs` | NEW — eligibility/accounting queries, award persistence, progression read |
| `backend/src/Kiwimpact.Core/Services/IProgressionService.cs`, `ProgressionService.cs` | NEW — read service + readiness gate (if D6) |
| `backend/src/Kiwimpact.Core/Services/QuestCompletionService.cs` | unchanged signature (redeem DTO unchanged) |
| `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs` | ADD `DbSet<XpTransaction>` |
| `backend/src/Kiwimpact.Infrastructure/Data/Configurations/XpTransactionConfiguration.cs` | NEW — §7.1 mapping |
| `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserProfileConfiguration.cs` | ADD two columns + checks |
| `backend/src/Kiwimpact.Infrastructure/Repositories/XpLedgerRepository.cs` | NEW — reconciliation queries, per-row award, profile lock, progression read |
| `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs` | EXTEND `RedeemAsync` per §9 (add steps 6–9; remove the unlocked community projection) |
| `backend/src/Kiwimpact.Infrastructure/Reconciliation/XpReconciliationOptions.cs`, `XpReconciliationHostedService.cs` | NEW — §10 |
| `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs` | register repository + hosted service |
| `backend/src/Kiwimpact.Infrastructure/Migrations/*_AddXpLedgerAndProgression.cs(.Designer.cs)`, `KiwimpactDbContextModelSnapshot.cs` | NEW — generated |
| `backend/src/Kiwimpact.Api/Contracts/ProgressionContracts.cs` | NEW — `MyProgressionDto` (if D6) |
| `backend/src/Kiwimpact.Api/Controllers/ProgressionController.cs` | NEW — `GET /api/v1/users/me/progression` (if D6) |
| `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs` | ADD mapper (if D6) |
| `backend/src/Kiwimpact.Api/Program.cs` | register read service + `XpReconciliationOptions` binding |
| `backend/tests/Kiwimpact.UnitTests/Core/ProgressionRulesTests.cs`, `XpTransactionDomainTests.cs`, `UserProfileProgressionTests.cs` | NEW — §14.1 |
| `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpLedgerMigrationUpgradeTests.cs`, `XpLedgerPersistenceTests.cs`, `XpReconciliationTests.cs`, `XpConcurrencyTests.cs` | NEW — §14.2–14.4 |
| `backend/tests/Kiwimpact.IntegrationTests/Api/ProgressionApiTests.cs` | NEW (if D6) |
| `backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs` | set `XpReconciliation:Enabled=false` |
| `specs/ai/prompts/45-…` (implementation prompt record), `specs/implementation/reports/05a-…` (completion report), `specs/ai/reviews/…` (independent review) | evidence per AGENTS.md |
| Accepted documents listed in D7 | amended only after human approval, inside the implementation Slice |

No `frontend/` change. No `.csproj`, lockfile, configuration, seed, or
authentication change. `QuestCompletionController`/contracts unchanged.

## 16. Verification gates

Applicable gates for this backend-only Slice, run from `backend/` after
implementation (no frontend file changes → no frontend gates):

```bash
dotnet build Kiwimpact.slnx
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
```

Then `git diff --check HEAD`, `git diff --stat HEAD`, `git diff --name-status
HEAD`, `git status --short`, `git ls-files --others --exclude-standard`. A gate
is claimed only when executed and observed.

## 17. Evidence and independent-review workflow

1. **This plan** → independent read-only design review by Codex (record under
   `specs/ai/reviews/`) → human decision on D1–D7 and the §19 checklist.
2. Implementation by a single implementation owner (AGENTS.md routing), including:
   implementation prompt record under `specs/ai/prompts/`; targeted tests during
   implementation; full applicable gates once; completion report under
   `specs/implementation/reports/` (implemented scope, files changed, observed
   gate results, known limitations, review status).
3. One independent read-only implementation review (reviewer ≠ implementer),
   one concentrated correction pass, one targeted closure check on the original
   Blocker/Major findings (AGENTS.md bounded workflow).
4. Human staging/commit inspection; the human performs or explicitly approves any
   commit, merge, or deploy. This plan authorizes none of those.

## 18. Risks, known limitations, and explicit stop conditions

**Risks and mitigations:**

- *Progression projection drift vs ledger* — prevented by recompute-in-transaction
  and the unique award boundary; detectable via the §13 audit query; repairable
  from the ledger.
- *Bounded lock waits on hot Quest rows* (reconciliation `KEY SHARE` vs
  redemption/rotation/edit `FOR UPDATE`) — bounded by per-row transactions and
  batch size; no deadlock per the D5 ordering proof.
- *Reconciliation window semantics (corrected per M3)* — the progression route
  returns `503 progression-not-ready` while the reward-pending count is
  non-zero, so the backfill window can no longer be observed as authoritative
  final state; the window is an availability matter, not a correctness one.
- *Impossible-state rows (corrected per M4)* — a Verified completion with null
  `VerifiedAtUtc` is never attempted: it is counted `unprocessable` on every
  pass, holds the readiness gate closed, and triggers the stop condition below
  if ever observed in a real environment; a missing profile row → 500; both are
  surfaced in the completion report if observed.
- *Courtesy advisory lock misuse* — correctness tests run with it unavailable so
  no hidden dependency forms; `finally` release plus disposal prevents lock
  leakage (m1).

**Known limitations (accepted for P0):** no reward UX or reveal; no leaderboard,
achievement, or streak consumption of the ledger; no Admin ledger read; drift
repair is a documented manual procedure, not an implemented tool; `Quest.XpAward`
remains as a dead-but-present column (docs-only deprecation).

**Stop conditions — stop and request human direction if:**

- implementation reveals a conflict between approved decisions and accepted
  documents not recorded in §5/D7;
- a real Verified completion with null `VerifiedAtUtc` is found (it must remain
  unrewarded and gate-blocking until the human decides its resolution);
- a new dependency, a public reward-mutation surface, or any frontend change
  appears necessary;
- modifying, deleting, or rewriting existing 4B completion history appears
  necessary;
- the accepted reward rules (amounts, formula, cap, bands) prove to differ from
  §4 sources.

## 19. Human approval checklist

Implementation may start only after the human explicitly approves each item
(after the Codex targeted closure check):

- [ ] **D1** — persist `UserProfiles.TotalXp` (`bigint`, default 0, CHECK ≥ 0)
      and `Level` (`int`, default 1, CHECK 1–99); Rank Title derived; no new
      concurrency token; ledger as audit source of truth; checked-addition
      overflow guard (m2).
- [ ] **D2** — `XpTransaction.CreatedAt = SourceCompletion.VerifiedAtUtc` for
      reconciled and future awards; processing time never used; the
      reward-accounting boundary covers every Verified-without-XP row with no
      timestamp filter, and unprocessable rows terminally block readiness (M4).
- [ ] **D3** — `CommunityRegionIdAtAward` copied from
      `CommunityRegionIdAtCompletion`; for future redemptions the snapshot is
      taken from the profile row locked `FOR UPDATE` (M1); the §5/D3 wording
      amendment to `02-core-domain-data-model.md` §3.10 and
      `01-community-identity-data-model.md` §4.2.
- [ ] **D4** — reconciliation as a hosted `BackgroundService` with the §10
      mechanics (batches, per-row transactions, unique-boundary skip,
      pass-level failure accounting with at-most-one-attempt-per-row-per-pass,
      circuit breaker, unprocessable-row terminal accounting, courtesy advisory
      lock with `finally` release, options, counts-only logging); no public
      reward-mutation endpoint; no migration data backfill.
- [ ] **D5** — the §9 redemption transaction (profile locked `FOR UPDATE`
      before the completion is created and the community snapshot read from
      that locked row), the global lock-order invariant (Quest before
      UserProfile; one profile per transaction), and the §12 error-translation
      matrix.
- [ ] **D6** — `GET /api/v1/users/me/progression` with the exact three-key DTO
      and the application-enforced `503 progression-not-ready` readiness gate
      (or its rejection, making 5A write-core only).
- [ ] **D7** — the listed accepted-document amendments, executed inside the
      implementation Slice only.
- [ ] **Scope** — §6 in-scope/out-of-scope boundaries, including docs-only
      `Quest.XpAward` deprecation and zero frontend change.
- [ ] **Schema** — §7 table/columns/indexes/checks/FK behaviors and the single
      additive, schema-only migration.
- [ ] **Tests** — §14 matrix, including forced-overlap concurrency tests (the
      M1 community-update overlap), bounded-attempt permanent-failure tests,
      readiness-gate tests, and observed migration `Down()`.
- [ ] **Workflow** — §17 evidence and review sequence before any commit.
