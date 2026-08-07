# Community masonry and text cover — completion report

- **Status:** Implementation and applicable verification complete
- **Date:** 2026-08-06
- **Database migration:** Not required

## Implemented scope

- Replaced the balanced CSS-column feed with a measured responsive masonry grid
  using 2, 3, 4, and 5 explicit tracks at the accepted breakpoints.
- Preserved complete images from `0.76` through `4:3`, including square and
  near-square covers; bounded extra-tall covers at `19:25` and extra-wide
  covers at `4:3`.
- Added a shared pale `secondary` text-cover component for no-image posts,
  using the first complete body sentence, a fixed `19:25` feed ratio, and a
  faint repeated diagonal Kiwimpact leaf watermark.
- Reused the same text-cover treatment in opened post detail.
- Kept the Development Community seed visible and idempotent, with bundled
  real local landscape, square, and tall photo fixtures plus the no-image
  fixture. The square photo is composed natively at `1:1` rather than being
  pre-cropped by an image CDN.
- Added a narrow Development-only URL resolver for those bundled fixtures;
  ordinary user HTTPS image URLs are unchanged.

## Verification status

- Frontend lint passed.
- Frontend type-check passed.
- Focused Community and cover-ratio tests passed 14/14.
- Full frontend suite passed 410/410 across 52 files.
- Frontend production build passed with the existing chunk-size advisory.
- Backend build passed with no errors and five pre-existing EF1002 warnings.
- Focused PostgreSQL Development seed test passed 1/1 after the local-photo URL
  correction.
- Backend unit tests passed 309/309; PostgreSQL integration tests passed
  342/342.
- Browser observation at `1440×1000` confirmed five stable columns and rendered
  cover sizes of `243×182` (wide), `243×243` (square), and `243×320` (tall and
  text cover). At `390×844`, the feed rendered two columns with no horizontal
  overflow and retained the fixed New post action.
- Browser observation of opened no-image detail confirmed the pale secondary
  background (`rgb(238, 245, 236)`), leaf-only watermark, and removal of the
  legacy topography circles.
- After replacing the CDN-pre-cropped square fixture, browser observation
  confirmed the native square asset at `1254×1254`, rendered at `237×237` with
  `h-auto` and without `object-cover`.

## Known limitations

- The twenty Development mirrors of Production assessment images intentionally
  retain the Production Pexels URLs. Only the dedicated local shape fixtures
  are bundled and network-independent.

## Review status

Implementation-owner diff inspection completed with no unresolved finding.
This bounded presentation and Development-fixture correction does not require
a second independent full review of the already reviewed Community Slice.
