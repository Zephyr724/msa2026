Status: Implemented — independently approved, pending human Git approval

# Slice 6B — Passport Achievements UI

- **Planning date:** 2026-07-26
- **Planning owner:** Kimi K3 (planning only; no implementation authority)
- **Expected implementation owner:** Codex (sole implementation owner, after
  human approval of this plan)
- **Expected design reviewer:** Codex, independent read-only design review of
  this plan before any implementation
- **Baseline:** remote `main` `a974725` (`Merge pull request #15 from
  Zephyr724/feat/slice-6a2-achievement-read-api`)
- **Upstream contracts:** `specs/implementation/06a-simple-achievements-backend.md`
  §13–§17 (especially the §17 handoff contract);
  `specs/architecture/03-api-contract.md` §2.12 (as amended by Slice 6A-2)

## 1. Status and planning boundary

This document began as the **first implementation plan** for Slice 6B. On
2026-07-26 the human approved D1-A through D8-A, the documented cache
side effects, and the 15-primary-file boundary after Review 45 closed every
Review 44 finding.

This planning task changed no production code, no test code, no accepted
specification, no dependency, and no configuration. It created exactly two
files: this plan and its planning-prompt record
(`specs/ai/prompts/51-slice-6b-passport-achievements-ui-first-plan.md`).
No branch, commit, push, merge, pull request, or deployment action was taken.

The implementation task that may follow this plan is **frontend-only**. It
must not change any backend file, schema, migration, seed, API contract,
dependency, or configuration. If implementation discovers that a backend or
contract change is necessary, it stops and returns to the human (§17 stop
conditions).

## 2. Executive summary

Slice 6B adds the member-facing Achievements surface to the existing Passport
page, consuming the two read APIs delivered by Slice 6A-2:

- anonymous `GET /api/v1/achievements` (active catalog, six exact keys,
  `code ASC`);
- self-only `GET /api/v1/users/me/achievements` (earned achievements, seven
  exact keys, `(awardedAt ASC, code ASC)`, bounded 401/404/503).

The recommended design:

- a new **Achievements section** on `/passport`, placed between the existing
  Level Summary (Progress) section and the Completion History section (D2);
- the section renders **every active catalog item** (D1): earned items show
  an unlocked state with the server-provided `awardedAt` date (D6); unearned
  items show a locked state with the server-provided name and description
  only — **no progress data**, because the backend deliberately exposes no
  threshold or count field (D3, §5);
- client-side `code` → Lucide icon mapping with a stable fallback and a
  safe `iconUrl` rendering path for future non-null URLs (D5, §12); no new
  dependency (`lucide-react` is already present);
- TanStack Query owns all server state under the `['achievements']` key
  family: `['achievements','catalog']` with a long stale time, earned under
  the `['achievements']` prefix; `syncAuthoritativeCompletion` and
  `expirePrivateSession` are extended to that prefix exactly as the §17
  handoff contract prescribes; Zustand stores nothing (§11);
- error behavior reuses the established 5B per-region degradation: 401 via
  the existing private-session lifecycle, 404 as the bounded
  profile-missing state, 503 `progression-not-ready` as a bounded
  section-level state, `retry: false` everywhere, manual Retry buttons (§10);
- responsive layout: mobile single column, up to three columns on wide
  screens (§7).

Out of scope (§5): progress-toward-next data, thresholds as data, streaks,
toasts, unlock animations, other users' achievements, any write endpoint,
and any backend change.

## 3. Verified merged baseline with file-level evidence

### 3.1 Git baseline (verified 2026-07-26)

- Remote `main` is `a9747259dee07b0db1698dd38c81f36e0e76bbea` — the PR #15
  merge of Slice 6A-2 plus the CI precision correction (`5be2a32`).
  Verified via `git fetch origin main` + `git rev-parse origin/main`.
- PR #15 contains `d350ae3 feat: add achievement read API` and
  `5be2a32 fix: correct CI precision failure in achievement read API tests`;
  `git log --oneline origin/main -3` confirms both.
- Slice 6A-1 (persisted catalog, award core, backfill) is merged through
  PR #14 (`a35ee86`), which is an ancestor of `a974725`.
- This planning session ran on branch `feat/slice-6a2-achievement-read-api`
  at `5be2a32` with a clean working tree (`git status --porcelain` empty);
  `git merge-base --is-ancestor HEAD origin/main` confirms the planning
  checkout's content is identical to the relevant merged content. The 6B
  implementation must branch from `main` at `a974725` (or later).

### 3.2 Implemented API facts (verified against contract, review, and code)

Source hierarchy: `specs/architecture/03-api-contract.md` §2.12 (accepted,
amended by 6A-2); `specs/implementation/06a-simple-achievements-backend.md`
§13–§14 (design) and §17 (handoff); Review 43
(`specs/ai/reviews/43-slice-6a2-k3-independent-implementation-review.md`)
and the 6A-2 completion report
(`specs/implementation/reports/06a2-achievement-read-api-completion.md`),
used **only to cross-check implemented facts** (both observed the real
stack: unit 218/218, integration 257/257).

`GET /api/v1/achievements`:

- Anonymous (`[AllowAnonymous]`), no request body, no pagination/filtering.
- `200 OK`: bare JSON array; each item has **exactly six keys**: `id`
  (UUID string), `code`, `name`, `description`, `iconUrl` (string|null),
  `category` (plain string, `Milestone` for the current catalog).
- Ordering `code ASC`; active rows only.
- No 401/404/503 contract; unexpected failures follow the existing
  framework 500 behavior.

`GET /api/v1/users/me/achievements`:

- Self-only for Member, Organizer, Admin; identity only from
  `ClaimTypes.NameIdentifier`; no route/query/body user selector.
- `200 OK`: bare JSON array; each item has **exactly seven keys**:
  `achievementId` (UUID string), `code`, `name`, `description`, `iconUrl`
  (string|null), `category`, `awardedAt` (round-trip `"O"` UTC timestamp).
- Ordering `awardedAt ASC`, tie-break `code ASC`. Display fields are
  composed server-side from the current active catalog row — **6B needs no
  client-side join to render earned items**; the catalog defines the card
  slots/order and supplies locked-card display data (Review 44 M1, §9).
- Inactive earned rows persist but are excluded.
- Errors: `401` anonymous/unparseable identity; `404` authenticated
  principal without a `UserProfile` (profile check precedes readiness);
  `503` with bounded Problem Details type
  `https://kiwimpact.app/problems/progression-not-ready` when the caller is
  reward-pending (Verified completion without its XP row) or has a
  committed XP count reaching an active milestone without the matching
  earned row. Evaluated live per request.
- Privacy: no user ID, email, community/region labels, evidence, code
  material, `SourceCompletionId`, `XpTransactionId`, or other users' state
  (asserted by backend tests; the DTOs carry no such fields by
  construction).

Catalog facts (6A spec §7, verified in Review 43 evidence): exactly three
active milestones — `verified-completions-1` ("First Steps"),
`verified-completions-3` ("Building Momentum"), `verified-completions-5`
("Committed Contributor") — category `Milestone`, `iconUrl: null` for all
three. Thresholds (1/3/5) are **not exposed by any API**; they exist only
inside the human-readable server `description` copy.

§17 handoff obligations binding on 6B:

- catalog cached as `['achievements','catalog']` with a long stale time;
- earned data under the `['achievements']` prefix;
- `syncAuthoritativeCompletion` extended to invalidate the `['achievements']`
  prefix;
- `expirePrivateSession` extended to the same prefix;
- no Zustand storage of catalog or earned data;
- client-side `code` → Lucide icon mapping; forward-compatible `iconUrl`
  rendering when non-null;
- `retry: false` on the earned query; the same bounded not-ready state 5B
  uses for 503.

### 3.3 Current Passport frontend facts (verified by reading source)

- `frontend/src/pages/PassportPage.tsx` — `<main className="container
  mx-auto max-w-4xl px-4 py-8">`, one `<h1>` (`{displayName} — Passport`),
  a `grid grid-cols-1 md:grid-cols-3` with two `<section
  aria-labelledby>` regions: **Progress** (`md:col-span-1`, h2 `Progress`)
  and **Completion history** (`md:col-span-2`, h2 `Completion history`).
  Per-region degradation is implemented by `RegionSkeleton`
  (`aria-live="polite"` + `.skeleton` + `sr-only` label) and `RegionError`
  (503 → `alert alert-info` + Retry; 404 → `alert alert-warning` "Passport
  unavailable", no retry; other → `alert alert-error` + Retry) with the
  helpers `isNotReady` (503 + problem type) and `isMissingProfile` (404).
- `frontend/src/hooks/useProgression.ts` — `progressionKeys`
  (`['progression']`, `['progression','me']`), `useQuery({ retry: false })`,
  active `queryClient` passed explicitly into the transport (Review 39 M2
  pattern).
- `frontend/src/hooks/usePassportCompletions.ts` — `passportKeys`
  (`['passport']` prefix; `['passport','completions',{page,pageSize}]`),
  `retry: false`, `placeholderData: keepPreviousData`.
- `frontend/src/lib/api/progression.ts` and
  `frontend/src/lib/api/passport.ts` — private transport convention:
  `apiFetch<unknown>` + strict validator; on `ApiError` 401 `await
  expirePrivateSession(options.queryClient)` before rethrow; `signal`
  forwarded.
- `frontend/src/lib/api/privateCache.ts` — `PRIVATE_SERVER_QUERY_KEYS =
  [['progression'], ['passport']]`; `clearPrivateServerState` awaits
  `cancelQueries` for all prefixes then `removeQueries`;
  `expirePrivateSession` runs that cleanup and only then nulls the auth
  session entry. Doc comment says private state lives under "exactly these
  two key prefixes" — 6B must update the array **and** the comment.
- `frontend/src/hooks/useCompletion.ts` — `syncAuthoritativeCompletion`
  invalidates completion detail, participation detail, quest detail,
  `progressionKeys.me` (exact), and `passportKeys.all` (prefix).
- `frontend/src/lib/api/apiFetch.ts` — `ApiError(status, problem?,
  retryAfterSeconds?)`; `ProblemDetails` carries `type`; base path `/api`
  (`/v1/...` route segments are appended by callers).
- Validators (`frontend/src/lib/validation/passportDto.ts`,
  `progressionDto.ts`) — strict exact-key style: `isRecord`,
  `hasExactKeys`, UUID regex, strict UTC timestamp regex
  (`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,7})?(Z|[+-]00:00)$`),
  safe-integer bounds; any violation throws.
- Types (`frontend/src/types/passport.ts`, `progression.ts`) — exact
  frontend mirrors of the backend DTOs with a header comment citing the
  contract source.
- `lucide-react` `^1.25.0` is already a production dependency
  (`frontend/package.json`) and already used
  (`frontend/src/app/AppShell.tsx`, `HomePage.tsx`, `NotFoundPage.tsx`).
  No new icon dependency is needed.
- Test conventions — Vitest + Testing Library; `vi.stubGlobal('fetch',
  ...)`; `createTestQueryClient`/`jsonResponse` from
  `frontend/tests/organizerTestUtils.tsx`; page tests in
  `frontend/tests/integration/` (e.g. `PassportPage.test.tsx`, F3–F22);
  hook/validator tests in `frontend/tests/unit/` (e.g.
  `useCompletion.test.tsx`, `passportDto.test.ts`).
  `frontend/tests/integration/AuthSessionBoundary.test.tsx` hard-codes the
  private prefix set `['progression','passport']` in several assertions and
  must be extended when the third prefix is added.
  `PassportPage.test.tsx` F20 currently asserts the page contains **no**
  achievement text and F22 asserts the current grid classes — both are
  expected, planned modifications (§14, §16).
- No achievement-related type, validator, transport, hook, component, or
  query key exists anywhere in `frontend/src` today (grep-verified: no
  `achievement` matches outside tests/docs).

## 4. Goals (P0)

1. An authenticated member sees an **Achievements section on the Passport
   page** that renders every active catalog achievement.
2. Earned achievements are visibly **unlocked** and show the
   server-authoritative `awardedAt` date; unearned achievements are visibly
   **locked** without fabricating progress the backend does not provide.
3. New awards appear after a completion-code redemption through the
   existing `syncAuthoritativeCompletion` resync, extended to the
   `['achievements']` prefix — no polling, no manual refresh.
4. Session-expiry, missing-profile, not-ready, and unexpected failures
   degrade the Achievements section exactly within the established 5B
   bounded-state conventions, leaking no internal detail.
5. Fully responsive (mobile single column; up to three columns on wide
   screens) and accessible (semantic headings/lists, state not carried by
   color alone, decorative icons, machine-readable dates).
6. Zero backend, dependency, configuration, or accepted-contract change;
   all four frontend gates pass with observed results.

## 5. Non-goals (explicitly excluded from Slice 6B)

The following are **not** part of this Slice. Several are technically
impossible without an approved additive API contract; the rest are product
decisions deferred by the §17 handoff contract.

- Progress-toward-next-achievement data of any kind (no "2/3", no
  percentage, no threshold numbers as data). The catalog contract carries
  no criteria fields; locked cards show only the server-provided
  `name`/`description` copy. Visible progress would require an explicitly
  approved additive contract change (6A §19 open product question).
- Achievement thresholds, streaks, or any achievement family beyond the
  three persisted milestones.
- Unlock toasts, celebratory overlays, count-ups, or any unlock animation
  (product decision, not in 6A).
- Other users' achievements, public achievement pages, or any route/query
  user selector.
- Any write endpoint usage; achievement awarding stays purely
  server-side.
- Any backend change: schema, migration, seed, endpoint, DTO, OpenAPI,
  service, or configuration.
- New dependencies (icons come from the already-present `lucide-react`).
- Zustand storage of catalog or earned data (§17 rule; TanStack Query
  owns server state).
- A separate Achievements route/page; 6B extends `/passport` only.
- Leaderboard, Share Card, Community Challenge, EvidenceClaim,
  SelfReported, theme switching, Docker/deployment — all remain owned by
  their own future slices.
- Placeholder or teaser UI for any of the excluded systems.

## 6. D1–D8 decision table

Each decision preserves the recommendation, alternatives, and impact for
traceability. The human approved option A for D1-D8 on 2026-07-26.

### D1 — Catalog coverage: all active items vs earned-only — APPROVED (A)

- **Recommended (A): render the full active catalog.** Earned items show
  the unlocked state; all other active items show the locked state. This is
  the smallest surface that makes the achievement system visible and
  motivating, and it matches the product intent of a catalog.
- Alternative (B): earned-only list (no catalog call on Passport). Smaller
  still, but a new user sees an empty section and never learns achievements
  exist; the catalog endpoint would go unused.
- Impact: (A) requires both queries in the section and the locked-card
  design (D3); (B) drops the catalog transport/hook and D3.

### D2 — Section placement — APPROVED (A)

- **Recommended (A): between Level Summary (Progress) and Completion
  History**, as a full-width section; the page becomes three stacked
  full-width sections in DOM order: Progress → Achievements → Completion
  history.
- Alternative (B): below Completion history (less visual disruption to the
  5B layout; weaker prominence).
- Alternative (C): keep the 5B two-column desktop row (Progress |
  Completion history) and insert Achievements as a full-width band between
  two grid rows — visually close to (A) but keeps an asymmetric grid that
  complicates the responsive structure.
- Impact: (A) restructures `PassportPage.tsx` layout and requires updating
  the F22 responsive structural assertions; the current desktop
  side-by-side Progress/History arrangement is replaced by stacked
  sections. The planning instruction fixes the *position* (between summary
  and history); the human decision is the *layout restructuring* cost.

### D3 — Locked-card content — APPROVED (A)

- **Recommended (A):** decorative icon (code-mapped or fallback), the
  server `name`, the server `description`, and a text **Locked** badge. No
  progress bar, no "x/y" count, no threshold figures beyond what the server
  description copy itself says, no teaser for future features.
- Alternative (B): name + Locked badge only (hide description until
  unlocked) — more mysterious, less informative; wastes server-provided
  copy.
- Alternative (C): show computed progress client-side — **rejected**;
  impossible without an unapproved contract change (§5).
- Impact: copy and information disclosure are product-visible; (A) reveals
  the earning criterion text (e.g. "Reach three verified quest
  completions") because the server description already contains it.

### D4 — 503 `progression-not-ready` blast radius — APPROVED (A)

- **Recommended (A): section-level bounded state.** An earned-query 503
  replaces only the Achievements section body with the bounded not-ready
  panel + Retry (the 5B F11/F12 per-region precedent); Progress and
  Completion history are unaffected, and vice versa.
- Alternative (B): page-level — any 503 replaces the whole Passport page.
  Simpler but strictly worse UX and inconsistent with 5B.
- Impact: (A) replicates the `RegionError`/`isNotReady` semantics with
  section-private helpers inside `AchievementsSection.tsx` (Review 44 m1;
  §10); no new error machinery, no shared file.

### D5 — Icon mapping and fallback — APPROVED (A)

- **Recommended (A):** an explicit client map from the three known codes to
  Lucide components — `verified-completions-1` → `Footprints`,
  `verified-completions-3` → `TrendingUp`, `verified-completions-5` →
  `Medal` — with `Award` as the stable fallback for any unknown code, and a
  guarded `iconUrl` renderer (§12) taking precedence when non-null. All
  icons decorative (`aria-hidden`).
- Alternative (B): one generic icon for everything (no per-code mapping) —
  less delightful, zero mapping maintenance.
- Alternative (C): render `iconUrl` only, ignore codes — worse: every
  current row has `iconUrl: null`, so all cards would share one fallback
  anyway, and the §17 contract explicitly prescribes code mapping.
- Impact: icon *choices* are product-visible. Exact Lucide export names are
  verified against the installed `lucide-react` version at implementation
  time (`npm run type-check` fails on a missing export); if a recommended
  name is absent the implementer substitutes the closest available icon and
  records it in the completion report — no dependency change is permitted.

### D6 — Show unlock date — APPROVED (A)

- **Recommended (A): unlocked cards show the `awardedAt` date**, rendered
  as `<time dateTime={awardedAt}>{localized date}</time>` (the
  `CompletionHistoryItem` precedent: `toLocaleDateString()`).
- Alternative (B): no date — loses the only temporal information the API
  provides; earned ordering would be invisible to the user.
- Impact: negligible complexity; date formatting follows the existing
  locale-date convention, not a new formatter.

### D7 — Empty-state semantics — APPROVED (A)

- **Recommended (A):**
  - earned empty (normal new-user state): **not an error** — the grid
    renders with every catalog item locked; no extra panel.
  - catalog empty (contract-valid `[]`; impossible at runtime because the
    backend seeds and fail-closed validates three rows, M3): a bounded
    neutral note "No achievements available yet." inside the section —
    never an error alert, since `200 []` is a success.
- Alternative (B): hide the entire section when the catalog is empty —
  risks the section silently vanishing if a future catalog regression
  occurs; the bounded note is more honest.
- Impact: one additional small render branch and one test case.

### D8 — Confirmation of exclusions — APPROVED (A)

- **Recommended (A): explicitly confirm** that progress display, thresholds
  as data, streaks, toasts, unlock animations, other users' achievements,
  write endpoints, and all backend changes are excluded from 6B (the §5
  list), and that any future progress display requires its own approved
  additive contract change.
- Alternative (B): bundle any excluded item into 6B — requires a contract
  amendment and a new approval cycle; out of the question for this slice.
- Impact: approving (A) freezes the 6B boundary; scope questions during
  implementation resolve against this list or stop.

## 7. Passport information architecture and responsive layout

Current (5B) structure: one `<main>` (`max-w-4xl`), one `<h1>`, one grid
`grid-cols-1 md:grid-cols-3` containing Progress (`md:col-span-1`) and
Completion history (`md:col-span-2`).

Recommended (D2-A) structure:

```
<main class="container mx-auto max-w-4xl px-4 py-8">
  <h1>{displayName} — Passport</h1>
  <section aria-labelledby="passport-summary-heading">   … Progress …   </section>
  <section aria-labelledby="passport-achievements-heading"> … Achievements … </section>
  <section aria-labelledby="passport-history-heading">   … Completion history … </section>
</main>
```

- The three sections stack vertically with the existing `mt-6` spacing
  rhythm; the outer `md:grid-cols-3` wrapper and both `md:col-span-*`
  classes are removed (nothing else uses them).
- Inside the Achievements section, the card grid is
  `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`:
  mobile single column, two columns from `sm`, **at most three** columns on
  wide screens (the planning instruction caps at three).
- DOM order = visual order = heading order (h2 Progress, h2 Achievements,
  h2 Completion history); no CSS reordering.
- The Completion history internals (list, pagination, empty state) are
  untouched; only its section wrapper's grid classes change.
- F22 (`PassportPage.test.tsx`) is updated to assert the new structure:
  single-column mobile base, section DOM order, and the achievements card
  grid classes `grid-cols-1`/`sm:grid-cols-2`/`lg:grid-cols-3` (§14).

## 8. Client types, validators, transport, and hooks

All modules follow the established 5B conventions exactly: exact-key strict
validators, `apiFetch<unknown>` + validate, explicit active-`queryClient`
passing for private endpoints, `retry: false`.

### 8.1 Types — `frontend/src/types/achievement.ts` (new)

Exact mirrors of the §2.12 DTOs, with the same header-comment convention
(citing the contract source):

```ts
export interface AchievementCatalogItem {
  id: string;            // UUID
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;      // plain string; 'Milestone' for the 6A catalog
}

export interface EarnedAchievement {
  achievementId: string; // UUID
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  awardedAt: string;     // round-trip "O" UTC timestamp
}
```

`category` and `code` are typed as plain `string` (not string-literal
unions): the contract defines them as plain strings, and forward
compatibility requires unknown codes/categories to validate and render via
the fallback icon (D5, §17).

### 8.2 Validators — `frontend/src/lib/validation/achievementDto.ts` (new)

Same helper style as `passportDto.ts` (`isRecord`, `hasExactKeys`, UUID and
UTC-timestamp regexes — the regexes are re-declared locally per the existing
per-file convention):

- `validateAchievementCatalog(payload: unknown): AchievementCatalogItem[]`
  — payload must be an array; every item must have **exactly** the six
  contract keys; `id` UUID; `code`, `name`, and `category` non-empty
  strings; `description` a string (possibly empty); `iconUrl` `null` or a
  non-empty string. Any violation throws. An empty array is valid (D7).
- `validateEarnedAchievements(payload: unknown): EarnedAchievement[]` —
  array; every item exactly the seven contract keys; `achievementId` UUID;
  `awardedAt` matching the strict UTC timestamp pattern used by
  `passportDto.ts`; other fields as above.
- No client-side threshold, progress, or count validation exists, because
  no such field exists in the contract.
- No deduplication or re-sorting: server ordering (`code ASC` /
  `(awardedAt, code)`) is preserved and trusted after validation.

### 8.3 Transport — `frontend/src/lib/api/achievements.ts` (new)

Two functions, mirroring `progression.ts`/`passport.ts` doc-comment and
error conventions:

- `fetchAchievementCatalog(options?: { signal?: AbortSignal }):
  Promise<AchievementCatalogItem[]>` — public;
  `apiFetch<unknown>('/v1/achievements', { signal: options?.signal })` +
  `validateAchievementCatalog`; no `queryClient`, no 401 lifecycle (the
  endpoint is anonymous; a 401 is not part of its contract). The optional
  signal keeps unmount, invalidation, and prefix-cancellation behavior
  coherent for the public query (Review 44 m2).
- `fetchMyAchievements(options: { queryClient: QueryClient; signal?:
  AbortSignal }): Promise<EarnedAchievement[]>` — private;
  `apiFetch<unknown>('/v1/users/me/achievements', { signal })` +
  `validateEarnedAchievements`; on `ApiError` 401 `await
  expirePrivateSession(options.queryClient)` before rethrow (the B1
  private-session lifecycle, unchanged).

### 8.4 Hooks — `frontend/src/hooks/useAchievements.ts` (new)

```ts
export const achievementKeys = {
  all: ['achievements'] as const,
  catalog: ['achievements', 'catalog'] as const,
  mine: ['achievements', 'me'] as const,
};

useAchievementCatalog()  // queryKey catalog; staleTime: 86_400_000 (24 h);
                         // retry: false; queryFn: ({ signal }) =>
                         //   fetchAchievementCatalog({ signal })
useMyAchievements()      // queryKey mine; passes the active queryClient;
                         // retry: false
```

- The catalog stale time is long (24 h) because catalog content changes
  only via deployment/seed change (§17). `gcTime` stays at the library
  default.
- `useMyAchievements` is only mounted inside the authenticated
  `RequireAuth` Passport route; no `enabled` gating is added (the
  `useProgression` precedent).
- Neither hook uses `placeholderData`; the section renders its own
  skeleton.

## 9. Recommended Achievements UI

`AchievementsSection` (new component) owns both queries and all section
states; `AchievementCard` renders one catalog item.

Composition rule (Review 44 M1): the catalog defines the **card slots and
their order** — one slot per active catalog item, in server (`code ASC`)
order. Earned state is resolved by identity match
(`earned.achievementId === catalogItem.id`):

- **Locked slot** (no matching earned row): all display fields render from
  the catalog row.
- **Unlocked slot** (matching earned row): the card renders the **complete
  earned item** — `code`, `name`, `description`, `iconUrl`, `category`,
  and `awardedAt` are all read from the earned endpoint's server-composed
  row (accepted 6A D5: the earned response deliberately carries current
  display fields so 6B never reconstructs them through the second call).
  The catalog row contributes nothing to an unlocked card beyond defining
  its slot.
- **Earned row without an active catalog slot** (its `achievementId`
  matches no catalog `id`): it is **not rendered** — the grid shows
  exactly the active catalog surface, mirroring the backend's
  inactive-earned exclusion.

No client re-sorting; earned items are **not** floated to the top (keeps
positions stable across redemptions; alternative considered and rejected
for layout stability).

Unlocked card (D3/D5/D6) — every field below is read from the matched
**earned item**, never from the catalog row:

- decorative icon (§12, resolved from the earned item's `iconUrl`/`code`),
  `name` (card title), `description`;
- a text badge **Unlocked** (e.g. `badge badge-success`); and
- `<time dateTime={awardedAt}>Unlocked {toLocaleDateString()}</time>` —
  the exact "Unlocked " prefix wording is finalized at implementation and
  asserted in tests.

Locked card:

- same decorative icon slot (the code-mapped icon, visually muted via
  `text-base-content/40`-style opacity — color is never the only state
  signal), `name`, `description`;
- a text badge **Locked** (`badge badge-outline`);
- no date, no progress, no threshold figures.

The section heading is `h2` "Achievements" (`id
="passport-achievements-heading"`), matching the existing heading style
(`text-xl font-semibold`).

## 10. Error and loading states

Per-query behavior inside the Achievements section (D4-A: section-level,
never page-level).

Implementation boundary (Review 44 m1): `RegionSkeleton`, `RegionError`,
`isNotReady`, and `isMissingProfile` are file-local to `PassportPage.tsx`
and are **not** imported by `AchievementsSection.tsx` — importing them from
the page that imports the section would create a dependency cycle. The
section implements **equivalent private helpers inside
`AchievementsSection.tsx`**: same fixed copy, same alert classes and ARIA
roles, same 404 (warning, no retry) / 503 (info + Retry) / generic (error
+ Retry) semantics as the Progress and Completion history regions. No
shared region-state component file is extracted; the §16 file map and
count are unchanged.

| Case | Behavior |
| --- | --- |
| Either query pending | Section skeleton (section-private helper equivalent to `RegionSkeleton`: `aria-live="polite"`, `.skeleton` blocks, `sr-only` label "Loading your achievements…"). |
| Earned 401 | Transport runs `expirePrivateSession`; the auth entry becomes null and the `RequireAuth` guard redirects. No section UI special-casing (existing lifecycle; no change). |
| Earned 404 (no profile) | The section-private equivalent of the `RegionError` missing-profile branch: `alert alert-warning`, "Passport unavailable", no retry — identical to the Progress/History sections (F13 precedent). |
| Earned 503 `progression-not-ready` | Bounded not-ready panel: `alert alert-info`, "Your achievements are being prepared. Try again shortly.", Retry button → `refetch()` of the earned query. The catalog data is **not** rendered in this state (showing an all-locked grid while earned state is unknown would be dishonest). |
| Earned other error (500, network, validation throw) | `alert alert-error`, "We could not load this section.", Retry → earned `refetch()`. Fixed copy only; no problem-detail or exception text is rendered. |
| Catalog error (any, incl. unexpected 500) | Same generic section error + Retry → catalog `refetch()`. The endpoint has no 401/404/503 contract; nothing else is special-cased. |
| Catalog `200 []` | D7-A bounded note "No achievements available yet." (not an error). |
| Both queries errored | One section-level generic error panel (not two stacked alerts); Retry refetches both. |

All queries use `retry: false` (§17); retries are exclusively the manual
Retry buttons. No internal information (problem `detail`, exception
messages, counts, SQL/HTTP internals) is rendered by any failure boundary;
the catalog/earned failure UI uses the same fixed strings as the 5B
sections.

## 11. Cache contract

- Query keys (§8.4): catalog `['achievements','catalog']` (24 h stale
  time); earned `['achievements','me']` under the `['achievements']`
  prefix.
- **Redemption resync:** `syncAuthoritativeCompletion`
  (`frontend/src/hooks/useCompletion.ts`) gains one entry:
  `queryClient.invalidateQueries({ queryKey: achievementKeys.all })`
  (prefix, non-exact) alongside the existing five invalidations. This is
  the §17 handoff requirement; a fifth-milestone redemption surfaces the
  new unlocked card without a page reload.
  - Accepted side effect: the prefix invalidation also marks the public
    catalog stale, causing one cheap anonymous refetch. Surgical exclusion
    of the catalog key was considered and rejected — §17 prescribes the
    prefix, and the extra public GET is harmless.
- **Private-session lifecycle:** `PRIVATE_SERVER_QUERY_KEYS`
  (`frontend/src/lib/api/privateCache.ts`) gains `['achievements']`, so
  logout, login/account replacement, and any private 401 cancel+remove
  earned achievement queries before the session entry changes. The file's
  doc comment ("exactly these two key prefixes") is updated to three.
  - Accepted side effect: prefix cleanup also removes the public catalog
    cache entry. It is anonymous data and refetches on next mount; the
    alternative (predicate-based surgical removal that spares
    `['achievements','catalog']`) was considered and rejected as
    unjustified complexity for a public, instantly refetchable resource.
- **No Zustand:** catalog and earned data never enter any store or Web
  Storage (§17 rule); the F19-style assertion is extended to achievement
  terms (§14).

## 12. Icon strategy (D5)

- Client-side map (living in `AchievementCard.tsx`, its only consumer):

  | Code | Achievement | Recommended Lucide icon |
  | --- | --- | --- |
  | `verified-completions-1` | First Steps | `Footprints` |
  | `verified-completions-3` | Building Momentum | `TrendingUp` |
  | `verified-completions-5` | Committed Contributor | `Medal` |
  | *(any unknown code)* | — | `Award` (stable fallback) |

- Export names are verified against the installed `lucide-react` (`^1.25.0`)
  at implementation time; `npm run type-check` fails on a missing export.
  A missing name is substituted with the closest available icon and
  recorded in the completion report; **no dependency is added or
  upgraded**.
- **`iconUrl` rendering (forward compatibility, §17):** when `iconUrl` is
  non-null it takes precedence over the code-mapped icon, rendered as
  `<img>` only after a protocol guard — `new URL(iconUrl)` must parse and
  use `http:` or `https:`; anything else falls back to the code-mapped
  icon. The `<img>` carries `alt=""` (decorative), `loading="lazy"`,
  `referrerPolicy="no-referrer"`, and an `onError` handler that falls back
  to the code-mapped icon. No `dangerouslySetInnerHTML`, no URL string is
  ever injected into markup except as a guarded `src`.
- All icons are decorative: Lucide components render with
  `aria-hidden="true"` (and `focusable="false"`); the `<img>` uses
  `alt=""`. Achievement state is conveyed by the text badges, never by the
  icon or its color (§13).

## 13. Accessibility

- **Semantics:** the section is `<section aria-labelledby
  ="passport-achievements-heading">` with `h2` "Achievements" — the third
  h2 under the single h1, in DOM order. Cards render as `<ul>`/`<li>`
  (the `CompletionHistoryList` precedent).
- **State not by color alone:** Locked/Unlocked are text badges present in
  the accessibility tree; icon muting is purely visual.
- **Decorative icons:** `aria-hidden`/`alt=""` per §12; screen readers
  hear name, description, and state — never an icon name.
- **Dates:** `<time dateTime={awardedAt}>` with a human-readable localized
  date as text content (D6).
- **Loading:** `aria-live="polite"` skeleton region with an `sr-only`
  "Loading your achievements…" label (the section-private `RegionSkeleton`
  equivalent, §10).
- **Keyboard:** cards are non-interactive — no tab stops, no focusable
  card content; the only focusable elements are the Retry buttons
  (`<button type="button">`, keyboard-operable, the 5B pattern).
- **Screen readers:** state panels use the existing roles (`role="status"`
  for the not-ready info alert, `role="alert"` for warning/error) so
  transitions are announced.
- **Reduced motion:** no animation is introduced anywhere in this slice
  (§5), so no `prefers-reduced-motion` handling is required.

## 14. Test matrix

All frontend: Vitest + Testing Library, `vi.stubGlobal('fetch', ...)`
idiom, `createTestQueryClient`/`jsonResponse` helpers. New test IDs
continue the Passport F-numbering (F23+) where tests live in
`PassportPage.test.tsx`.

### 14.1 Validators/types — `frontend/tests/unit/achievementDto.test.ts` (new)

- catalog: valid array passes (including `iconUrl: null` and non-null);
  exact six keys enforced (extra key, missing key rejected); non-array
  rejected; non-UUID `id` rejected; empty `code`/`name`/`category`
  rejected; `iconUrl` wrong type rejected; `[]` valid.
- earned: exact seven keys enforced; `achievementId` UUID; `awardedAt`
  strict UTC pattern (accepts `"2026-07-26T01:23:45.0000000Z"`, rejects
  non-UTC offsets other than `+00:00`, rejects date-only); `[]` valid.
- type-level: the returned types match the interfaces (compile-time via
  `npm run type-check`).

### 14.2 Transport + 401 cleanup — covered in `useAchievements.test.tsx` (new)

- `fetchMyAchievements` on a 401 response: `expirePrivateSession` runs
  against the passed client — private queries (`['progression']`,
  `['passport']`, `['achievements']`) are cancelled+removed and the auth
  entry becomes null before the promise rejects (the
  `AuthSessionBoundary` F9 ordering pattern, at unit scope).
- `fetchAchievementCatalog` performs no session cleanup on any status.
- Signal forwarding (Review 44 m2): the catalog hook's `queryFn` forwards
  the TanStack-Query-provided `AbortSignal`; a focused assertion proves
  the exact signal instance reaches `apiFetch`/the global `fetch` call
  (e.g. the fetch mock observes that signal instance, or aborting it
  cancels the in-flight catalog request).

### 14.3 Hooks/query keys/retry — `frontend/tests/unit/useAchievements.test.tsx` (new)

- `achievementKeys` exact shapes: `['achievements']`,
  `['achievements','catalog']`, `['achievements','me']`.
- both hooks use `retry: false` (a failed fetch surfaces `isError` without
  additional attempts — assert fetch call count is 1);
- catalog hook carries the 24 h `staleTime`;
- `useMyAchievements` fetches into `['achievements','me']` and validates
  (an invalid payload rejects into the query error state).

### 14.4 Section rendering — `frontend/tests/integration/PassportAchievements.test.tsx` (new)

- earned/locked rendering: catalog of three + earned of one → exactly one
  Unlocked badge (with the correct card) and two Locked badges; unlocked
  card shows the `awardedAt` `<time dateTime>`; locked cards show no
  `<time>`.
- earned-field authority (Review 44 M1 counterexample): for the matched
  achievement, catalog and earned display fields deliberately differ
  (`name`, `description`, `iconUrl`, `category`) → the unlocked card
  renders the **earned** endpoint's fields, not the catalog row's; the
  catalog row only determines the card's slot and position.
- earned row without an active catalog slot (its `achievementId` matches
  no catalog `id`) is not rendered; the grid shows exactly the active
  catalog slots.
- ordering: cards render in catalog server order (`code ASC` as returned);
  earned items are not re-sorted to the front (counter-arranged earned
  order asserted — mirrors the Review 43 m1 lesson on ordering evidence).
- unknown `code` renders the fallback icon without crashing; a non-null
  `https:` `iconUrl` renders an `<img alt="">`; a `javascript:`-scheme
  `iconUrl` falls back to the mapped icon.
- locked cards contain no progress text (`queryByText(/\d+\s*\/\s*\d/)`
  null, no `progressbar` role in the section).
- loading: section skeleton with the sr-only label; other sections render
  normally.
- earned-empty: all cards Locked; no empty panel; not an error state.
- catalog-empty (`200 []`): bounded "No achievements available yet." note;
  no error alert.
- earned 404: "Passport unavailable" in the achievements region; no retry
  button; other regions unaffected.
- earned 503 `progression-not-ready`: bounded not-ready panel + Retry in
  the achievements region only; Progress and Completion history render
  normally; clicking Retry refetches and recovers (the F11 pattern).
- earned 500 / catalog 500: generic fixed-copy error + Retry; no problem
  `detail` text leaks into the DOM (assert the server-sent detail string is
  absent).
- both errored: exactly one error alert in the section.

### 14.5 Page integration and regression — `frontend/tests/integration/PassportPage.test.tsx` (modified)

- F23 (new): section order — the achievements region sits between the
  Progress and Completion history regions in DOM order; h2 sequence is
  Progress → Achievements → Completion history.
- F22 (updated): structural assertions for the new layout — `max-w-4xl`
  main, no more `md:grid-cols-3`/`md:col-span-*`, achievements card grid
  carries `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (responsive
  structural assertions; jsdom cannot evaluate media queries, so classes
  are asserted, matching the existing F22 approach).
- F19 (updated): the no-server-state-in-stores assertion is extended with
  `achievement` terms.
- F20 (updated): the "no achievement text" assertion is inverted for the
  achievements domain — the page now **must** contain the Achievements
  section; streak/leaderboard/share-card/carbon absence is retained.
- All other existing F-tests remain valid unchanged (Progress and
  Completion history behavior is untouched).

### 14.6 Redemption invalidation — `frontend/tests/unit/useCompletion.test.tsx` (modified)

- The existing success-path invalidation test (F17 companion, "also
  invalidates the Passport progression and history keys on success") is
  extended: a successful redemption invalidates the `['achievements']`
  prefix (both `['achievements','me']` and `['achievements','catalog']`
  observers see the invalidation, or the prefix invalidation is asserted
  directly via the query cache).

### 14.7 Private-cache cleanup — `frontend/tests/integration/AuthSessionBoundary.test.tsx` (modified)

- The hard-coded private prefix set `['progression','passport']` (cancel/
  remove ordering assertions and filters) is extended to include
  `['achievements']`; F9/F10 assertions then prove achievement queries are
  cancelled+removed before the session entry changes at logout, login, and
  mid-page private 401.

### 14.8 Existing Passport regression

The full `PassportPage.test.tsx` suite (updated F19/F20/F22 + new F23)
plus `AuthSessionBoundary.test.tsx` and `useCompletion.test.tsx` must pass
with observed results; no other existing test file changes.

## 15. Verification gates (frontend only)

Targeted during implementation (from `frontend/`):

```bash
npm run test -- --run tests/unit/achievementDto.test.ts tests/unit/useAchievements.test.tsx
npm run test -- --run tests/integration/PassportAchievements.test.tsx tests/integration/PassportPage.test.tsx
npm run test -- --run tests/unit/useCompletion.test.tsx tests/integration/AuthSessionBoundary.test.tsx
```

Full gates once after implementation is complete (from `frontend/`):

```bash
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

No backend gates: no backend file changes. No result is claimed unless
executed and observed. Browser/manual claims are excluded — verification is
the four gates plus the test matrix.

## 16. Proposed file map

Production (new, 6):

- `frontend/src/types/achievement.ts`
- `frontend/src/lib/validation/achievementDto.ts`
- `frontend/src/lib/api/achievements.ts`
- `frontend/src/hooks/useAchievements.ts`
- `frontend/src/components/passport/AchievementsSection.tsx` (includes the
  section-private loading/error helpers per Review 44 m1 — no shared
  region-state file is added)
- `frontend/src/components/passport/AchievementCard.tsx` (includes the
  code→icon map and the guarded `iconUrl` renderer)

Production (modified, 3):

- `frontend/src/pages/PassportPage.tsx` (insert the section; restructure to
  three stacked sections per D2-A)
- `frontend/src/lib/api/privateCache.ts` (add `['achievements']`; update
  the doc comment)
- `frontend/src/hooks/useCompletion.ts` (extend
  `syncAuthoritativeCompletion` with the `['achievements']` prefix
  invalidation)

Tests (new, 3):

- `frontend/tests/unit/achievementDto.test.ts`
- `frontend/tests/unit/useAchievements.test.tsx`
- `frontend/tests/integration/PassportAchievements.test.tsx`

Tests (modified, 3):

- `frontend/tests/integration/PassportPage.test.tsx` (F19/F20/F22 updates,
  new F23)
- `frontend/tests/unit/useCompletion.test.tsx` (achievements invalidation)
- `frontend/tests/integration/AuthSessionBoundary.test.tsx` (third private
  prefix)

**Primary-file count:** 9 production files (6 new + 3 modified) plus 6 test
files (3 new + 3 modified) — 15 total, within the
`03-deadline-execution-mode.md` 10–15 primary-file guideline.

Documentation/evidence at implementation time (after approval of this
plan): an implementation prompt record under `specs/ai/prompts/` (next
number), a completion report under `specs/implementation/reports/`, and a
`PROJECT_STATUS.md` update at completion. **No accepted-spec amendment is
required**: the API contract §2.12 already documents both endpoints (6A-2
amendment), and 6B changes no architecture decision. This plan's D-marks
are flipped to APPROVED in place when the human approves.

## 17. Risks, alternatives, unknowns, and stop conditions

### Risks

- **Layout regression (medium):** D2-A restructures the 5B desktop layout;
  F22 guards the structure, and the F-suite regression run guards behavior.
  The stacked layout is simpler than the two-column grid it replaces.
- **Icon availability (low):** recommended Lucide names may differ in the
  installed version; type-check catches it, substitution is recorded (D5).
- **Cache-prefix side effects (low):** the shared `['achievements']`
  prefix invalidates/removes the public catalog along with earned data;
  both are harmless refetches (§11). If the human disagrees, the surgical
  alternatives are recorded there.
- **Section grows long on mobile (low):** three stacked sections lengthen
  the page; acceptable for P0 and consistent with the responsive mandate.
- **Test churn (low):** F19/F20/F22 and `AuthSessionBoundary` assertions
  are intentionally modified; the changes are enumerated in §14 so review
  can verify nothing else moved.

### Alternatives recorded

- Earned-only surface (D1-B); section below history (D2-B); locked cards
  without descriptions (D3-B); page-level 503 (D4-B); single generic icon
  (D5-B); hiding the date (D6-B); hiding the section on empty catalog
  (D7-B); surgical catalog-sparing invalidation/cleanup (§11).

### Unknowns (non-blocking)

- Exact Lucide export availability (resolved at implementation by
  type-check; D5 records the rule).
- Final user-visible copy for the Unlocked date line (D6); finalized at
  implementation and asserted in tests.

### Stop conditions (return to the human before implementing further)

- Any backend, contract, schema, dependency, or configuration change
  appears necessary (including any desire for progress data).
- The §2.12/§13 contract cannot be satisfied as documented (e.g. a key
  mismatch discovered against the real API).
- The D2-A layout proves impossible without regressing an approved 5B
  behavior that tests cannot guard.
- Any decision beyond D1–D8 emerges (e.g. new user-visible features).

## 18. Definition of Done, evidence, and independent review workflow

A Slice 6B implementation is ready for commit only when:

1. Production implementation is complete within the §16 file map.
2. The §14 matrix tests and all four §15 frontend gates have been executed
   and observed passing (lint, type-check, full test run, build).
3. An implementation prompt record exists under `specs/ai/prompts/`.
4. A completion report exists under `specs/implementation/reports/`
   stating implemented scope, files changed, verification commands and
   observed results, known limitations, and review status.
5. The independent read-only implementation review record exists under
   `specs/ai/reviews/` and all original Blocker/Major findings are closed
   (important cross-layer slice: one independent full review, one
   concentrated correction pass, one targeted closure check — the AGENTS.md
   bounded workflow).

Process for this plan itself: Review 44 identified M1/m1/m2, Kimi K3 made
the single concentrated planning correction, and Review 45 closed all three.
The human then approved the complete decision checklist. Codex implemented
as sole owner. Review 46 independently approved the implementation with
0 Blockers, 0 Majors, and 2 non-blocking Minors; Codex corrected both in one
concentrated pass and reran the complete frontend gates.

## 19. Human approval checklist

- [x] D1 — full catalog vs earned-only (approved: full catalog)
- [x] D2 — section placement and layout restructuring (approved:
      between summary and history, stacked sections)
- [x] D3 — locked-card content (approved: icon + name + description
      + Locked badge, no progress)
- [x] D4 — 503 blast radius (approved: section-level bounded)
- [x] D5 — icon mapping/fallback (approved: Footprints / TrendingUp /
      Medal, Award fallback, guarded iconUrl)
- [x] D6 — unlock date display (approved: show `awardedAt` date on
      unlocked cards)
- [x] D7 — empty states (approved: earned-empty → all-locked grid;
      catalog-empty → bounded note)
- [x] D8 — exclusions confirmed (progress, thresholds, streaks, toasts,
      animations, other users, write endpoints, backend changes — all out)
- [x] Cache-contract extensions approved (`syncAuthoritativeCompletion` +
      `PRIVATE_SERVER_QUERY_KEYS`, §11 side effects accepted)
- [x] File map and 15-file count approved (§16)
- [x] Independent Codex design review completed before implementation
