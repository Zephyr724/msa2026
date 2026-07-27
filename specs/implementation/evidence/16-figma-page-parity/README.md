# Slice 16 Visual Evidence

## Reference source

The accepted reference is the connected Figma Make file
`2pACGo2MnSp1BOFglrkFJ0`, node `0:1`. The prototype was also run locally from
`docs/UI/Kiwimpact MVP UI Design/` so its viewport and full-page captures could
be recorded at the same CSS dimensions as the product.

All images in this directory are JPEG files with a `.jpg` extension.

## Desktop viewport pairs

All viewport files below were captured at 1280 × 720 CSS pixels.

| State | Make reference | Current product | Observed current state |
| --- | --- | --- | --- |
| Landing | `reference/desktop-landing.jpg` | `current/desktop-landing.jpg` | Guest first fold |
| Discover cards | `reference/desktop-discover.jpg` | `current/desktop-discover-cards.jpg` | Compact controls and three-card rhythm |
| Quest Detail | `reference/desktop-quest-detail.jpg` | `current/desktop-quest-detail.jpg` | Hero, facts, reward summary, sidebar |
| Mission Board | `reference/desktop-my-quests.jpg` | `current/desktop-my-quests.jpg` | Populated signed-in state |
| Passport | `reference/desktop-passport.jpg` | `current/desktop-passport.jpg` | Populated signed-in state |
| Leaderboard | `reference/desktop-leaderboard.jpg` | `current/desktop-leaderboard.jpg` | New Zealand/all-time row marked `You` |
| Share Card | `reference/desktop-share-card.jpg` | `current/desktop-share-card-populated.jpg` | Populated verified-completion builder |
| Completion chooser | `reference/desktop-completion-chooser.jpg` | `current/desktop-completion-chooser.jpg` | Code/evidence/self-report choices |
| Verified reward | `reference/desktop-completion-reward.jpg` | `current/desktop-completion-reward.jpg` | Real completion-code result with +50 XP |

The real Google map is separately recorded in
`current/desktop-discover-map-real.jpg` on the API-key-authorised `5173`
development origin. The Make map is illustrative rather than a Google Maps
runtime.

## Desktop full-page pairs

All files below retain the same 1280 CSS-pixel width. Their heights reflect the
actual document height and are not compared against viewport-only images.

| Page | Make reference | Current product |
| --- | --- | --- |
| Landing | `reference/desktop-landing-full.jpg` | `current/desktop-landing-full.jpg` |
| Discover | `reference/desktop-discover-full.jpg` | `current/desktop-discover-full.jpg` |
| Quest Detail | `reference/desktop-quest-detail-full.jpg` | `current/desktop-quest-detail-full.jpg` |
| Mission Board | `reference/desktop-my-quests-full.jpg` | `current/desktop-my-quests-full.jpg` |
| Passport | `reference/desktop-passport-full.jpg` | `current/desktop-passport-full.jpg` |
| Leaderboard | `reference/desktop-leaderboard-full.jpg` | `current/desktop-leaderboard-full.jpg` |
| Share Card | `reference/desktop-share-card-full.jpg` | `current/desktop-share-card-full.jpg` |

## Mobile 390 px viewport pairs

The Make Landing and Discover artifacts are 390 × 844 viewport captures. They
are paired only with current 390 × 844 viewport captures:

| Page | Make reference | Current product |
| --- | --- | --- |
| Landing | `reference/mobile-390-landing.jpg` | `current/mobile-390-landing-viewport.jpg` |
| Discover | `reference/mobile-390-discover.jpg` | `current/mobile-390-discover-viewport.jpg` |

## Mobile 390 px full-page pairs

Each pair below was captured from a 390 × 844 viewport with full-page output.

| Page | Make reference | Current product |
| --- | --- | --- |
| Quest Detail | `reference/mobile-390-quest-detail.jpg` | `current/mobile-390-quest-detail.jpg` |
| Mission Board | `reference/mobile-390-my-quests.jpg` | `current/mobile-390-my-quests.jpg` |
| Passport | `reference/mobile-390-passport.jpg` | `current/mobile-390-passport.jpg` |
| Leaderboard | `reference/mobile-390-leaderboard.jpg` | `current/mobile-390-leaderboard.jpg` |
| Share Card | `reference/mobile-390-share-card.jpg` | `current/mobile-390-share-card.jpg` |

`reference/mobile-390-completion-reward.jpg` records the Make reward state at
390 × 844. The current verified reward is retained as the same-size desktop
pair above because the current reward state was produced through a one-time
server-authoritative redemption.

## Narrow 320 px full-page pairs

Each pair below was captured with a 320 × 844 viewport. These are the explicit
narrow overflow checks required by the Slice contract.

| Page | Make reference | Current product |
| --- | --- | --- |
| Landing | `reference/narrow-320-landing.jpg` | `current/narrow-320-landing.jpg` |
| Discover | `reference/narrow-320-discover.jpg` | `current/narrow-320-discover.jpg` |
| Quest Detail | `reference/narrow-320-quest-detail.jpg` | `current/narrow-320-quest-detail.jpg` |

The current 320 px captures are exactly 320 pixels wide; no horizontal crop or
overflow band was observed.

## Observed current dimensions

| Page/state | CSS viewport | Captured dimensions |
| --- | ---: | ---: |
| Landing full page | 1280 × 720 | 1280 × 3340 |
| Discover full page | 1280 × 720 | 1280 × 2287 |
| Quest Detail full page | 1280 × 720 | 1280 × 2585 |
| Mission Board full page | 1280 × 720 | 1280 × 1643 |
| Passport full page | 1280 × 720 | 1280 × 2482 |
| Leaderboard full page | 1280 × 720 | 1280 × 1114 |
| Share Card full page | 1280 × 720 | 1280 × 1079 |
| Landing mobile full page | 390 × 844 | 390 × 5914 |
| Discover mobile full page | 390 × 844 | 390 × 6096 |
| Quest Detail mobile full page | 390 × 844 | 390 × 3700 |
| Mission Board mobile full page | 390 × 844 | 390 × 2777 |
| Passport mobile full page | 390 × 844 | 390 × 4333 |
| Leaderboard mobile full page | 390 × 844 | 390 × 1411 |
| Share Card mobile full page | 390 × 844 | 390 × 1710 |
| Landing narrow full page | 320 × 844 | 320 × 6285 |
| Discover narrow full page | 320 × 844 | 320 × 6210 |
| Quest Detail narrow full page | 320 × 844 | 320 × 3947 |

## Evidence notes

- The populated product evidence uses local development fixtures and real
  application flows. The current reward capture was produced by joining a
  locally published organiser Quest and redeeming its one-time completion
  code; the overlay reports verified `+50 XP` and Passport persistence.
- The leaderboard evidence uses the authenticated member's New Zealand,
  all-time view so the server-authoritative row and `You` marker are visible.
  Empty Auckland and privacy-protected states remain valid product states but
  are not substitutes for the populated comparison.
- Repository-owned demo SVGs that visibly printed filenames are rendered as
  category scenes in cards, Hero, gallery, and thumbnails. API image
  attribution remains visible below gallery media.
- The built-in image generation request for an Auckland planting photograph
  failed because its image service was unreachable. No unlicensed or remote
  prototype asset was copied; repository-native category scenes provide the
  accepted fallback geometry.
