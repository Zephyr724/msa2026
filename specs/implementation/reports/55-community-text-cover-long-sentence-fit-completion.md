# Community text-cover long-sentence fit completion

## Implemented scope

- Created `fix/community-long-opening-sentence`.
- Preserved the complete first sentence on no-image Community post covers.
- Added runtime font fitting that begins at the responsive preferred font size
  and reduces it only when the rendered sentence exceeds the available height.
- Included padding, in-flow siblings, and flex gaps in the available-height
  calculation, and recalculated fitting after cover resizes.
- Added focused unit coverage for unchanged fitting text and complete
  overflowing text that shrinks to fit.

## Files changed

- `frontend/src/components/social/SocialPostTextCover.tsx`
- `frontend/src/lib/socialTextCover.ts`
- `frontend/tests/unit/socialTextCoverFit.test.ts`
- `specs/ai/prompts/114-community-text-cover-long-sentence-fit.md`
- `specs/implementation/reports/55-community-text-cover-long-sentence-fit-completion.md`

## Verification

- `npm run test -- --run tests/unit/socialTextCoverFit.test.ts tests/integration/CommunityPage.test.tsx`
  - Passed: 2 files, 12 tests.
- `npm run test -- --run`
  - Passed: 61 files, 492 tests.
- `npm run type-check`
  - Passed.
- `npm run lint`
  - Passed with no findings.
- `npm run build`
  - Passed; Vite retained its existing advisory about a JavaScript chunk above
    500 kB.
- `git diff --check`
  - Passed.
- Browser verification at `http://localhost:5173/community`
  - Observed the no-image cover preserving its full sentence.
  - At desktop size, the measured preferred 24 px text shrank to 22.2031 px;
    rendered text height and usable height were both 216 px, with no overflow.
  - At a temporary 390 × 844 viewport, the cover sentence fit at the preferred
    responsive 16 px size. The viewport override was reset afterward.

## Known limitations

- Browser verification used the locally available seeded no-image post. More
  extreme sentence lengths are covered by the fitting algorithm and focused
  unit test rather than by mutating seeded data.

## Review status

- This is a localized presentation bug fix. No independent review was required
  or performed.
