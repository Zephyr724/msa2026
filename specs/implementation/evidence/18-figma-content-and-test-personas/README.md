# Slice 18 Browser Evidence

Captured from the locally running product at `http://localhost:5173` on
2026-07-28 after the Slice 18 implementation and concentrated review
correction. The runnable Figma Make prototype under
`docs/UI/Kiwimpact MVP UI Design/` was inspected page by page.

## Desktop viewport pairs

Every file in this table is 1280 × 720 pixels. The Make reference is unchanged
from the persistent Slice 16 capture; the current side was recaptured after
the Slice 18 correction.

| Page | Make reference | Slice 18 current |
| --- | --- | --- |
| Landing | `../16-figma-page-parity/reference/desktop-landing.jpg` | `current/desktop/desktop-landing.jpg` |
| Discover | `../16-figma-page-parity/reference/desktop-discover.jpg` | `current/desktop/desktop-discover.jpg` |
| Quest Detail | `../16-figma-page-parity/reference/desktop-quest-detail.jpg` | `current/desktop/desktop-quest-detail.jpg` |
| My Quests | `../16-figma-page-parity/reference/desktop-my-quests.jpg` | `current/desktop/desktop-my-quests.jpg` |
| Passport | `../16-figma-page-parity/reference/desktop-passport.jpg` | `current/desktop/desktop-passport.jpg` |

The Make capture contains prototype data. Current captures use the real signed
in Admin persona's empty/zero-progress state; the comparison is for layout,
hierarchy, density, and responsive behavior rather than matching invented
metrics.

## 390 px responsive evidence

All current files below are exactly 390 × 844 pixels:

- `current/mobile-390/landing.jpg`
- `current/mobile-390/discover.jpg`
- `current/mobile-390/quest-detail.jpg`
- `current/mobile-390/my-quests.jpg`
- `current/mobile-390/passport.jpg`

The Landing and Discover captures pair directly with the Make reference files
`../16-figma-page-parity/reference/mobile-390-landing.jpg` and
`../16-figma-page-parity/reference/mobile-390-discover.jpg`, which are also
390 × 844. The remaining Make mobile references have the same 390 px viewport
width but retain full-page height; the current viewport captures verify the
changed first-fold hierarchy without claiming equal document height.

## 320 px narrow evidence

All current files below are exactly 320 × 844 pixels:

- `current/narrow-320/landing.jpg`
- `current/narrow-320/discover.jpg`
- `current/narrow-320/quest-detail.jpg`
- `current/narrow-320/my-quests.jpg`
- `current/narrow-320/passport.jpg`

Landing, Discover, and Quest Detail pair with the existing 320 px Make files
under `../16-figma-page-parity/reference/narrow-320-*.jpg`. My Quests and
Passport have no distinct 320 px Make artifact, so their captures are explicit
overflow and stacking checks.

## Additional runtime states

- `current/desktop-discover-map.jpg`
- `current/desktop-map-info-window.jpg`
- the earlier full-document desktop captures retained directly under
  `current/`

Observed outcomes:

- Landing contains the framed interactive map preview, separate Community
  Goal composition, and green `Build your Impact Passport` band.
- Discover cards expose colored category and state chips, unclipped emblems,
  full-card navigation, precise addresses, and Make-style green controls.
- Map mode retains the result list and the marker InfoWindow includes media,
  address, comfortable padding, and a detail action.
- Quest Detail contains the precise location context and a gallery even when
  no extra API gallery media is available.
- My Quests and Passport follow the Make page hierarchy while retaining their
  real loading, empty, error, privacy, and account behavior.
- No horizontal crop or overflow band was observed at 390 or 320 px. Navigation,
  filters, cards, Passport summary, and Mission Board content stack within the
  captured viewport.

The local API process already running on port `5091` predated the final DTO
build. It served the newly seeded address strings from the shared database but
requires one restart to expose the added administrative-area, country, and
remaining-capacity response fields. Those final fields were separately
observed from the rebuilt API on port `5092` before that temporary validation
process was stopped.
