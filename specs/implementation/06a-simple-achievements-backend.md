Status: Approved — Slice 6A-1 implementation authorized; Slice 6A-2 remains sequenced after 6A-1 closure

# Slice 6A — Simple Achievements Backend

- **Date:** 2026-07-26 (first version, Review 40 correction and targeted
  closure, unified human approval)
- **Risk:** High — additive reward-adjacent schema, write concurrency on both
  XP award paths, historical backfill, idempotency
- **Planning owner:** Kimi K3 (planning only; no implementation authority)
- **Intended implementation owner:** one implementation session per AGENTS.md
  routing (Codex default), assigned by the human after this plan is approved
- **Design reviewer:** Codex (independent read-only design review of this plan)
- **Planning prompt record:** `specs/ai/prompts/48-slice-6a-simple-achievements-backend-first-plan.md`
- **Design review:** `specs/ai/reviews/40-slice-6a-codex-independent-design-review.md`
  (initially `CHANGES REQUIRED`; targeted closure `APPROVE`, M1–M5 closed)
- **Human decision:** Approved 2026-07-26 — D1–D8, the exact catalog,
  additive schema and staged omission of `SourceCommunityChallengeId`,
  sequential 6A-1 → 6A-2 delivery, and the recorded 6A-1 size exception

> The corrected design has passed its targeted closure check and received
> unified human approval. Slice 6A-1 implementation is authorized within this
> contract. Slice 6A-2 remains sequenced after 6A-1 is complete, verified, and
> independently reviewed. Approval does not prove implementation.

**Revision note (2026-07-26):** this revision applies the single concentrated
correction pass for Review 40. M1 (trigger snapshot semantics), M2
(`UserAchievement` 23505 rollback/retry), M3 (fail-closed catalog), M4
(actual lock-order documentation), M5 (split into sequential implementation
tasks 6A-1 and 6A-2), and the Minor workflow-order finding are corrected in
place. The targeted closure check subsequently closed M1–M5 with final
`APPROVE`, and the human approved the corrected rules, schema, task split,
and 6A-1 size exception (§20).

## 1. Status and planning boundary

Implementation plan for Slice 6A, the smallest safe backend vertical slice
satisfying the P0 requirement "at least three simple achievements"
(`specs/product/04-phase-2-delivery-scope.md` §2.1). Every open
implementation choice is surfaced as an explicit decision (D1–D8, §6) with
alternatives, tradeoffs, consequences, and an approval label. **All eight
decisions require explicit human approval** before implementation; that
approval was granted after the targeted closure check (§20 workflow).

This task was planning only. No production code, migration, configuration,
test, dependency, or accepted specification was changed to produce this plan.
The files created by planning are this plan, its planning-prompt record, and
the Review 40 record. The pre-existing human-authorized modification to
`PROJECT_STATUS.md` was preserved unchanged.

Scheduling context: `specs/product/04-phase-2-delivery-scope.md` records
status "Proposed — pending design review". It controls current assessment
scheduling (P0/P1/Deferred ordering) and is used here only for that purpose;
it is not treated as an accepted architecture or data-model decision.

## 2. Executive summary

Slice 6A delivers exactly three cumulative verified-completion milestone
achievements (thresholds 1, 3, 5), derived exclusively from the authoritative
`XpTransaction` ledger, awarded atomically inside the two existing XP award
paths (live Completion Code redemption and hosted historical reconciliation),
backfilled deterministically for users who already hold XP transactions, and
exposed through the two accepted read routes
(`GET /api/v1/achievements` anonymous catalog,
`GET /api/v1/users/me/achievements` authenticated own-earned).

The plan proposes one additive schema-only migration creating `Achievements`
and `UserAchievements`. The accepted long-term `UserAchievement` model
(`specs/architecture/02-core-domain-data-model.md` §3.12) contains nullable
`SourceCommunityChallengeId` referencing the Deferred, unimplemented
`CommunityChallenge` table. This plan resolves that staged-schema conflict by
**omitting `SourceCommunityChallengeId` from the Slice 6A physical schema**
(D3, option 1) and adding it later together with Community Challenge. This is
the only variance from the accepted long-term model and is flagged explicitly
in §9 and §18.

Award semantics are snapshot-deterministic (Review 40 M1 correction):
eligibility uses only the committed `XpTransaction` count; when an award row
is first created, its trigger is resolved from the transactionally stable
ledger snapshot visible while holding the profile lock (including the staged
XP transaction where applicable), choosing the Nth row by the documented
total order `(CreatedAt ASC, Id ASC)`; the resolved `XpTransactionId` and
`AwardedAt = trigger.CreatedAt` are persisted immutably and are never
rewritten by later backdated or equal-timestamp ledger rows. Live,
reconciliation, and backfill produce identical awards when — and only when —
they evaluate the same ledger snapshot.

The required three-row catalog is a hard precondition (M3 correction): it is
seeded concurrency-safely before any hosted reconciliation/backfill starts,
validated completely at startup, and any catalog defect fails application
startup. Catalog absence never means "no awards and ready".

Per Review 40 M5, implementation is split into two sequential tasks with
separate prompt, report, and review obligations: **6A-1 Achievement Award
Core** (schema, catalog, rules, award writes, backfill — no HTTP) and
**6A-2 Achievement Read API** (the two read endpoints — no schema or
award-write changes). Task contracts are in §16.

No frontend, Community Challenge, streak, category, leaderboard, rules-engine,
dependency, Docker, or authentication change is included. Slice 6B (Passport
achievement UI) is a separate future Slice consuming the §17 contract.

## 3. Verified merged baseline with file-level evidence

Reviewed branch and HEAD: `feat/slice-6a-simple-achievements-backend` at
`2706e0cd968a3b254910552df34f288c0013b21f` ("Merge pull request #13 from
Zephyr724/05b-passport-lite"), inspected 2026-07-26 and re-inspected before
the Review 40 correction pass. Slice 5A (`7eea4fe`, PR #12) and Slice 5B
(`2706e0c`, PR #13) are merged ancestors of HEAD. Working tree: exactly one
tracked modification, `PROJECT_STATUS.md` (the expected human-authorized
status update, which already records this branch and baseline); the only
other entries are the untracked planning/evidence files created by this
planning task. No unrelated modification. Verification method: `git branch
--show-current`, `git log`, `git status --porcelain`.

Each prompt baseline statement, verified against merged source:

1. **P0 requires at least three simple achievements — CONFIRMED.**
   `specs/product/04-phase-2-delivery-scope.md:35` ("At least three simple
   achievements") under §2.1 P0. The document's status line (`:3`) is
   "Proposed — pending design review"; per its own §1 it controls scheduling
   only.
2. **Richer achievements and streaks are P1 — CONFIRMED.**
   `specs/product/04-phase-2-delivery-scope.md:87-88` ("Richer achievements.
   Streak." under §3 P1).
3. **`UserProfile` persists `TotalXp` and `Level` — CONFIRMED.**
   `backend/src/Kiwimpact.Core/Entities/UserProfile.cs` (`TotalXp` long,
   `Level` int, `ApplyXpAward` with checked addition and internal
   `ProgressionRules.ComputeLevel` recompute);
   `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserProfileConfiguration.cs`
   (defaults and `CK_UserProfiles_TotalXp_NonNegative`,
   `CK_UserProfiles_Level_Range`); migration
   `20260725144430_AddXpLedgerAndProgression`;
   accepted model `specs/architecture/02-core-domain-data-model.md:74-75`.
4. **`XpTransaction` is the authoritative verified-reward ledger — CONFIRMED.**
   `specs/architecture/02-core-domain-data-model.md:264-282` (§3.10);
   `backend/src/Kiwimpact.Core/Entities/XpTransaction.cs`
   (`CreateFromVerifiedCompletion` factory: Verified-status guard, non-null
   `VerifiedAtUtc` guard — "award timestamp is never invented").
5. **Every `XpTransaction` has a unique `SourceCompletionId` — CONFIRMED.**
   `specs/architecture/02-core-domain-data-model.md:271` and `:376`;
   `backend/src/Kiwimpact.Infrastructure/Data/Configurations/XpTransactionConfiguration.cs`
   (`UX_XpTransactions_SourceCompletionId`); observed enforcement in
   `XpLedgerRepository.AwardVerifiedCompletionAsync`
   (`backend/src/Kiwimpact.Infrastructure/Repositories/XpLedgerRepository.cs:62-104`)
   where `23505` on that constraint maps to benign `AlreadyAwarded`.
6. **XP amounts come from server-owned rules, not client input or mutable
   Quest reward fields — CONFIRMED.**
   `backend/src/Kiwimpact.Core/Progression/ProgressionRules.cs`
   (`XpForDifficulty`: Easy 50 / Medium 100 / Hard 150); amount derives only
   from the immutable `QuestCompletion.RewardDifficultySnapshot`;
   `Quest.XpAward` is documented "not a reward input"
   (`specs/architecture/02-core-domain-data-model.md:107`).
7. **`XpTransaction.CreatedAt` is the award-effective timestamp and equals the
   source completion's `VerifiedAtUtc` — CONFIRMED.**
   `specs/architecture/02-core-domain-data-model.md:274`; enforced by the
   `XpTransaction.CreateFromVerifiedCompletion` factory guard
   (`XpTransaction.cs`); 5A completion report D2
   (`specs/implementation/reports/05a-xp-ledger-and-progression-core-completion.md`).
8. **Completion Code redemption creates Verified completion + XP + profile
   progression atomically — CONFIRMED.**
   `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs:133-235`
   (`RedeemAsync`: Quest `FOR UPDATE` → 4B eligibility rules →
   `LockUserProfileAsync` `FOR UPDATE` → completion + XP construction →
   `profile.ApplyXpAward` → one `SaveChangesAsync()` → one commit; `23505` on
   `UX_QuestCompletions_UserId_QuestId_Verified` → `AlreadyCompleted`;
   `UX_XpTransactions_SourceCompletionId` deliberately untranslated =
   invariant failure). Accepted boundary:
   `specs/architecture/02-core-domain-data-model.md:413` (§7).
9. **Historical XP reconciliation awards one eligible completion per
   transaction and is idempotent through unique `SourceCompletionId` —
   CONFIRMED.** `backend/src/Kiwimpact.Infrastructure/Reconciliation/XpReconciliationRunner.cs`
   (`ReconcilePassAsync` with `pg_try_advisory_lock`, fixed
   `AdvisoryLockKey = 727414900000005017L`; `ReconcilePassCoreAsync` lock-free
   body) driving `XpLedgerRepository.AwardVerifiedCompletionAsync` per row in
   its own transaction (XP flush → profile `FOR UPDATE` → progression →
   commit; `23505` → benign `AlreadyAwarded`).
10. **Both live redemption and historical reconciliation are
    achievement-triggering paths — CONFIRMED as a design constraint.** These
    are the only two production code paths that create `XpTransaction` rows
    (verified by reading both repositories; no other writer exists). The plan
    hooks award evaluation into both (§11, §12).
11. **No implemented `Achievement`/`UserAchievement` artifact exists —
    CONFIRMED.** Case-insensitive search for `Achievement` and
    `CommunityChallenge` across all of `backend/` (src and tests) on
    2026-07-26 returned no matches: no entity, configuration, DbSet,
    migration, repository, service, controller, contract, seed, or test.
12. **Accepted API document lists the two routes without an exact DTO
    contract — CONFIRMED.** `specs/architecture/03-api-contract.md:288-293`
    (§2.12: `GET /api/v1/achievements` auth None;
    `GET /api/v1/users/me/achievements` auth Member+; no request/response
    schema, ordering, or error conditions specified).
13. **Current Passport frontend has no achievement data or UI — CONFIRMED.**
    Case-insensitive search for `achievement` across `frontend/src` on
    2026-07-26 returned no matches.
14. **TanStack Query owns future achievement server state; Zustand must not
    store catalog or earned records — CONFIRMED.**
    `specs/00-project-profile.md:284-296` (§8 State Ownership: "Do not
    duplicate authoritative Quest, user, participation, completion, claim,
    XP, achievement, or leaderboard data in Zustand").
15. **`CommunityChallenge` is Deferred and its table is not implemented —
    CONFIRMED.** `specs/product/04-phase-2-delivery-scope.md:109` (Deferred);
    no entity or migration exists (same search as item 11).
16. **The accepted long-term `UserAchievement` model includes nullable
    `SourceCommunityChallengeId` whose referenced table does not exist —
    CONFIRMED.** `specs/architecture/02-core-domain-data-model.md:307`
    (§3.12 FK → `CommunityChallenge.Id`) and `:316-343` (§3.13, unimplemented).
    Resolved explicitly in D3.

Additional verified baseline facts used by this plan:

- Latest migration: `20260725144430_AddXpLedgerAndProgression`; migration
  history is five migrations
  (`backend/src/Kiwimpact.Infrastructure/Migrations/`).
- `ForeignKeyIndexConvention` is removed in
  `KiwimpactDbContext.ConfigureConventions`
  (`backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`): new
  configurations must declare every needed FK lookup index explicitly.
- Configurations are discovered via `ApplyConfigurationsFromAssembly`.
- Seed precedent: static idempotent seed classes under
  `backend/src/Kiwimpact.Infrastructure/Data/Seeds/` (`RegionSeed`,
  `DemoQuestSeed`, `IdentitySeed`), invoked from `Program.cs:224-326`; role
  seeding runs in every environment, Region/demo seeding is
  Development-only; `db.Database.Migrate()` runs Development-only. The
  `Program.cs` seed block executes synchronously before `app.Run()`, and
  therefore before any hosted service executes a pass.
- API read-endpoint precedent: `ProgressionController` and
  `PassportController` (class-level
  `[Authorize(Roles = AppRoles.Member + "," + AppRoles.Organizer + "," + AppRoles.Admin)]`,
  identity only from `ClaimTypes.NameIdentifier`, XML `<summary>` +
  `[ProducesResponseType]` OpenAPI annotations, domain-exception →
  `ProblemDetailsHelper` mapping). `ProblemDetailsHelper.ProgressionNotReady()`
  already defines the bounded `503` type
  `https://kiwimpact.app/problems/progression-not-ready`.
- Readiness precedent: `ProgressionService` evaluates the live global
  reward-pending anti-join before reading profile state (never cached);
  `PassportService` evaluates profile-existence (404) then a caller-scoped
  invariant check (503) before composing a page.
- API fixtures disable hosted reconciliation
  (`XpReconciliation:Enabled=false` in `CustomWebApplicationFactory`) and
  invoke passes directly.

No baseline statement required correction.

## 4. Goals

- A fixed catalog of exactly three active simple achievements (D1), persisted
  in a new `Achievements` table with deterministic IDs, concurrency-safe
  seeding, and fail-closed startup validation (M3).
- Eligibility derived only from authoritative persisted reward data: the
  caller's committed `XpTransaction` rows (D2).
- Atomic, idempotent, concurrency-safe awards on both XP-creation paths plus
  a deterministic historical backfill (D3, D4), with immutable award records
  resolved from the locked ledger snapshot (M1).
- Public active-catalog read and authenticated current-user earned read with
  exact DTOs, bounded errors, privacy exclusions, and OpenAPI/Scalar coverage
  (D5) — delivered as the separate sequential task 6A-2 (M5).
- PostgreSQL-backed tests per the §15 matrix; all applicable backend gates
  run once and observed per task (D7).
- A clean, documented backend contract for the separate Slice 6B frontend
  (§17).

## 5. Non-goals

Everything in the Prompt 48 explicit exclusions list, including: any frontend
change; unlock animation/toast/modal/sound; streaks; category-specific,
level/rank, community, or challenge achievements; Community Challenge
entities or behavior (including the `CommunityChallenge` table and
`SourceCommunityChallengeId` column); leaderboard; Share Card; SignalR;
theme switching; Zustand changes; Docker/deployment; account lifecycle or
authentication redesign; evidence claims/Admin review/self-reporting; Admin
achievement CRUD; user-authored achievements; a generic expression/rules
engine; criteria columns; dependency additions; unrelated refactors. None of
these is claimed as partially implemented.

## 6. D1–D8 decision table

Each decision lists recommendation, alternatives, tradeoffs, and consequences.
**Every decision required human approval; D1–D8 were approved on
2026-07-26 after the targeted closure check** (§20).

### D1 — Exact Slice and catalog boundary — APPROVED 2026-07-26

- **Recommended:** exactly three achievements; cumulative verified-completion
  milestones at thresholds 1, 3, 5; category `Milestone`; `IconUrl` seeded
  null (Slice 6B maps `code` → icon client-side); inactive achievements
  excluded from both reads; later additions are new seeded rows only.
  Exact proposed content in §7.
- **Alternatives:** (a) larger catalog (6–8 per the accepted model's deferred
  note) — rejected: expands a P0 slice toward P1 "richer achievements";
  (b) level/rank milestones instead of completion milestones — rejected:
  completion milestones derive from the ledger's idempotency key and need no
  new threshold state; (c) persist `IconUrl` values — rejected for 6A: no
  icon asset pipeline exists; nullable column is retained for the long-term
  model; (d) include inactive rows in reads with a flag — rejected: leaks
  unreleased content and complicates the contract.
- **Tradeoffs:** thresholds 1/3/5 are reachable in a demo (Easy quests = 50
  XP each) and demonstrable in the submission video; a fixed code-defined
  rule set means catalog display edits are seed changes, not runtime config.
- **Consequences:** `AchievementCatalog` static definitions (§12); seed with
  three deterministic GUIDs; evaluator keyed by `Code`; no criteria columns.

### D2 — Authoritative eligibility and award semantics — APPROVED 2026-07-26

- **Recommended (M1-corrected):** eligibility = count of the user's committed
  `XpTransaction` rows (each row uniquely represents one verified completion
  via unique `SourceCompletionId`). A `QuestCompletion` without an XP row
  never counts (it is reward-pending or unprocessable — awarding from it
  would decouple achievements from the verified-reward boundary and from the
  readiness gate). When an award row is first created, its trigger is
  resolved from the **transactionally stable ledger snapshot visible while
  holding the profile lock** — including the staged XP transaction where
  applicable (live redemption) — choosing the Nth row by the total order
  `(CreatedAt ASC, Id ASC)`. The resolved `XpTransactionId` and
  `AwardedAt = trigger.CreatedAt` are persisted as the **immutable** award
  record: later backdated or equal-timestamp XP rows never rewrite an
  existing award. Live, reconciliation, and backfill produce identical
  awards only when evaluating the same ledger snapshot; where snapshots
  legitimately differ (e.g., a backdated row reconciled after newer live
  awards), the committed award record is authoritative. One transaction can
  never cross two milestones (count grows by one per award), but the
  evaluator awards **all** eligible-not-yet-earned active milestones at
  every evaluation (catch-up semantics) so late-activated or re-activated
  catalog entries and any missed evaluation self-heal on the next award or
  backfill pass. Inactive achievements are not awarded and not returned;
  persisted awards are never revoked by catalog edits — display fields are
  read from the current catalog row. Catalog data cannot be missing or
  malformed at runtime: startup validation fails closed (M3, §9).
- **Alternatives:** (a) count `QuestCompletion` Verified rows — rejected:
  admits reward-pending/unprocessable rows and breaks the
  "verified **rewarded** completion" semantics; (b) `AwardedAt` = processing
  time — rejected: non-deterministic and contradicts the ledger's
  award-effective timestamp precedent; (c) award only the single crossed
  milestone — rejected: no self-healing; (d) revoke awards on catalog
  deactivation — rejected: awards are immutable historical records;
  (e) re-resolve triggers on every read — rejected: the persisted award is
  the historical record; re-resolution would let backdated rows rewrite
  history (the M1 defect).
- **Tradeoffs:** catch-up evaluation makes every award path slightly more
  than a single insert, but removes an entire class of permanently-missed
  awards. Snapshot-resolved immutable triggers give deterministic results
  per evaluation while honestly acknowledging that different processing
  orders can produce different (each valid) historical records.
- **Consequences:** pure Core evaluator (§12); uniform live/reconciliation/
  backfill evaluation; M1 tests (equal timestamps, concurrent profile-lock
  ordering, backdated reconciliation, award immutability) in §15.

### D3 — Staged schema, migration, seeding, and historical backfill — APPROVED 2026-07-26

- **Recommended:** **Option 1 — omit `SourceCommunityChallengeId`** from the
  Slice 6A physical `UserAchievements` schema; add the nullable column, its
  FK, and the second partial unique index in the future Community Challenge
  slice that also creates the `CommunityChallenge` table. Exact proposed
  schema in §9. Catalog seeding via a static, concurrency-safe, deterministic
  `AchievementSeed` invoked from `Program.cs` in **every** environment,
  **before any hosted reconciliation/backfill service can run a pass**, with
  complete startup validation that fails the application on any catalog
  defect (M3, §9) — never inside the migration. Historical backfill via a
  dedicated bounded hosted runner mirroring the 5A reconciliation pattern
  (§10).
- **Alternatives compared (as mandated):**
  1. *Omit the column (recommended).* Smallest referentially honest design:
     no FK to a non-existent table, no phantom column semantics, no Deferred
     scope. Cost: the accepted long-term model is temporarily staged; the
     future Community Challenge slice must add the column and split the
     unique index into the two accepted partial indexes (a mechanical
     additive migration; existing rows all have the challenge-less shape the
     accepted `WHERE SourceCommunityChallengeId IS NULL` partial index
     covers).
  2. *Add the nullable column without its future FK.* Rejected: a column
     whose only purpose is an unenforced reference to a non-existent table is
     referentially dishonest, invites writes the schema cannot validate, and
     still requires the later FK migration — same rework, worse integrity.
  3. *Create the Deferred `CommunityChallenge` table merely to satisfy the
     FK.* Rejected: implements Deferred scope inside P0, contradicts the
     delivery-scope document and Prompt 48's explicit exclusions.
- **Tradeoffs:** option 1 creates one documented variance from the accepted
  §3.12 model (recorded in §9 and amended into the accepted document only
  after approval, §18). Options 2/3 avoid the variance note at the price of
  integrity or scope violations.
- **Consequences:** unique index `UX_UserAchievements_UserId_AchievementId`
  (plain, not partial — every 6A row is challenge-less); migration upgrade
  from `20260725144430_AddXpLedgerAndProgression` is additive; `Down()` drops
  both new tables (destructive to achievement data, documented like the 5A
  precedent); empty-database path creates tables and startup seeding +
  validation inserts and verifies the catalog; upgrade path leaves existing
  XP data untouched and the backfill runner awards milestones to existing
  ledger holders.

### D4 — Atomicity, idempotency, and concurrency — APPROVED 2026-07-26

- **Recommended (M2/M4-corrected):** preserve and extend the accepted atomic
  boundary. Live redemption: completion + `XpTransaction` + profile
  progression + newly earned `UserAchievement` rows commit in the **same
  single `SaveChangesAsync()`** inside `QuestCompletionRepository.RedeemAsync`.
  Reconciliation: achievement inserts join the existing per-row transaction
  in `XpLedgerRepository.AwardVerifiedCompletionAsync` (after the profile
  `FOR UPDATE` lock, in the final flush with the progression update).
  Backfill: per-user transactions under the profile `FOR UPDATE` lock,
  serialized across hosts by a dedicated `pg_try_advisory_lock` key.
  **Idempotency protocol (M2):** on every award path, existing awards are
  re-read **after** the profile lock is acquired and only missing awards are
  staged, so a `(UserId, AchievementId)` conflict is unreachable under the
  lock protocol. The unique index remains as an invariant backstop: an
  unexpected `UserAchievement` `23505` **rolls back** the full enclosing
  transaction — the live redemption, the per-row XP reconciliation
  transaction, or the current backfill user transaction — and the affected
  operation retries through its existing retry/pass semantics (redemption
  request retry; reconciliation/backfill next pass). An aborted transaction
  is **never** reported as successfully awarded; this constraint is
  explicitly distinguished from `UX_XpTransactions_SourceCompletionId`
  (whose reconciliation-path `23505` remains the benign already-awarded
  probe). Per-user serialization: every path that can award holds the user's
  profile row lock before counting and before re-reading awards, so two
  concurrent same-user completions on different Quests serialize exactly
  (already proven for XP in `XpConcurrencyTests`). Rollback removes staged
  achievement rows with everything else — no orphan awards.
- **Alternatives:** (a) eventual awards via a post-commit background sweep
  for live redemption too — rejected: breaks the demonstrable
  "redeem → achievement visible" behavior and the accepted XP atomicity
  precedent; (b) a separate achievements DbContext transaction after commit —
  rejected: creates committed-XP-without-achievement windows and
  orphan/duplicate edge cases; (c) evaluate before the profile lock —
  rejected: count instability under concurrency; (d) treat `UserAchievement`
  `23505` as benign success — rejected (Review 40 M2): the aborted
  transaction also discarded the completion/XP/progression writes, so
  reporting success would corrupt both the reward record and the retry
  semantics.
- **Tradeoffs:** extending both existing write paths touches two reviewed 5A
  files; the alternative (third write path) would add a job framework-shaped
  process Prompt 48 forbids. Lock-ordering impact is analyzed against the
  actual paths in §11 (M4): no new explicit lock is introduced, and
  achievement FK `KEY SHARE` acquisitions happen only at flush time, after
  the Quest and/or profile locks already held.
- **Consequences:** hook code in `QuestCompletionRepository` and
  `XpLedgerRepository`; shared Infrastructure `AchievementAwardService`;
  new hosted backfill pair (runner in Infrastructure, thin
  `BackgroundService` wrapper in Api — the Review-36-M1 pattern); no new job
  framework, no unbounded process; forced-conflict rollback/retry tests on
  all three paths (§15).

### D5 — Exact API contracts, authorization, privacy, and readiness — APPROVED 2026-07-26

- **Recommended:** §13 defines the exact contract (delivered in task 6A-2).
  Summary: `GET /api/v1/achievements` — anonymous, active catalog only, bare
  JSON array of `{ id, code, name, description, iconUrl, category }` ordered
  by `code` ASC; no error contract beyond framework 500.
  `GET /api/v1/users/me/achievements` — Member/Organizer/Admin, identity only
  from `ClaimTypes.NameIdentifier` (no route/query/body user selector);
  server-composed items `{ achievementId, code, name, description, iconUrl,
  category, awardedAt }` ordered by `(awardedAt ASC, code ASC)`; `401`
  anonymous/unparseable identity; `404` no profile row (explicit existence
  check first, Passport precedent); `503 progression-not-ready` when the
  caller has reward-pending Verified completions **or** is missing an earned
  milestone the ledger already entitles them to (backfill/award not yet
  caught up); evaluated live per request, never cached.
- **Alternatives:** (a) earned endpoint returns only `{ achievementId,
  awardedAt }` and the client composes with the catalog — rejected: two-call
  composition, cross-call mismatch windows, and more 6B complexity for no
  privacy gain (catalog is public); (b) `{ items: [...] }` envelopes —
  rejected: no pagination exists or is needed for a fixed three-row catalog
  and a small earned list; (c) a distinct `achievements-not-ready` problem
  type — rejected: same readiness family; reusing the existing bounded type
  keeps one client handling path (5B already handles it); (d) global (not
  caller-scoped) achievement-pending gate — rejected: one user's backlog
  must not block others (Passport caller-scoped precedent).
- **Tradeoffs:** server-composed earned items read catalog fields from the
  current row, so a deactivated achievement's earned rows disappear from the
  response while remaining persisted (D1/D2 rule); this is deliberate.
- **Consequences:** two controllers (§12, §16); exact-key tests including
  privacy exclusions (email, user ID, Home Community, completion evidence,
  code material, source-completion ID, concurrency values, other users'
  state never appear); OpenAPI annotations per existing convention.

### D6 — Backend architecture and integration boundary — APPROVED 2026-07-26

- **Recommended (M5-corrected):** preserve Clean Architecture Lite dependency
  direction exactly (Core ← Infrastructure ← Api; Core references neither).
  Placement: entities + static catalog/rules/evaluator in Core; EF
  configurations, DbContext sets, seed + validation, repositories,
  award-write service, and backfill runner in Infrastructure; controllers,
  contracts, mapping, hosted wrapper, options binding, and composition in
  Api. Implementation executes as **two sequential tasks** (6A-1 award core,
  6A-2 read API) with the contracts in §16. No new dependency; no
  general-purpose rules engine (three `count >= threshold` checks over static
  definitions); unnecessary one-type-per-file abstractions are simplified
  where repository conventions allow (the evaluator and milestone rules live
  with the static catalog definitions in one Core file; service models are
  grouped in one models file, matching `ProgressionModels.cs`).
- **Alternatives:** (a) award evaluation inside Core services with DbContext
  access — rejected: violates the persistence boundary (only approved
  Infrastructure components touch DbContext); (b) a domain-event/mediator
  pipeline — rejected: new infrastructure concept for three rows;
  (c) one umbrella implementation task — rejected (Review 40 M5): exceeds
  the bounded task size; superseded by the 6A-1/6A-2 split.
- **Tradeoffs:** two tasks mean two prompt/report/review cycles; the gain is
  that each task stays independently implementable, testable, and reviewable
  within the bounded workflow, and 6A-2 reviews a read-only surface against
  an already-reviewed write core.
- **Consequences:** DI registrations in `DependencyInjection.cs` (6A-1:
  award service scoped, runner singleton; 6A-2: read repository scoped) and
  `Program.cs` (6A-1: seed + validation, validated options, hosted wrapper;
  6A-2: read service scoped); the 6B contract is §17.

### D7 — Verification strategy — APPROVED 2026-07-26

- **Recommended:** the §15 matrix, split per task (6A-1: domain, catalog,
  migration, persistence, award-path, backfill, concurrency; 6A-2: API,
  mapping, OpenAPI), with targeted filters during implementation and the
  three full backend gates from AGENTS.md run once after each task.
- **Alternatives:** SQLite for speed — rejected (ADR-0007; important
  PostgreSQL behavior must be tested on PostgreSQL); skipping the
  migration-upgrade test — rejected: upgrade from the 5B schema is a core
  risk of this Slice.
- **Consequences:** new test classes listed in §16 following
  `XpLedgerMigrationUpgradeTests`, `XpLedgerPersistenceTests`,
  `XpReconciliationTests`, `XpConcurrencyTests`, and `ProgressionApiTests`
  patterns; fixtures disable hosted backfill
  (`AchievementBackfill:Enabled=false`) exactly like the reconciliation flag.

### D8 — Documentation, evidence, risk, and follow-on boundary — APPROVED 2026-07-26

- **Recommended (Minor-finding-corrected workflow):** the workflow order is
  fixed in §20 (plan → design review → correction pass → targeted closure
  check → **one unified human approval** → 6A-1 → 6A-1 review → 6A-2 →
  6A-2 review → 6B). After approval, 6A-1 amends
  `specs/architecture/02-core-domain-data-model.md` (record the
  three-achievement catalog content and the staged `UserAchievement`
  variance) and 6A-2 amends `specs/architecture/03-api-contract.md` (§2.12
  exact DTO / error / readiness contract, mirroring the 5B §2.11 amendment
  style). Evidence: planning prompt record (Prompt 48, this task), one
  implementation prompt record, one completion report, and one independent
  read-only implementation review **per implementation task** under
  `specs/ai/prompts/`, `specs/implementation/reports/`, and
  `specs/ai/reviews/` (mandatory: high-risk schema/reward work). Slice 6B is
  a separate future frontend Slice bounded by §17.
- **Alternatives:** amending the data-model document to the full long-term
  shape now — rejected: would document unimplemented Community Challenge
  schema; bundling 6B into 6A — rejected: exceeds bounded task size.
- **Consequences:** each implementation task follows AGENTS.md (one
  implementation owner, one independent review, one concentrated correction
  pass, one targeted closure check).

## 7. Exact proposed achievement catalog and criteria

All content below is a **recommendation requiring explicit human approval**
(D1); names and descriptions are product-visible copy.

| # | Id (deterministic GUID) | Code | Name | Description | Category | Threshold | IconUrl |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | `b5371794-ccd2-45fb-9a7a-f24ec2692bc2` | `verified-completions-1` | First Steps | Complete your first verified eco quest. | `Milestone` | 1 | null |
| 2 | `ed2faa73-1947-4b4b-826a-af7384d4ed10` | `verified-completions-3` | Building Momentum | Reach three verified quest completions. | `Milestone` | 3 | null |
| 3 | `23cb1a76-1cfb-4b53-b71b-cfee48c3f57b` | `verified-completions-5` | Committed Contributor | Reach five verified quest completions. | `Milestone` | 5 | null |

- Criteria (code-defined, not persisted as data): a user is eligible for the
  achievement with threshold T when the count of their committed
  `XpTransaction` rows is ≥ T. Nothing else contributes.
- Codes are stable machine identifiers; the threshold is embedded in the
  code and mirrored in the static `AchievementCatalog` definition, so lexical
  `code` ordering equals threshold ordering for this catalog.
- GUIDs are fixed seed constants (RegionSeed precedent), identical in every
  environment, so API `id` values are stable across deployments.
- All three rows are seeded `IsActive = true`. `CreatedAt` is set by the seed
  at insert time (catalog metadata, not award data; no determinism
  requirement).
- Later additions: append new static definitions + seed rows + (if the
  milestone family grows) evaluator entries. No schema change is needed for
  new milestone rows; new achievement *types* (streak, category, level) are
  P1 and require their own approved plans.

## 8. Eligibility, ordering, and award-time semantics (M1-corrected)

- **Eligibility source:** committed `XpTransaction` rows for the user, and
  nothing else. Rationale: unique `SourceCompletionId` makes each row exactly
  one verified rewarded completion; the ledger is immutable; it is the same
  source the readiness gate and progression projection trust.
- **Why `QuestCompletion` alone never earns:** a Verified completion lacking
  its XP row is reward-pending (transient or unprocessable invariant
  failure). Awarding from it would (a) grant achievements for rewards the
  system has not actually conferred, (b) escape the `23505` idempotency
  boundary, and (c) contradict the accepted rule that only verified
  XP-producing completion contributes to gamification state.
- **Trigger resolution (snapshot semantics):** a trigger is resolved only at
  the moment an award row is first created, from the **transactionally
  stable ledger snapshot visible while holding the user's profile lock**:
  - live redemption: the committed rows plus the staged new XP transaction
    (the profile lock guarantees no other same-user award can commit
    concurrently, so this snapshot is stable for the rest of the
    transaction);
  - XP reconciliation: the committed rows, which already include the
    just-flushed XP row (flush #1 precedes the profile lock);
  - backfill: the committed rows.
  The trigger for threshold T is element T (1-based) of the snapshot ordered
  by `(CreatedAt ASC, Id ASC)`. The `Id` tie-break makes equal-timestamp
  ordering total and deterministic within the snapshot.
- **Immutable award record:** the resolved `XpTransactionId` and
  `AwardedAt = trigger.CreatedAt` are persisted once and never updated.
  A later backdated `XpTransaction` (e.g., reconciliation processes an old
  completion after newer live awards) or an equal-timestamp row **does not
  rewrite an existing award** — it only participates in snapshots for awards
  not yet created. Because of this, live, reconciliation, and backfill
  produce identical award rows when — and only when — they evaluate the same
  ledger snapshot; where processing order legitimately differs, each
  committed award record is the authoritative history of its own evaluation.
- **`XpTransactionId`:** the resolved triggering transaction's Id; always
  non-null for 6A milestone awards (the column is nullable only for future
  award sources that have no triggering transaction, per the accepted
  long-term model).
- **Multiple achievements per transaction:** impossible for distinct
  thresholds with +1 count growth; the evaluator nevertheless computes the
  full eligible-minus-earned set, so any theoretically skipped milestone is
  awarded at the next evaluation.
- **Inactive achievement:** excluded from evaluation, catalog reads, and
  earned reads; persisted rows are untouched. Reactivation makes eligible
  users catch up at their next award or the next backfill pass.
- **Catalog content changes:** display-field edits (via deliberate seed
  change) alter display output only; IDs, codes, thresholds, and category
  are immutable (enforced by startup validation, §9); awards are never
  revoked.
- **Missing or malformed catalog:** impossible at runtime — seeding and
  complete validation run before hosted services start and fail the
  application otherwise (M3, §9). There is no fail-open path.

## 9. Proposed staged schema, migration, seeding, and catalog validation

One additive, schema-only migration (generated with the project EF tooling,
no hand edits, no data backfill — the 5A precedent), upgrading from
`20260725144430_AddXpLedgerAndProgression`.

### `Achievements`

| Column | Type | Nullability / default | Notes |
| --- | --- | --- | --- |
| `Id` | `uuid` | PK, not null | deterministic seed GUID |
| `Code` | `text` (max 100) | not null | unique `UX_Achievements_Code` |
| `Name` | `text` (max 200) | not null | |
| `Description` | `text` (max 500) | not null | |
| `IconUrl` | `text` (max 2000) | nullable | seeded null in 6A |
| `Category` | `text` (max 50) | not null | `Milestone` for all 6A rows |
| `IsActive` | `bool` | not null, default `true` | |
| `CreatedAt` | `timestamp with time zone` | not null | |

Matches accepted §3.11 exactly. No check constraints beyond nullability;
content validity is guaranteed by the seed + startup validation (the only
writer path). No concurrency token (catalog rows change only through the
deployment-time seed).

### `UserAchievements`

| Column | Type | Nullability / default | Notes |
| --- | --- | --- | --- |
| `Id` | `uuid` | PK, not null | |
| `UserId` | `uuid` | not null | FK → `AspNetUsers.Id`, Restrict |
| `AchievementId` | `uuid` | not null | FK → `Achievements.Id`, Restrict; explicit index `IX_UserAchievements_AchievementId` (FK-index convention is removed) |
| `AwardedAt` | `timestamp with time zone` | not null | = persisted trigger's `CreatedAt` (§8) |
| `XpTransactionId` | `uuid` | nullable | FK → `XpTransactions.Id`, Restrict; explicit index `IX_UserAchievements_XpTransactionId`; always non-null for 6A awards |

Constraints:

- `UX_UserAchievements_UserId_AchievementId` — plain unique index on
  `(UserId, AchievementId)`; doubles as the user-lookup index for the earned
  read (leftmost column) and serves as the invariant backstop of the M2
  idempotency protocol (§11).
- No concurrency token (rows are insert-only and immutable, like
  `XpTransaction`).

### Staged variance from the accepted long-term model (explicit)

- `SourceCommunityChallengeId` (accepted §3.12) is **omitted**. Consequence:
  the accepted partial unique index `(UserId, AchievementId) WHERE
  SourceCommunityChallengeId IS NULL` is staged as a plain unique index —
  semantically identical while no challenge rows can exist.
- Future path (Community Challenge slice, not this plan): additive migration
  adding the nullable column + FK, replacing the plain unique index with the
  two accepted partial indexes. Existing rows remain valid under the
  `IS NULL` partial index unchanged.
- No other variance: `Achievements` matches §3.11 fully; all other
  `UserAchievement` columns match §3.12.

### Seeding and fail-closed catalog validation (M3)

- **Writer:** static `AchievementSeed` (RegionSeed pattern location),
  invoked from the `Program.cs` seed block in **every** environment,
  alongside role seeding. The seed block executes synchronously before
  `app.Run()`, so seeding and validation always complete before
  `XpReconciliationHostedService` or `AchievementBackfillHostedService` can
  execute a pass; the backfill runner additionally retains its own
  `InitialDelay`.
- **Concurrency-safe across application instances:** seed work is guarded by
  a dedicated fixed `pg` advisory lock (distinct from the XP reconciliation
  and achievement backfill keys), so two instances starting simultaneously
  serialize; row writes use deterministic upsert semantics
  (insert-if-missing by `Id`, keyed lookups tolerant of the other instance's
  already-committed rows).
- **Deterministic upsert of display fields:** for each of the three required
  definitions, insert the row when missing; when present with the matching
  `Id` **and** `Code`, update only the product-visible display fields
  (`Name`, `Description`, `IconUrl`) to the definition values. `IsActive` is
  not reset by reseeding (an operational deactivation is not silently
  reverted).
- **Immutable identity:** `Id`, `Code`, `Category`, and the rule threshold
  are never mutated by the seed. A persisted row whose `Code` matches a
  definition but whose `Id` or `Category` differs (or vice versa) is a
  conflicting-identity defect — reported to validation, never "repaired".
- **Complete startup validation (fail closed):** immediately after seeding,
  a validator confirms, for exactly the static definition set: every
  required row exists; no required row is missing (no partial catalog); no
  conflicting ID/code pair; no duplicate codes or IDs in the table beyond
  the definitions; every row's `Category` is a known valid category
  (`Milestone` for 6A); and the persisted catalog rows correspond one-to-one
  with the rule definitions (rule/catalog mismatch fails). Any violation
  throws during startup — the application does not start, no hosted service
  runs, and no award path can execute. **Catalog absence or defect never
  means "no awards and ready"; there is no warning-only mode.** (The
  first-version fail-open behavior and the R5 warning-only mitigation are
  removed.)
- Startup-validation failure is a deployment-time defect signal: it is
  deliberate that a bad catalog blocks boot rather than silently degrading
  the P0 achievement feature.

### Migration behavior

- **Empty database:** creates both tables; startup seeding + validation
  inserts and verifies the three catalog rows; no awards exist until XP
  exists.
- **Upgrade from 5B schema:** adds both tables; existing
  `XpTransactions`/`QuestCompletions`/`UserProfiles` untouched; users with
  existing XP receive awards only through the §10 backfill runner (never in
  the migration).
- **`Down()`:** drops `UserAchievements` and `Achievements` (destructive to
  achievement data — documented, same posture as the 5A `Down()`).
- Non-Development environments do not auto-migrate (verified baseline:
  `Migrate()` is Development-only; the production migration procedure is
  pending per `specs/00-project-profile.md` §9). The deployment procedure
  for such an environment must apply migrations before starting the
  application, because startup validation (correctly) fails if the
  `Achievements` table itself is missing. This ordering requirement is
  recorded as risk R5 (§19), not solved by this Slice.

## 10. Historical backfill design

Users with ≥ 1 existing `XpTransaction` before the 6A migration must receive
their earned milestones without any manual step.

- **Mechanism:** `AchievementBackfillRunner` (Infrastructure, singleton) +
  thin `AchievementBackfillHostedService` (Api) — the exact Review-36-M1
  split used for XP reconciliation. Validated `AchievementBackfillOptions`
  (`Enabled` default true, `BatchSize` 100, `InitialDelay`, `IdleInterval`
  24h, `MaxConsecutiveRowFailures` 10) with `ValidateOnStart()`.
- **Precondition:** the catalog exists and is validated (§9) before the
  hosted service can run a pass.
- **Serialization:** dedicated fixed `bigint` advisory-lock key (distinct
  from the XP reconciliation key and the seed key) via
  `pg_try_advisory_lock` on a dedicated `NpgsqlConnection`; explicit
  `pg_advisory_unlock` in `finally`. A pass that cannot take the lock skips
  (another host is working).
- **Candidate discovery:** distinct `UserId`s from `XpTransactions` that have
  at least one eligible-missing milestone, in bounded batches ordered by
  `UserId`; pass-scoped `attemptedIds` exclude retried users within a pass
  (at most one attempt per user per pass).
- **Per-user transaction (M2 protocol):** `UserProfiles FOR UPDATE` (missing
  profile with existing XP = invariant failure → counted failed, bounded
  log, never awarded) → **re-read the user's existing awards after the
  lock** → count committed `XpTransactions` → for each active known
  milestone with `count >= threshold` and no existing award: resolve the
  trigger from the locked snapshot (§8) and stage the insert → one commit.
  Under the lock protocol a `(UserId, AchievementId)` conflict is
  unreachable; if the `UX_UserAchievements_UserId_AchievementId` backstop
  ever fires (`23505`), the **entire user transaction rolls back**, the user
  is counted **failed** (not awarded, not already-awarded), and the user is
  retried on a later pass. An aborted transaction is never reported as
  successfully awarded.
- **Determinism (M1):** backfilled rows resolve triggers from the same
  locked-snapshot rule as live and reconciliation awards (§8); rows are
  identical across paths for the same ledger snapshot, and once committed
  they are immutable.
- **Failure handling:** per-user failure increments `consecutiveFailures`;
  any non-failure outcome resets it; the pass aborts at
  `MaxConsecutiveRowFailures`; failed users heal on the next pass
  (`IdleInterval` or next restart). Logging: counts and exception types only
  at Information and above; user IDs at Debug; no profile, XP, or exception
  detail text (the 5A bounded-logging rules).
- **Completion signal:** a pass with zero eligible-missing users is a strict
  no-op (verified by test). The earned endpoint's caller-scoped readiness
  check (§14, delivered in 6A-2) covers the window before backfill catches
  up — no global gate, no new public signal.
- **Empty database:** runner finds no candidates; zero writes.

## 11. Atomicity, idempotency, locking, and concurrency (M2/M4-corrected)

### Write-path integration (both XP-creation paths)

1. **Live redemption** (`QuestCompletionRepository.RedeemAsync`,
   `QuestCompletionRepository.cs:133-235`): after
   `profile.ApplyXpAward(...)` and `_db.XpTransactions.Add(xp)`, call the
   award evaluator (§12) which (a) re-reads the user's existing awards
   (the profile lock is already held), (b) builds the stable snapshot =
   committed transactions + the staged `xp`, (c) determines newly eligible
   milestones and resolves each trigger from that snapshot (§8), and
   (d) stages only the missing `UserAchievement` rows on the same DbContext.
   The existing single `SaveChangesAsync()` commits or rolls back
   everything.
2. **Historical reconciliation** (`XpLedgerRepository.AwardVerifiedCompletionAsync`,
   `XpLedgerRepository.cs:62-104`): the XP insert is already flushed (flush
   #1, mandatory lock ordering) before the profile lock, so after
   `LockUserProfileAsync` + `ApplyXpAward` the evaluator re-reads existing
   awards, counts the committed rows (the new row included), resolves
   triggers, and stages only missing `UserAchievement` rows; flush #2
   commits the progression update and the achievement inserts together in
   the existing per-row transaction.
3. **Backfill:** §10 (per-user transaction, profile lock, re-read after
   lock, committed snapshot).

### Lock-ordering analysis against the actual paths (M4)

The three write paths have **different** lock sequences; they are documented
separately and not claimed to be identical:

1. **Live redemption:** Quest `FOR UPDATE` → (eligibility checks) →
   `UserProfiles FOR UPDATE` → **single flush** containing the completion
   insert, the XP insert, the profile progression update, and the
   `UserAchievement` inserts. The flush acquires FK `KEY SHARE` locks on the
   referenced rows — `Quests`, `AspNetUsers`, `QuestParticipations`,
   `Regions` (completion); `AspNetUsers`, `Quests`, `QuestCompletions`,
   `Regions` (XP); `Achievements`, `AspNetUsers`, `XpTransactions`
   (achievements) — all after both explicit locks are held.
2. **XP reconciliation:** XP insert flush #1 (acquiring the XP-row FK
   `KEY SHARE` locks first, the 5A mandatory ordering) → `UserProfiles
   FOR UPDATE` → progression + achievement staging → flush #2 (achievement
   FK `KEY SHARE` locks on `Achievements`, `AspNetUsers`, `XpTransactions`).
3. **Achievement backfill:** `UserProfiles FOR UPDATE` → achievement insert
   flush (FK `KEY SHARE` on `Achievements`, `AspNetUsers`,
   `XpTransactions`).

Analysis of the **added** FK locks (`Achievements`, `AspNetUsers`,
`XpTransactions`):

- On all three paths they are acquired only at flush time, after the
  per-user serialization point (the profile row lock) is already held, so
  two same-user award transactions cannot interleave achievement writes.
- `KEY SHARE` conflicts only with concurrent `UPDATE`/`DELETE` of the
  referenced row. The referenced rows are never updated or deleted by any
  award path: `XpTransaction` rows are immutable; `Achievements` rows change
  only through the startup seed's display-field upsert, which completes
  before hosted services or traffic; `AspNetUsers` rows are touched only by
  unrelated Identity operations, which never hold Quest or profile locks and
  therefore cannot form a cycle with these paths.
- Cross-path cycles: live path (Quest → profile) vs reconciliation (no Quest
  lock) vs backfill (no Quest lock) — the 5A-established invariant "Quest-row
  acquisitions always precede the profile lock; at most one profile row per
  transaction" is preserved unchanged; the new FK locks introduce no edge
  from any lock held earlier to a lock acquired later on another path.
- Retained verification: the existing 5A deadlock/overlap tests
  (`XpConcurrencyTests`) re-run unchanged, plus one new real-PostgreSQL
  overlap test (externally held profile lock + `pg_stat_activity`
  blocked-session observation, never timing sleeps) proving live redemption
  vs backfill for the same user serializes on the profile lock and awards
  exactly once (§15).

### Idempotency and concurrency cases (M2)

- **Retries:** a retried redemption after commit fails earlier on the
  Verified-completion uniqueness (existing behavior) — achievement code is
  never reached twice for one completion.
- **Two concurrent same-user completions on different Quests:** serialized by
  the profile lock (proven pattern in `XpConcurrencyTests`); the second
  transaction's snapshot includes the first's committed row, so milestone
  triggers attach in order.
- **Live award vs backfill for the same user:** both take the profile lock
  and both re-read existing awards after the lock, so the loser simply finds
  the winner's award rows and stages nothing. The unique index is a
  backstop, not a control-flow mechanism.
- **Unexpected `UserAchievement` `23505` (backstop firing):** the whole
  enclosing transaction rolls back — for live redemption the request fails
  and the member may retry (nothing was committed: no completion, no XP, no
  progression, no achievement); for reconciliation the row is counted
  **failed** and heals on a later pass; for backfill the user is counted
  **failed** and retried on a later pass. This is explicitly distinct from
  `UX_XpTransactions_SourceCompletionId` on the reconciliation path, which
  remains the benign already-awarded probe (that transaction's purpose is
  exactly one row's XP award, and the probe pattern is the accepted 5A
  design). No path reports an aborted transaction as awarded.
- **Two backfill workers (same or different hosts):** the advisory lock
  skips concurrent passes; lock-free overlap remains correct via the profile
  lock + post-lock re-read (tested, mirroring 5A).
- **Rollback:** staged `UserAchievement` rows vanish with the transaction;
  no partial award state is visible.
- **Multiple milestones in one evaluation:** rows are inserted in threshold
  order; impossible via a single +1 award but handled for catch-up.

## 12. Backend architecture and integration with both XP paths

- **Core** (no Infrastructure/Api reference):
  - `Entities/Achievement.cs`, `Entities/UserAchievement.cs` — internal
    setters/factories mirroring `XpTransaction` style; `UserAchievement`
    factory guards: non-empty IDs, non-empty trigger transaction ID,
    non-null award timestamp.
  - `Achievements/AchievementCatalog.cs` — one file containing the static
    definitions (the three `(Id, Code, Name, Description, Category,
    Threshold)` tuples), lookup by `Code`, the milestone rule set
    (thresholds only), and the pure award evaluator (given the user's
    transaction count, an ordered snapshot trigger resolver, the active
    known definitions, and the already-earned achievement IDs, return the
    ordered set of awards to create). No I/O; fully unit-testable. (M5
    simplification: definitions, rules, and evaluator are one cohesive
    concept and share one file, instead of three one-type files.)
- **Infrastructure**:
  - `Data/Configurations/AchievementConfiguration.cs`,
    `UserAchievementConfiguration.cs` — §9 shape, `Restrict` deletes,
    explicit FK indexes (convention removed), named `UX_/IX_` constraints.
  - `KiwimpactDbContext.cs` — two `DbSet`s (configurations discovered via
    `ApplyConfigurationsFromAssembly`).
  - `Data/Seeds/AchievementSeed.cs` — static, deterministic GUIDs,
    advisory-lock-guarded, deterministic display-field upsert, and the
    complete fail-closed catalog validation (§9).
  - `Achievements/AchievementAwardService.cs` — write-side evaluation used by
    both XP paths and the backfill runner: assumes the caller holds the
    profile lock; re-reads existing awards; performs snapshot counts/trigger
    lookups; stages only missing `UserAchievement` rows on the caller's
    DbContext (or its own scoped context for backfill).
  - `Reconciliation/AchievementBackfillRunner.cs` +
    `AchievementBackfillOptions.cs` — §10.
  - Migration trio (`..._AddSimpleAchievements.cs`, `.Designer.cs`,
    snapshot update).
- **Core (6A-2 only)**:
  - `Repositories/IAchievementRepository.cs` — read-side abstraction
    (catalog read, caller earned read, caller-scoped readiness inputs,
    profile-existence).
  - `Services/IAchievementService.cs`, `AchievementModels.cs`,
    `AchievementService.cs` — read-side application service: identity guard,
    profile 404, caller-scoped 503 (reward-pending and missing-earned),
    active-only filtering, ordering; `AchievementError { NotFound, NotReady }`
    + exception, mirroring `ProgressionService`/`PassportService`.
- **Infrastructure (6A-2 only)**:
  - `Repositories/AchievementRepository.cs` — read-side queries
    (no-tracking) + the caller-scoped readiness primitives.
- **Api (6A-2 only)**:
  - `Controllers/AchievementsController.cs` — `[Route("api/v1/achievements")]`,
    anonymous `GET` catalog.
  - `Controllers/UserAchievementsController.cs` —
    `[Route("api/v1/users/me")]`, class-level
    `[Authorize(Roles = AppRoles.Member + "," + AppRoles.Organizer + "," + AppRoles.Admin)]`,
    `HttpGet("achievements")` — mirrors `PassportController` structure.
  - `Contracts/AchievementContracts.cs` — §13 DTOs.
  - `Mapping/DtoMapping.cs` — `ToDto` extensions (timestamps `.ToString("O")`).
- **Api (6A-1)**:
  - `Reconciliation/AchievementBackfillHostedService.cs` — thin
    `BackgroundService` wrapper.
  - `Program.cs` — `AchievementSeed` + validation invocation in the
    every-environment seed block (before `app.Run()`), validated backfill
    options binding, hosted wrapper registration. No middleware, auth, CORS,
    antiforgery, or rate-limit change in either task (6A-2 adds GET reads
    only; the catalog is public like Regions/Quests).
  - `DependencyInjection.cs` — 6A-1: award service (scoped), runner
    (singleton); 6A-2: read repository (scoped).
- **Both XP paths (6A-1):** the two hook insertions described in §11 are the
  only modifications to 5A-reviewed files.
- **No** new package, rules engine, domain-event bus, or DbContext access
  from Core/Api.

### Contract expected by Slice 6B (not implemented here)

6B will consume §13 exactly: anonymous catalog for display composition,
authenticated earned list for the Passport, `503 progression-not-ready`
handled with the same "progression not ready" state 5B already implements,
`retry: false` on the private read, TanStack Query key families
(`['achievements','catalog']`, `['achievements','me']`), private-cache
cleanup extended to the `['achievements']` prefix, redemption invalidation
extended to earned achievements, icons mapped from `code` (Lucide) since
`iconUrl` is null. No Zustand storage of catalog or earned data.

## 13. Exact API contracts and DTOs (delivered in task 6A-2)

JSON keys are camelCase; timestamps ISO 8601 UTC (`"O"` format strings, the
existing mapping convention); enums/categories serialize as plain strings.

### `GET /api/v1/achievements`

- Auth: none (anonymous allowed).
- `200 OK`: bare JSON array of:

```json
[
  {
    "id": "b5371794-ccd2-45fb-9a7a-f24ec2692bc2",
    "code": "verified-completions-1",
    "name": "First Steps",
    "description": "Complete your first verified eco quest.",
    "iconUrl": null,
    "category": "Milestone"
  }
]
```

- Exactly six keys per item: `id` (string, uuid), `code` (string),
  `name` (string), `description` (string), `iconUrl` (string|null),
  `category` (string).
- Ordering: `code` ASC (equals threshold ASC for this catalog).
- Only `IsActive = true` rows. No pagination, no filtering, no request body.
- Errors: no 401/404/503 contract; unexpected failures follow existing
  framework 500 Problem Details behavior.

### `GET /api/v1/users/me/achievements`

- Auth: Member, Organizer, Admin (class-level `[Authorize]`, identity only
  from `ClaimTypes.NameIdentifier`; no route/query/body user selector —
  reading another person's achievements is impossible by construction).
- `200 OK`: bare JSON array of:

```json
[
  {
    "achievementId": "b5371794-ccd2-45fb-9a7a-f24ec2692bc2",
    "code": "verified-completions-1",
    "name": "First Steps",
    "description": "Complete your first verified eco quest.",
    "iconUrl": null,
    "category": "Milestone",
    "awardedAt": "2026-07-26T01:23:45.0000000Z"
  }
]
```

- Exactly seven keys per item; `awardedAt` is the persisted award-effective
  timestamp (§8). Catalog display fields are composed server-side from the
  current active catalog row (D5).
- Ordering: `awardedAt` ASC, tie-break `code` ASC.
- Earned rows whose achievement is inactive are excluded (rows persist).
- Errors:
  - `401` — anonymous or unparseable identity (bare `Unauthorized()`, the
    existing convention).
  - `404` — authenticated principal without a `UserProfile` row (explicit
    existence check precedes all other work; Passport precedent).
  - `503` — `https://kiwimpact.app/problems/progression-not-ready` bounded
    Problem Details (existing `ProblemDetailsHelper.ProgressionNotReady()`,
    no counts or internals) when the caller (a) owns a Verified completion
    lacking its XP row (reward-pending anti-join, no timestamp filter —
    unprocessable rows included), or (b) has a committed `XpTransaction`
    count that reaches an active known milestone threshold without the
    matching `UserAchievement` row (award/backfill not yet caught up).
    Evaluated live per request, never cached.
  - Unexpected failures: existing framework 500 behavior.

### OpenAPI/Scalar

Both operations appear in the generated OpenAPI document via the existing
convention only: XML `<summary>` doc comments plus `[ProducesResponseType]`
for 200/401/404/503 as applicable. No new OpenAPI package, transformer, or
Scalar configuration. An integration test asserts both operations are
present in `/openapi/v1.json` (§15).

## 14. Authorization, privacy, readiness, logging, and errors

- **Authorization:** catalog = anonymous public (consistent with the
  accepted §2.12 contract and the Authorization Summary's Guest abilities).
  Earned = self-only for all three authenticated roles; Admin/Organizer
  receive no elevated other-user access (Passport precedent). No endpoint
  accepts a user identifier.
- **Privacy exclusions (asserted by test):** responses contain no email, no
  user ID, no Home Community or region/community labels, no completion
  evidence or claim data, no code material, no `SourceCompletionId`, no
  `XpTransactionId` (internal award linkage, not display data), no
  concurrency tokens, and never another user's achievement state. Note: the
  earned item intentionally omits `xpTransactionId` even though the column
  exists — it is an internal join key with no client use in 6B; exposing it
  later is an additive, separately approved change.
- **Readiness interaction:** the earned endpoint reuses the XP
  reward-pending anti-join (same repository primitive family as
  `HasRewardPendingCompletionsAsync`, caller-scoped) plus the
  missing-earned-milestone check. The catalog endpoint has no readiness
  coupling. No change to the existing progression/Passport readiness
  behavior. The catalog is guaranteed present and valid by startup
  validation (§9); there is no empty-catalog readiness rule (M3).
- **Logging:** no new application logging of catalog content, user IDs, XP
  values, or achievement awards at Information and above in the read paths
  (none exists in current read services; none is added). Backfill logging
  follows the 5A bounded rules (counts and exception types only; IDs at
  Debug; no exception objects). Startup validation failures log the defect
  category (missing/partial/conflict/mismatch), not user data.
- **Problem Details:** only the existing helpers are used
  (`NotFound`, `ProgressionNotReady`); no new problem type is introduced.

## 15. Detailed test matrix and verification commands (split per task, M5)

### 6A-1 unit tests (`backend/tests/Kiwimpact.UnitTests/`)

- `Core/AchievementCatalogTests` — exactly three definitions; exact IDs,
  codes, names, descriptions, category, thresholds; codes unique; thresholds
  strictly increasing; lookup-by-code resolves all three and rejects
  unknown/empty codes; no duplicate definitions (M3).
- `Core/AchievementAwardEvaluatorTests` (evaluator lives in
  `AchievementCatalog.cs`) — eligibility at counts 0/1/2/3/4/5/6; trigger =
  Nth by `(CreatedAt, Id)` of the supplied snapshot including engineered
  equal-timestamp ties resolved by `Id` (M1); `AwardedAt` = trigger
  `CreatedAt`; already-earned exclusion; catch-up of multiple missing
  milestones in threshold order; inactive definitions excluded; count far
  above all thresholds with all earned → empty result.
- `Core/UserAchievementDomainTests` — factory guards: empty user/achievement/
  transaction IDs rejected, null award timestamp rejected, valid construction
  sets all fields.

### 6A-1 PostgreSQL integration tests (`backend/tests/Kiwimpact.IntegrationTests/`)

- `Persistence/AchievementMigrationUpgradeTests` (own container, isolated
  databases, `PreviousMigration = "20260725144430_AddXpLedgerAndProgression"`):
  clean-schema migration creates both tables with exact columns, nullability,
  `UX_Achievements_Code`, `UX_UserAchievements_UserId_AchievementId`,
  `IX_UserAchievements_AchievementId`, `IX_UserAchievements_XpTransactionId`,
  three Restrict FKs observed as `RESTRICT`; upgrade from the previous
  migration on a database holding a 5B-era seeded award graph adds the tables
  and leaves existing rows byte-identical; `Down()` drops both tables while
  the pre-existing graph remains.
- `Persistence/AchievementPersistenceTests` — seed inserts exactly the three
  §7 rows; seed repetition is a strict no-op (M3); concurrent seed from two
  contexts serializes and yields one catalog (M3); a partial pre-existing
  catalog is completed by the seed and then validates (M3); display-field
  upsert updates `Name`/`Description`/`IconUrl` only and does not reset
  `IsActive`; conflicting ID/code identity, duplicate definitions, invalid
  category, and rule/catalog mismatch each fail validation (M3);
  duplicate `(UserId, AchievementId)` raw insert fails `23505` naming
  `UX_UserAchievements_UserId_AchievementId`; Restrict FK delete rules
  verified; EF model assertions (no concurrency tokens; no unexpected
  indexes).
- `Persistence/AchievementAwardPathTests` — live redemption at the first,
  third, and fifth completion awards exactly the right milestone with
  triggers resolved from the locked snapshot and `AwardedAt = trigger
  .CreatedAt`; completion + XP + profile + achievement commit atomically
  (rejecting-trigger rollback leaves zero rows of all four kinds); a
  reward-pending completion (raw-SQL Verified row without XP) earns nothing;
  reconciliation-path award integration (awarded with the reconciled row in
  snapshot); a forced `UserAchievement` unique conflict on the live path
  rolls back the entire redemption (no completion/XP/progression rows
  committed) and a clean retry then succeeds (M2); the same forced-conflict
  rollback + later-pass heal on the reconciliation path (M2); a backdated
  reconciled XP row processed after newer live awards does not rewrite the
  existing award's `XpTransactionId`/`AwardedAt` (M1 immutability); existing
  5A tests (including the deliberately untranslated
  `UX_XpTransactions_SourceCompletionId` redemption behavior) still pass.
- `Persistence/AchievementBackfillTests` — seeded 4B/5A-style ledger-only
  users at 0, 1, 2, 3, 4, and 5+ transactions receive exactly
  0/1/1/2/2/3 awards with correct snapshot triggers and `AwardedAt` values;
  a repeat pass is a strict no-op; advisory-lock-held pass skips; two
  overlapping lock-free workers award exactly once via profile lock +
  post-lock re-read (not via 23505 control flow); a forced unique conflict
  rolls back the user transaction, is counted failed (never reported
  awarded), and heals on the next pass (M2); per-user failure heals next
  pass; circuit breaker aborts after the configured consecutive failures;
  user with XP but no profile row is counted failed, never awarded.
- `Persistence/AchievementConcurrencyTests` — two concurrent same-user
  redemptions on different Quests (externally held locks +
  `pg_stat_activity`, the 5A method, no timing sleeps) serialize and attach
  milestone triggers in order; live redemption vs backfill for the same user
  serializes on the profile lock and awards exactly once (M4 overlap test);
  the full 5A deadlock/overlap suite re-runs unchanged.

### 6A-2 tests

- `UnitTests/Api/AchievementMappingTests` — exact DTO keys, `iconUrl` null
  passthrough, `awardedAt` `"O"` formatting, ordering inputs preserved.
- `IntegrationTests/Api/AchievementsApiTests` — catalog: anonymous 200,
  exact six keys, active-only (deactivated row hidden), `code` ordering.
  Earned: 401 anonymous; 404 principal without profile (precedes readiness);
  503 while caller is reward-pending and while a milestone is
  earned-but-unawarded (raw-SQL seeded), returning the bounded
  `progression-not-ready` body; 200 with exact seven keys, `(awardedAt,
  code)` ordering, inactive-earned exclusion; caller isolation (user B's
  awards invisible to A; no endpoint accepts a user selector); privacy
  exclusion assertion over the serialized body; Member/Organizer/Admin all
  reach their own list.
- `IntegrationTests/Api/OpenApiOperationTests` (new, or extension of an
  existing OpenAPI test if one is found during implementation) —
  `/openapi/v1.json` contains both operations with the documented response
  codes.

### Targeted commands (during implementation)

```bash
cd backend
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --filter "FullyQualifiedName~Achievement"
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --filter "FullyQualifiedName~Achievement"
```

### Full backend gates (once per task, after that task's implementation; from `backend/`)

```bash
dotnet build Kiwimpact.slnx
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
```

No frontend gates: neither task changes a frontend file. No test or runtime
result is claimed unless executed and observed.

## 16. Implementation tasks and proposed file maps (M5)

Slice 6A executes as **two sequential implementation tasks**. 6A-2 must not
start until 6A-1 is complete, verified, and independently reviewed. Each
task has its own implementation prompt record, completion report, and
independent read-only implementation review (D8).

### Slice 6A-1 — Achievement Award Core

- **Goal:** users who cross a milestone through any XP award path (live
  redemption, XP reconciliation, historical backfill) receive durable,
  idempotent, snapshot-deterministic `UserAchievement` rows; the fixed
  three-row catalog is persisted, concurrency-safely seeded, and fail-closed
  validated at startup.
- **Scope:** the two entities; static catalog + rules + evaluator; EF
  configurations; additive migration; seed + startup validation; award
  service; the two XP-path hooks; backfill runner/options/hosted wrapper;
  DI/Program changes; the data-model document amendment (§18); focused
  unit/migration/persistence/rollback/backfill/concurrency tests (§15).
- **Out of scope:** any HTTP achievement endpoint, DTO, controller, OpenAPI
  work, the API-contract document amendment, any frontend change, and
  everything in §5.
- **Definition of Done:** all 6A-1 matrix tests and the full backend gates
  executed and observed passing; a fifth live redemption commits
  completion + XP + progression + achievement atomically in an observed
  PostgreSQL test; a backfill pass awards seeded ledger-only users
  correctly; startup validation demonstrably fails closed on each catalog
  defect class; evidence documents (prompt record, completion report) exist;
  independent implementation review closed.
- **Verification:** §15 6A-1 targeted filters, then the full backend gates
  once.
- **Risk:** High — reward-path writes, additive schema, concurrency.
- **Stop conditions:** atomicity or the 5A lock invariant cannot be
  preserved; a real lock-order conflict is observed; Community Challenge or
  a dependency appears necessary; the catalog contract must change.
- **File map:**

  Production (new, 11):
  - `backend/src/Kiwimpact.Core/Entities/Achievement.cs`
  - `backend/src/Kiwimpact.Core/Entities/UserAchievement.cs`
  - `backend/src/Kiwimpact.Core/Achievements/AchievementCatalog.cs`
    (definitions + milestone rules + pure evaluator)
  - `backend/src/Kiwimpact.Infrastructure/Data/Configurations/AchievementConfiguration.cs`
  - `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserAchievementConfiguration.cs`
  - `backend/src/Kiwimpact.Infrastructure/Data/Seeds/AchievementSeed.cs`
    (seed + validation)
  - `backend/src/Kiwimpact.Infrastructure/Achievements/AchievementAwardService.cs`
  - `backend/src/Kiwimpact.Infrastructure/Reconciliation/AchievementBackfillOptions.cs`
  - `backend/src/Kiwimpact.Infrastructure/Reconciliation/AchievementBackfillRunner.cs`
  - `backend/src/Kiwimpact.Infrastructure/Migrations/<timestamp>_AddSimpleAchievements.cs`
    (+ `.Designer.cs`, tooling-generated)
  - `backend/src/Kiwimpact.Api/Reconciliation/AchievementBackfillHostedService.cs`

  Production (modified, 6):
  - `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs` (two DbSets)
  - `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs` (award hook, §11.1)
  - `backend/src/Kiwimpact.Infrastructure/Repositories/XpLedgerRepository.cs` (award hook, §11.2)
  - `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs` (registrations)
  - `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs` (tooling-generated)
  - `backend/src/Kiwimpact.Api/Program.cs` (seed + validation, options, hosted wrapper)

  Tests (new, 8):
  - `backend/tests/Kiwimpact.UnitTests/Core/AchievementCatalogTests.cs`
  - `backend/tests/Kiwimpact.UnitTests/Core/AchievementAwardEvaluatorTests.cs`
  - `backend/tests/Kiwimpact.UnitTests/Core/UserAchievementDomainTests.cs`
  - `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementMigrationUpgradeTests.cs`
  - `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementPersistenceTests.cs`
  - `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementAwardPathTests.cs`
  - `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementBackfillTests.cs`
  - `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementConcurrencyTests.cs`

  Tests (modified, 2):
  - `backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs` (`AchievementBackfill:Enabled=false`)
  - `backend/tests/Kiwimpact.IntegrationTests/Persistence/XpLedgerTestHelpers.cs` (additive achievement graph helpers only, if needed)

  **Primary-file count:** 16 hand-maintained production files (11 new + 5
  hand-edited; the migration Designer and model snapshot are
  tooling-generated) plus 8 new + 2 modified test files. This remains
  slightly above the `03-deadline-execution-mode.md` 10–15 primary-file
  guideline; the residual excess is inherent to one atomic invariant
  (schema + both write paths + backfill cannot be split further without
  breaking the award boundary) and is recorded here for the unified
  approval rather than requested mid-correction (per the M5 instruction).

- **Evidence obligations:** implementation prompt record under
  `specs/ai/prompts/`; completion report under
  `specs/implementation/reports/`; one independent read-only implementation
  review under `specs/ai/reviews/` with the bounded correction workflow.

### Slice 6A-2 — Achievement Read API

- **Goal:** the two accepted read routes serve the exact §13 contracts with
  self-only authorization, caller-scoped readiness, and privacy exclusions.
- **Scope:** read-side Core abstractions/service, Infrastructure read
  repository, two controllers, contracts, mapping, DI/Program registrations,
  the API-contract document amendment (§18), focused API/mapping/OpenAPI
  tests (§15).
- **Out of scope:** any schema, migration, seed, award-write, backfill, or
  XP-path change; any frontend change; everything in §5. If a read
  requirement is found to need a write-side change, the task stops and
  returns (it does not expand).
- **Definition of Done:** all 6A-2 matrix tests and the full backend gates
  executed and observed passing; exact-key responses observed from the real
  stack (integration tests); `/openapi/v1.json` contains both operations;
  evidence documents exist; independent implementation review closed.
- **Verification:** §15 6A-2 targeted filters, then the full backend gates
  once.
- **Risk:** Medium — read-only surface with privacy and readiness
  sensitivity.
- **Stop conditions:** any schema/write-side change appears necessary; the
  §13 contract cannot be satisfied against the 6A-1 core as built.
- **File map:**

  Production (new, 8):
  - `backend/src/Kiwimpact.Core/Repositories/IAchievementRepository.cs`
  - `backend/src/Kiwimpact.Core/Services/IAchievementService.cs`
  - `backend/src/Kiwimpact.Core/Services/AchievementModels.cs`
  - `backend/src/Kiwimpact.Core/Services/AchievementService.cs`
  - `backend/src/Kiwimpact.Infrastructure/Repositories/AchievementRepository.cs`
  - `backend/src/Kiwimpact.Api/Controllers/AchievementsController.cs`
  - `backend/src/Kiwimpact.Api/Controllers/UserAchievementsController.cs`
  - `backend/src/Kiwimpact.Api/Contracts/AchievementContracts.cs`

  Production (modified, 3):
  - `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs` (repository registration)
  - `backend/src/Kiwimpact.Api/Program.cs` (read service registration)
  - `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs` (two `ToDto` extensions)

  Tests (new, 3):
  - `backend/tests/Kiwimpact.UnitTests/Api/AchievementMappingTests.cs`
  - `backend/tests/Kiwimpact.IntegrationTests/Api/AchievementsApiTests.cs`
  - `backend/tests/Kiwimpact.IntegrationTests/Api/OpenApiOperationTests.cs` (or extension of an existing OpenAPI test discovered during implementation)

  **Primary-file count:** 11 production files (8 new + 3 modified) plus 3
  test files — within the bounded-task guideline.

- **Evidence obligations:** separate implementation prompt record,
  completion report, and independent read-only implementation review, as
  for 6A-1.

## 17. Slice 6B handoff contract

Guaranteed by 6A (6A-1 + 6A-2) to the future frontend Slice:

- `GET /api/v1/achievements` — anonymous, exact six-key items, `code`-ordered,
  active-only; safe to cache as TanStack Query `['achievements','catalog']`
  with a long stale time (content changes only via deployment/seed change).
- `GET /api/v1/users/me/achievements` — self-only, exact seven-key items,
  `(awardedAt, code)`-ordered; server-composed display fields, so 6B needs
  no client-side join; `401` (session expiry → existing private-401
  lifecycle), `404` (no profile), `503 progression-not-ready` (render the
  same bounded not-ready state 5B uses); `retry: false`.
- Icons: `iconUrl` is null for the whole 6A catalog; 6B maps `code` → Lucide
  icon client-side. If a future slice seeds real URLs, rendering `iconUrl`
  when non-null is forward-compatible.
- New awards appear after redemption through the existing
  `syncAuthoritativeCompletion` invalidation, extended by 6B to the
  `['achievements']` prefix; private-cache cleanup (`expirePrivateSession`)
  extended to the same prefix.
- No Zustand storage of catalog or earned data (profile §8 rule).

Intentionally unavailable to 6B: progress-toward-next-achievement data
(no threshold/count field is exposed — the catalog contract carries no
criteria), unlock animations/toasts (product decision, not in 6A), streak
or category achievements, other users' achievements, and any write
endpoint. If 6B wants visible progress (e.g., "2/3"), that requires an
explicitly approved additive contract change — flagged as an open product
question in §19.

## 18. Documentation and evidence changes after approval

After the unified human approval (§20):

**6A-1 amends exactly:**

1. `specs/architecture/02-core-domain-data-model.md` — record the accepted
   §3.11 catalog content for the three milestones and the §3.12 staged
   variance (`SourceCommunityChallengeId` omitted until Community Challenge;
   plain unique index staging the accepted partial index). No other section
   touched.

**6A-2 amends exactly:**

2. `specs/architecture/03-api-contract.md` — §2.12 additive amendment with
   the exact §13 DTOs, ordering, 401/404/503 behavior, and privacy
   exclusions (the 5B §2.11 amendment style); long-term direction preserved.

**Evidence artifacts (per implementation task):**

- an implementation prompt record under `specs/ai/prompts/` (actual or
  truthfully reconstructed prompt);
- a completion report under `specs/implementation/reports/` with implemented
  scope, files changed, verification commands and observed results, known
  limitations, and review status;
- one independent read-only implementation review under `specs/ai/reviews/`
  (mandatory — high-risk schema/reward work), followed by the bounded
  correction workflow in AGENTS.md before any commit request.

`PROJECT_STATUS.md` is updated only through the existing human-authorized
status workflow, not by this plan.

## 19. Risks, alternatives, unknowns, and stop conditions

### Risks

- **R1 — 6A-1 remains slightly above the primary-file guideline** (16
  hand-maintained production files + 10 test files). The M5 split removed
  the API half; the residual size is one atomic invariant (schema + both
  write paths + backfill). Recorded for the unified approval; no mid-
  correction decision is requested.
- **R2 — Touching two reviewed 5A write paths** (`QuestCompletionRepository`,
  `XpLedgerRepository`). Mitigation: hook insertions only, no restructuring;
  the full 5A test suite re-runs; rollback behavior is trigger-tested.
- **R3 — Backfill/readiness mismatch**: if the 6A-2 readiness rule and the
  6A-1 evaluator diverge, users could see spurious 503s or silently missing
  awards. Mitigation: both derive from the same static catalog definitions;
  matrix tests cover the boundary counts 0–5+.
- **R4 — Equal-timestamp triggering ambiguity**: two completions verified in
  the same microsecond. Mitigated by the total `(CreatedAt, Id)` order, the
  locked-snapshot rule (M1), and dedicated tie and immutability tests;
  behavior is deterministic per snapshot, and the persisted award is
  authoritative.
- **R5 — Non-Development migration/validation ordering**: startup validation
  fails (correctly) if the `Achievements` table is missing, and
  `Migrate()` runs Development-only. A future deployment procedure must
  apply migrations before application start. Recorded; the production
  migration procedure is a pending project-level decision
  (`specs/00-project-profile.md` §9), not solved here.
- **R6 — Startup-validation blast radius**: a catalog defect blocks
  application boot (M3 intent). Mitigation: defects are deployment-time
  detectable in CI/staging via the seed/validation tests; the failure is
  loud by design rather than a silent P0 feature loss.

### Alternatives recorded

- Post-commit/eventual live awards (rejected, D4); client-composed earned
  items (rejected, D5); distinct not-ready problem type (rejected, D5);
  persisted `IconUrl` values in 6A (rejected, D1); global achievement
  readiness gate (rejected, D5); benign-success `UserAchievement` `23505`
  (rejected, M2); empty-catalog fail-open with warning (rejected, M3);
  identical-lock-order claim (corrected, M4); one umbrella implementation
  task (rejected, M5).

### Unknowns to resolve during implementation (not blockers)

- Whether an existing OpenAPI-document integration test exists to extend;
  otherwise a new minimal test class is added (§15).
- Exact `AchievementSeed` invocation point within the `Program.cs` seed
  block (alongside `IdentitySeed.SeedRolesAsync`); verified against current
  `Program.cs` at implementation time.
- Whether 6B needs progress-toward-next data (product question; excluded
  unless separately approved).

### Stop conditions (return to the human before implementing)

- the branch or expected baseline is wrong, or an unrelated working-tree
  modification appears;
- the design cannot preserve the accepted XP atomicity or idempotency
  guarantees (e.g., a lock-ordering conflict is discovered);
- the design is found to require Community Challenge implementation;
- a dependency or broader architecture change appears necessary;
- a safe historical backfill cannot be specified or implemented;
- 6A-1 as bounded cannot be implemented without breaking its atomic
  invariant (it must be re-planned, not silently expanded).

## 20. Workflow and human approval checklist (Minor-finding-corrected)

The workflow order is fixed as:

1. first plan (Prompt 48, complete);
2. independent Codex design review (Review 40, complete: `CHANGES REQUIRED`);
3. this single concentrated correction pass (this revision);
4. targeted Codex closure check limited to the original M1–M5;
5. **one unified final human approval of the corrected rules and schema**;
6. implement 6A-1;
7. verify and independently review 6A-1;
8. implement and independently review 6A-2;
9. proceed to the separate 6B frontend Slice.

The human completed step 5 on 2026-07-26. Implementation may begin within
the checked items below:

- [x] **D1** — exactly three achievements; thresholds 1/3/5; category
      `Milestone`; null `IconUrl`; inactive excluded from both reads.
- [x] **D1 catalog content** — the exact §7 IDs, codes, names, and
      descriptions (product-visible copy).
- [x] **D2 (M1)** — `XpTransaction`-only eligibility; locked-snapshot trigger
      resolution with `(CreatedAt, Id)` total order; immutable persisted
      `XpTransactionId`/`AwardedAt`; catch-up evaluation; no revocations.
- [x] **D3 — schema approval** — additive `Achievements`/`UserAchievements`
      migration per §9, **including the staged omission of
      `SourceCommunityChallengeId`** (option 1) and the documented variance
      from accepted §3.12.
- [x] **D3 (M3)** — every-environment concurrency-safe `AchievementSeed`
      with deterministic display-field upsert and fail-closed startup
      validation before hosted services.
- [x] **D4 (M2)** — live awards inside the redemption atomic boundary;
      reconciliation per-row integration; post-lock re-read idempotency
      protocol with `23505` as rollback-and-retry backstop, never
      reported-as-awarded.
- [x] **D5** — exact §13 routes, DTO keys, ordering, 401/404/503 behavior,
      and privacy exclusions (including the non-exposure of
      `xpTransactionId`).
- [x] **D6 (M5)** — file placement per §16, the two 5A-path hook
      modifications, and the sequential 6A-1 → 6A-2 task split including
      the recorded 6A-1 primary-file count.
- [x] **D7** — §15 per-task test matrices and gate set.
- [x] **D8** — §18 per-task document amendments and evidence obligations;
      one independent implementation review per task before commit.
