# Slice 5B — Passport-lite Completion Report

- **Date:** 2026-07-26
- **Slice:** 5B — Passport-lite and Progression Frontend
- **Implementation owner:** Kimi K3 (sole implementation owner under Prompt 47)
- **Implementation prompt record:** `specs/ai/prompts/47-slice-5b-passport-lite-implementation.md` (pre-existing, preserved unchanged)
- **Approved plan:** `specs/implementation/05b-passport-lite.md` (D1–D8, human-approved 2026-07-26)
- **Design reviews:** Review 37 (`CHANGES REQUIRED`), Review 38 (`FINAL DESIGN VERDICT: APPROVE`)
- **Implementation review:** Review 39 (`CHANGES REQUIRED`, Majors M1/M2) — addressed in the single concentrated correction pass recorded below
- **Branch:** `05b-passport-lite`; baseline HEAD `5c89542` (descendant of the expected `7eea4fe`, containing only planning/review evidence files)
- **Independent implementation review status:** `APPROVED — Review 39 targeted closure check on original M1/M2 passed with final APPROVE`

## Implementation status

Implementation of the approved Slice 5B plan is complete. All applicable
verification gates were executed and their results observed (below). The
observed 375px/320px browser smoke check was performed against the real
backend. Nothing was staged, committed, pushed, merged, deployed, or added
to a pull request.

The independent implementation review (Review 39) returned `CHANGES
REQUIRED` with two Majors (M1 Organizer/Admin narrow-width navigation
overflow; M2 private-401 cleanup bound to an imported singleton
QueryClient). The single permitted concentrated correction pass was
performed, limited to M1, M2, the directly necessary tests, and this
report. The working tree holds the corrected, independently approved implementation as uncommitted changes awaiting explicit human authorization to commit.

## Review 39 correction pass

### M1 — Organizer/Admin navigation overflow at 320/375px — corrected

Root cause: the full `Manage quests` label and the always-visible `Sign
out` label pushed the complete authenticated cluster to a measured
`scrollWidth` of 412px at both target widths (reviewer's reproduction).

Correction (existing compact-label idiom only, no new menu):

- `frontend/src/app/AppShell.tsx` — the `Manage quests` link now uses a
  `ClipboardList` icon with `aria-label="Manage quests"` and its text label
  wrapped in `hidden sm:inline` (the same idiom already used by the brand
  and the Passport link); the `Sign out` button now has
  `aria-label="Sign out"` with its text label wrapped in
  `hidden sm:inline`. No control was removed; every cluster member stays
  reachable below the `sm` breakpoint as an icon button.
- Deterministic coverage added in
  `frontend/tests/integration/AppShell.test.tsx`: for Organizer and Admin
  (`it.each`), the Manage quests / Passport / Sign out labels assert the
  `hidden sm:inline` compact-label classes and accessible names; a Member
  case asserts the management item is absent.
- Observed browser re-check against the real backend (details in the F23
  section below): Organizer cluster `scrollWidth === innerWidth` at both
  320px and 375px with all five controls present and reachable; the Member
  cluster was re-checked at both widths after the shared Sign-out change.

### M2 — Private-401 lifecycle bound to imported singleton — corrected

Root cause: `lib/api/progression.ts` and `lib/api/passport.ts` imported the
application singleton from `app/queryClient.ts` and ran the B1 cleanup on
it, so the lifecycle was correct only under the incidental assumption that
the provider always uses that one module instance.

Correction:

- `frontend/src/lib/api/privateCache.ts` — now also defines `authQueryKey`
  (moved here so the API layer no longer depends upward on the hook module;
  `frontend/src/hooks/useAuth.ts` re-exports it for existing consumers) and
  a shared `expirePrivateSession(queryClient)` (ordered cleanup, then the
  auth entry is cleared). The duplication note from the first version of
  this report is obsolete.
- `frontend/src/lib/api/progression.ts` and
  `frontend/src/lib/api/passport.ts` — transport/validation functions no
  longer import any app or hook module; they require the active
  `QueryClient` as an explicit parameter and run the 401 session-expiry
  path against exactly that instance.
- `frontend/src/hooks/useProgression.ts` and
  `frontend/src/hooks/usePassportCompletions.ts` — obtain the client via
  `useQueryClient()` and pass it into the query functions. Logout/login in
  `useAuth.ts` already used `useQueryClient()` and are unchanged.
- `frontend/tests/integration/AuthSessionBoundary.test.tsx` — rewritten to
  install a fresh `new QueryClient()` through `QueryClientProvider` (the
  application singleton is no longer imported). F9 now fails BOTH private
  reads with 401 concurrently and asserts, deterministically, that every
  recorded auth write is preceded by a complete
  cancel-progression/cancel-passport → remove-progression/remove-passport
  sequence on that injected client (idempotent concurrent-401 behavior);
  F10 keeps the exact cancel → remove → setAuth order assertions for the
  logout and login/account-replacement paths plus the deferred
  old-principal non-repopulation proof.

No backend design, schema, dependency, or menu-architecture change was
made in this pass.

## Approved scope delivered (D1–D8)

- **D1 — Surface boundary:** `/passport` shows display name (existing
  session query), server-authoritative total XP / Level / Rank Title
  (existing progression endpoint, unchanged), current-level progress, and a
  paginated Verified + CompletionCode history. No achievements, streaks,
  leaderboard, Share Card, community aggregation, carbon/impact metrics,
  reward animation, or placeholder cards were added.
- **D2 — Endpoint composition:** `GET /api/v1/auth/me` and
  `GET /api/v1/users/me/progression` are reused unchanged; exactly one
  endpoint was added, `GET /api/v1/users/me/passport/completions`. No
  aggregate Passport summary endpoint; `MyProgressionDto` untouched.
- **D3 — Level progress:** pure TypeScript mirror
  `frontend/src/lib/progressionRules.ts` (floor(1) = 0; floor(L) = 5 × (L −
  1. × (L + 7), L = 2..99; MaxLevel 99) with a comment referencing
     `backend/src/Kiwimpact.Core/Progression/ProgressionRules.cs`. Bar, visible
     fraction, and ARIA values all use `currentLevelXp / levelSpanXp`;
     "XP to Level N" = `nextFloor − totalXp` shown only below Level 99; total
     XP is a separate statistic. Level 99 renders a full bar with "Maximum
     level reached" and no next-level amount. Invalid payloads
     (unsafe/fractional/negative numbers, level outside 1..99,
     totalXp/level inconsistency) are rejected (throw), never clamped.
- **D4 — History contract:** only caller rows with `Status == Verified &&
Method == CompletionCode`; existing `PagedResponse<T>` envelope; defaults
  page 1 / pageSize 12, page < 1 → 1, pageSize < 1 → 12, clamp 50 (same
  normalization as `QuestsController`). Item keys exactly `completionId,
questId, questTitle, questCategory, questStatus, status, method,
completedAtUtc, verifiedAtUtc, xpAmount`. `questTitle`/`questCategory`/
  `questStatus` come from the Quest's current row (documented
  historical-integrity limitation, pinned by test B12). `xpAmount` joins
  `XpTransaction` by `SourceCompletionId`; an ordinary non-null-timestamp
  reward-pending row returns `xpAmount: null` and the UI shows "XP pending".
  Ordering `VerifiedAtUtc DESC` with explicit nulls-last (leading
  `VerifiedAtUtc != null` descending marker key, translating to
  `ORDER BY "VerifiedAtUtc" IS NOT NULL DESC, "VerifiedAtUtc" DESC, "Id"
ASC`), tie-break `Id ASC`. Service order: identity guard → normalization →
  profile-existence check (404) → caller-scoped null-`VerifiedAtUtc` check
  (503) → only then count/query/map. No snapshot fields, no migration.
- **D5 — Authorization, privacy, errors:** same
  `[Authorize(Roles = Member,Organizer,Admin)]` boundary as
  `ProgressionController`; identity only from `ClaimTypes.NameIdentifier`;
  no user selector in route/query/body; Admin/Organizer receive no elevated
  other-user access. Responses exclude email, user ID, Home Community,
  region/community labels, evidence, code material, claims, review notes,
  participation IDs, and location (asserted by B14). Bounded 401 (bare
  `Unauthorized()`), 404 (explicit profile-existence check), 503
  `progression-not-ready` (existing `ProblemDetailsHelper`); unexpected
  failures follow existing framework 500 behavior. No new application
  logging of Passport content, XP values, display names, completion IDs, or
  Quest titles was added.
- **D6 — Frontend, auth guard, private cache:** `/passport` sits under
  `AppShell` behind the new generic `RequireAuth` with exactly four states
  (pending → skeleton with `aria-live`; confirmed anonymous →
  `<Navigate replace to="/login" />`; authenticated → children;
  session-restore transport failure → bounded error + Retry, never a
  redirect). Session data stays in the existing `['auth','me']` query;
  progression/history live only in TanStack Query — nothing added to
  Zustand, localStorage, or sessionStorage (asserted by F19). Key families
  `['progression','me']`, `['passport']`, `['passport','completions',{page,
pageSize}]`; `retry: false` on the new private reads; TanStack Query v5
  `placeholderData: keepPreviousData` for history page transitions.
  `clearPrivateServerState(queryClient)` awaits `cancelQueries` for
  `['progression']` and `['passport']` and only then runs `removeQueries`
  for the same prefixes; all three principal boundaries (logout success,
  login success/account replacement, private-endpoint 401) await it first
  and only then clear or replace the auth session entry. The API helpers
  receive the active `QueryClient` explicitly from the calling hooks
  (`useQueryClient()`) and run the 401 lifecycle against exactly that
  instance (corrected under Review 39 M2); TanStack's queryFn
  `AbortSignal` is passed through to `apiFetch`, so cancellation aborts the
  underlying fetch (observed live: navigation away produced
  `net::ERR_ABORTED` for in-flight private requests). Redemption resync
  (`syncAuthoritativeCompletion`) now also invalidates `['progression','me']`
  (exact) and `['passport']` (prefix); the history view resets to page 1 on
  that invalidation and clamps to the final page when `totalPages` shrinks.
  The `Passport` nav link was added to the authenticated branch only
  (`IdCard` icon + `hidden sm:inline` label, `aria-label="Passport"`); no
  new menu was built.
- **D7 — Tests and gates:** the §15 matrix was implemented (backend
  B1–B15, frontend F1–F22; F23 observed, below). Full gates were run once
  after implementation and their outputs observed (below).
- **D8 — Contract and evidence:** `specs/architecture/03-api-contract.md`
  §2.11 was amended additively only (implemented Verified + CompletionCode
  subset, exact item/envelope contract, nullable `xpAmount`, 401/404/503
  behavior; the accepted one-record-per-Quest precedence is preserved
  verbatim as unimplemented long-term direction; the other two Passport
  routes remain marked unimplemented). Prompt 47 serves as the
  implementation prompt record. This report is the completion evidence.

## Endpoint and exact DTO behavior

`GET /api/v1/users/me/passport/completions?page={page}&pageSize={pageSize}`
returns `200` with `PagedResponse<PassportCompletionItemDto>` (envelope keys
`items, page, pageSize, totalCount, totalPages, hasNextPage,
hasPreviousPage`). Items carry exactly the ten D4 keys; enums serialize via
`.ToString()`; timestamps via `.ToString("O")`; `xpAmount` is `int?`
(`null` iff no `XpTransaction` row exists for the completion).
`verifiedAtUtc` is non-null for every returned row by construction — a
caller owning a null-timestamp Verified completion receives the bounded 503
before any page is composed.

## Profile-404 and null-timestamp-503 behavior

- An authenticated principal without a `UserProfile` row receives bounded
  `404`; the existence check precedes the invariant check and the page
  query, proven by B13 including a principal with seeded completions but no
  profile row.
- A caller owning a Verified completion with null `VerifiedAtUtc` receives
  bounded `503 progression-not-ready` (raw-SQL-seeded real-PostgreSQL test
  B10); another caller with only ordinary pending rows still receives 200.
  No timestamp is invented and no invariant-failure row is silently omitted.

## Guard and B1 cache-lifecycle test evidence

F9/F10 (`frontend/tests/integration/AuthSessionBoundary.test.tsx`, rewritten
in the Review 39 correction pass) install a fresh `QueryClient` through
`QueryClientProvider` — the application singleton is not imported — and spy
on that injected client, proving the lifecycle acts on the provider's
active client. F9 fails both private reads with 401 concurrently and
asserts that every recorded `setQueryData(['auth','me'], null)` is preceded
by a complete `cancelQueries(['progression'])` →
`cancelQueries(['passport'])` → `removeQueries(['progression'])` →
`removeQueries(['passport'])` sequence (idempotent concurrent-401
behavior), followed by the guard redirect. F10 asserts the exact order
cancel → remove → setAuth for the logout path and the
login/account-replacement path, holds user A's progression fetch deferred,
logs out mid-flight, resolves A's request after logout, and asserts the
cache gains no `['progression']`/`['passport']` entries (no late-request
repopulation); user B then renders only B's fetched data.

## Verification commands and observed results

From `backend/` (observed 2026-07-26, this session):

- `dotnet build Kiwimpact.slnx` — Build succeeded, 0 warnings, 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj
--no-build` — Passed: 178, Failed: 0, Skipped: 0 (includes 2 new
  `PassportMappingTests`).
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj
--no-build` — Passed: 213, Failed: 0, Skipped: 0 (includes 18 new
  `PassportApiTests`).
- Focused: `dotnet test
tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj
--no-build --filter "FullyQualifiedName~PassportApiTests"` — Passed: 18,
  Failed: 0.

From `frontend/` (observed 2026-07-26, after the Review 39 correction
pass):

- `npm run lint` — 0 warnings, 0 errors (95 files).
- `npm run type-check` — clean (`tsc -b`).
- `npm run test -- --run` — 25 test files passed, 225 tests passed, 0
  failed. New tests: 43 declarations across six new files
  (`progressionRules` 7, `progressionDto` 6, `passportDto` 8,
  `RequireAuth` 3, `PassportPage` 16, `AuthSessionBoundary` 2) plus one
  invalidation case added to `useCompletion.test.tsx`; the correction pass
  rewrote the 2 `AuthSessionBoundary` cases and added 3 `AppShell` nav
  cases (Organizer/Admin compact-cluster assertions and the Member
  negative).
- `npm run build` — clean (`tsc -b && vite build`).

The backend gates above were observed before the correction pass; the pass
changed no backend file, so they remain the current backend results.

Diff hygiene (from repository root, observed):

- `git diff --check HEAD` — no findings.
- `git diff --no-index --check /dev/null <file>` for every untracked text
  file — no whitespace findings.
- `git diff --name-status HEAD` — 11 modified files, all within the
  approved boundary (listed below).

## Observed narrow-viewport browser smoke check (F23)

Two observed checks were performed with Playwright against the real stack:
docker-compose PostgreSQL 17 (a separate throwaway `kiwimpact_smoke`
database each time, dropped afterwards), the backend on
`http://localhost:5055` (Development, seeded), and the Vite dev server
proxying to it. Accounts were registered through the UI/API; the Organizer
role was assigned directly in the throwaway database.

First check (initial implementation, Member account) — observed:

- **375px:** `/` and `/passport` — `documentElement.scrollWidth ===
innerWidth === 375` (no horizontal overflow); no navbar child's bounding
  box exceeded the viewport; the navbar rendered as a single row (brand,
  Quests, Passport icon-button, Sign out). The `Passport` nav link was
  clicked from `/` and reached `/passport`. The page rendered h1 "Smoke
  Tester — Passport", the Progress region (Level 1, Novice, Total XP 0,
  "0 / 45 XP toward Level 2", "45 XP to Level 2") before the Completion
  history region ("No verified completions yet." + Discover link). The
  native `<progress>` element exposed `aria-valuemin="0"`,
  `aria-valuemax="45"` (= levelSpanXp), `aria-valuenow="0"` (=
  currentLevelXp) — the unified within-level unit against live data.
- **320px:** `/quests` → clicked `Passport` link → `/passport` rendered
  with the same hierarchy (h1 → Progress → Completion history);
  `scrollWidth === innerWidth === 320`; no navbar element overflow.
- **Live request evidence:** the network log shows
  `GET /api/v1/users/me/progression` → 200 and
  `GET /api/v1/users/me/passport/completions?page=1&pageSize=12` → 200
  from the real backend; earlier in-flight copies of both requests were
  aborted with `net::ERR_ABORTED` on navigation (AbortSignal wiring).
- **Guard against the real backend:** after signing out, navigating to
  `/passport` redirected to `/login`.

Second check (after the Review 39 M1 correction, Member AND Organizer
accounts) — observed:

- **Organizer, 320px:** `scrollWidth === innerWidth === 320`, zero navbar
  elements exceeding the viewport, all five controls present (`Kiwimpact
home`, `Quests`, `Manage quests`, `Passport`, `Sign out`); the Sign-out
  button's right edge measured 304px (the review measured 412.30px before
  the correction). The `Passport` link was clicked and rendered the full
  Passport hierarchy (h1 "Org Nav — Passport" → Progress → Completion
  history); the `Manage quests` link was clicked and rendered
  `/organizer/quests`. A 320px viewport screenshot was visually inspected:
  single-row navbar (brand icon, Quests, two icon buttons, Sign-out icon
  button), no overflow.
- **Organizer, 375px:** `scrollWidth === innerWidth === 375`, zero
  overflowing navbar elements; Sign-out right edge 359px.
- **Member, 320px and 375px (re-checked after the shared Sign-out
  change):** `scrollWidth === innerWidth` at both widths, zero overflowing
  navbar elements, controls `Kiwimpact home` / `Quests` / `Passport` /
  `Sign out` (no management item).
- Zero console errors at error level during both checks. Viewport
  screenshots were visually inspected and then removed from the working
  tree.

Limitations of these checks: the accounts had empty histories, so populated
history rendering at narrow widths is covered by component tests (F5/F22)
rather than live observation. Admin renders the same navbar cluster as
Organizer (the `canManageQuests` branch covers both roles) and is covered
by the new `it.each(['Organizer','Admin'])` class-level assertions; the
live browser check exercised Organizer.

## Files changed

Backend (new):

- `backend/src/Kiwimpact.Api/Contracts/PassportContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/PassportController.cs`
- `backend/src/Kiwimpact.Core/Repositories/IPassportRepository.cs`
- `backend/src/Kiwimpact.Core/Services/IPassportService.cs`
- `backend/src/Kiwimpact.Core/Services/PassportModels.cs`
- `backend/src/Kiwimpact.Core/Services/PassportService.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/PassportRepository.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/PassportApiTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Api/PassportMappingTests.cs`

Backend (modified):

- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs` (one `ToDto` extension)
- `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs` (repository
  registration)
- `backend/src/Kiwimpact.Api/Program.cs` (service registration)
- `backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj` (see adjustment below)

Frontend (new):

- `frontend/src/types/progression.ts`, `frontend/src/types/passport.ts`
- `frontend/src/lib/validation/progressionDto.ts`,
  `frontend/src/lib/validation/passportDto.ts`
- `frontend/src/lib/api/progression.ts`, `frontend/src/lib/api/passport.ts`,
  `frontend/src/lib/api/privateCache.ts`
- `frontend/src/lib/progressionRules.ts`
- `frontend/src/hooks/useProgression.ts`,
  `frontend/src/hooks/usePassportCompletions.ts`
- `frontend/src/components/RequireAuth.tsx`
- `frontend/src/pages/PassportPage.tsx`
- `frontend/src/components/passport/PassportSummaryCard.tsx`,
  `LevelProgress.tsx`, `CompletionHistoryList.tsx`,
  `CompletionHistoryItem.tsx`, `PassportPagination.tsx`
- `frontend/tests/unit/progressionRules.test.ts`,
  `tests/unit/progressionDto.test.ts`, `tests/unit/passportDto.test.ts`
  (all under `frontend/tests/`)
- `frontend/tests/integration/PassportPage.test.tsx`,
  `frontend/tests/integration/RequireAuth.test.tsx`,
  `frontend/tests/integration/AuthSessionBoundary.test.tsx`

Frontend (modified):

- `frontend/src/app/router.tsx` (`/passport` under `RequireAuth`)
- `frontend/src/app/AppShell.tsx` (authenticated-only Passport link;
  Review 39 M1: compact-label Manage quests and Sign out)
- `frontend/src/hooks/useCompletion.ts` (invalidation extension only)
- `frontend/src/hooks/useAuth.ts` (two awaited `clearPrivateServerState`
  calls; `authQueryKey` re-export after the Review 39 M2 move)
- `frontend/tests/unit/useCompletion.test.tsx` (one invalidation assertion)
- `frontend/tests/integration/AppShell.test.tsx` (Review 39 M1: 3 new nav
  cluster cases)

Docs:

- `specs/architecture/03-api-contract.md` (§2.11 additive amendment only)

## Adjustment relative to the plan file map

One addition beyond §16: `backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj`
gained `<InternalsVisibleTo Include="Kiwimpact.UnitTests" />`, mirroring
the pre-existing IntegrationTests entry. This was required because
`DtoMapping` is `internal` and the plan-mandated unit mapping tests live in
`Kiwimpact.UnitTests`. It is not a dependency or package change. Flagged
for the independent reviewer.

A deliberate frontend construction note from the first version of this
report (the duplicated 401 `expirePrivateSession` helper in the two API
modules) is obsolete: the Review 39 M2 correction hoisted the helper into
`privateCache.ts` together with the `authQueryKey` definition, eliminating
both the duplication and the upward import cycle.

## Known limitations and unrun verification

- History shows the Quest's current mutable title/category/status, not
  completion-time snapshots (human-accepted D4 limitation; pinned by B12).
- Offset pagination is deterministic only for an unchanged dataset; a
  concurrent new completion can shift rows across pages (accepted m3
  semantics; UI resets to page 1 on redemption invalidation and clamps on
  shrunk `totalPages`).
- The client level-threshold mirror can drift from `ProgressionRules.cs` if
  the accepted curve ever changes without updating both sides (D3 risk;
  both sides are pinned by tests).
- The live smoke checks exercised empty histories; populated narrow-width
  rendering is covered by component tests, not live observation.
- The live post-correction browser check exercised the Member and Organizer
  clusters; Admin shares the Organizer cluster and is covered by
  class-level assertions.
- The backend gates were not rerun after the Review 39 correction pass (the
  pass changed no backend file; the pre-pass backend results stand). The
  full frontend gates were rerun and observed after the pass.

## Confirmation

- No schema, migration, or model-snapshot change occurred. No dependency,
  package-manifest, or lockfile change occurred (the csproj
  `InternalsVisibleTo` entry above adds no dependency). No authentication
  architecture change occurred. No deployment, Docker, CI, new menu
  architecture, or out-of-scope product change occurred.
- Nothing was staged, committed, pushed, merged, reverted, deployed, or
  added to a pull request. All evidence files from planning and design
  review were preserved unchanged.
- Review 39 (`CHANGES REQUIRED`, Majors M1/M2) was addressed in the single
  permitted concentrated correction pass recorded above. The targeted
  closure check on the original M1/M2 has since passed with a final
  `APPROVE`. Independent implementation review status:
  `APPROVED — Review 39 targeted closure check on original M1/M2 passed
with final APPROVE`.
