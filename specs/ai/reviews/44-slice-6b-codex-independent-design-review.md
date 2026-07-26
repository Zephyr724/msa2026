# Review 44 — Slice 6B Codex Independent Design Review

- **Date:** 2026-07-26
- **Reviewer:** Codex (independent of the Kimi K3 planning session)
- **Scope:** `specs/implementation/06b-passport-achievements-ui.md`
- **Baseline:** `a974725` on `feat/slice-6b-passport-achievements-ui`
- **Verdict:** `CHANGES REQUIRED`

## Findings summary

| Severity | Count |
| --- | ---: |
| Blocker | 0 |
| Major | 1 |
| Minor | 2 |

## Major

### M1 — Unlocked cards discard the server-composed earned display fields

The plan §9 matches catalog rows to earned rows by ID, but says the earned
row contributes only `awardedAt`; `name`, `description`, `iconUrl`,
`category`, and `code` are rendered from the separately fetched catalog row.

That contradicts the accepted 6A D5/§17 contract. The earned endpoint
deliberately returns current display fields so 6B does not reconstruct earned
display data through a second catalog call. The rejected alternative in 6A
explicitly cites two-call composition, cross-call mismatch windows, and
unnecessary 6B complexity.

Required correction:

- catalog rows define stable card slots/order and provide display data only
  for locked cards;
- when a catalog row has a matching earned row, the unlocked card must use
  the complete earned row for `code`, `name`, `description`, `iconUrl`,
  `category`, and `awardedAt`;
- matching may still use `achievementId === catalog.id`;
- add a counterexample test where catalog and earned display fields differ
  and prove the unlocked card renders the earned endpoint's fields;
- document the expected behavior if an earned row has no active catalog slot:
  it is not rendered, matching the active catalog surface and backend
  inactive-earned exclusion.

This correction does not change D1's recommendation to show the full active
catalog and does not require a backend change.

## Minors

### m1 — The plan cannot literally reuse PassportPage's local error helpers

`RegionSkeleton`, `RegionError`, `isNotReady`, and `isMissingProfile` are
file-local functions in `PassportPage.tsx`. `AchievementsSection.tsx` cannot
import them from a page that itself imports `AchievementsSection` without a
dependency cycle, yet §§10/16 say the new component reuses them verbatim and
the file map contains no shared-state component.

Clarify one bounded implementation:

- recommended: keep equivalent private helpers/state branches inside
  `AchievementsSection.tsx`, using the same fixed copy and semantics; or
- extract shared Passport region-state components and update the file map and
  count.

Do not leave the implementation owner to discover this structural choice
mid-task.

### m2 — The public catalog transport omits query cancellation

§8.3 defines `fetchAchievementCatalog()` without an `AbortSignal`, while the
hook is a TanStack Query and the plan extends prefix cancellation/removal to
all `['achievements']` queries. The earned transport forwards its signal, but
the catalog transport does not.

Define a signal-aware catalog transport and hook:

```text
fetchAchievementCatalog({ signal? })
queryFn: ({ signal }) => fetchAchievementCatalog({ signal })
```

Add a focused assertion that the signal reaches `apiFetch`. This keeps
unmount, invalidation, and prefix cleanup behavior coherent even though the
catalog itself is public.

## Verified strengths

- D1–D8 are explicit, recommended, and genuinely human-approved boundaries.
- The plan correctly excludes progress, thresholds as data, animations,
  toasts, other users, backend changes, dependencies, and Zustand server
  state.
- Query keys, 401 cleanup, redemption invalidation, bounded 404/503 states,
  strict exact-key validation, privacy-safe fixed error copy, responsive
  classes, accessibility semantics, and the four frontend gates are
  specified in testable terms.
- The proposed production/test file count is bounded and matches the existing
  Passport architecture, subject to m1's clarification.
- Baseline `a974725` is the merged PR #15 state and contains the reviewed
  6A-2 contract plus its CI correction.

## Closure requirements

Use one concentrated planning correction limited to M1, m1, and m2. Keep the
plan's first-line status unchanged and keep every D1–D8 item marked
`REQUIRES HUMAN APPROVAL`.

After correction, a Codex targeted design closure check is limited to these
three original findings. No second full review is authorized.

No production code, tests, accepted specification, dependency,
configuration, staging, commit, push, merge, pull request, or deployment
action was performed. This review added only this review record.
