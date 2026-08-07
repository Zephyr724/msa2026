# AppShell route scroll restoration — completion report

- **Status:** Implementation and verification complete
- **Date:** 2026-08-06
- **Database migration:** Not required

## Implemented scope

- Added React Router `ScrollRestoration` at the shared AppShell boundary.
- Added a focused integration assertion that navigation to Discover resets the
  window scroll position.
- Added the narrow jsdom `window.scrollTo` implementation needed to observe
  browser-only restoration behavior without test-environment errors.

## Files changed

- `frontend/src/app/AppShell.tsx`
- `frontend/src/test/setup.ts`
- `frontend/tests/integration/AppShell.test.tsx`

## Verification

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — passed: 403/403 tests across 51 files.
- `npm run build` — passed with the existing chunk-size advisory.
- `git diff --check` — passed before staging.

## Known limitations

- Scroll restoration behavior remains owned by React Router; this change does
  not add custom per-page saved positions.

## Review status

Small, isolated frontend correction reviewed by the implementation owner. No
independent review requested for this branch.
