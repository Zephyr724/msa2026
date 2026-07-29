# Slice 19 Complete Colour Audit — Independent K3 Review

## Scope

Read-only focused review of the additive complete Figma colour audit against:

- `docs/UI/Kiwimpact MVP UI Design/src/styles/theme.css`
- `docs/UI/Kiwimpact MVP UI Design/src/app/App.tsx`
- `specs/ai/prompts/75-slice-19-complete-figma-colour-audit.md`
- the current frontend implementation and regression tests

## Result

- Blocker: 0
- Major: 0
- Minor: 1
- Commit readiness: Ready to commit; the Minor is non-blocking and recorded.

## Minor

The exact Make light-theme `muted-content #5A7A65` on
`secondary #EEF5EC` has an approximate contrast ratio of 4.29:1, below the
WCAG AA 4.5:1 threshold for ordinary small text. Observed examples include:

- the Organizer source chip in `frontend/src/lib/questPresentation.ts`;
- two 12 px helper/unavailable states in
  `frontend/src/pages/LeaderboardPage.tsx`.

This is an accessibility limitation inherited from the exact Make palette,
not a broad-replacement error. A future accessibility decision can introduce
a darker small-text token for secondary surfaces, but that would intentionally
depart from exact source colour parity and therefore was not added in this
increment.

## Confirmed observations

- Light and dark core tokens match the Make theme source.
- `.dark` and `data-theme` synchronization is correct and covered in both
  directions.
- Category, difficulty, source, registration, status, XP, podium, and
  placeholder-map palettes match the Make source.
- Review of the broad `text-muted-content` replacements found no clear
  accidental use on primary, accent, error, success, warning, info, or neutral
  surfaces.
- Keeping Google Maps InfoWindow and Share Card canvas content colours
  independent from application theme tokens is appropriate.
- Independent focused theme and semantic-colour rerun passed: 2 files,
  18 tests.
- `git diff --check` passed.
