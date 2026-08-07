# Slice 46 — V2 Optimisation: Community Challenges Clarity, Place Search, Passport Share Artwork

## Status

**Implemented — explicitly requested by the product owner on 2026-08-07** via
the V2 feedback document (`需要优化内容V2.pdf`, four items) and the controlling
task instruction naming Kimi as sole implementation owner, with Codex as the
independent reviewer after evidence exists.

## Source feedback

The product owner's V2 feedback (translated):

1. What are the "Community challenges" under "Act together"? What do they mean?
   The display is confusing and apparently does not cover all of New Zealand.
   Fix the display logic rather than expanding the database.
2. Location must be addable by text search — entering coordinates is not
   acceptable as the primary path. A place search with a map for visual
   confirmation is the expected basic behavior.
3. The Passport Share page must show the trophy icon; it looks bare now.
4. The Passport Share page needs substantial beautification; sharing is
   pointless without showing each achievement's logo/artwork.

## Product contract

### 1. Community challenges clarity (frontend only, no Region expansion)

- Explain the monthly LocalArea collective verified-action goal in plain copy
  on the "Act together / Community challenges" section: one shared target per
  local-board community per calendar month, automatic contribution through
  verified quest completions attributed to the member's chosen home
  community, and the listed reward achievement for contributors on success.
- Label coverage honestly as an Auckland-first launch. Do not claim
  nationwide coverage and do not expand the Region data.
- Default the view to the signed-in member's current home community and its
  Active challenge ("Your community"). Members without a home community get a
  truthful invite linking to `/settings/profile`.
- Provide a bounded browse: a community selector over the existing active
  LocalAreas plus a Current / Past results control, using the already-existing
  `regionId`/`status` filters on `GET /v1/community-challenges`. Never mix
  different communities into one unlabeled grid; never present past
  (Completed/Failed/Cancelled) challenges as current.
- Show truthful reward information resolved from the existing public
  achievement catalog (`Reward: {name} achievement`, or "No bonus reward this
  month"; hide the line if the catalog cannot resolve the id).
- Home and My Quests feature only the member's own home community's Active
  challenge; the previous `?? challenges[0]` fallback that surfaced unrelated
  or past challenges is removed. Guests on Home see the first Active
  challenge labeled with its community name.

### 2. Text-first place search for quest location

- Replace coordinate-first entry with a "Search for a place" combobox above
  the map in `CoordinatePicker`, using the existing
  `@vis.gl/react-google-maps` dependency and `googleMapsConfig`; the Places
  library loads via `useMapsLibrary('places')` (classic
  `AutocompleteService` + `PlacesService.getDetails` with a session token,
  `componentRestrictions: { country: 'nz' }`).
- Selecting a place populates the existing Location description and the
  latitude/longitude string fields, moves the marker, and centers/zooms the
  map for visual confirmation. The Google place ID is used in-flight only and
  is never stored or submitted.
- The combobox is keyboard accessible (ARIA combobox/listbox, arrows, Enter,
  Escape). Manual coordinate entry and all existing validation are retained
  unchanged.
- Graceful failure: unconfigured Maps keeps today's fallback; Places library
  load failure or request rejection degrades the search to a truthful note
  while map click and manual entry keep working.
- No new dependency, no database column, no migration.

### 3 + 4. Whole Passport Share trophy and achievement artwork

Product-owner clarification on 2026-08-07 overrides the original mistaken
interpretation: "Passport Share" means a privacy-safe snapshot of the member's
whole Passport, not the existing per-completion achievement card.

- `/passport/share` is the whole-Passport share page and has a visible
  first-screen entry from `/passport`.
- The 1080×1080 preview/export contains authoritative Level, Rank, total XP,
  completion totals, category impact, the current trophy, and every earned
  achievement logo from `GET /v1/users/me/achievements`.
- The existing per-completion card remains separate at
  `/passport/share/completion`; Quest-specific links target that route.
- Both share modes use repository-owned artwork, one canvas render model, and
  block export while the current artwork is unresolved.
- Reuse the repository-owned `TrophyArtwork` / `AchievementBadgeArt` artwork
  through a new single-source module (`lib/gameArtworkSvg.ts`) that generates
  both the React inner markup and the standalone SVG documents rasterized for
  canvas. No remote images are ever drawn into the canvas (CORS taint risk);
  rasterization uses same-origin `data:image/svg+xml` URLs.
- Keep preview and download on one render model (one canvas, synchronous
  `drawShareCard`; the page pre-loads artwork images and passes them in;
  failed decodes draw truthful vector fallbacks).
- Preserve verified-only completion sharing, the opt-in display name, and
  every existing privacy exclusion (no home community, precise location,
  email, user ID, evidence, or claim text on the card).

## Scope boundaries

- No backend, schema, migration, dependency, authentication, or security
  change. No Region expansion. No new public profile.
- **ADR-0006 note**: ADR-0006 excluded Places Autocomplete from the MVP and
  lists "accepted scope adds autocomplete" as a review trigger. The product
  owner's explicit V2 instruction (source-of-truth priority 1) authorizes
  text-first place search; ADR-0006 should be amended by the human to record
  this scope change. Operational requirement: the Google Cloud browser key
  must have the Places API enabled; without it the search degrades gracefully
  to map click and manual entry.
- `frontend/tsconfig.app.json` adds `"google.maps"` to `types` only; the
  `@types/google.maps` package was already installed transitively via
  `@vis.gl/react-google-maps`. No dependency was added.

## Verification contract

- Targeted tests for: community selection/filtering/reward labeling and the
  Home/My Quests no-mixing fix; place selection, map synchronization, and
  fallback layers; trophy/badge rendering on page and canvas, privacy
  exclusions, and export behavior.
- Full frontend gates run once after implementation: `npm run lint`,
  `npm run type-check`, `npm run test -- --run`, `npm run build`.
- Backend gates not applicable (no backend production change).
