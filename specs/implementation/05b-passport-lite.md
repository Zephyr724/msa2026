Status: Approved — implementation authorized; pending implementation and independent implementation review

# Slice 5B — Passport-lite and Progression Frontend

- **Date:** 2026-07-25 (first version); 2026-07-26 (review closure and human approval)
- **Risk:** Medium — cross-layer (one new backend endpoint plus a new
  authenticated frontend surface), no schema change proposed
- **Planning owner:** Kimi K3 (planning only; no implementation authority)
- **Intended implementation owner:** one implementation session per AGENTS.md
  routing (Codex default), assigned by the human after this plan is approved
- **Design reviewer:** Codex (independent read-only design review of this plan)
- **Planning prompt record:** `specs/ai/prompts/46-slice-5b-passport-lite-first-plan.md`

> This document began as a proposal. After independent design review,
> concentrated correction, targeted closure, the authorized final B1
> documentary correction, and explicit human approval on 2026-07-26, D1–D8
> form the approved Slice 5B implementation contract. Intended behavior and
> currently implemented behavior remain separate: §3 records the merged
> baseline, while the approved design is not implemented until source and
> observed verification prove it.

## 1. Status and planning boundary

First-version implementation plan for Slice 5B, the smallest useful P0
personal-progression surface consuming Slice 5A's server-authoritative state.
Every open implementation choice is surfaced as an explicit decision (D1–D8,
§6) with alternatives and a recommendation. **All eight decisions received
explicit human approval on 2026-07-26.**

This task was planning only. No production code, migration, configuration,
test, dependency, or accepted specification was changed to produce this plan.
The only files created by the planning task are this plan and its
planning-prompt record.

Scheduling context: `specs/product/04-phase-2-delivery-scope.md` is
**Proposed — pending design review** (its own status line) and lists
"Passport-lite profile/dashboard" as P0. It is treated here as scheduling
context only, not as an accepted architecture decision.

This revision (2026-07-26) applies the concentrated correction pass for the
Codex independent design review
(`specs/ai/reviews/37-slice-5b-codex-independent-design-review.md`):
Blocker B1, Majors M1–M4, and Minors m1–m4 are corrected in place
(§6 D3–D7, §8–§15, §16–§19). The plan remains **Proposed** pending the
Codex targeted closure check and explicit human approval.

A final human-authorized narrow correction (2026-07-26) closes the one B1
ordering issue left open by the Codex targeted closure check
(`specs/ai/reviews/38-slice-5b-codex-targeted-design-closure-review.md`):
logout, login/account replacement, and the private-401 path now share one
strictly ordered lifecycle — await cancel-then-remove of the private
queries first, then clear or replace the auth session, then redirect or end
(§6 D6, §12, §13, §15 F9/F10). No other design content changed.

After Codex mechanically confirmed that final ordering correction, the human
approved all recommended D1–D8 choices and explicitly accepted (a) the
client-side mirror of the server level thresholds and (b) the bounded
historical-integrity limitation that completion history shows the Quest's
current title/category/status rather than completion-time snapshots. This
approval authorizes implementation within this plan, but not staging,
committing, pushing, merging, deployment, dependency changes, schema changes,
or scope expansion.

## 2. Executive summary

Slice 5B gives an authenticated user a responsive Personal Impact Passport at
`/passport`:

- display name (from the existing session query — no duplicated identity
  state);
- server-authoritative total XP, Level, and Rank Title from the existing,
  unchanged `GET /api/v1/users/me/progression` endpoint;
- current-level progress with fully specified, single-unit semantics,
  computed by a pure deterministic client mirror of the merged
  `ProgressionRules` curve, pinned by tests, with the drift risk explicitly
  documented (D3);
- a bounded, paginated, Verified + CompletionCode-only completion history
  served by one new backend endpoint,
  `GET /api/v1/users/me/passport/completions`, which is the exact route the
  accepted API contract already lists (D2, D4);
- an explicit authenticated-cache lifecycle so private Passport data never
  survives a logout, login, or session-expiry boundary (D6, Review 37 B1);
- loading, empty, confirmed-anonymous, session-restore-failure, not-ready
  (503), missing-profile (404), and unexpected-error states;
- responsive desktop/mobile presentation with accessible progress semantics.

Recommended boundary (D1): **summary plus paginated Verified completion
history**. No achievements, streaks, leaderboard, Share Card, community
participation aggregation, evidence claims, self-report, reward animation, or
passport aggregate-summary endpoint. The accepted long-term Passport endpoints
(`/users/me/passport`, `/users/me/passport/community-participation`) remain
unimplemented future direction.

One historical-integrity caveat is surfaced for human acknowledgement (D4):
completion rows snapshot difficulty only; quest title/category shown in
history are the Quest's *current* mutable fields. The recommended resolution
is a documented read-model limitation with no schema change; the snapshot
alternative is a stop condition requiring explicit human approval.

## 3. Verified merged baseline with file-level evidence

Branch and Git state, observed 2026-07-25:

- Current branch: `05b-passport-lite` (`git branch --show-current`).
- Working tree: clean (`git status --porcelain` produced no output).
- Reviewed HEAD: `7eea4fe30665ac58b5f012ad8be99c297c269eec` — merge commit
  `7eea4fe Merge pull request #12 from Zephyr724/05a-xp-ledger-and-progression-core`.
- Merged Slice 5A commits: `cc2dc1d feat: add XP ledger and progression core`
  and `e468281 fix: align timestamp assertions with PostgreSQL precision`.
  Slice 5A is therefore merged into the current branch.

Each baseline statement from the planning prompt, verified against merged
source:

1. **Slice 5A persists `UserProfiles.TotalXp` and `Level`.** Confirmed.
   `backend/src/Kiwimpact.Core/Entities/UserProfile.cs:14-24`;
   configuration with both CHECK constraints at
   `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserProfileConfiguration.cs:13-19`;
   migration `20260725144430_AddXpLedgerAndProgression`.
2. **Rank Title is derived, not persisted.** Confirmed. Derived at read time
   via `ProgressionRules.RankTitleFor` in
   `backend/src/Kiwimpact.Infrastructure/Repositories/XpLedgerRepository.cs`
   (`FindProgressionAsync`, :106-121); pure rules at
   `backend/src/Kiwimpact.Core/Progression/ProgressionRules.cs:60-81`.
3. **`GET /api/v1/users/me/progression` returns exactly
   `{ totalXp, level, rankTitle }`.** Confirmed.
   `MyProgressionDto(long TotalXp, int Level, string RankTitle)` at
   `backend/src/Kiwimpact.Api/Contracts/ProgressionContracts.cs:3-6`;
   exact-key assertion at
   `backend/tests/Kiwimpact.IntegrationTests/Api/ProgressionApiTests.cs:131-138`.
4. **The progression endpoint returns bounded `503 progression-not-ready`
   while any Verified completion lacks XP.** Confirmed. Live anti-join gate
   `HasRewardPendingCompletionsAsync`
   (`XpLedgerRepository.cs:24-32`), evaluated per request in
   `ProgressionService.GetMyProgressionAsync`
   (`backend/src/Kiwimpact.Core/Services/ProgressionService.cs:27-30`),
   mapped to `ProblemDetailsHelper.ProgressionNotReady()` (503, type
   `https://kiwimpact.app/problems/progression-not-ready`,
   `backend/src/Kiwimpact.Api/Helpers/ProblemDetailsHelper.cs:62-71`;
   controller mapping `ProgressionController.cs:44-48`).
5. **Completion-code redemption creates the Verified completion, XP
   transaction, and progression update atomically.** Confirmed. One
   transaction, one `SaveChangesAsync()`:
   `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs:133-235`
   (`RedeemAsync`; construction and single flush at :196-208).
6. **The redemption response deliberately contains no XP/reward reveal.**
   Confirmed. Response DTO `MyQuestCompletionDto(string Status, string?
   Method, string? CompletedAtUtc, string? VerifiedAtUtc)` at
   `backend/src/Kiwimpact.Api/Contracts/QuestCompletionContracts.cs:16-20`;
   exact-key assertion at `ProgressionApiTests.cs:280-285`.
7. **`XpTransaction.CreatedAt` equals the source completion's
   `VerifiedAtUtc`.** Confirmed. Factory guard in
   `backend/src/Kiwimpact.Core/Entities/XpTransaction.cs:25-57`
   (`CreateFromVerifiedCompletion`); documented at
   `specs/architecture/02-core-domain-data-model.md` §3.10.
8. **Current implemented completion support is Completion Code Verified
   completion only.** Confirmed. `QuestCompletionStatus` enum has the single
   value `Verified` (`backend/src/Kiwimpact.Core/Enums/QuestCompletionStatus.cs:3-6`);
   `CompletionMethod` has the single value `CompletionCode`
   (`backend/src/Kiwimpact.Core/Enums/CompletionMethod.cs`). Note the accepted
   data model (`specs/architecture/02-core-domain-data-model.md` §3.7) lists
   `Pending`/`Rejected`/`SelfReported` statuses and `EvidenceClaim`/
   `SelfReported` methods as accepted future direction — they are not in the
   implemented enum.
9. **The accepted long-term API document lists Passport summary, completion
   history, and community-participation endpoints, none implemented.**
   Confirmed. Listed at `specs/architecture/03-api-contract.md` §2.11
   (`/users/me/passport`, `/users/me/passport/completions`,
   `/users/me/passport/community-participation`). Backend controllers are
   exactly: Progression, QuestCompletion, CompletionCodes,
   QuestParticipation, OrganizerQuests, Auth, Regions, Quests, Health — a
   case-insensitive search for `passport|history` across
   `backend/src/Kiwimpact.Api` returns zero matches. The only backend
   "passport" occurrence is the unexposed column
   `UserProfile.ShowCommunityOnPassport` (`UserProfile.cs:17`).
10. **No Passport page, progression API client/hook, achievement system,
    streak, leaderboard, share card, or reward animation exists in the
    frontend.** Confirmed. Case-insensitive search for
    `passport|progression|achievement|streak|leaderboard|share.?card` across
    `frontend/` matches only a negative assertion at
    `frontend/tests/integration/QuestCompletionPanel.test.tsx:157`.
11. **The current auth/session response already provides the caller's display
    name.** Confirmed. `AuthSessionDto(Guid UserId, string DisplayName,
    string Email, IReadOnlyList<string> Roles)` at
    `backend/src/Kiwimpact.Api/Contracts/AuthContracts.cs:56-60`, served by
    `GET /api/v1/auth/me` (`AuthController.cs:168-183`). Frontend type
    `AuthSession { userId, displayName, email, roles }` at
    `frontend/src/types/auth.ts:1-6`, consumed via `useAuthQuery`
    (`frontend/src/hooks/useAuth.ts:6-13`, key `['auth','me']`).
    Caveat recorded: `frontend/src/lib/api/auth.ts:4-13` does **not**
    runtime-validate the session payload (unlike the completion/participation
    modules); 5B does not change that file (see §18).
12. **TanStack Query owns server state; Zustand holds no identity,
    progression, or history data.** Confirmed. The only store is
    `frontend/src/stores/useUiStore.ts:1-16` (`mobileNavOpen`,
    `themePreference`). Server state lives in TanStack Query
    (`frontend/src/app/queryClient.ts:3-10`).

Additional verified facts the plan relies on:

- **Progression curve.** `ProgressionRules.cs`: `MaxLevel = 99`,
  `MinLevel = 1` (:11-12); XP per difficulty Easy 50 / Medium 100 / Hard 150
  (:14-21); cumulative threshold `RequiredXpForLevel(L) = 5 × (L − 1) × (L +
  7)` valid for L ∈ 2..99, level 1 floor 0 (:27-35); `ComputeLevel` caps at
  99 while totals keep accruing (:42-58); rank bands (:60-81): 1-9 Novice,
  10-19 Scout, 20-29 Adventurer, 30-39 Ranger, 40-49 Pathfinder, 50-59
  Guardian, 60-69 Vanguard, 70-79 Champion, 80-89 Hero, 90-98 Legend, 99
  Kiwimpact Legend. Pinned by 57 unit tests
  (`backend/tests/Kiwimpact.UnitTests/Core/ProgressionRulesTests.cs`).
- **One Verified completion per Member per Quest**, enforced by filtered
  unique index `UX_QuestCompletions_UserId_QuestId_Verified`
  (`QuestCompletionConfiguration.cs:62-69`; data model §3.7).
- **Quest title/category are mutable.** `Quest.UpdateDetails`
  (`backend/src/Kiwimpact.Core/Entities/Quest.cs:87-118`) via
  `PUT /api/v1/organizer/quests/{id}`; completions snapshot only
  `RewardDifficultySnapshot` (`QuestCompletion.cs:11-27`). `QuestStatus`:
  Draft, Published, Cancelled, Archived — no Deleted; delete allowed only
  from Draft (`Quest.cs:153-157`), and `QuestCompletion → Quest` is a
  Restrict FK, so a quest with a Verified completion always retains its row.
- **Pagination convention.** Page-number style, `page`/`pageSize`, defaults
  1/12, max 50, envelope `PagedResponse<T>` `{ items, page, pageSize,
  totalCount, totalPages, hasNextPage, hasPreviousPage }`
  (`backend/src/Kiwimpact.Api/Contracts/PagedResponse.cs:3-11`;
  `QuestsController.cs:22-68`; contract doc §1.2).
- **Redemption invalidations today.** `syncAuthoritativeCompletion`
  (`frontend/src/hooks/useCompletion.ts:97-115`) invalidates exactly
  `completionKeys.detail`, `participationKeys.detail`, and
  `['quest', questId]`, all `exact: true`.
- **Route guard reality.** Only `RequireManagementAccess`
  (`frontend/src/components/organizer/RequireManagementAccess.tsx:26-51`)
  exists; there is no generic authenticated guard. AppShell nav has no
  NavLink/active-route styling and no mobile hamburger
  (`frontend/src/app/AppShell.tsx:5-104`).
- **Frontend validation idiom.** Hand-rolled validators with `isRecord` +
  strict exact-key `hasExactKeys` in `frontend/src/lib/validation/`
  (canonical example `completionDto.ts`); no zod anywhere.
- **Frontend test idiom.** Vitest 4 + jsdom + Testing Library; no MSW —
  `vi.stubGlobal('fetch', ...)` URL-suffix routing; helpers in
  `frontend/tests/organizerTestUtils.tsx`.
- **TanStack Query version idiom.** This repository uses v5:
  `placeholderData: keepPreviousData` at
  `frontend/src/hooks/useQuests.ts:1,10`; the v4-style `keepPreviousData:
  true` option does not exist here.
- **PostgreSQL null ordering.** `ORDER BY ... DESC` defaults to
  `NULLS FIRST`; explicit `NULLS LAST` is required for the intended history
  ordering (PostgreSQL documentation, Sorting Rows).
- **Auth cache lifecycle today.** The login mutation sets `['auth','me']`
  on success (`frontend/src/hooks/useAuth.ts:19`) and the logout mutation
  sets it to `null` (:31); neither touches any other query entry, and
  inactive queries remain cached by TanStack Query default.

## 4. Goals

- G1. An authenticated `/passport` route showing display name plus
  server-authoritative total XP, Level, and Rank Title.
- G2. Current-level progress with fully specified, single-unit, tested
  semantics, including threshold boundaries, invalid-payload handling, and
  Level 99.
- G3. A bounded, paginated, Verified + CompletionCode-only completion
  history built only on currently implemented data.
- G4. Clear Verified/XP semantics: XP shown only where an authoritative
  `XpTransaction` exists; pending state explicit, never guessed; the
  null-`VerifiedAtUtc` invariant failure bounded, never rendered with an
  invented timestamp.
- G5. Complete state coverage: loading, empty, confirmed-anonymous,
  session-restore failure, not-ready, missing-profile, unexpected error,
  with retry where meaningful.
- G6. Responsive desktop/mobile presentation meeting the UX brief's
  accessibility guidance, verified by an observed narrow-viewport smoke
  check during implementation.
- G7. Passport query invalidation wired into the existing redemption resync
  so a new Verified completion appears without manual refresh.
- G8. Private Passport server data never crosses a principal boundary:
  logout, login, and any private 401 cancel in-flight requests and remove
  the private cache entries before another session can mount them.

## 5. Non-goals

Everything in the planning prompt's explicit-exclusions list, restated as
binding for this Slice: achievements/unlocks; streak; leaderboard; community
participation aggregation; Community Challenge; Share Card; reward
overlay/count-up/level-up animation; SelfReported completion; EvidenceClaim
and Admin review; SignalR; theme-switching implementation; Docker/deployment;
authentication architecture changes; dependency additions; unrelated
refactors; public or Admin access to another user's Passport; schema changes
(see the D4 stop condition). Also excluded:

- the accepted `/users/me/passport` aggregate-summary endpoint and
  `/users/me/passport/community-participation` (D2);
- changing the exact three-key progression DTO (D2/D3);
- Home Community display on the Passport (the
  `ShowCommunityOnPassport` toggle has no settings surface yet; privacy rules
  default it off);
- runtime-validation hardening of the pre-existing `auth.ts` session fetch
  (recorded in §18 as a separate candidate);
- narrow-screen navigation fit without a new hamburger menu (the existing
  unwired `useUiStore.mobileNavOpen` stays unwired; fit is achieved with
  existing label idioms and proven by an observed smoke check — §14);
- page-number offset pagination, which is sufficient for the small P0
  history and whose bounded staleness is specified truthfully in §9;
- placeholder cards for any excluded system — unavailable sections are
  omitted, not fictionalized.

## 6. D1–D8 decision table

Every decision below was explicitly approved by the human on 2026-07-26.
Sections §7–§15 carry the full detail; this table is the summary.

### D1 — Exact Passport-lite boundary — APPROVED

- **Recommendation: summary + paginated Verified completion history.**
  Display name, total XP, Level, Rank Title, level progress, and a bounded
  Verified + CompletionCode-only history (page size 12, max 50).
- Alternatives: (a) progression-only summary — smallest, but thin for a
  demonstrable P0 Passport and leaves the "completion history" P0 intent
  unmet; (b) summary + history + community-participation aggregation —
  exceeds lite, needs region-label surfacing decisions; (c) the full
  accepted Passport contract — explicitly out of scope.
- Tradeoffs: history adds one backend endpoint and one query, but every
  datum it needs already exists and is server-authoritative. Summary-only
  would make `/passport` a near-duplicate of a header XP chip.

### D2 — Backend endpoint strategy — APPROVED

- **Recommendation: compose existing endpoints + one new history endpoint.**
  Reuse `GET /api/v1/auth/me` (display name, via the existing session query)
  and `GET /api/v1/users/me/progression` (unchanged exact three-key DTO); add
  exactly one endpoint, `GET /api/v1/users/me/passport/completions`, the
  route already listed in accepted contract §2.11, implemented with the 5B
  Verified + CompletionCode subset semantics.
- Alternatives: (a) implement the accepted `GET /users/me/passport` aggregate
  summary — rejected for 5B: it would either duplicate the composition or
  pressure-expand toward fields (achievements, streak, community) that do not
  exist; (b) implement both summary and history — same objection; (c) extend
  the progression DTO with thresholds — rejected: breaks the accepted
  "exactly `{ totalXp, level, rankTitle }`" contract
  (`specs/architecture/03-api-contract.md` §2.2) and its exact-key tests
  without a compelling reason (see D3).
- The existing progression DTO is preserved byte-for-byte.

### D3 — Level-progress semantics — APPROVED

- **Recommendation: deterministic client mirror, server authority
  preserved.** The server remains authoritative for `totalXp`, `level`, and
  `rankTitle`. The UI derives display-only thresholds from a pure TypeScript
  mirror of `ProgressionRules`: floor(L) = `5 × (L − 1) × (L + 7)` for
  L ≥ 2, floor(1) = 0; next threshold for level L (1..98) = floor(L + 1).
  Level 99: no next threshold; the UI shows a max-level state (full bar +
  "Maximum level reached"), never a percentage beyond 99. The mirror is
  pinned by unit tests asserting exact threshold values (e.g. level 2 at 45
  XP, level 3 at 100 XP, level 99 at `5 × 98 × 106 = 51,940` XP) and
  boundary behavior, and the backend curve is independently pinned by 57
  existing unit tests.
- **One unit everywhere (Review 37 M2):** total XP is displayed only as its
  own statistic. The progress bar, its visible fraction, and its ARIA values
  all use within-level XP: `currentLevelXp = totalXp − floor(level)` over
  `levelSpanXp = floor(level + 1) − floor(level)`; "XP to Level N" is
  `floor(level + 1) − totalXp` and appears only when level < 99; no
  percentage text is shown without the exact fraction semantics in the test
  matrix (§15).
- **Invalid server state (M2/m1):** the runtime validator rejects a
  progression payload whose numbers are non-integer, negative, unsafe, or
  out of range, or whose `totalXp`/`level` are mutually inconsistent under
  the mirror (`totalXp < floor(level)`, or level < 99 with
  `totalXp ≥ floor(level + 1)`). A rejected payload renders the summary
  region's error state. The UI never silently clamps inconsistent
  authoritative data into a plausible-looking bar.
- Alternatives: (a) server-supplied thresholds — zero drift but changes the
  accepted three-key DTO (or adds a fourth endpoint); (b) embed thresholds in
  the new history endpoint — wrong cohesion, thresholds are not history.
- Drift risk and mitigation are explicit: if the accepted curve ever changes,
  the change is itself an approval-gated decision and must update both
  implementations and both test suites in one Slice; the plan records the
  client mirror as temporary until an accepted Passport summary endpoint
  carries thresholds server-side. If the human prefers server-supplied
  thresholds now, that is a D2/D3 scope change requiring plan amendment —
  **stop condition**.

### D4 — Completion-history semantics — APPROVED

- **Recommendation:** records filtered by both `Status == Verified` **and**
  `Method == CompletionCode` — the only implemented status and method — so a
  future Verified EvidenceClaim cannot silently enter the 5B surface and
  break its exact contract (Review 37 m2); one record per Quest (guaranteed
  structurally by `UX_QuestCompletions_UserId_QuestId_Verified`); ordered
  `VerifiedAtUtc DESC` with explicit `NULLS LAST`, tie-break `Id ASC`;
  page-number pagination reusing `PagedResponse<T>` with truthful bounded
  semantics (m3): deterministic for an unchanged dataset, while a concurrent
  new completion can shift rows between pages — the UI resets to page 1 on
  redemption-driven invalidation and clamps the page when `totalPages`
  shrinks; item DTO as specified in §8. `xpAmount` comes only from the
  `XpTransaction` row joined on `SourceCompletionId` and is `null` for an
  ordinary (non-null-timestamp) reward-pending row — the UI shows an
  explicit "XP pending" label and never an estimated amount. Verification
  label is the constant `Verified`; `method` is included as validated
  contract data, and any future completion-method Slice must broaden
  backend, DTO/validator, and UI labels together.
- **Null-`VerifiedAtUtc` invariant failure (M1):** a Verified completion
  with null `VerifiedAtUtc` is the 5A unprocessable state — impossible via
  application paths and readiness-blocking by design. The history endpoint
  answers such a caller with the bounded `503 progression-not-ready`
  ProblemDetails instead of a page. The DTO's `verifiedAtUtc` therefore
  stays non-null for every rendered row: no timestamp is invented, no row is
  silently dropped from a history that claims completeness, and ordinary
  non-null-timestamp reward-pending rows remain available with
  `xpAmount: null`. A real-PostgreSQL raw-SQL test proves the 503 path
  (§15 B10).
- **Historical-integrity caveat (human acknowledgement required):** quest
  title/category/quest-status are read from the Quest's *current* mutable
  row, not from as-of-completion snapshots (none exist). A later organizer
  edit rewrites history display. Recommended resolution: documented
  read-model limitation, no schema change; quest-status badge
  (`Cancelled`/`Archived`) shown so a no-longer-available quest is honest.
  The alternative — snapshot columns on `QuestCompletion` — is a schema
  change and a **stop condition**: if the human wants snapshots, planning
  stops for explicit schema approval before any implementation.
- Deleted quests cannot occur for Verified completions (delete allowed only
  from Draft; Restrict FK). Draft quests cannot have Verified completions.
  Unsupported future statuses and methods are excluded by the query filter —
  never represented with invented labels.

### D5 — Privacy, authorization, and readiness — APPROVED

- **Recommendation:** both consumed endpoints are self-only with identity
  solely from `ClaimTypes.NameIdentifier`; roles Member/Organizer/Admin
  (same attribute as `ProgressionController.cs:12`); no route/query/body
  selector for another user exists; anonymous → 401; history excludes email,
  user ID, Home Community, evidence, code material, claim text, review
  notes, and precise location — the DTO in §8 contains none of them;
  `progression-not-ready` (503) from the progression endpoint degrades only
  the summary section; the history endpoint stays available during ordinary
  (non-null-timestamp) reward-pending windows and returns its own bounded
  503 only for the caller's null-`VerifiedAtUtc` invariant failure (M1);
  missing profile → bounded 404 produced by an explicit profile-existence
  check that precedes the page query (M4, §11); bounded
  401/404/503/unexpected responses per §13; no new logging of Passport
  content — read endpoints add no per-request logging beyond framework
  defaults, and error mapping follows the existing bounded ProblemDetails
  pattern.

### D6 — Frontend architecture and state ownership — APPROVED

- **Recommendation:** route `/passport` under `AppShell` behind a new
  generic `RequireAuth` guard with an explicit four-state machine (M3:
  pending → skeleton; confirmed anonymous → redirect; authenticated →
  children; session-restore transport failure → bounded error with Retry,
  never a redirect); "Passport" nav link in the authenticated branch of
  `AppShell` using the existing short-label/`hidden sm:inline` idioms so the
  320/375px navbar cannot overflow (m4); new API modules
  `lib/api/progression.ts` + `lib/api/passport.ts` with strict exact-key
  validators extended by numeric and cross-field bounds (m1); hooks
  `useProgression` and `usePassportCompletions` with exported key factories
  (`['progression','me']`, `['passport','completions',{page,pageSize}]`),
  `retry: false`, and `placeholderData: keepPreviousData` (the repository's
  TanStack Query v5 idiom, `useQuests.ts:10`) for page transitions; one
  explicit ordered authenticated-cache lifecycle (B1) shared by logout,
  login/account replacement, and private-endpoint 401 alike — await
  cancel-then-remove of `['progression']`/`['passport']` first, and only
  then clear or replace the auth session;
  redemption resync extended to invalidate both Passport keys and reset the
  history view to page 1; nothing added to Zustand — progression and
  history are server state and must never enter `useUiStore` or Web Storage;
  component boundaries per §12; responsive single-column mobile → two-column
  desktop; native/ARIA progress semantics in the single within-level unit;
  visible focus; reduced-motion-safe by construction (no new animation).

### D7 — Testing strategy — APPROVED

- **Recommendation:** the §15 matrix — backend API/persistence coverage for
  the new endpoint (authorization, isolation, exact keys, pagination
  boundaries, fixed-dataset ordering stability, XP linkage, ordinary
  reward-pending, the null-`VerifiedAtUtc` 503 on real PostgreSQL via raw
  SQL, method-filter isolation, mutable-quest-field behavior, profile-404
  precedence, privacy exclusions) plus frontend validator (numeric and
  cross-field negatives), hook, page-state, level-boundary, guard
  four-state, mid-page 401, A → logout → B cache-lifecycle, page
  reset/clamp, state-ownership, accessibility, and an observed
  narrow-viewport smoke check recorded honestly in the completion report.
  Targeted commands during implementation; full applicable gates from
  AGENTS.md once after implementation: frontend `npm run lint`,
  `npm run type-check`, `npm run test -- --run`, `npm run build`; backend
  `dotnet build Kiwimpact.slnx`, both `dotnet test ... --no-build` projects.

### D8 — Documentation and evidence — APPROVED

- **Recommendation:** after approval, implementation amends exactly
  `specs/architecture/03-api-contract.md` §2.11 — **additively**, recording
  the implemented 5B subset (Verified + CompletionCode only, exact item DTO,
  nullable `xpAmount`, 401/404/503 conditions) while preserving the accepted
  one-record-per-Quest precedence as unimplemented long-term direction (m2).
  Implementation must also produce the prompt record under
  `specs/ai/prompts/`, the completion report under
  `specs/implementation/reports/`, and obtain the independent read-only
  implementation review under `specs/ai/reviews/` (this is an important
  cross-layer Slice).

## 7. Proposed user journeys

1. **Member views own Passport (populated).** Member selects `Passport` in
   the header → skeleton → summary card (display name, Level, Rank Title,
   total XP, progress toward next level) → history list, newest Verified
   completion first, with quest title, category, verification label,
   completion date, XP amount → pagination controls.
2. **New Member (empty history).** Summary shows Level 1 / Novice / 0 XP,
   progress bar at 0 of 45 toward Level 2; history shows a calm empty state
   ("No verified completions yet") with a link to Discover — never a
   fabricated record.
3. **Redeem → Passport refresh.** After a successful redemption on Quest
   Detail, the existing resync also invalidates the Passport queries;
   opening `/passport` shows updated totals and the new history row, with
   the history view reset to page 1.
4. **Not-ready window.** While any Verified completion lacks its XP row, the
   summary region shows the bounded not-ready state with a retry action;
   history still renders, with "XP pending" on any affected ordinary row.
5. **Anonymous visitor.** `/passport` redirects to `/login` only after the
   session query confirms `null` (M3).
6. **Account switch.** User A signs out (or the session expires); user B
   signs in in the same browser. B's Passport fetches fresh data only — no
   cached XP, Level, Rank Title, or history row of A can appear (G8, B1).
7. **Mobile.** Single column: summary card, progress, then history list;
   pagination controls full-width, 44px targets; navbar fits at 320/375px.

## 8. Proposed API contracts and exact DTOs

No change to any existing endpoint or DTO.

### New endpoint (D2/D4)

`GET /api/v1/users/me/passport/completions?page={page}&pageSize={pageSize}`

- Auth: `[Authorize(Roles = Member,Organizer,Admin)]`; identity only from
  `ClaimTypes.NameIdentifier`.
- Record set: caller's completions with `Status == Verified` **and**
  `Method == CompletionCode` (m2) — the only implemented values.
- Query: `page` (1-based, default 1, values < 1 normalize to 1), `pageSize`
  (default 12, < 1 normalizes to 12, clamped to 50) — identical
  normalization to `QuestsController.cs:46-47`.
- Response `200`: `PagedResponse<PassportCompletionItemDto>` with the
  existing envelope keys `items, page, pageSize, totalCount, totalPages,
  hasNextPage, hasPreviousPage`.

`PassportCompletionItemDto` — exactly these keys:

```json
{
  "completionId": "uuid",
  "questId": "uuid",
  "questTitle": "string (current Quest.Title)",
  "questCategory": "RestoreNature|ProtectWildlife|CleanReduceWaste|GrowCompost|ObserveMeasure|LearnShare",
  "questStatus": "Published|Cancelled|Archived",
  "status": "Verified",
  "method": "CompletionCode",
  "completedAtUtc": "ISO-8601 UTC (\"O\")",
  "verifiedAtUtc": "ISO-8601 UTC (\"O\")",
  "xpAmount": 50
}
```

- `xpAmount`: `int?` — the joined `XpTransaction.XpAmount`; `null` iff the
  completion is an ordinary (non-null-timestamp) reward-pending row. Never
  client-influenced.
- `verifiedAtUtc`: non-null for every returned row, by construction — a
  caller with a null-`VerifiedAtUtc` Verified row receives the bounded 503
  before any page is composed (M1), so mapping never confronts a null.
- Enums serialized via `.ToString()`, timestamps via `.ToString("O")` —
  the existing `DtoMapping` idiom.
- Error responses (bounded ProblemDetails, existing helpers):
  - `401` anonymous or unparseable identity (bare `Unauthorized()`, same as
    `ProgressionController.cs:35-36`);
  - `404` authenticated user with no profile row, produced by the explicit
    profile-existence check that precedes the page query (M4, §11);
  - `503 progression-not-ready` (existing bounded helper, no counts or
    internals) **only** when the caller has a Verified completion with null
    `VerifiedAtUtc` — the 5A unprocessable invariant failure (M1). Ordinary
    non-null-timestamp reward-pending rows do **not** trigger this; they
    return 200 with `xpAmount: null`;
  - `500` generic unexpected (framework).

## 9. Completion-history and historical-integrity semantics

- **Included record set:** caller's `QuestCompletion` rows with
  `Status == Verified` **and** `Method == CompletionCode` — the only status
  and method the implemented enums contain (`QuestCompletionStatus.cs:3-6`,
  `CompletionMethod.cs`). SelfReported, EvidenceClaim-pending, and Rejected
  are not implemented and therefore neither queried nor represented. A
  future Verified EvidenceClaim completion must not enter this surface
  silently: the method filter isolates the 5B subset, and the future
  completion-method Slice broadens backend filter, DTO/validator, and UI
  labels together (m2). Accepted contract §2.11's one-record-per-Quest
  precedence (Verified > Pending EvidenceClaim > SelfReported > latest
  Rejected) remains the long-term direction; 5B documentation amends §2.11
  additively and never narrows it.
- **One record per Quest:** guaranteed by the partial unique index; no
  read-model deduplication logic is needed or permitted to mutate canonical
  rows (data model §3.7).
- **Ordering:** `VerifiedAtUtc DESC` with **explicit `NULLS LAST`**,
  tie-break `Id ASC` — deterministic for an unchanged dataset. PostgreSQL's
  `DESC` default is `NULLS FIRST`, so the query states `NULLS LAST`
  explicitly. Rows reaching this ordering have non-null `VerifiedAtUtc` by
  construction: a caller with a null-timestamp Verified row receives the
  bounded 503 before any page is composed (M1) — no row is silently omitted
  from a returned history and no timestamp is invented.
- **Offset-pagination truthfulness (m3):** page-number `Skip/Take` is
  stable only for an unchanged snapshot; a concurrent new Verified
  completion can shift rows across page boundaries (a row may move to the
  previous page, or be seen twice across two page requests). This is
  accepted for the small P0 history; cursor pagination is not required. The
  UI mitigates: redemption-driven invalidation resets the history view to
  page 1, and if `totalPages` shrinks below the current page the view
  clamps to the last page. The fixed-dataset tie-break test (§15 B7) pins
  the deterministic half of this contract without overstating it.
- **Snapshot vs current fields:** the completion snapshots difficulty
  (`RewardDifficultySnapshot`) and community; it does not snapshot title or
  category. History therefore shows the Quest's current title/category. This
  is the D4 caveat: honest for record-keeping, weak for historical
  fidelity. The plan recommends accepting this as a documented limitation
  and showing `questStatus` so Cancelled/Archived quests are labelled.
  Adding snapshot columns is a schema change — **stop condition** requiring
  explicit human approval outside this plan's recommended scope.
- **XP amount source:** `XpTransaction` joined on `SourceCompletionId`
  (unique — at most one row). Amount derives from the immutable
  `RewardDifficultySnapshot` at award time, never from current
  `Quest.Difficulty`/`Quest.XpAward`.
- **Ordinary reward-pending row** (non-null `VerifiedAtUtc`, XP row not yet
  written): included with `xpAmount: null`; UI label "XP pending". Totals
  are never derived client-side from history rows. The null-`VerifiedAtUtc`
  invariant failure is **not** rendered — it produces the bounded 503 for
  that caller (M1).

## 10. Level-progress calculation and Level 99 behavior

Source of truth: `backend/src/Kiwimpact.Core/Progression/ProgressionRules.cs`.

- Cumulative floor: `floor(1) = 0`; `floor(L) = 5 × (L − 1) × (L + 7)` for
  L ∈ 2..99 (values: L2 = 45, L3 = 100, L4 = 165, L10 = 765,
  L99 = 51,940).
- Server supplies `totalXp`, `level`, `rankTitle`. Display derives exactly
  these quantities, **all in within-level XP units (M2)**:
  `levelFloor = floor(level)`; `nextFloor = floor(level + 1)` when
  `level < 99`; `currentLevelXp = totalXp − levelFloor`;
  `levelSpanXp = nextFloor − levelFloor`. The bar, its visible fraction
  ("`currentLevelXp` / `levelSpanXp` XP toward Level N+1"), and its ARIA
  values all use these two numbers; total XP appears only as a separate
  statistic; "XP to Level N+1" = `nextFloor − totalXp`, displayed only when
  `level < 99` (non-negative for every consistent payload).
- **Threshold boundary:** when `totalXp == nextFloor`, the server's
  `ComputeLevel` already returns `level + 1`, so the client never displays
  100%-but-not-levelled; the mirror is tested against this exact boundary.
- **Invalid server state (M2/m1):** if a payload fails validation —
  non-integer/negative/unsafe numbers, `level` outside 1..99, or
  `totalXp`/`level` mutually inconsistent under the mirror
  (`totalXp < levelFloor`, or `level < 99` with `totalXp ≥ nextFloor`) —
  the summary region renders its error state. The UI never clamps
  inconsistent authoritative data into a plausible-looking bar, and the
  "non-negative by construction" argument is a test target, not a silent
  assumption.
- **Level 99:** no next threshold exists (`RequiredXpForLevel` is valid only
  to 99). UI: full progress bar, text "Maximum level reached", no "XP to
  next level" line. `totalXp` continues to display and may keep accruing.
- **Drift control:** the mirror lives in one module
  (`frontend/src/lib/progressionRules.ts`) referencing
  `ProgressionRules.cs` in a comment; unit tests pin exact thresholds,
  boundaries, and invalid-state rejection; any accepted curve change must
  update both sides in one approved Slice. The mirror derives display aids
  only — it never writes XP, level, or rank anywhere.

## 11. Backend architecture and query design

Proposed, following the established Core/Infrastructure/Api layering:

- `IPassportService` / `PassportService` (Core), executed in this exact
  order: identity guard (`Guid.Empty` → NotFound, matching the 5A
  progression service); page/pageSize normalization; profile-existence
  check (M4); caller-scoped null-`VerifiedAtUtc` check (M1); page query.
  No ordinary readiness gate on this service (D5).
- `IPassportRepository` / `PassportRepository` (Infrastructure): three
  read-only, no-tracking operations —
  1. `UserProfiles.AnyAsync(p => p.Id == userId)` — existence proof for the
     bounded 404 (M4). The service calls it before composing any page, so
     the 404 is an executable path, not an aspirational response condition;
     §15 B13 proves it, including a principal with seeded completions but
     no profile row.
  2. Caller-scoped unprocessable check —
     `QuestCompletions.AnyAsync(UserId == id && Status == Verified &&
     VerifiedAtUtc == null)`; true → bounded 503 (M1).
  3. Page query — `QuestCompletions.Where(UserId == id && Status ==
     Verified && Method == CompletionCode)` (m2), join `Quests` for current
     title/category/status, left-join `XpTransactions` on
     `SourceCompletionId` for `XpAmount`; ordered `VerifiedAtUtc DESC` with
     explicit `NULLS LAST`, then `Id ASC`; `CountAsync` + `Skip/Take`. Uses
     the existing QuestId index plus the UserId predicate (a new index is
     *not* proposed; the per-user Verified set is small — flagged for
     design review).
- `PassportController` (Api): `api/v1/users/me` route prefix,
  `passport/completions` action; same authorization attribute, identity
  parsing, and ProblemDetails mapping as `ProgressionController`.
- `PassportContracts.cs` + `DtoMapping` extensions, `.ToString("O")`
  timestamps, enum `.ToString()`.
- DI registration in `Infrastructure/DependencyInjection.cs` and
  `Program.cs` per existing patterns.
- No migration, no model change, no new dependency.

## 12. Frontend architecture, state ownership, and query keys

New files (proposed):

- `frontend/src/types/progression.ts` — `MyProgression { totalXp, level,
  rankTitle }`.
- `frontend/src/types/passport.ts` — `PassportCompletionItem`,
  `PassportCompletionsPage` (mirrors `PagedResponse`).
- `frontend/src/lib/validation/progressionDto.ts`,
  `frontend/src/lib/validation/passportDto.ts` — `isRecord` +
  `hasExactKeys` strict validators following `completionDto.ts`, **plus
  numeric and cross-field bounds (m1)**: `Number.isSafeInteger` on every
  JSON number that feeds arithmetic; `totalXp ≥ 0`; `level` an integer in
  1..99; `xpAmount` null or a positive safe integer; envelope coherence
  (`page ≥ 1`, `pageSize` in 1..50, `totalCount ≥ 0`, `totalPages ≥ 0`,
  `hasNextPage === (page < totalPages)`,
  `hasPreviousPage === (page > 1)`, `items.length ≤ pageSize`); enum
  membership via `Set`; strict UTC timestamp regex; and the progression
  consistency check from §10. Any violation rejects the payload.
- `frontend/src/lib/api/progression.ts` — `fetchMyProgression()` →
  `GET /v1/users/me/progression`, validate, return. On 401 it runs the
  session-expiry path below.
- `frontend/src/lib/api/passport.ts` — `fetchPassportCompletions(page,
  pageSize)`; same 401 path.
- `frontend/src/lib/api/privateCache.ts` — the single authenticated-cache
  lifecycle (B1). `clearPrivateServerState(queryClient)` is async and
  internally ordered: it first **awaits** `cancelQueries` for
  `['progression']` and `['passport']` — so an in-flight old-principal
  request cannot complete into the cache — and only then runs
  `removeQueries` for the same prefixes. All three principal-boundary
  paths share this one ordered lifecycle: logout, login/account
  replacement, and private-endpoint 401/session expiry. On every path the
  sequence is identical: (1) `await clearPrivateServerState(queryClient)`;
  (2) only after cleanup completes, clear or replace the auth session;
  (3) only then allow a redirect or let the path end. Integration points
  are `frontend/src/hooks/useAuth.ts:19,31` plus the 401 handler described
  below; those calls are the only changes to `useAuth.ts`.
- `frontend/src/lib/progressionRules.ts` — pure mirror (§10).
- `frontend/src/hooks/useProgression.ts` — `progressionKeys.me =
  ['progression','me']`, `retry: false`.
- `frontend/src/hooks/usePassportCompletions.ts` — `passportKeys.all =
  ['passport']`, `passportKeys.completions(page, pageSize) =
  ['passport','completions',{page,pageSize}]`, `placeholderData:
  keepPreviousData` (the v5 idiom at `frontend/src/hooks/useQuests.ts:1,10`)
  for page transitions, `retry: false`.
- `frontend/src/components/RequireAuth.tsx` — generic guard with an
  explicit four-state machine (M3): session **pending** → skeleton with
  `aria-live`; **confirmed anonymous** (session query succeeded with
  `null`) → `<Navigate replace to="/login" />`; **authenticated** →
  children; **session-restore failure** (`isError`, e.g. network/5xx while
  restoring the session) → bounded inline error with Retry — never a
  redirect, because a transport failure is not evidence of anonymity. Only
  a confirmed null session redirects.
- `frontend/src/pages/PassportPage.tsx` — composition + state branching.
- `frontend/src/components/passport/PassportSummaryCard.tsx`,
  `LevelProgress.tsx`, `CompletionHistoryList.tsx`,
  `CompletionHistoryItem.tsx`, `PassportPagination.tsx` (inline pattern from
  `QuestListPage.tsx:223-241`, not an extraction refactor).

Modified files (minimal):

- `frontend/src/app/router.tsx` — add `/passport` under a `RequireAuth`
  group.
- `frontend/src/app/AppShell.tsx` — add `Passport` link in the
  authenticated branch only, using the existing short-label/
  `hidden sm:inline` idioms (m4).
- `frontend/src/hooks/useCompletion.ts` — extend
  `syncAuthoritativeCompletion` to also invalidate `['progression','me']`
  and `['passport']` (prefix invalidation covers all history pages).
- `frontend/src/hooks/useAuth.ts` — two `clearPrivateServerState` calls
  (B1), both awaited before the auth entry changes: on logout success,
  `await clearPrivateServerState(queryClient)` first and only then
  `setQueryData(authQueryKey, null)` — never auth-first; in the login
  mutation, `await clearPrivateServerState(queryClient)` before
  `setQueryData(authQueryKey, session)` installs the new principal — the
  old principal's requests are cancelled and its private entries removed
  before the new session exists.

Session-expiry path (M3/B1): a 401 from any private Passport/progression
request is converted exactly like `fetchCurrentSession`'s 401 → `null`
idiom, but in the strict shared order: the API layer first `await`s
`clearPrivateServerState(queryClient)` (cancel-then-remove, as above);
only after the private cleanup has completed does it run
`queryClient.setQueryData(authQueryKey, null)`; and only after the auth
entry is `null` may the guard redirect or the 401 path end — the 401
handler does not propagate, redirect, or resolve until cleanup is
complete. There is never an intermediate state in which authentication is
already anonymous while the previous principal's private queries still
exist. A mid-page expiry therefore never leaves stale private data behind
and never lets the guard trust a dead session for the remainder of its
60-second stale time.

State ownership rules (binding):

- Session/display name: existing `useAuthQuery` only — no duplication, no
  prop-drilling into stores.
- Progression and history: TanStack Query only. **Never** Zustand, never
  Web Storage, never optimistic XP mutation, no client-side totals.
- Private server data never survives a principal boundary (B1/G8): logout,
  login, and any private 401 all run the cleanup before another session can
  mount these keys. User-scoping the keys by user ID was considered and is
  not sufficient on its own — cleanup of sensitive inactive queries is
  required regardless.
- Page number for history: local component state (a private history page
  number does not need the URL). Reset to page 1 when the redemption resync
  invalidates `['passport']`; clamp to `totalPages` when it shrinks (m3).
- No toast containing reward history; no automatic animation; no
  speculative cache writes.

## 13. Authorization, privacy, logging, and error behavior

- Self-only on both endpoints; no selector of any kind. Admin and Organizer
  get exactly their own Passport — no elevated read of other users
  (ownership table, data model §6; API doc §4 Admin UserProfile boundary).
- Anonymous: 401 from the backend; the frontend guard redirects only on a
  confirmed null session, and fires no Passport request while the session
  is pending or failed to restore (M3).
- Session expiry mid-page: any private 401 awaits the B1 cleanup first,
  then clears the auth entry, and only then the guard redirects to
  `/login`; a failed session restore (network/5xx) shows the guard's
  bounded error with Retry, not a redirect (M3).
- Response exclusions (asserted by tests): no `userId`, `email`,
  `homeCommunityRegionId`, community labels, evidence/claim fields, code
  material, review notes, participation IDs, or location data in any
  Passport response. `completedAtUtc`/`verifiedAtUtc` are the member's own
  timestamps (self-view, permitted).
- Readiness: the progression endpoint's 503 affects only the summary
  region. History is gate-free for ordinary reward-pending windows and has
  exactly one 503 of its own: the caller's null-`VerifiedAtUtc` invariant
  failure (M1). The frontend renders the not-ready panel from
  `error.problem.type === 'https://kiwimpact.app/problems/progression-not-ready'`
  with a manual retry (`refetch()`), matching the `redeemErrorMessage`
  error-switch idiom.
- 404 (no profile): "Passport unavailable" state — an invariant failure,
  not an empty state; produced by the explicit existence check (§11, M4).
- Logging: no new application logging on the read path; unhandled
  exceptions follow the existing generic-500 mapping. Nothing in requests
  or responses logs XP values, display names, completion IDs, or quest
  titles.

## 14. Responsive UX and accessibility states

- Structure: `max-w-4xl` container (QuestDetail idiom); mobile single
  column → desktop two-column split (summary card left, history right) —
  final classes settled in implementation with the same Tailwind/daisyUI
  vocabulary as existing pages.
- Navigation at 320/375px (m4): the `Passport` link joins the existing
  single-row navbar using the established `hidden sm:inline` / short-label
  idioms so the authenticated cluster (brand, Quests, Manage quests,
  Passport, display name, logout) cannot overflow; no new menu is built and
  the unwired `useUiStore.mobileNavOpen` stays out of scope. Implementation
  must perform an **observed responsive browser smoke check at 375px and
  320px** (navbar fits, Passport reachable, summary/history hierarchy
  intact) and record the observed result in the completion report; if
  overflow is observed and cannot be fixed within existing idioms,
  implementation stops and returns to the human with a minimal-menu
  proposal rather than silently shipping a broken nav.
- Summary card: display name (h1-level identity block), Level badge, Rank
  Title, total XP as its own statistic, `LevelProgress` with text
  alternatives.
- Progress semantics (one unit, M2): native `<progress>` or
  `role="progressbar"` with `aria-valuemin={0}`,
  `aria-valuemax={levelSpanXp}`, `aria-valuenow={currentLevelXp}`, and the
  visible text in the same unit — e.g. at Level 3 with 120 total XP:
  floor(3) = 100, floor(4) = 165, so bar and text show "20 / 65 XP toward
  Level 4", a separate line shows "45 XP to Level 4", and total XP (120)
  appears only as its own statistic. Color is never the only signal.
- States per region, independently: skeleton (loading), empty (history),
  not-ready (summary from progression 503; history only for the M1
  invariant failure), 404 (summary and history — profile missing), generic
  unexpected error + Retry (each region), session-expired (redirect via the
  §12/§13 path), session-restore failure (guard-level error + Retry).
- Accessibility: single `h1` (display name + "Passport"), `h2` section
  headings with `aria-labelledby` (CompletionShell idiom), `<time
  dateTime>` for dates, keyboard-operable pagination buttons with
  `aria-label`, visible focus (existing daisyUI focus styles), no motion
  beyond existing `transition-*` idioms — reduced-motion safe by
  construction; `prefers-reduced-motion` media query added only if any new
  animated element is introduced (none proposed).
- Copy: concise NZ English per UX brief §12; Verified label "Verified";
  XP pending label "XP pending"; no carbon, impact-metric, or reward
  claims.

## 15. Detailed backend/frontend test matrix

### Backend (new history endpoint) — Testcontainers PostgreSQL, `PassportApiTests` patterned on `ProgressionApiTests.cs`

| # | Case | Expectation |
|---|------|-------------|
| B1 | Anonymous request | 401 |
| B2 | Member/Organizer/Admin each read own history | 200, own rows only |
| B3 | Two users with completions | response contains only caller's rows (isolation; negative `DoesNotContain`) |
| B4 | Exact contract | `AssertExactKeys` on envelope and item; enums/timestamps in existing formats |
| B5 | Empty history | 200, `items: []`, `totalCount: 0`, page fields coherent |
| B6 | Pagination | 25 rows, pageSize 12 → 3 pages; boundary rows correct; `hasNext/Previous` correct; `pageSize=100` clamps to 50; `page=0` normalizes to 1 |
| B7 | Fixed-dataset ordering | equal `VerifiedAtUtc` rows ordered by Id; a tie split across a page boundary is deterministic across two requests against an unchanged dataset (m3 — no cross-mutation claim) |
| B8 | XP linkage | item `xpAmount` equals the `XpTransaction.XpAmount` for its `SourceCompletionId` (50/100/150 by snapshot difficulty) |
| B9 | Ordinary reward-pending | Verified row with non-null `VerifiedAtUtc` and no XP row (seeded 4B-style) → 200, item present, `xpAmount: null` |
| B10 | Null-`VerifiedAtUtc` invariant failure (M1) | raw-SQL seeded Verified row with null `VerifiedAtUtc` → bounded 503 `progression-not-ready`, no page composed; another caller with only ordinary pending rows still gets 200; real PostgreSQL |
| B11 | Method isolation (m2) | raw-SQL seeded Verified row with a non-`CompletionCode` method value (simulating a future method) is excluded from both page items and `totalCount` |
| B12 | Mutable quest fields | edit quest title/category after completion → response shows current values (pins the D4 documented semantics); Cancelled/Archived quest → `questStatus` reflected |
| B13 | Missing profile (M4) | authenticated principal without a profile row → bounded 404 — including a principal with seeded completions but no profile, proving the existence check precedes the page query |
| B14 | Privacy exclusions | response JSON contains no email, userId, region IDs, participation IDs, code material |
| B15 | OpenAPI | route present in `/openapi/v1.json` (idiom from `ProgressionApiTests.cs:384-396`) |

Unit tests: DTO mapping (enum/timestamp formatting, null `xpAmount`).

### Frontend — Vitest + Testing Library, `vi.stubGlobal('fetch', ...)` idiom

| # | Case | Expectation |
|---|------|-------------|
| F1 | Validators | strict exact-key accept/reject for progression, envelope, item; unknown key rejected; `xpAmount` null accepted; bad enum/timestamp rejected; numeric/cross-field negatives (m1): fractional, unsafe, negative numbers rejected; `level` 0/100 rejected; incoherent envelope flags rejected; inconsistent `totalXp`/`level` rejected |
| F2 | Progression rules mirror | exact floors (0, 45, 100, 165, 765, 51,940); unified-unit derivations (`currentLevelXp`, `levelSpanXp`, XP-to-next); boundary `totalXp == floor(L+1)` treated as server-level L+1 input; L99 no-next behavior; invalid-state rejection (no silent clamp) |
| F3 | Loading | skeletons for both regions |
| F4 | Empty | Level 1 / 0 XP summary ("0 / 45 XP toward Level 2"); empty history message; no fabricated rows |
| F5 | Populated | display name from session query; totals from progression payload; history rows render title/category/date/Verified label/XP |
| F6 | Guard — anonymous | session confirmed `null` → redirect to `/login`; no Passport/progression fetch fired |
| F7 | Guard — session-restore failure | session fetch fails with network/500 → bounded error + Retry, **no redirect** (M3) |
| F8 | Guard — authenticated | children render; private fetches fire only in this state |
| F9 | Mid-page 401 (M3/B1) | a private 401 drives the strict order, asserted deterministically (e.g. spied `cancelQueries`/`removeQueries`/`setQueryData` call order): cancel private queries → remove private queries → set `['auth','me']` to `null` → guard redirects; the handler does not complete before cleanup |
| F10 | Account switch A → logout → B (B1) | logout awaits cleanup before the auth entry becomes `null` (same asserted call order as F9); after logout, QueryCache contains no `['progression']`/`['passport']` entries; B renders only B's fetched data; a deferred A request resolving after logout does not repopulate the cache (in-flight cancelled before removal) |
| F11 | Summary 503 | not-ready panel on summary only; ordinary history still renders; retry triggers refetch |
| F12 | History 503 (M1) | history-region not-ready state from the bounded history 503; summary may render independently |
| F13 | Summary 404 | "Passport unavailable" state (profile missing) |
| F14 | Unexpected 500 | generic error + Retry per region |
| F15 | Level cases | L1 (0 XP), ordinary mid-level, exact threshold boundary input, L99 max-level rendering, "XP to next level" absent at 99 |
| F16 | XP pending item | "XP pending" label, no amount fabricated |
| F17 | Redemption invalidation + page reset | after successful redeem resync, `['progression','me']` and `['passport']` are invalidated and the history view returns to page 1 |
| F18 | Page clamp (m3) | when a refetch returns `totalPages` below the current page, the view clamps to the last page |
| F19 | State ownership | no progression/history/identity in `useUiStore`; nothing written to `localStorage`/`sessionStorage` by Passport modules |
| F20 | No excluded claims | rendered page contains no achievement/streak/leaderboard/share-card/carbon text (extends the `QuestCompletionPanel.test.tsx:157` idiom) |
| F21 | Accessibility | heading order h1→h2; progressbar ARIA values in the unified unit (`aria-valuemax = levelSpanXp`, `aria-valuenow = currentLevelXp`); pagination buttons named; dates use `<time dateTime>` |
| F22 | Responsive hierarchy | content order and grid classes at mobile vs desktop breakpoints (class-level assertions per existing test style) |
| F23 | Observed narrow-viewport smoke check (m4) | during implementation, a real browser check at 375px and 320px: navbar fits, Passport reachable, hierarchy intact; observed result recorded in the completion report (not claimed here) |

### Commands and gates

Targeted during implementation (examples):
`npx vitest run tests/integration/PassportPage.test.tsx`,
`dotnet test tests/Kiwimpact.IntegrationTests --filter PassportApiTests`.
Full gates once after implementation, from AGENTS.md: frontend `npm run
lint`, `npm run type-check`, `npm run test -- --run`, `npm run build`
(from `frontend/`); backend `dotnet build Kiwimpact.slnx`,
`dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`,
`dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
(from `backend/`). No browser or runtime result may be claimed unless
observed; F23's smoke check is an implementation-time obligation, not a
planning-time claim.

## 16. Proposed file map

Backend (new): `src/Kiwimpact.Api/Contracts/PassportContracts.cs`;
`src/Kiwimpact.Api/Controllers/PassportController.cs`;
`src/Kiwimpact.Core/Services/IPassportService.cs`;
`src/Kiwimpact.Core/Services/PassportModels.cs`;
`src/Kiwimpact.Core/Services/PassportService.cs`;
`src/Kiwimpact.Core/Repositories/IPassportRepository.cs`;
`src/Kiwimpact.Infrastructure/Repositories/PassportRepository.cs`;
`tests/Kiwimpact.IntegrationTests/Api/PassportApiTests.cs`;
unit mapping tests under `tests/Kiwimpact.UnitTests/`.

Backend (modified): `src/Kiwimpact.Api/Mapping/DtoMapping.cs`;
`src/Kiwimpact.Infrastructure/DependencyInjection.cs`;
`src/Kiwimpact.Api/Program.cs` (service registration only).

Frontend (new): `src/types/progression.ts`; `src/types/passport.ts`;
`src/lib/validation/progressionDto.ts`; `src/lib/validation/passportDto.ts`;
`src/lib/api/progression.ts`; `src/lib/api/passport.ts`;
`src/lib/api/privateCache.ts`; `src/lib/progressionRules.ts`;
`src/hooks/useProgression.ts`; `src/hooks/usePassportCompletions.ts`;
`src/components/RequireAuth.tsx`; `src/pages/PassportPage.tsx`;
`src/components/passport/` (five components listed in §12);
`tests/unit/progressionRules.test.ts`; `tests/unit/passportDto.test.ts`;
`tests/unit/progressionDto.test.ts`; `tests/integration/PassportPage.test.tsx`;
`tests/integration/RequireAuth.test.tsx`;
`tests/integration/AuthSessionBoundary.test.tsx` (F9/F10 cache-lifecycle
tests).

Frontend (modified): `src/app/router.tsx`; `src/app/AppShell.tsx`;
`src/hooks/useCompletion.ts` (invalidation extension only);
`src/hooks/useAuth.ts` (two `clearPrivateServerState` calls only);
`tests/unit/useCompletion.test.tsx` or its integration equivalent
(invalidation assertions only).

## 17. Documentation/evidence changes after approval

Amend after approval, and only then:

- `specs/architecture/03-api-contract.md` §2.11 — **additively** record the
  implemented 5B subset of `/users/me/passport/completions`
  (Verified + CompletionCode only, exact item DTO, nullable `xpAmount`,
  401/404/503 conditions). The accepted one-record-per-Quest precedence
  (Verified > Pending EvidenceClaim > SelfReported > latest Rejected)
  remains the unimplemented long-term direction and must not be narrowed or
  rewritten away (m2); the other two Passport endpoints remain
  unimplemented.

Implementation evidence required before commit-readiness (AGENTS.md):

- implementation prompt record under `specs/ai/prompts/`;
- completion report under `specs/implementation/reports/` with observed
  gate results only — including the observed 375/320px smoke-check result
  (F23), recorded as observed fact;
- independent read-only implementation review record under
  `specs/ai/reviews/` (important cross-layer Slice), with Blocker/Major
  closure before commit.

The planning task itself created only this plan and
`specs/ai/prompts/46-slice-5b-passport-lite-first-plan.md`.

## 18. Risks, unknowns, alternatives, and explicit stop conditions

Risks/unknowns:

- **Curve drift (D3):** client mirror can diverge from
  `ProgressionRules.cs` if the curve is ever changed without updating both.
  Mitigated by pinned tests on both sides and the approval gate on rule
  changes; eliminated later by a server-supplied summary endpoint.
- **Mutable quest fields (D4):** history shows current title/category —
  documented limitation; the snapshot alternative is a schema change.
- **Cache lifecycle touches `useAuth.ts`:** the B1 cleanup integrates at
  the two existing login/logout success points plus the private-401
  handler; deliberately minimal (one awaited helper call each) and covered
  by the F9/F10 order-asserting tests.
- **Null-timestamp 503 is caller-scoped on history but global on
  progression:** the 5A readiness gate is a global anti-join (any user's
  pending row closes progression for everyone), while the history 503 fires
  only for the caller's own unprocessable row. This asymmetry is deliberate:
  history has no totals to protect, only its own contract. Flagged for the
  closure check.
- **Page-number state not in URL (§12):** chosen for simplicity; consistent
  with the "URL-owned state" UX guidance targeting shareable discovery
  views, not private history.
- **Pre-existing gap (no 5B change):** `frontend/src/lib/api/auth.ts`
  does not runtime-validate the session DTO. 5B consumes it as-is for
  display name; hardening is a separate candidate task.
- **`useUiStore.mobileNavOpen` is currently unwired** — 5B does not add a
  mobile menu; narrow-viewport fit relies on existing label idioms and is
  proven by the observed F23 smoke check, with a stop-and-return rule if
  overflow is observed.

Explicit stop conditions (implementation halts and returns to the human):

1. Any need for a schema change (e.g. title/category snapshots) — requires
   explicit human approval outside the recommended scope.
2. Human preference for server-supplied level thresholds — amends D2/D3.
3. Any pressure to include non-Verified or non-CompletionCode records
   before those statuses/methods are implemented.
4. Any requirement touching achievements, streaks, leaderboard, Share Card,
   community aggregation, or reward animation.
5. Observed 320/375px navbar overflow that existing label idioms cannot fix
   — return with a minimal-menu proposal (m4).
6. Any mismatch discovered between this plan's §3 baseline and the actual
   merged source at implementation time.

## 19. Human approval checklist

- [x] D1 boundary: summary + Verified completion history (§6 D1).
- [x] D2 endpoints: compose session + progression; add only
      `GET /api/v1/users/me/passport/completions`; progression DTO
      unchanged (§6 D2, §8).
- [x] D3 level progress: client mirror with pinned tests; unified
      within-level units; invalid-state rejection; Level 99 behavior
      (§6 D3, §10).
- [x] D4 history semantics: Verified + CompletionCode filter, explicit
      `NULLS LAST` ordering, truthful offset pagination, `xpAmount: null`
      for ordinary reward-pending, bounded 503 for the null-`VerifiedAtUtc`
      invariant failure, mutable title/category limitation
      (§6 D4, §8, §9).
- [x] D5 privacy/authorization/readiness behavior incl. the
      profile-existence 404 path (§6 D5, §11, §13).
- [x] D6 frontend architecture: guard four-state machine, B1
      authenticated-cache lifecycle, query keys, v5 `placeholderData`
      idiom, nav treatment (§6 D6, §12).
- [x] D7 test matrix and gates incl. A → logout → B cache tests, raw-SQL
      PostgreSQL invariant test, and the observed F23 smoke check
      (§6 D7, §15).
- [x] D8 documentation/evidence plan: additive §2.11 amendment only
      (§6 D8, §17).
- [x] Review 37 corrections accepted: B1 cache lifecycle; M1
      null-`VerifiedAtUtc` policy; M2 unified progress units; M3 guard
      state machine; M4 profile-existence 404; m1 numeric/cross-field
      validation; m2 method isolation; m3 truthful pagination; m4 nav
      smoke check and v5 idiom.
- [x] Acknowledged: no schema change, no dependency change, no excluded
      feature, no placeholder cards (§5).
- [x] Acknowledged stop conditions (§18).

**Next step after this plan:** implementation by the assigned sole
implementation owner under Prompt 47, followed by truthful evidence and the
single independent read-only implementation review required by `AGENTS.md`.
