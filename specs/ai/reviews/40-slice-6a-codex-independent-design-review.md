# Slice 6A Codex Independent Design Review

- **Date:** 2026-07-26
- **Reviewer:** Codex (independent read-only design reviewer)
- **Planning owner:** Kimi K3
- **Branch:** `feat/slice-6a-simple-achievements-backend`
- **Reviewed HEAD:** `2706e0cd968a3b254910552df34f288c0013b21f`
- **Reviewed plan:** `specs/implementation/06a-simple-achievements-backend.md`
  (first version, 2026-07-26)
- **Planning prompt record:** `specs/ai/prompts/48-slice-6a-simple-achievements-backend-first-plan.md`

> Recording note: this review was produced by the independent Codex design
> review session and transmitted to the planning owner by the human. This
> file records the review's verdict and findings in substance so the
> correction pass and the targeted closure check have a stable repository
> reference.

## Verdict

**CHANGES REQUIRED**

- Blockers: 0
- Majors: 5
- Minors: 1

The plan's scope boundaries, catalog minimalism, `XpTransaction`-only
eligibility direction, staged-schema resolution (omitting
`SourceCommunityChallengeId`), API read contract shape, and exclusion
discipline are sound. The Slice is not approval-ready because the trigger
determinism claim is overstated, the `UserAchievement` unique-violation
handling reports aborted transactions as success, the catalog is fail-open,
the lock-ordering proof misdescribes the actual write paths, and the single
implementation contract exceeds the bounded task size.

## Findings

### M1 — Trigger determinism claim is false as stated

- **Location:** plan §2, §8, §10 (the "byte-identical rows for identical
  ledgers" and "the new transaction is necessarily element T" claims).
- **Issue:** the plan claims a newly inserted XP transaction is necessarily
  the final Nth row and that live, reconciliation, and backfill always
  produce identical achievement rows. A later-reconciled backdated
  `XpTransaction` (its `CreatedAt` equals an old `VerifiedAtUtc`) legitimately
  changes the ledger snapshot, so processing order can change which row is
  "Nth". The claim of universal byte-identical outcomes is unprovable and
  wrong in the backdated case.
- **Required correction:** eligibility stays based only on committed
  `XpTransaction` count; when an achievement is first created, resolve its
  trigger from the transactionally stable ledger snapshot visible while
  holding the profile lock (including the staged XP transaction where
  applicable); choose the Nth row from that snapshot using the documented
  total ordering; persist its `XpTransactionId` and `CreatedAt` as the
  immutable award record; later backdated or equal-timestamp XP rows do not
  rewrite an existing award; live, reconciliation, and backfill are
  identical only when evaluating the same ledger snapshot. Add tests for
  equal timestamps, concurrent profile-lock ordering, later backdated
  reconciliation, and immutability of an existing award.

### M2 — PostgreSQL 23505 on UserAchievement treated as harmless success

- **Location:** plan §10, §11 ("`23505` → benign already-awarded").
- **Issue:** a unique violation aborts the PostgreSQL transaction. Treating
  a `UserAchievement` `23505` as a benign success conflates an aborted
  transaction (in which the completion, XP, and progression writes were also
  discarded) with a successfully awarded state.
- **Required correction:** acquire the profile lock, re-read existing awards
  after the lock, and stage only missing awards, so the conflict is
  unreachable under the lock protocol; retain `(UserId, AchievementId)`
  uniqueness as an invariant backstop; an unexpected `UserAchievement`
  `23505` rolls back the full live redemption, the per-row XP reconciliation
  transaction, or the current backfill user transaction; the affected
  operation retries through its existing retry/pass semantics; distinguish
  this constraint from `UX_XpTransactions_SourceCompletionId`; never report
  an aborted transaction as successfully awarded. Add forced-conflict
  rollback and retry tests for all three paths.

### M3 — Catalog integrity is fail-open

- **Location:** plan §6 D2/D4, §9, §14 ("an empty catalog yields no awards
  and an always-ready gate"; the warning-only mitigation in §19 R5).
- **Issue:** the required three-row catalog is a hard precondition of the
  feature, yet the plan allows the system to run with a missing or partial
  catalog and silently award nothing while reporting readiness.
- **Required correction:** seed the required catalog before hosted
  reconciliation/backfill starts; make seeding concurrency-safe across
  application instances; validate the complete catalog immediately after
  seeding; fail application startup for missing rows, partial catalog,
  conflicting ID/code pairs, duplicate definitions, invalid category, or
  rule/catalog mismatch; use deterministic upsert for product-visible
  display fields; keep stable IDs, codes, thresholds, and category
  immutable; catalog absence must never mean "no awards and ready"; remove
  the empty-catalog fail-open behavior and its warning-only mitigation. Add
  seed repetition, concurrent seed, partial catalog, mismatched identity,
  and startup-validation tests.

### M4 — Lock-order proof does not match the actual write paths

- **Location:** plan §11 ("Relative order is identical on both paths").
- **Issue:** the plan asserts the live redemption and XP reconciliation lock
  orders are identical. They are not: redemption holds Quest lock → profile
  lock and flushes once; reconciliation flushes the XP insert (acquiring FK
  locks) before the profile lock, then flushes progression and achievements.
- **Required correction:** document the actual paths — live redemption:
  Quest lock → profile lock → single flush containing completion, XP,
  progression, and achievements; XP reconciliation: XP insert flush/FK locks
  → profile lock → progression and achievement flush; achievement backfill:
  profile lock → achievement insert flush. Analyze the added FK locks on
  `Achievements`, `AspNetUsers`, and `XpTransactions` against those actual
  paths. Do not claim the live and reconciliation lock orders are identical.
  Retain the existing 5A deadlock tests and add one real-PostgreSQL overlap
  test without timing sleeps.

### M5 — Single implementation contract exceeds bounded task size

- **Location:** plan §16 (~21 new production files plus tests, self-flagged
  as risk R1) against `specs/ai/03-deadline-execution-mode.md` task-size
  rules.
- **Issue:** schema + award writes + backfill + HTTP API + OpenAPI in one
  task is too large to implement and review safely, and the plan defers the
  oversize decision to the human instead of restructuring.
- **Required correction:** revise the umbrella plan into two sequential
  implementation tasks, each with Goal, Scope, Out of scope, Definition of
  Done, verification, risk, stop condition, exact proposed file map and
  primary-file count, and separate implementation prompt, completion report,
  and review obligations:
  - **Slice 6A-1 — Achievement Award Core:** `Achievement` and
    `UserAchievement` persistence; fixed three-row catalog and fail-closed
    seed validation; pure milestone rules; additive migration; atomic live
    XP-path integration; XP reconciliation integration; bounded historical
    achievement backfill; focused unit, migration, persistence, rollback,
    backfill, and concurrency tests. No HTTP achievement endpoints.
  - **Slice 6A-2 — Achievement Read API:** after 6A-1 is complete and
    reviewed; anonymous active catalog endpoint; authenticated self-only
    earned endpoint; exact DTOs and ordering; caller-scoped readiness;
    privacy and authorization; OpenAPI/Scalar coverage; focused API tests.
    No schema or award-write changes.
  Simplify unnecessary one-type-per-file abstractions where repository
  conventions allow it. Keep Clean Architecture Lite boundaries intact.

### Minor — Workflow order misstated

- **Location:** plan §20 ("After approval: one independent Codex design
  review of this plan...").
- **Issue:** the plan places human approval before the design review and
  correction cycle, inverting the established workflow.
- **Required correction:** use this order: (1) first plan; (2) independent
  design review; (3) concentrated correction pass; (4) targeted closure
  check limited to M1–M5; (5) final human approval of the corrected rules
  and schema; (6) implement 6A-1; (7) verify and independently review 6A-1;
  (8) implement and review 6A-2; (9) proceed to the separate 6B frontend
  Slice.

## Directions not reopened

The following plan directions are accepted and must be preserved unless a
correction above strictly requires adjustment:

- exactly three milestones at 1, 3, and 5 verified rewarded completions;
- `XpTransaction`-only eligibility;
- `SourceCommunityChallengeId` omitted until Community Challenge;
- no streak, leaderboard, Community Challenge, frontend, rules engine,
  dependency, Docker, or authentication expansion;
- public catalog and self-only earned API (now in 6A-2);
- no API exposure of `xpTransactionId`.

## Bounded next step

The planning owner performs the single concentrated correction pass
permitted by `AGENTS.md`, limited to M1–M5 and the Minor finding plus
truthful record updates. Codex then performs one targeted closure check
limited to the original M1–M5. Final human approval of the corrected rules
and schema follows the closure check; the database-schema change remains
unapproved until that point.

## Targeted closure check

- **Date:** 2026-07-26
- **Scope:** Original M1–M5 only; not a second full design review
- **Reviewer:** Codex, independent read-only
- **Validation:** Corrected plan and Review 40 record inspected; repository
  boundary rechecked; `git diff --check` observed clean. No implementation
  suite was run because this remained a planning review.

### Closure results

- **M1 — CLOSED.** The plan now resolves the trigger from the ledger snapshot
  visible under the profile lock, includes the staged XP row where applicable,
  persists immutable trigger metadata, and no longer claims equality across
  different ledger snapshots.
- **M2 — CLOSED.** Existing awards are re-read after the profile lock; an
  unexpected `UserAchievement` `23505` rolls back the enclosing transaction
  and heals through request/pass retry semantics. It is no longer reported as
  a benign successful award.
- **M3 — CLOSED.** Catalog seeding is concurrency-safe and followed by complete
  fail-closed startup validation before hosted services or traffic. Missing or
  inconsistent required catalog data can no longer yield an always-ready
  achievement surface.
- **M4 — CLOSED.** The lock proof now records the distinct live,
  reconciliation, and backfill sequences and analyzes the additional FK locks
  against those actual paths.
- **M5 — CLOSED.** Delivery is split into sequential 6A-1 award-core and 6A-2
  read-API tasks with separate contracts, evidence, reviews, and file maps.
  The residual 6A-1 size exception is explicit and requires human approval.

## Final design verdict

**APPROVE**

All original Major findings are substantively closed. Remaining Blockers: 0.
Remaining Majors: 0. No second full design review is permitted or required.

## Human approval

On 2026-07-26 the human approved the corrected D1–D8 decisions, exact catalog,
additive database schema, staged omission of `SourceCommunityChallengeId`,
sequential 6A-1 → 6A-2 delivery, and the recorded 6A-1 size exception.
Slice 6A-1 implementation is authorized; staging, commit, push, PR, merge, and
deployment remain separately approval-gated.
