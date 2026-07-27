# Slice 16 — Figma Page-by-Page Parity Completion Report

## Status

Implementation and verification complete. The initial independent K3 review
reported no Blockers, one evidence-completeness Major, and one file-format
Minor. Both findings were corrected and the targeted closure review confirmed
that no original Blocker or Major remains.

## Implemented scope

- Restored the Make desktop scale and density across the shared shell.
- Rebuilt Landing first-fold composition around the compact two-column Hero,
  map visual, progression loop, and immediately following progress/community
  panels.
- Consolidated Discover search, filters, sort, Cards/Map selection, and
  category controls; restored the three-card desktop rhythm.
- Restored Quest Detail Hero height, main/sidebar proportions, fact density,
  reward hierarchy, and responsive sticky action.
- Reworked repository placeholder media into category scenes so cards, Hero,
  gallery, and thumbnails no longer expose asset filenames.
- Compressed Mission Board so identity, XP, streak, community signals,
  milestone, and next action are visible in the first desktop viewport.
- Removed the duplicate Passport title region and restored the identity-banner
  first hierarchy.
- Restored the centered 900 px Leaderboard composition and segmented
  People/Communities, geography, and period controls.
- Corrected Share Card desktop column proportions and clipping.
- Preserved evidence-review, self-report, organizer-code, privacy, real Maps,
  real SignalR, ranking, account, and export behaviour from the accepted
  implementation.

## Slice 16 files changed

Production:

- `frontend/src/app/AppShell.tsx`
- `frontend/src/index.css`
- `frontend/src/components/PlayerStatusSummary.tsx`
- `frontend/src/components/passport/PassportSummaryCard.tsx`
- `frontend/src/components/quest/QuestCard.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/QuestListPage.tsx`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/src/pages/MyQuestsPage.tsx`
- `frontend/src/pages/PassportPage.tsx`
- `frontend/src/pages/LeaderboardPage.tsx`
- `frontend/src/pages/ShareCardBuilderPage.tsx`

Tests:

- `frontend/tests/integration/AppShell.test.tsx`
- `frontend/tests/integration/QuestListPage.test.tsx`

Evidence and records:

- `specs/implementation/16-figma-page-by-page-parity.md`
- `specs/ai/prompts/67-slice-16-figma-page-by-page-parity.md`
- `specs/implementation/evidence/16-figma-page-parity/`
- `specs/implementation/reports/16-figma-page-by-page-parity-report.md`

This report lists the Slice 16 delta. The branch also contains the uncommitted
Slice 15 implementation stack recorded separately in its completion report.

## Verification

Observed after the final production and test changes:

| Command or check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed: 44 files, 334 tests |
| `npm run build` | Passed; Vite emitted the existing chunk-size advisory |
| `git diff --check` | Passed |
| Browser, 1280 × 720 | Nine paired viewport states plus seven paired full pages; no horizontal overflow |
| Browser, 390 × 844 | Two paired viewport states plus five paired full pages; no horizontal overflow |
| Browser, 320 × 844 | Three paired full pages; no horizontal overflow |
| Google Maps on authorised origin | Real Auckland map rendered |
| Populated Share Card | Verified completion available and preview rendered |
| Populated Leaderboard | New Zealand/all-time row marked `You` |
| Verified reward | Real organiser code redeemed; +50 XP overlay rendered |

The first full test run exposed two obsolete assertions: the removed Landing
copy and a test that treated a repository placeholder SVG as a real photograph.
The tests were corrected to assert the accepted Landing copy, repository scene
rendering, and a separate external-image failure fallback. The final full run
passed.

## Known limitations

- Category scenes are deliberate repository-native fallbacks, not photographic
  replicas of Figma Make's remote demo imagery.
- The production bundle still emits the previously known warning that the main
  JavaScript chunk exceeds 500 kB. This Slice adds no dependency and does not
  broaden scope into code splitting.
- The current verified reward was captured at desktop after a one-time
  server-authoritative redemption. The Make mobile reward reference is also
  stored, but a second current mobile redemption was not fabricated solely to
  duplicate the same authoritative state.

## Review status

The initial independent K3 read-only review found:

- Blocker: 0;
- Major: 1 — incomplete same-viewport/full-page/populated-state evidence;
- Minor: 1 — screenshots had JPEG bytes with `.png` extensions.

The evidence set now contains correctly named JPEG files, desktop viewport and
full-page pairs, two 390 px mobile viewport pairs, five 390 px mobile full-page
pairs, 320 px narrow full-page pairs, a populated Share Card, a current-user
Leaderboard row, and a freshly verified current reward overlay.

The targeted K3 closure check confirmed:

- original Blocker: 0;
- original Major: closed;
- original Minor: closed;
- unresolved original Blocker/Major: 0.

Slice 16 satisfies the documented commit-readiness gates.
