Status: Implemented — Slice 7B independently approved, pending human Git approval

# Slice 7 — Simple Persisted Leaderboard

- **Date:** 2026-07-26
- **Planning owner:** Kimi K3 (planning only; no production code, tests,
  migrations, dependencies, configuration, or accepted-spec changes)
- **Implementation owner (after human approval):** Codex
- **Independent design review:** Codex (Review 47; targeted closure Review 49)
- **Independent implementation review:** Kimi K3 (Reviews 48 and 50:
  APPROVED)

## 1. Status and planning boundary

This document is a plan. It implements nothing. It records a verified
baseline, a minimal P0 scope, eight decisions that each require explicit human
approval, proposed contracts, a file map, a test matrix, risks, stop
conditions, and a handoff contract for the implementation owner.

Scheduling authority is `specs/product/04-phase-2-delivery-scope.md`: P0
requires **one simple persisted leaderboard** (§2.1). Leaderboard refinements
and SignalR are P1 (§3). Multi-layer community leaderboards are Deferred
(§4). The long-term accepted design (ADR-0008, API contract §2.14, security
and testing specifications) remains valid future direction but is **not** the
P0 delivery requirement and must not be silently implemented as P0.

## 2. Verified baseline with file-level evidence

All facts below were verified against source, migrations, configuration, and
accepted documents on 2026-07-26. No discrepancy with the planning task's
stated baseline facts was found.

### 2.1 Git baseline

- Branch: `feat/slice-7-simple-leaderboard`, created from `main`.
- HEAD: `ade8f1e3c0b474924aca44e97cb29a872f4513d1` — "Merge pull request #16
  from Zephyr724/feat/slice-6b-passport-achievements-ui".
- `git merge-base --is-ancestor ade8f1e HEAD` confirms HEAD is the expected
  Slice 6B merge baseline.
- Working tree was clean at branch creation (`git status --porcelain` empty).
  Slice 6B is merged; `PROJECT_STATUS.md` has not yet been updated for it,
  which is expected and out of scope for this planning task.

### 2.2 XP ledger (backend)

- `backend/src/Kiwimpact.Core/Entities/XpTransaction.cs` — immutable
  server-owned ledger row: `Id`, `UserId`, `QuestId`, `SourceCompletionId`,
  `XpAmount` (int, positive), `CommunityRegionIdAtAward` (nullable Guid),
  `CreatedAt` (the completion's `VerifiedAtUtc`, never invented). Created only
  via `CreateFromVerifiedCompletion`, which rejects non-Verified completions.
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/XpTransactionConfiguration.cs`
  — check constraint `"XpAmount" > 0`; unique index
  `UX_XpTransactions_SourceCompletionId`; index
  `IX_XpTransactions_UserId_CreatedAt` on `(UserId, CreatedAt)`; index
  `IX_XpTransactions_CommunityRegionIdAtAward_CreatedAt`.
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/QuestCompletionConfiguration.cs:67-69`
  — partial unique index `UX_QuestCompletions_UserId_QuestId_Verified`
  (`WHERE "Status" = 'Verified'`): one Verified completion per user per quest.
- Consequence: per user, `COUNT(XpTransaction)` equals the number of distinct
  verified quest completions, and duplicate XP rows for one completion are
  impossible. Completion count as `COUNT(XpTransaction)` is safe.

### 2.3 Idempotent reconciliation and readiness gate

- `backend/src/Kiwimpact.Infrastructure/Reconciliation/XpReconciliationRunner.cs`
  — repeatable pass awarding exactly one XP row per eligible legacy Verified
  completion; unique `SourceCompletionId` is the correctness boundary;
  per-row transactions; advisory lock is a courtesy only.
- `backend/src/Kiwimpact.Core/Repositories/IXpLedgerRepository.cs` —
  `HasRewardPendingCompletionsAsync` defines the reward-pending accounting
  boundary: true while any Verified completion lacks an XP row.
- `backend/src/Kiwimpact.Core/Services/ProgressionService.cs:23-31` — the
  readiness gate is enforced live per request; reward-pending state throws
  `ProgressionError.NotReady`.
- `backend/src/Kiwimpact.Api/Controllers/ProgressionController.cs` — NotReady
  maps to `503 progression-not-ready` Problem Details.

### 2.4 User profile

- `backend/src/Kiwimpact.Core/Entities/UserProfile.cs` — `Id` (= user Id),
  `DisplayName` (text, max 100, trimmed, **not unique**),
  `HomeCommunityRegionId` (nullable), `ShowCommunityOnPassport`,
  `LastCommunityChangeAt`, `TotalXp` (long), `Level`, timestamps.
- `ApplyXpAward` adds XP as a checked addition inside the award transaction
  and recomputes `Level` from the new total.
- `specs/architecture/02-core-domain-data-model.md` §3.1 (`TotalXp` is a
  "transactional projection of the XP ledger", written only inside award
  transactions) and §8 (award atomicity; `SELECT ... FOR UPDATE` profile row
  lock). Consequence: `UserProfile.TotalXp` and `SUM(XpTransaction.XpAmount)`
  cannot drift within application code; the only non-authoritative window is
  reward-pending reconciliation, which the readiness gate already covers.
- §12 index table already anticipates `(UserId, CreatedAt)` serving
  leaderboard queries.

### 2.5 No leaderboard implementation exists

- Case-insensitive search for `leaderboard` across `backend/src` and
  `frontend/src`: no matches. No repository, service, controller, DTO,
  frontend type, validator, transport, hook, route, page, or navigation entry
  exists. The only occurrences are in accepted specification documents.

### 2.6 Accepted long-term contract (future direction, not P0 scope)

- `specs/architecture/03-api-contract.md` §2.14 — People Leaderboards:
  `GET /api/v1/leaderboards/people` (auth: None) with `scope`
  (myCommunity, auckland, nz), `period` (weekly, monthly, allTime), `page`,
  `pageSize`; `GET /api/v1/leaderboards/people/me` (Member+). §2.15 —
  Communities Leaderboard. §3.1 — SignalR Leaderboard Hub.
- §4 Authorization summary: Guests may read leaderboards (Auckland/NZ).
- `specs/security/01-community-privacy-rules.md` — NZ/Auckland leaderboard
  rows must not show community affiliation (§2); deleted users must not
  remain identifiable in leaderboard rows (§6); leaderboard endpoint rules
  (§7). Small-community suppression (§3) applies to community scopes, not to
  a national people board.
- `specs/architecture/01-domain-model-region.md:95` — unattributed XP
  (null `CommunityRegionIdAtAward`) contributes to personal progression and
  the **New Zealand** leaderboard. Confirmed by
  `specs/testing/01-community-leaderboard-and-privacy-tests.md` §4.6.
- `specs/adr/ADR-0008-...md` — My Community/Auckland/NZ scopes, periods,
  Your Position, Personal Best, movement, small-community collective mode,
  and Communities Leaderboard are the accepted long-term design.

### 2.7 Frontend conventions (verified by reading source)

- Stack: React 19, TypeScript, Vite, React Router (`createBrowserRouter` in
  `frontend/src/app/router.tsx`), Tailwind + daisyUI, TanStack Query, Zustand
  (`frontend/src/stores/useUiStore.ts` for UI state only).
- Public anonymous reads follow the achievement catalog pattern:
  `frontend/src/lib/api/achievements.ts` (transport + strict validation),
  `frontend/src/lib/validation/achievementDto.ts` (hand-rolled exact-key
  validators; **no zod or other validation library is present**),
  `frontend/src/hooks/useAchievements.ts` (key factory, `retry: false`,
  explicit `staleTime`).
- `frontend/src/hooks/useCompletion.ts:100-131` — `syncAuthoritativeCompletion`
  invalidates progression, passport, and achievement queries after
  redemption; this is the established redemption-invalidation seam.
- `frontend/src/app/AppShell.tsx` — primary navigation; public links render
  for all principals.
- Tests: `frontend/tests/unit` (validators, hooks), `frontend/tests/integration`
  (pages, shell). Backend: `backend/tests/Kiwimpact.UnitTests` (Core, Api,
  Architecture), `backend/tests/Kiwimpact.IntegrationTests` (Api, Persistence;
  Testcontainers per ADR-0007).
- Scalar/OpenAPI coverage is exercised by
  `backend/tests/Kiwimpact.IntegrationTests/Api/OpenApiOperationTests.cs`;
  new endpoints must follow the existing controller documentation pattern
  (`[ProducesResponseType]`, XML doc comments).

### 2.8 Home Community UI absence

No community-selection UI exists (Slice 2B and community selection are not
implemented; no `/api/v1/users/me` PATCH surface in `backend/src/Kiwimpact.Api/Controllers`).
Therefore My Community cannot be a P0 prerequisite, and an all-time NZ people
board — which includes unattributed XP by design — is the only scope from the
accepted design that is implementable today without new identity surfaces.

## 3. Goals (P0)

1. One persisted, server-authoritative, anonymous-readable **New Zealand /
   All-time People Leaderboard**, ranked from committed `XpTransaction` rows
   only, Top 10.
2. Rows expose the minimum useful public fields: rank, display name, total
   verified XP, verified completion count.
3. Fully deterministic ordering with an explicit, tested tie-break chain and
   explicit rank semantics.
4. Readiness behaviour consistent with the existing progression readiness
   gate (no partial rankings presented as authoritative).
5. A responsive, accessible public `/leaderboard` route with TanStack Query
   ownership, strict response validation, and bounded loading/empty/error/
   Retry states.
6. No schema, migration, dependency, authentication, or privacy-model change.

## 4. Non-goals (explicitly excluded)

- My Community or Auckland scopes; scope switching UI.
- Weekly/monthly periods; period switching UI.
- `/api/v1/leaderboards/people/me`, Your Position, context rows, Personal
  Best, rank movement.
- Pagination beyond the fixed Top 10.
- Communities Leaderboard (§2.15), collective small-community mode, privacy
  thresholds.
- SignalR hubs, events, or client subscriptions (P1; REST must work without it).
- Seasons, leagues, streaks, social features.
- Schema or migration changes; new dependencies; new configuration.
- Home Community selection UI or any dependency on Home Community.
- Changes to XP award, reconciliation, progression, or achievement code paths
  (the leaderboard reads; it never writes).
- `PROJECT_STATUS.md` changes during planning. The implementation owner
  updates it as evidence at the 7A and 7B delivery boundaries approved in D8.

## 5. D1–D8 decision table

Each decision lists the recommendation, alternatives, impact, and requires
explicit human approval before implementation.

### D1 — Staged P0 scope and relationship to contract §2.14 — APPROVED 2026-07-26 (A)

- **Recommended (A):** Implement `GET /api/v1/leaderboards/people` exactly as
  routed in §2.14, but honour only `scope=nz` and `period=allTime` (both
  optional, defaulting to those values), fixed Top 10, no pagination, no
  `/me`. Any other `scope`/`period` value and any `page`/`pageSize` parameter
  returns `400` Problem Details documenting the staged limitation. Amend
  §2.14 with a short staged-implementation note (after approval, see §13).
  The controller explicitly binds nullable string query parameters `scope`,
  `period`, `page`, and `pageSize` and passes all four to the service.
  Omitted scope/period values default; empty or unsupported scope/period
  values fail. Any non-null page/pageSize value — including empty or
  non-numeric text — fails. Unrelated unknown query keys are ignored by
  normal ASP.NET Core binding; only the future contract parameters whose
  semantics would otherwise be misleading are explicitly rejected.
- **Alternatives:**
  - (B) A separate staged route (e.g. `/api/v1/leaderboards/people/nz-alltime`).
    Avoids parameter handling but forks the accepted contract and creates a
    route to retire later.
  - (C) Silently ignore unsupported parameters and always return NZ all-time.
    Contract-dishonest; clients cannot tell they were not honoured.
  - (D) Implement the full §2.14 surface now. Consumes P1/Deferred scope;
    blocked anyway by the missing Home Community surfaces (§2.8).
- **Impact:** (A) keeps one contract-compatible public route, honest error
  behaviour, and an upgrade path that adds parameters instead of moving
  routes. The 400-on-unsupported behaviour must be recorded in the §2.14
  amendment so the staging is an accepted decision, not a silent deviation.

### D2 — Ranking source and eligibility — APPROVED 2026-07-26 (A)

- **Recommended (A):** Aggregate committed `XpTransaction` rows directly:
  per user, `totalXp = SUM(XpAmount)`, `verifiedCompletionCount = COUNT(*)`,
  joined to `UserProfile` for `DisplayName`. Eligibility: every user with at
  least one committed XP row (users with zero XP are naturally excluded).
- **Alternatives:**
  - (B) Rank by `UserProfile.TotalXp`. Simpler sum, but completion count
    still requires the ledger, `TotalXp` is a projection (the ledger is the
    source of truth), and two sources invite subtle disagreement if a future
    write path changes.
- **Impact:** Verified facts (§2.2, §2.4) show the two sources cannot drift
  inside application code, so (A) costs nothing in correctness and yields
  both ranked fields from one authoritative scan. Drift consequence if a
  future defect desynchronises the projection: (A) keeps the leaderboard
  ledger-authoritative while `TotalXp`-based surfaces would diverge — the
  readiness gate (D6) is unchanged either way. Only verified XP ever creates
  ledger rows, so "only verified XP contributes" holds by construction
  (testing spec §2.7 satisfied without a filter).

### D3 — Deterministic ordering and tie/rank semantics — APPROVED 2026-07-26 (A)

- **Recommended (A):** Order by `totalXp` DESC, then `verifiedCompletionCount`
  DESC, then `lower(DisplayName)` ASC, then `UserId` ASC (internal final
  tie-break, never serialized). Assign **ordinal row numbering** (rank = 1..N
  in that order, N ≤ 10). Ties share no rank; the deterministic chain fully
  orders every pair.
- **Alternatives:**
  - (B) Competition ranking (`1,2,2,4`): familiar, but at a fixed Top-10 cut
    it creates a boundary ambiguity (two users tied at rank 10 — include one
    or both?) and needs an extra rule anyway.
  - (C) Dense ranking (`1,2,2,3`): same boundary ambiguity, less familiar.
  - (D) Ordinal numbering without the display-name tie-break (XP, count,
    UserId only): fully deterministic but opaque to users and untestable
    without leaking IDs.
- **Impact:** (A) is exactly 10 rows every time, stable across queries,
  and leaks no internal identifier. The final internal tie can still be
  proven end to end without serializing it: seed equal XP/count rows named
  `Aroha` and `AROHA`, whose `lower(DisplayName)` values collide but whose
  visible names remain distinguishable, and control their GUID order. The
  tie-break chain must be documented in the §2.14 amendment and covered by
  the test matrix (§11).

### D4 — Public response shape and privacy exclusions — APPROVED 2026-07-26 (A)

- **Recommended (A):**
  ```json
  {
    "scope": "nz",
    "period": "allTime",
    "rows": [
      { "rank": 1, "displayName": "Aroha", "totalXp": 1250, "verifiedCompletionCount": 12 }
    ]
  }
  ```
  Exact keys only. `scope`/`period` echo the staged literals. No per-row
  community, email, user ID, XP transaction ID, completion ID, quest ID,
  level, timestamps, or profile metadata. Empty leaderboard: `200` with
  `"rows": []`.
- **Alternatives:**
  - (B) Include `level` or rank title: derivable client-side from
    `frontend/src/lib/progressionRules.ts`, but adds surface for no P0 use.
  - (C) Bare array of rows: loses the scope/period self-description that
    keeps the staged response honest under §2.14.
- **Impact:** Display names are user-chosen public handles and the accepted
  leaderboard design publishes ranked members; duplicate display names are
  possible (DisplayName is not unique, §2.4) and are rendered as-is, with
  rank distinguishing rows. Privacy exclusions satisfy
  `specs/security/01-community-privacy-rules.md` §2 (no per-row community)
  and the planning task's exclusion list. Strict exact-key frontend
  validation makes any accidental extra field a visible failure.

### D5 — Top 10 vs pagination and `/me` exclusion — APPROVED 2026-07-26 (A)

- **Recommended (A):** Fixed Top 10, server-side `Take(10)`, no
  `page`/`pageSize` support (400 if supplied, per D1), and **no** `/me`
  endpoint in P0.
- **Alternatives:**
  - (B) Contract pagination from day one: more service surface, more tests,
    and a UI that paginates 10 rows — no product value at current scale.
  - (C) Top 10 plus `/me`: `/me` is Member-only contextual ranking (Your
    Position/context rows) — a named P1 refinement that requires careful
    rank computation beyond the Top-10 window.
- **Impact:** (A) is the smallest honest slice; pagination and `/me` slot
  into the same route later without breaking the P0 response (rows array +
  scope/period fields are forward-compatible).

### D6 — Readiness, error behaviour, and reconciliation implications — APPROVED 2026-07-26 (A)

- **Recommended (A):** Mirror the progression readiness gate: the service
  evaluates `IXpLedgerRepository.HasRewardPendingCompletionsAsync` live per
  request; while reward-pending, return `503` Problem Details
  (`leaderboard-not-ready`). Other errors: `400` for unsupported
  scope/period/pagination (D1), `500` for unexpected failures. Anonymous
  `200` otherwise.
- **Alternatives:**
  - (B) Serve the leaderboard from committed rows regardless of pending
    reconciliation: a fresh Verified completion could be missing from the
    board while Passport shows it, and the board would silently present a
    partial state as authoritative.
  - (C) Block on reconciliation inline: couples a read endpoint to a batch
    worker; rejected by the existing architecture.
- **Impact:** (A) reuses the verified accounting boundary (§2.3) with zero
  new write paths. Reconciliation implication: none — the leaderboard reads
  the ledger; the hosted reconciliation service is untouched. The frontend
  treats 503 like any load failure (fixed-copy error + manual Retry).

### D7 — Frontend route, navigation, responsive layout, cache, and state — APPROVED 2026-07-26 (A)

- **Recommended (A):**
  - Public route `/leaderboard` under `AppShell` (no `RequireAuth`), plus a
    "Leaderboard" primary-navigation link visible to all principals
    (`frontend/src/app/AppShell.tsx`). Match the existing compact-navigation
    contract: Lucide `Trophy`, `aria-label="Leaderboard"`, and
    `<span className="hidden sm:inline">Leaderboard</span>` so the link stays
    usable at 320/375 px while its text label is hidden below `sm`.
  - TanStack Query owns the server data; **no Zustand, no Web Storage**.
    Key factory `leaderboardKeys.peopleNzAllTime =
    ['leaderboard', 'people', 'nz', 'allTime']`; `retry: false`;
    `staleTime: 60_000` (dynamic data, unlike the 24 h catalog).
  - **Redemption invalidation:** extend `syncAuthoritativeCompletion`
    (`frontend/src/hooks/useCompletion.ts`) to invalidate the
    `['leaderboard']` prefix so a member who redeems sees the board resync.
    This modifies an existing shared hook and is explicitly part of this
    decision.
  - Manual Retry button calling `refetch()` in the error state; fixed-copy
    loading and empty states; no skeleton layout that shifts.
  - Responsive: one semantic `<table>` with `<caption>` and `scope="col"`
    headers at all viewports; structural layout uses `table-fixed w-full`,
    compact padding, a narrow rank column (`w-10 sm:w-14`), flexible
    `min-w-0`/truncated display names, and compact numeric columns
    (`w-16 sm:w-24`) with right alignment. Tests prove this markup contract;
    an actual 320 px no-overflow claim requires an observed browser run.
- **Alternatives:**
  - (B) Card list on mobile / table on desktop: two render paths to test and
    keep accessible for zero information gain at four narrow columns.
  - (C) No redemption invalidation: simpler diff, but a member's own
    redemption leaves a stale board for up to `staleTime` — inconsistent
    with the established resync convention (§2.7).
- **Impact:** (A) adds one public route and one nav link, follows the
  verified achievements pattern end to end, and keeps all server state in
  TanStack Query per ADR-0005.

### D8 — Delivery split, tests, evidence, amendments, review workflow — APPROVED 2026-07-26 (A)

- **Recommended (A):** Split into two sequential tasks within this slice:
  - **7A Backend** — repository, service, DTOs, controller, DI, tests,
    backend gates, prompt record, completion report. Reviewed per the
    important-task rule before 7B starts (one independent review, one
    correction pass, one targeted closure check).
  - **7B Frontend** — types, validator, transport, hook, page, router/nav,
    redemption invalidation, tests, frontend gates, prompt record,
    completion report. Independent implementation review by Kimi K3 after
    evidence exists.
  - Accepted-document amendments (§13) land with 7A after human approval.
  - 7A is implemented on the current
    `feat/slice-7-simple-leaderboard` branch. After its evidence, Kimi K3
    independent review, bounded correction/closure, human-approved Git
    actions, and merge to `main`, 7B begins from merged `main` on a new
    `feat/slice-7b-simple-leaderboard-frontend` branch. Codex updates
    `PROJECT_STATUS.md` in each implementation task's evidence boundary.
- **Alternatives:**
  - (B) One full-stack task: the file map (§9) totals ~24 primary files,
    exceeding the 10–15 primary-file guideline in
    `specs/ai/03-deadline-execution-mode.md`.
- **Impact:** Each half fits the guideline (7A ≈ 13 primary files; 7B ≈ 13
  primary files), and each produces its own evidence chain per AGENTS.md.
  7B's contract is frozen by 7A's observed API behaviour.

## 6. Required analysis resolutions

1. **Route choice:** use the existing `/api/v1/leaderboards/people` route
   with a documented staged limitation (D1-A). No alternative contract shape
   is necessary; a forked route (D1-B) is inferior.
2. **Aggregation source:** aggregate `XpTransaction` directly (D2-A).
   `UserProfile.TotalXp` cannot drift from the ledger inside application code
   (§2.4), but the ledger is the source of truth and yields the completion
   count in the same scan. The reward-pending window is covered by the
   readiness gate (D6), not by source choice.
3. **Completion count:** `COUNT(XpTransaction)` per user. Safe because
   `UX_XpTransactions_SourceCompletionId` makes duplicate XP rows for one
   completion impossible and `UX_QuestCompletions_UserId_QuestId_Verified`
   makes duplicate Verified completions per user per quest impossible (§2.2).
4. **Stable deterministic ordering:** `totalXp` DESC →
   `verifiedCompletionCount` DESC → `lower(displayName)` ASC → `UserId` ASC
   (internal only, never serialized) (D3-A). The repository owns this SQL
   order. The service preserves repository order and only adds ordinal ranks.
5. **Rank semantics:** ordinal row numbering 1..N after the full tie-break
   chain (D3-A); competition and dense ranking both leave a Top-10 boundary
   ambiguity.
6. **Display-name exposure and privacy exclusions:** display names are
   public ranked-member data under the accepted design; response excludes
   user IDs, XP/completion/quest IDs, email, community, level, and
   timestamps (D4-A).
7. **Edge profiles:** zero-XP users are excluded naturally (no ledger rows).
   Missing profile: the join is from XP rows to `UserProfile`; a profile is
   created at registration, so every `UserId` in the ledger resolves — the
   repository must still inner-join so an unresolvable row is excluded
   rather than crashing. Deleted accounts: account deletion does not exist
   (Slice 2B is P1); the privacy rule (deleted users not identifiable) is
   recorded as a future requirement, and an inner join through `UserProfile`
   is the deletion-safe shape. Duplicate display names render as-is,
   distinguished by rank (D4).
8. **Unattributed XP:** all-time NZ is computed over **all** committed XP
   rows with no community filter, so unattributed XP (`CommunityRegionIdAtAward`
   null) is included by construction (01-domain-model-region:95; testing spec
   §4.6). No Home Community is required from anyone.
9. **Query performance:** one `GROUP BY UserId` scan over `XpTransactions`
   joined to `UserProfiles`, ordered, `LIMIT 10`. At MSA scale this is a
   small sequential scan; the existing `(UserId, CreatedAt)` index does not
   cover a global aggregate, but no new index is justified at this row count.
   **Conclusion: no schema or migration change.** A future scale-triggered
   index or materialization is a stop-condition decision (§14), not P0.
10. **Cache:** `['leaderboard', 'people', 'nz', 'allTime']`,
    `staleTime: 60_000`, `retry: false`, manual Retry via `refetch()`,
    redemption invalidation of the `['leaderboard']` prefix (D7-A).
11. **Responsive/accessibility:** single semantic fixed-layout table with
    caption, column scopes, compact/truncated column structure, `aria-live`
    status regions for loading/error, and keyboard-reachable Retry (D7-A).
    Unit/integration tests prove structure; a runtime no-overflow claim at
    320 px requires an observed browser check.
12. **Task size:** one task would be ~24 primary files — over the 10–15
    guideline. Sequential **7A Backend** (≈13 primary) and **7B Frontend**
    (≈13 primary) with separate evidence and review boundaries (D8-A).
13. **Accepted-spec amendments (only after human approval, landing with 7A):**
    a one-paragraph staged-implementation note in
    `specs/architecture/03-api-contract.md` §2.14 recording: P0 implements
    only `scope=nz`, `period=allTime`, fixed Top 10, ordinal ranks, the D3
    tie-break chain, the D4 response shape, 400-on-unsupported-parameters,
    and 503 `leaderboard-not-ready`; all other §2.14 capabilities remain
    accepted future direction. No other accepted document changes.
14. **Stop conditions:** see §14 — any schema, dependency, authentication,
    privacy, or scope expansion need stops the task for a human decision.

## 7. Proposed backend contract (7A)

### 7.1 Endpoint

`GET /api/v1/leaderboards/people` — `[AllowAnonymous]`, mirroring
`AchievementsController` (`backend/src/Kiwimpact.Api/Controllers/AchievementsController.cs`).

- Query: `scope` (optional, only `nz`), `period` (optional, only `allTime`).
  The action explicitly binds nullable strings `scope`, `period`, `page`,
  and `pageSize`. Omitted scope/period values default; empty or unsupported
  values fail. Any non-null page/pageSize value, including an empty or
  non-numeric value, → `400` Problem Details with a detail string naming the
  supported staged values. Other unknown query keys are ignored.
- `200`: the D4 response shape.
- `503`: Problem Details `leaderboard-not-ready` while reward-pending (D6),
  via a `ProblemDetailsHelper.LeaderboardNotReady()` factory mirroring
  `ProgressionNotReady()`.
- No antiforgery (anonymous GET), no rate-limit change (follows existing
  public read endpoints; adding one is a configuration change requiring
  separate approval).

### 7.2 Service and repository

- `ILeaderboardRepository.GetTopPeopleNzAllTimeAsync(int limit, CancellationToken)`
  — Infrastructure EF Core query: `XpTransactions` `GROUP BY UserId`
  (`SUM((long)XpAmount)`, `COUNT(*)`), inner join `UserProfiles` for
  `DisplayName`, `ORDER BY` totalXp DESC, count DESC, `lower(DisplayName)`
  ASC, `UserId` ASC, `Take(limit)`. Returns domain rows including the
  internal `UserId` (used for ordering only, never mapped to a DTO).
- `ILeaderboardService.GetPeopleLeaderboardAsync(scope, period, page,
  pageSize, ct)` — validates all four explicitly bound staged parameters
  (400-class domain error), evaluates
  `HasRewardPendingCompletionsAsync` (503-class `LeaderboardException`
  mirroring `ProgressionException`), maps repository rows to ranked results
  with ordinal ranks 1..N.
- Limit is a compiled constant `10`, not configuration (no config change).
- Repository DI registration is in
  `Kiwimpact.Infrastructure/DependencyInjection.cs`; Core service
  registration is in `Program.cs`, following the existing split.

### 7.3 DTOs and mapping

`LeaderboardContracts.cs`: `LeaderboardRowDto` (`Rank`, `DisplayName`,
`TotalXp`, `VerifiedCompletionCount`) and `PeopleLeaderboardDto` (`Scope`,
`Period`, `Rows`) with a `ToDto()` mapping in the same file (avoids touching
`DtoMapping.cs`). `TotalXp` serializes as a JSON number (long).

## 8. Proposed frontend contract (7B)

- `frontend/src/types/leaderboard.ts` — `LeaderboardRow`,
  `PeopleLeaderboard` (string-literal `'nz'`/`'allTime'`).
- `frontend/src/lib/validation/leaderboardDto.ts` — hand-rolled strict
  validator following `achievementDto.ts`: exact keys at both levels;
  `scope === 'nz'`; `period === 'allTime'`; `rows` is an array of at most 10;
  each row: integer `rank` equal to its 1-based position, non-empty
  `displayName` ≤ 100 chars, non-negative safe-integer `totalXp`, positive
  integer `verifiedCompletionCount`. Any extra key (e.g. a leaked `userId`)
  fails validation.
- `frontend/src/lib/api/leaderboard.ts` — `fetchPeopleLeaderboard({signal})`
  calling `apiFetch<unknown>('/v1/leaderboards/people')` then validating.
  Anonymous: no 401 session-expiry path.
- `frontend/src/hooks/useLeaderboard.ts` — `leaderboardKeys` factory and
  `usePeopleLeaderboard()` per D7 (retry false, staleTime 60 s).
- `frontend/src/pages/LeaderboardPage.tsx` — fixed-copy states:
  loading (`aria-live="polite"`), empty (board has no rows yet),
  error + manual Retry (`role="alert"` + button), and the ranked table
  (D7 layout). Static copy, no date formatting, no i18n framework.
- `frontend/src/app/router.tsx` — public child route `/leaderboard`.
- `frontend/src/app/AppShell.tsx` — public compact "Leaderboard" nav link
  using `Trophy`, an accessible label, and the existing hidden-below-`sm`
  text convention.
- `frontend/src/hooks/useCompletion.ts` — add `['leaderboard']` prefix
  invalidation to `syncAuthoritativeCompletion` (D7, if approved).

## 9. File map and primary-file counts

### 7A Backend (≈ 13 primary files: 9 new, 4 modified)

New:

1. `backend/src/Kiwimpact.Core/Repositories/ILeaderboardRepository.cs`
2. `backend/src/Kiwimpact.Core/Services/ILeaderboardService.cs`
3. `backend/src/Kiwimpact.Core/Services/LeaderboardModels.cs`
4. `backend/src/Kiwimpact.Core/Services/LeaderboardService.cs`
5. `backend/src/Kiwimpact.Infrastructure/Repositories/LeaderboardRepository.cs`
6. `backend/src/Kiwimpact.Api/Contracts/LeaderboardContracts.cs`
7. `backend/src/Kiwimpact.Api/Controllers/LeaderboardsController.cs`
8. `backend/tests/Kiwimpact.UnitTests/Core/LeaderboardServiceTests.cs`
9. `backend/tests/Kiwimpact.IntegrationTests/Api/LeaderboardsApiTests.cs`

Modified:

10. `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs`
    (repository DI registration)
11. `backend/src/Kiwimpact.Api/Program.cs` (Core service DI registration)
12. `backend/src/Kiwimpact.Api/Helpers/ProblemDetailsHelper.cs`
    (`LeaderboardNotReady`)
13. `backend/tests/Kiwimpact.IntegrationTests/Api/OpenApiOperationTests.cs`
    (operation and 200/400/503 response documentation)

Plus the accepted §2.14 amendment (documentation, after approval) and the 7A
prompt/completion/review evidence files. `PROJECT_STATUS.md` is also modified
as delivery evidence but is not counted as a primary implementation file.

### 7B Frontend (≈ 13 primary files: 8 new, 5 modified)

New:

1. `frontend/src/types/leaderboard.ts`
2. `frontend/src/lib/validation/leaderboardDto.ts`
3. `frontend/src/lib/api/leaderboard.ts`
4. `frontend/src/hooks/useLeaderboard.ts`
5. `frontend/src/pages/LeaderboardPage.tsx`
6. `frontend/tests/unit/leaderboardDto.test.ts`
7. `frontend/tests/unit/useLeaderboard.test.tsx`
8. `frontend/tests/integration/LeaderboardPage.test.tsx`

Modified:

9. `frontend/src/app/router.tsx`
10. `frontend/src/app/AppShell.tsx`
11. `frontend/src/hooks/useCompletion.ts` (redemption invalidation, if D7 approved)
12. `frontend/tests/integration/AppShell.test.tsx` (nav link)
13. `frontend/tests/unit/useCompletion.test.tsx` (invalidation assertion)

Plus the 7B prompt/completion/review evidence files.

## 10. Migration/schema conclusion

**No migration, no schema change, no new index, no new dependency.** The
leaderboard is a read-only aggregate over the existing `XpTransactions` and
`UserProfiles` tables. Verified evidence: §2.2 (schema, indexes), §6 item 9
(performance reasoning). If the implementer believes any schema or
dependency change is required, that is a stop condition (§14), not an
implementation choice.

## 11. Test matrix (counter-directional; results to be observed, not claimed)

### 11.1 Backend — 7A

Integration (`LeaderboardsApiTests.cs`, Testcontainers factory pattern):

- T1 Only committed XP counts: a user with a Verified completion appears
  after its XP row commits; a user with only non-Verified completions never
  appears (self-reported exclusion holds by construction).
- T2 Users with no XP rows are excluded (zero-XP profiles absent).
- T3 Primary order: higher total XP ranks above lower total XP.
- T4 Tie-break 1: equal XP, different counts → higher completion count first.
- T5 Tie-break 2: equal XP, equal count → case-insensitive display-name
  order; response contains no user identifier.
- T6 Final tie and rank semantics: equal XP/count rows named `Aroha` and
  `AROHA` have colliding lowercase names but distinct visible names; controlled
  GUIDs prove the repository's final `UserId ASC` order without serializing
  IDs. The response assigns ordinal 1..N with no shared/skipped ranks.
- T7 Duplicate display names: two users with identical names both render,
  proving multiplicity and privacy only; this test does not claim to prove
  final ordering.
- T8 Exact response keys: row objects contain exactly `rank`, `displayName`,
  `totalXp`, `verifiedCompletionCount`; envelope exactly `scope`, `period`,
  `rows` — no `userId`, `community*`, `email`, IDs, or timestamps.
- T9 Anonymous access: no cookie → `200`.
- T10 Empty leaderboard: no XP rows → `200`, `"rows": []`.
- T11 Top-10 boundary: 11+ ranked users → exactly 10 rows, the 11th (by the
  full tie-break chain) excluded.
- T12 Reconciliation/backfill: XP awarded via the reconciliation path (legacy
  Verified completion) appears with its ledger `XpAmount`/`CreatedAt` and
  counts toward totals like any other row.
- T13 Readiness: seeded reward-pending state → `503`
  `leaderboard-not-ready`; after reconciliation completes → `200`.
- T14 Staged parameters: `scope=auckland`, `period=weekly`, `page=1` each →
  `400`; `scope=nz&period=allTime` explicit → `200`; omitted → `200`.
- T15 Unattributed XP included: XP rows with null `CommunityRegionIdAtAward`
  contribute to the NZ board.
- T15a OpenAPI/Scalar document contains the anonymous people-leaderboard
  operation and its documented `200`, `400`, and `503` responses.

Unit (`LeaderboardServiceTests.cs`):

- T16 Parameter validation rejects empty/unsupported scope/period and every
  present page/pageSize form (empty, numeric, or non-numeric) before any
  readiness or repository call; omitted scope/period defaults successfully.
- T17 Readiness gate short-circuits ranking when reward-pending.
- T18 Ordinal rank assignment preserves the fabricated repository sequence;
  the service does not reimplement or claim to prove the SQL tie-break order.

### 11.2 Frontend — 7B

Unit:

- T19 `leaderboardDto.test.ts`: valid payload passes; each strict failure
  rejects — extra key (including a leaked `userId`), missing key, wrong
  scope/period literal, non-sequential rank, empty/overlong displayName,
  negative or non-integer totalXp, zero/negative count, >10 rows.
- T20 `useLeaderboard.test.tsx`: query key shape, `retry: false`, transport
  error surfaces as query error, no 401 session-expiry side effects.

Integration (`LeaderboardPage.test.tsx`, `AppShell.test.tsx`,
`useCompletion.test.tsx`):

- T21 Loading state renders fixed copy; successful render shows the table
  with caption, column headers, and ranked rows.
- T22 Empty state: `rows: []` renders the empty copy, no table rows.
- T23 Error state (500/503/network): fixed error copy + Retry button;
  clicking Retry refetches and renders data on recovery.
- T24 Responsive structure: assert `table-fixed w-full`, the compact column
  widths, truncated/flexible name cell, and compact padding. This is a
  structural markup contract, not a jsdom claim that 320 px runtime overflow
  was observed. Accessibility: caption present, `scope="col"` headers, rank
  per row, status regions have correct roles.
- T25 Cache behaviour: second mount within staleTime does not refetch;
  invalidation triggers refetch; no Zustand store and no
  localStorage/sessionStorage access on this path (asserted via store and
  storage spies).
- T26 Redemption invalidation (if D7 approved): `syncAuthoritativeCompletion`
  invalidates the `['leaderboard']` prefix alongside the existing keys.
- T27 Navigation: the Trophy/`aria-label="Leaderboard"` link renders for
  guest, member, organizer, and admin, routes to `/leaderboard`, uses
  `hidden sm:inline` for its text, and the route is public (no redirect to
  `/login`). Existing compact-header assertions remain true at 320/375 px.

## 12. Applicable verification gates

7A (from `backend/`), once after implementation, plus targeted tests during:

- `dotnet build Kiwimpact.slnx`
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`

7B (from `frontend/`):

- `npm run lint`
- `npm run type-check`
- `npm run test -- --run`
- `npm run build`

No command may be claimed passed unless executed and observed.

## 13. Accepted-document amendments (only after human approval)

Exactly one amendment, landing with 7A: a staged-implementation note in
`specs/architecture/03-api-contract.md` §2.14 as specified in §6 item 13.
No change to ADR-0008, the security specification, the testing
specification, or the Phase 2 scope document. `PROJECT_STATUS.md` is not an
accepted contract amendment: Codex updates it as implementation evidence in
7A (recording Slice 6B merged and 7A current/completed state) and again in 7B
for the final Slice 7 state.

## 14. Risks and stop conditions

Risks:

- **R1 (medium):** Public display-name exposure is a product-visible privacy
  surface. Mitigated by D4 (accepted direction publishes ranked members;
  exact-key validation; no other fields). Stop if anyone proposes adding
  profile/community/level fields to rows.
- **R2 (medium):** Tie/rank semantics are easy to get subtly wrong
  (non-deterministic SQL tie order). Mitigated by D3's explicit chain
  including a deterministic internal final key, and T5/T6/T11.
- **R3 (low):** `GROUP BY` without a covering index scans the ledger;
  acceptable at MSA scale. Stop if the implementer measures a real problem —
  an index is a schema decision.
- **R4 (low):** Readiness 503 makes the board temporarily unavailable during
  reconciliation backlog. Accepted deliberately (D6) for consistency with
  progression; frontend treats it as a retryable error.
- **R5 (low):** Scope creep pressure toward §2.14's full surface. Mitigated
  by D1's 400 behaviour and the §13 amendment making staging explicit.

Stop conditions — return to the human before proceeding if any of these
becomes necessary:

- any schema, migration, or index change;
- any dependency addition/removal/upgrade;
- any authentication, authorization, antiforgery, CORS, or rate-limit change;
- any expansion of the response shape, scopes, periods, pagination, or `/me`;
- any change to XP award, reconciliation, or progression write paths;
- any deviation from the D1–D8 options approved by the human.

## 15. Definition of Done

7A:

1. Backend implementation complete per §7 and the approved decisions.
2. All 7A tests in §11.1 implemented and passing; full backend gates (§12)
   executed and observed passing.
3. §2.14 staged-limitation amendment applied (post-approval).
4. Implementation prompt record under `specs/ai/prompts/` and completion
   report under `specs/implementation/reports/` with observed evidence only.
5. Independent review record under `specs/ai/reviews/`; original
   Blocker/Major findings closed.
6. `PROJECT_STATUS.md` truthfully records the merged 6B baseline and the 7A
   delivery state.

7B:

1. Frontend implementation complete per §8 and the approved decisions.
2. All 7B tests in §11.2 implemented and passing; full frontend gates (§12)
   executed and observed passing.
3. Prompt record and completion report with observed evidence only.
4. Independent Kimi K3 implementation review; Blocker/Major findings closed.
5. `PROJECT_STATUS.md` truthfully records the final Slice 7 delivery state.

Slice: 7A and 7B both done; no unapproved file changes in the diff; Git
actions remain with the human.

## 16. Evidence requirements

- 7A implementation prompt (`specs/ai/prompts/54-…`), 7A completion report,
  7A Kimi K3 review record, and the 7A `PROJECT_STATUS.md` update.
- 7B implementation prompt (`specs/ai/prompts/…`), 7B completion report,
  7B Kimi K3 review record, and the final `PROJECT_STATUS.md` update.
- Every report records implemented scope, files changed, verification
  commands with observed results, known limitations, and review status.
- No invented test counts, browser results, or unverified claims.

## 17. Human approval checklist

- [x] D1 staged route + 400-on-unsupported behaviour
- [x] D2 ranking source = `XpTransaction` aggregate
- [x] D3 tie-break chain + ordinal rank semantics
- [x] D4 response shape + privacy exclusions
- [x] D5 fixed Top 10, no pagination, no `/me`
- [x] D6 503 `leaderboard-not-ready` readiness behaviour
- [x] D7 route/nav/layout/cache + redemption invalidation (including the
      `useCompletion.ts` modification)
- [x] D8 7A/7B split, evidence, and review workflow
- [x] §13 §2.14 staged-limitation amendment
- [x] Confirmation: no schema/dependency/auth/config change approved or needed

## 18. Handoff contract for the implementation owner (Codex)

1. Work only after the human records D1–D8 decisions; treat approved options
   as the contract. Any need to deviate is a stop condition (§14).
2. Execute 7A first on the current
   `feat/slice-7-simple-leaderboard` branch, including its evidence chain,
   `PROJECT_STATUS.md` update, Kimi K3 independent implementation review,
   bounded correction/closure, and human-approved Git actions. Merge 7A to
   `main` before starting 7B.
3. Start 7B only from merged `main`, on a new
   `feat/slice-7b-simple-leaderboard-frontend` branch. Do not build 7B on an
   unmerged 7A branch.
4. Stay inside the §9 file map. Additions require human approval.
5. The leaderboard is read-only: do not modify XP award, reconciliation,
   progression, achievement, or authentication code paths. The only
   pre-existing source files touched are the §9 "modified" entries.
6. Follow verified existing patterns: `AchievementsController`
   (anonymous read), `ProgressionController`/`ProblemDetailsHelper`
   (readiness 503), `achievementDto.ts`/`achievements.ts`/`useAchievements.ts`
   (frontend transport/validation/hooks), `syncAuthoritativeCompletion`
   (invalidation seam).
7. Run targeted tests during implementation; run the §12 gates once at the
   end; record observed results only.
8. Do not stage, commit, push, merge, create a PR, or deploy without explicit
   human approval. Updating `PROJECT_STATUS.md` is required implementation
   evidence and is not a Git-action authorization.
9. Preserve every pre-existing change in the working tree; inspect branch
   and tree before editing.
