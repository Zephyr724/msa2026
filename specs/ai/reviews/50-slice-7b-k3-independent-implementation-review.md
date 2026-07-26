# Review 50 — Slice 7B Simple Leaderboard Frontend: Kimi K3 Independent Implementation Review

- **Date:** 2026-07-26
- **Reviewer:** Kimi K3 (independent, read-only; Codex was the sole
  implementation owner)
- **Branch:** `feat/slice-7b-simple-leaderboard-frontend`
- **Baseline:** `5fb7be0` (PR #17, Slice 7A merge). The 7B change set is the
  uncommitted working tree on top of this HEAD, confirmed via
  `git status` / `git diff 5fb7be0..HEAD` (empty committed diff).
- **Plan:** `specs/implementation/07-simple-persisted-leaderboard.md`
  (§8 frontend contract, D1–D8 approved, §11.2 test matrix)
- **Evidence reviewed:**
  `specs/ai/prompts/55-slice-7b-simple-leaderboard-frontend-implementation.md`,
  `specs/implementation/reports/07b-simple-leaderboard-frontend-completion.md`,
  `PROJECT_STATUS.md` diff
- **Review method:** independent read of every changed/new file against the
  approved plan; independent execution of all four frontend gates; no files
  modified, no Git write action performed.

## Verdict

**APPROVED — 0 Blockers, 0 Majors, 2 Minors (both non-blocking).**

The implementation matches the approved D1–D8 contract and the §8/§9 7B
file map exactly. All reported verification results were independently
reproduced.

## Independently observed gates (run by the reviewer from `frontend/`)

- `npm run lint` — passed: 0 warnings, 0 errors, 112 files.
- `npm run type-check` — passed (`tsc -b`, no output errors).
- `npm run test -- --run` — **288/288 tests passed across 31 files**
  (includes `leaderboardDto.test.ts` 17 tests).
- `npm run build` — succeeded; Vite transformed **1,899 modules**.

These match the completion report and `PROJECT_STATUS.md` claims exactly
(40/40 targeted, 288/288 full, 1,899 modules). No invented numbers found.

## Item-by-item verification

### 1. Types and validator — PASS

`frontend/src/types/leaderboard.ts` uses the staged string literals
(`scope: 'nz'`, `period: 'allTime'`). `frontend/src/lib/validation/leaderboardDto.ts`
hand-rolls strict validation in the `achievementDto.ts` pattern (no new
validation dependency):

- exact keys at envelope (`scope`, `period`, `rows`) and row
  (`rank`, `displayName`, `totalXp`, `verifiedCompletionCount`) level via
  length + inclusion check — a leaked `userId` or any missing key fails;
- `scope === 'nz'` and `period === 'allTime'` literal equality;
- `rows` array capped at 10;
- ordinal rank enforced as `rank === index + 1` (sequential, 1-based);
- `displayName`: string, 1–100 chars;
- `totalXp`: `Number.isSafeInteger` and `>= 0`;
- `verifiedCompletionCount`: `Number.isSafeInteger` and `> 0`.

`frontend/tests/unit/leaderboardDto.test.ts` is counter-directional (T19):
17 tests reject extra/missing keys, leaked `userId` at both levels, wrong
literals, 11 rows, non-sequential rank, empty/101-char names, negative,
fractional, and `MAX_SAFE_INTEGER + 1` XP, and zero/fractional counts.

### 2. Transport and cancellation — PASS

`frontend/src/lib/api/leaderboard.ts` calls exactly
`apiFetch<unknown>('/v1/leaderboards/people')` and nothing else, then
validates. The `{ signal }` option is forwarded in `init`;
`frontend/src/lib/api/apiFetch.ts:120-125` spreads `init` into `fetch`, so
the TanStack Query signal reaches the network layer unmodified.
`useLeaderboard.test.tsx` ("forwards and aborts the exact TanStack Query
signal") captures the signal instance observed by `fetch`, asserts it is
the live `AbortSignal`, unmounts the hook, and observes `aborted === true`
(T20). No 401/session-expiry path exists on this anonymous GET.

### 3. Query contract — PASS

`frontend/src/hooks/useLeaderboard.ts`:
`leaderboardKeys.peopleNzAllTime = ['leaderboard', 'people', 'nz', 'allTime']`,
`leaderboardKeys.all = ['leaderboard']`, `retry: false`,
`staleTime: 60_000`. The hook test asserts the key shapes and reads the
cached query's `staleTime`/`retry` options back from the `QueryClient`.
Manual Retry is `refetch()` from the error state; the page integration
test proves one click produces exactly one refetch and recovery to the
table. Cache behaviour (second mount reuses fresh data; prefix
invalidation refetches) is covered by `LeaderboardPage.test.tsx` (T25).

### 4. Public route — PASS

`frontend/src/app/router.tsx` adds `{ path: '/leaderboard', element: <LeaderboardPage /> }`
as a direct `AppShell` child, outside the `RequireAuth` subtree.
`AppShell.test.tsx` ("serves the leaderboard route publicly without a
login redirect") stubs a 401 session, clicks the nav link as a guest, and
observes the leaderboard heading and empty state with no Sign-in redirect
(T27 route half).

### 5. All-principal compact navigation — PASS

`frontend/src/app/AppShell.tsx` renders the link unconditionally (outside
`canManageQuests` and auth conditionals) with Lucide `Trophy`
(`aria-hidden`), `aria-label="Leaderboard"`, and
`<span className="hidden sm:inline">Leaderboard</span>` — the established
compact idiom. Tests cover all four principals: signed-out guest
(`href` + `hidden sm:inline` assertions), Member (link present, no
management item), and Organizer/Admin via the `it.each` compact-cluster
test asserting the same `hidden sm:inline` contract (T27 navigation half).

### 6. Page states and Problem Details hygiene — PASS

`frontend/src/pages/LeaderboardPage.tsx` renders only server fields
(`rank`, `displayName`, `totalXp`, `verifiedCompletionCount`) and fixed
client copy. States are bounded and non-shifting: loading
(`aria-live="polite"`), empty (`rows: []` → fixed copy, no table), error
(`role="alert"` + Retry button), data (table). The error integration test
serves a 503 Problem Details body containing the marker string
"Sensitive server detail must stay hidden." and asserts the alert does
**not** contain it — server `detail` is never rendered.

### 7. Table markup contract — PASS

Single semantic table at all viewports: `table table-fixed w-full`;
`<caption className="sr-only">` (accessible name asserted via
`findByRole('table', { name: ... })`); all four headers carry
`scope="col"`; `colgroup` encodes the D7 widths (`w-10 sm:w-14` rank,
flexible member, `w-16 sm:w-24` numeric columns); rank cells expose
`aria-label="Rank N"` ordinal text; the name cell is
`min-w-0 truncate` with a `title` fallback; numeric columns are
right-aligned `tabular-nums`; padding is compact (`px-1 sm:px-3`).
`LeaderboardPage.test.tsx` asserts each of these structurally (T21/T24)
and — per the approved plan — does not claim observed 320 px runtime
overflow.

### 8. Redemption invalidation — PASS

`frontend/src/hooks/useCompletion.ts:131-133` adds
`queryClient.invalidateQueries({ queryKey: leaderboardKeys.all })` to the
existing `Promise.all` in `syncAuthoritativeCompletion` — a non-exact
`['leaderboard']` prefix invalidation, matching D7. The diff touches
nothing else in the hook. `useCompletion.test.tsx` asserts the call
alongside the pre-existing keys (T26).

### 9. Boundary — PASS

`git status` shows the complete change set: 8 new and 5 modified frontend
files (exactly the §9 7B map), plus `PROJECT_STATUS.md`, the plan status
line, and evidence documents. No backend, schema, migration, index,
dependency (`package.json`/lockfile untouched), configuration,
authentication, or excluded-capability (scope/period switch, pagination,
`/me`, movement, SignalR, communities board) change exists. No Zustand
import or Web Storage access was introduced (verified by reading the new
sources; the storage-spy test adds counter-evidence).

### 10. Counter-directional tests and evidence truthfulness — PASS

All §11.2 matrix items T19–T27 have corresponding tests, and the failure
modes are asserted as rejections/absences rather than happy-path-only
checks. The completion report's "Known limitations" honestly disclaims
any browser viewport run. Every quantitative claim in the report,
prompt record, and `PROJECT_STATUS.md` (40/40 targeted, 288/288 full
across 31 files, 1,899 build modules, lint clean) was reproduced by the
reviewer's own gate run.

## Findings

### Blockers

None.

### Majors

None.

### Minors (non-blocking)

- **M1 (test coverage gap, cosmetic):** `leaderboardDto.test.ts` has no
  explicit case for a missing **envelope** key (e.g. `{ scope, period }`
  without `rows`) or a non-object row element (e.g. `rows: [null]`). The
  `hasExactKeys` length check and `isRecord` guard already reject both by
  construction, so behaviour is correct; only the counter-evidence table
  is one or two cases short of exhaustive. No change required for commit;
  optional hardening later.
- **M2 (evidence-only):** The completion report's "40/40 passed across 5
  files" targeted-run claim predates this review and could not be
  independently replayed as a targeted run; it is, however, fully
  subsumed by the reviewer's observed full run (288/288, 31 files),
  which includes all 5 targeted files. Recorded for accuracy; no action
  required.

## Review status and boundaries

- This is the single independent read-only review required for 7B. The
  reviewer did not implement, modify, stage, commit, push, merge, create
  a PR, or deploy anything.
- Slice 7B is ready for human Git approval. All Blocker/Major findings:
  none open.
