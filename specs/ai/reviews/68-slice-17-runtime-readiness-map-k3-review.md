# Slice 17 — Independent K3 Review

## Review scope

Independent read-only review of the Slice 17 delta described by:

- `specs/implementation/17-runtime-readiness-and-map-discovery.md`
- `specs/ai/prompts/68-slice-17-runtime-readiness-and-map-discovery.md`
- `specs/implementation/reports/17-runtime-readiness-and-map-discovery-report.md`
- `specs/implementation/evidence/17-runtime-readiness-map/README.md`

The reviewer was asked to inspect only Slice 17 on top of the existing
uncommitted Slice 14–16 stack.

## Initial review

Observed result:

- Blocker: 0
- Major: 1
- Minor: 1

### Major — shared Quest Map regression

The initial controlled-state conversion removed internal marker selection from
`QuestMap`. Discover passed both controlled props, but Quest Detail retained
the existing `<QuestMap quests={[quest]} />` call. Its marker remained visible
but could no longer select the Quest or open the `View Quest` InfoWindow.

The existing map test covered only a controlled harness and therefore did not
detect the regression.

### Minor — stale runtime comment

`backend/src/Kiwimpact.Api/Program.cs` still named port `5000` in the
development Vite-proxy comment after the supported runtime moved to `5091`.

### Checks accepted without findings

- Runtime configuration was consistent across README, launch profile, Vite
  fallback, and environment example.
- Relative `/api`, cookie authentication, antiforgery, and same-origin proxy
  behavior were preserved.
- `profile-not-found` was fixed and bounded, and frontend classification
  required both HTTP `404` and the exact Problem Details type.
- Discover retained all current-page items and produced markers only for paired
  authoritative coordinates.
- Browser evidence truthfully covered the restored Passport, Community
  Challenge, and Discover Map states.

## Concentrated correction

- `QuestMap` now distinguishes controlled from uncontrolled usage using
  whether `selectedQuestId` is supplied.
- Discover retains its controlled marker/list synchronization.
- Quest Detail retains backward-compatible internal marker selection and can
  open the InfoWindow.
- A direct uncontrolled regression test was added alongside the controlled
  harness.
- The backend development-proxy comment was made port-neutral.

Observed targeted verification:

- `npm run lint`: passed.
- `npm run type-check`: passed.
- focused Google Maps, Discover, and Quest Detail tests: 3 files, 11 tests
  passed.
- `git diff --check`: passed.
- real-browser Quest Detail marker click: marker present; matching dialog and
  `View Quest` link opened.

## Targeted closure check

The same independent reviewer checked only the original findings and reported:

- original Blocker: 0;
- original Major: closed;
- original Minor: closed;
- unresolved original Blocker/Major: 0.

Slice 17 satisfies the bounded independent-review gate.
