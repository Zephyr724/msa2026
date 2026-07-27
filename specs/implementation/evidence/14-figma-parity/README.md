# Slice 14 Figma Parity Evidence

## Runtime references

- Figma Make export: `http://127.0.0.1:4174/`
- Current audit frontend: `http://127.0.0.1:5174/`
- Current audit API: `http://127.0.0.1:5001/`
- Existing Maps-authorized frontend checked separately at
  `http://127.0.0.1:5173/`

All services were local. No production deployment was inspected.

## Captures

### Prototype

- `prototype/landing-desktop.png`
- `prototype/discover-desktop.png`
- `prototype/quest-detail-desktop.png`
- `prototype/my-quests-desktop.png`
- `prototype/passport-desktop.png`
- `prototype/leaderboard-desktop.png`
- `prototype/share-card-desktop.png`
- `prototype/completion-overlay-desktop.png`
- `prototype/*-full.png` for full-page versions of the seven primary pages

### Current product

- `product/landing-desktop.png`
- `product/discover-desktop.png`
- `product/quest-detail-desktop.png`
- `product/leaderboard-desktop.png`
- `product/*-full.png` for the public pages plus Login and Register
- `product/my-quests-unauthenticated-desktop.png`
- `product/passport-unauthenticated-desktop.png`
- `product/share-card-unauthenticated-desktop.png`
- `product/discover-map-authorized-origin.png`

The three unauthenticated Member captures document the real route boundary,
not the Member page design.

## Evidence limitations

- The browser surface rendered at 1280 × 720 and exposed no supported viewport
  emulation. Mobile behaviour was therefore audited from accepted responsive
  requirements, production source, and tests; this Slice does not claim a live
  390 px visual comparison.
- The browser had no existing confirmed Member session for the audit frontend.
  Creating a user or synthetic progression data was outside this read-only
  audit. Current Member layouts were assessed from production source, existing
  test coverage, prior completion reports, and the anonymous route boundary.
- The map error visible in `product/discover-desktop.png` is caused by using
  audit port 5174 with a browser key restricted to the approved local origin.
  `product/discover-map-authorized-origin.png` confirms the real Google map
  loaded at the authorized 5173 origin. The port-specific error is not treated
  as a product defect in the parity report.
- Full-page screenshots include the Make export's demo toolbar. That toolbar
  is a prototype control and is explicitly excluded from production parity.

