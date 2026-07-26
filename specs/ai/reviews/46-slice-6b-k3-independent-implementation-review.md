# Review 46 — Slice 6B Passport Achievements UI: Kimi K3 Independent Implementation Review

- **Date:** 2026-07-26
- **Reviewer:** Kimi K3 (independent, read-only; not the implementation session)
- **Implementation owner:** Codex
- **Branch:** `feat/slice-6b-passport-achievements-ui`
- **Baseline:** `a974725` (PR #15 merge of Slice 6A-2); HEAD `3ea80d6` plus
  uncommitted working-tree content, reviewed in full (tracked diff **and**
  every untracked file)
- **Contract reviewed against:**
  `specs/implementation/06b-passport-achievements-ui.md` (D1-A–D8-A approved
  2026-07-26), `specs/architecture/03-api-contract.md` §2.12,
  `specs/ai/reviews/44-slice-6b-codex-independent-design-review.md`,
  `specs/ai/reviews/45-slice-6b-codex-targeted-design-closure-review.md`,
  `specs/ai/prompts/52-slice-6b-passport-achievements-ui-implementation.md`,
  `specs/implementation/reports/06b-passport-achievements-ui-completion.md`
- **Verdict:** `APPROVE`

## Findings summary

| Severity | Count |
| -------- | ----: |
| Blocker  | 0     |
| Major    | 0     |
| Minor    | 2     |

## Minor findings (non-blocking)

### m1 — Duplicated assertion line in F22

- **Where:** `frontend/tests/integration/PassportPage.test.tsx:474-475` —
  `expect(main?.className).toContain('max-w-4xl');` appears twice in
  immediate succession.
- **Risk:** none to behavior; cosmetic test redundancy.
- **Minimal fix:** delete line 475 in the next convenient pass.

### m2 — Locked-card `<img>` path ignores the `muted` visual treatment

- **Where:** `frontend/src/components/passport/AchievementCard.tsx:44-56` —
  the mapped-icon branch applies `text-base-content/40` when `muted`, but
  the guarded `<img>` branch (`className="size-8 object-contain"`) carries
  no muting (a text color cannot mute an image; an `opacity-40`-style class
  would be the equivalent).
- **Risk:** cosmetic only, and currently unreachable — the merged catalog
  has `iconUrl: null` on every row, so locked cards never render the
  `<img>` path today. State is still conveyed by the text badge, so the
  accessibility contract is unaffected.
- **Minimal fix:** apply an opacity utility to the `<img>` when `muted` in
  a future pass, or record the difference as accepted styling.

## Conclusions on the ten mandated review points

### 1. Types, exact-key validation, API paths, timestamps, error handling — PASS

- `frontend/src/types/achievement.ts:6-23` exactly mirrors §2.12 (six catalog
  keys, seven earned keys; `code`/`category` open strings for forward
  compatibility).
- `frontend/src/lib/validation/achievementDto.ts` enforces exact keys
  (`CATALOG_ITEM_KEYS`/`EARNED_ITEM_KEYS` lines 6-23, `hasExactKeys`
  34-41), UUID format on `id`/`achievementId` (25-26, 51-67), the strict
  UTC pattern on `awardedAt` (27-28, 73-74 — accepts `Z`/`+00:00`, rejects
  other offsets and >7 fractional digits), non-empty `code`/`name`/
  `category`, `iconUrl` null-or-non-empty-string (47-49), empty-array
  validity, and rejection of extra/missing keys (84-89, 99-104).
- Paths are exactly `/v1/achievements` and `/v1/users/me/achievements`
  (`frontend/src/lib/api/achievements.ts:17,33`).
- The earned transport runs `expirePrivateSession` on a 401 against the
  active QueryClient before rethrowing (`achievements.ts:37-42`), the B1
  lifecycle; the anonymous catalog transport deliberately has no session
  coupling.

### 2. Review 44 M1 closure (earned-field authority) — PASS

- Catalog defines slots and order: `AchievementsSection.tsx:103-119` maps
  over `catalog.data` only, in server order, keyed by `catalogItem.id`.
- Matching is by achievement ID: line 105
  `earnedById.get(catalogItem.id)` with the map built from
  `item.achievementId` (line 100).
- Unlocked cards read **all** display fields from the earned item, enforced
  by the type system: `AchievementCardProps` (AchievementCard.tsx:68-76)
  is a discriminated union whose `unlocked: true` variant accepts only
  `EarnedAchievement`; the section passes `earnedItem` (line 113-117).
  `code`, `name`, `description`, `iconUrl`, `category`, `awardedAt` all
  render from that object (lines 85-110).
- Earned rows without an active catalog slot cannot render (only catalog
  items are iterated); proven by test
  `PassportAchievements.test.tsx:150-165`.
- The counter-directional test (`PassportAchievements.test.tsx:117-148`)
  deliberately gives the earned row different `code`/`name`/`description`/
  `iconUrl`/`category` from the catalog row and asserts the earned values
  render, the catalog name is absent, and slot order is preserved — not a
  same-direction test.

### 3. Review 44 m2 closure (AbortSignal propagation) — PASS

- `useAchievementCatalog` forwards the TanStack Query signal
  (`useAchievements.ts:18`); the catalog transport accepts and forwards it
  to `apiFetch` (`achievements.ts:14-19`); the earned transport already
  forwarded its signal (`achievements.ts:33-35`).
- Identity-level proof: `useAchievements.test.tsx:71-87` captures the exact
  `AbortSignal` instance reaching the global `fetch`, asserts it is not
  aborted pre-unmount and becomes aborted after unmount.

### 4. Cache contract — PASS

- Redemption resync: `syncAuthoritativeCompletion` gains the
  `['achievements']` prefix invalidation (`useCompletion.ts:127-129`),
  asserted in `useCompletion.test.tsx:165-167`.
- Principal boundaries: `PRIVATE_SERVER_QUERY_KEYS` is extended to three
  prefixes with the doc comment updated (`privateCache.ts:6-17`);
  `AuthSessionBoundary.test.tsx` extends the ordered cancel-then-remove
  proof to `achievements` (EXPECTED_CLEANUP_ORDER lines 64-72,
  `slice(0, 6)`).
- The approved public-catalog side effect is **not** secretly avoided: the
  401 unit test seeds `['achievements','catalog']` and asserts the entire
  prefix is empty after cleanup (`useAchievements.test.tsx:132,142`); the
  invalidation test asserts the non-exact prefix form (no catalog-sparing
  predicate exists anywhere — grep-verified).

### 5. UI structure, states, accessibility — PASS

- Vertical order Progress → Achievements → Completion history
  (`PassportPage.tsx:110-133`), asserted by F23's exact h2 sequence
  (`PassportPage.test.tsx:483-492`).
- Responsive grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
  (`AchievementsSection.tsx:103`), asserted by F22 (468-480).
- Locked/Unlocked are text badges (AchievementCard.tsx:91-97), dates use
  `<time dateTime>` (108-110), mapped icons are `aria-hidden` +
  `focusable="false"` and images `alt=""` (48-64); section is
  `aria-labelledby` + h2 with `ul`/`li` cards
  (AchievementsSection.tsx:103-131).
- All seven states are section-bounded: skeleton while either query
  pends (74-75), 404 warning without retry (48-54), 503 not-ready info +
  retry (38-47), generic error + retry (55-62), exactly one alert when
  both fail (76-77), catalog-empty neutral note (92-97), earned-empty
  all-locked grid. Region isolation and no-detail-leak are test-proven
  (`PassportAchievements.test.tsx:210-328`, including explicit absence of
  server `detail` strings).

### 6. `iconUrl` safety — PASS

- `guardedIconUrl` (AchievementCard.tsx:20-30) parses with `new URL` and
  allows only `http:`/`https:`; parse failures and dangerous schemes
  return null → mapped/fallback icon; image load failure falls back via
  `onError` state (41, 46-56); `loading="lazy"`,
  `referrerPolicy="no-referrer"`. Tests cover unknown code, a
  `javascript:` URL, and a guarded HTTPS image
  (`PassportAchievements.test.tsx:167-183`). No `dangerouslySetInnerHTML`
  anywhere in the new code (grep-verified).

### 7. Excluded scope — PASS

No progress text or `progressbar` in the section (test-proven,
`PassportAchievements.test.tsx:185-195`), no thresholds as data, streaks,
toasts, animations, other-user achievement views, write endpoints, or
backend behavior. The new production files contain no Zustand/Web-Storage
usage (grep-verified), and F19 now includes `achievement` in the
store/storage exclusion pattern.

### 8. Fifteen-primary-file boundary and forbidden changes — PASS

Observed working tree vs `a974725` (tracked diff + all untracked files):

- Production new (6): `types/achievement.ts`,
  `lib/validation/achievementDto.ts`, `lib/api/achievements.ts`,
  `hooks/useAchievements.ts`, `components/passport/AchievementCard.tsx`,
  `components/passport/AchievementsSection.tsx`.
- Production modified (3): `pages/PassportPage.tsx`,
  `lib/api/privateCache.ts`, `hooks/useCompletion.ts`.
- Tests new (3): `tests/unit/achievementDto.test.ts`,
  `tests/unit/useAchievements.test.tsx`,
  `tests/integration/PassportAchievements.test.tsx`.
- Tests modified (3): `tests/integration/PassportPage.test.tsx`,
  `tests/unit/useCompletion.test.tsx`,
  `tests/integration/AuthSessionBoundary.test.tsx`.
- Documentation: the 6B plan (status line and D1–D8 flipped to the
  human-approved state — an expected post-approval edit), Prompt 52, the
  completion report, `PROJECT_STATUS.md`.
- No backend, schema, migration, seed, dependency, lockfile
  (`package.json`/`package-lock.json` untouched), configuration, or
  accepted API-contract change appears in the diff.

### 9. Tests are counter-directional — PASS

The earned-field-authority test uses deliberately conflicting
catalog/earned display values; the no-slot earned row test uses an
unmatched ID; the catalog-order test arranges earned rows in reverse slot
order; the signal test proves instance identity and abort; the 401 test
seeds all three private prefixes plus the auth entry and asserts complete
removal before rethrow; region-isolation tests assert other regions render
while Achievements degrades. Validators are tested against both valid and
invalid payloads (17 cases in `achievementDto.test.ts`).

### 10. Independent gate execution — PASS (observed by this review)

Run independently from `frontend/` on the reviewed working tree:

- `npm run lint` — 0 warnings, 0 errors (104 files, 103 rules).
- `npm run type-check` — `tsc -b` passed, no output/errors.
- `npm run test -- --run` — **28/28 test files, 261/261 tests passed**
  (5.56 s), including all new and modified files listed above.
- `npm run build` — passed; 1,895 modules transformed; production bundle
  emitted (`dist/`, git-ignored; the gate run left the working tree
  unchanged).

These observed results match the completion report's claims (63/63
targeted subset is contained in the 261/261 full run).

## Evidence consistency

- Prompt 52 records the human approval and the implemented scope
  truthfully; the completion report's file list, boundaries, and gate
  results match the observed diff and this review's independent runs.
- `PROJECT_STATUS.md` accurately records the pending-review,
  uncommitted state; the 6B plan's status line and D-marks reflect the
  recorded human approval of 2026-07-26.
- Review 45 closed Review 44's M1/m1/m2 before implementation; this
  review verifies the closures are actually present in code (points 2-3
  above) plus m1's private-helper boundary (`AchievementsSection.tsx:8-63`
  defines its own helpers; no import from `PassportPage.tsx`; no shared
  file added).

## Scope and working-tree confirmation

- This review created exactly one file: this review record. No production
  code, test, plan, prompt, completion report, `PROJECT_STATUS.md`, or any
  other file was modified.
- No staging, commit, push, merge, pull request, or deployment action was
  performed. `git status --porcelain` after the gate runs shows the same
  8 modified + 11 untracked paths as before the review.

## Verdict

`APPROVE`. Zero Blocker, zero Major findings; two non-blocking cosmetic
Minors (m1 duplicated test assertion, m2 muted-image styling gap on a
currently unreachable path). Slice 6B implements the approved plan within
the 15-primary-file boundary, closes Review 44's M1/m1/m2 in code, and
passes all four frontend gates as independently observed. The Slice is
ready for explicit human approval of staging and commit.
