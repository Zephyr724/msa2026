# Review 53 — Slice 8 Codex Post-Merge Storage Review

- **Date:** 2026-07-26
- **Reviewer:** Fresh Codex session (independent of the original Slice 8
  implementation)
- **Reviewed baseline:** `a3e7309` (PR #19 merge of Slice 8)
- **Mode:** Read-only review
- **Record timing:** This record truthfully reconstructs the finding issued by
  the reviewer before the Slice 8A correction was implemented. It is being
  persisted after correction commit `e16b31c` because the original review was
  reported in-session but was not written under `specs/ai/reviews/` at that
  time.

## Scope

The review inspected the merged Slice 8 contract, production implementation,
tests, completion evidence, and applicable frontend verification gates. It did
not modify production code or evidence.

## Verdict at review time

**TARGETED FIX REQUIRED — 0 Blockers, 1 Major, 1 Minor.**

## Major 1 — `window.localStorage` acquisition escaped the guarded helpers

### Evidence

`frontend/src/stores/useUiStore.ts` evaluated `window.localStorage` while
constructing the argument to `readStoredThemePreference` during module
initialization and again before `writeStoredThemePreference` during theme
selection. The helpers caught exceptions thrown by `getItem` or `setItem`, but
argument evaluation occurred before their `try/catch`.

A browser can throw `SecurityError` while evaluating the `localStorage`
property itself. A jsdom opaque-origin probe reproduced this behavior:

```text
SecurityError: localStorage is not available for opaque origins
```

### Impact

The exception could escape during Zustand store initialization and prevent the
SPA from loading, or escape during a preference write. This contradicted the
accepted Slice 8 contract that inaccessible storage falls back to `system`
without throwing.

### Required correction

- Acquire browser storage lazily inside the guarded helper boundary.
- Keep the Zustand store from evaluating `window.localStorage` directly.
- Add a regression test in which the `window.localStorage` property getter
  itself throws `SecurityError`.
- Preserve all other Slice 8 persistence, resolution, listener, and UI
  contracts.

## Minor 1 — `PROJECT_STATUS.md` predated the PR #19 merge

The status document still identified PR #18 as the current `main` baseline and
listed Slice 8 as local work awaiting Git approval, while repository truth was
PR #19 merged at `a3e7309`.

Required correction: record PR #19 and Slice 8 as merged, then list the storage
correction as current work.

## Independently observed verification at review time

From `frontend/`:

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — 308/308 tests passed across 34 files.
- `npm run build` — succeeded with 1,906 modules transformed.
- `git diff --check 81cfe94..22a55af` — passed.

These passing gates did not cover the Major because the existing unavailable
storage test supplied objects whose `getItem`/`setItem` methods threw; it did
not make the `window.localStorage` property getter throw.

## Review handoff

The correction required one bounded implementation pass followed by an
independent targeted closure check limited to the original Major. No second
full implementation review was requested.
