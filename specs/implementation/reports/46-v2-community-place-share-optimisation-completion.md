# Slice 46 — V2 Optimisation Completion Report

## Product-owner whole-Passport correction (2026-08-07)

The original implementation and review misread "Passport Share" as the
existing per-completion Share Card Builder. After explicit clarification,
Codex replaced `/passport/share` with a whole-Passport snapshot and moved the
single-Quest builder to `/passport/share/completion`.

Implemented:

- a first-screen `Share Passport` action on `/passport`;
- a whole-Passport 1080×1080 preview/export containing Level, Rank, total XP,
  verified/self-reported totals, category impact, current trophy, and every
  earned achievement logo;
- privacy opt-in for display name and unconditional exclusion of Home
  Community, precise location, email, user ID, evidence, and claim text;
- artwork readiness/stale-identity gating before download or Web Share;
- retained per-Quest cards at `/passport/share/completion` with all former
  deep links migrated.

Verification observed after correction (from `frontend/`):

- targeted suite: 5 files / 43 tests passed, followed by 1 file / 3 tests and
  4 files / 30 tests after test-compatibility corrections;
- `npm run lint`, `npm run type-check`, and `npm run build` passed; build kept
  the pre-existing chunk-size warning;
- full `npm run test -- --run`: 449/451 passed initially; the two failures were
  stale `Aroha — Passport` heading expectations exposed by the new visible
  header. The heading contract was restored and the affected 4-file/30-test
  closure suite passed;
- browser: Test Member 1 showed one first-screen `Share Passport` entry;
  `/passport/share` showed the locked trophy, both earned achievement logos,
  whole-Passport canvas, enabled export, and the separate single-Quest link.

No backend, schema, dependency, branch, stage, commit, push, or deployment
change was made. Review status: Codex implementation self-check complete;
independent review was waived when the product owner requested direct Codex
implementation due remaining quota.

## Leaderboard control-layout follow-up (2026-08-07)

- Replaced the intrinsic-width flex row with a bounded responsive grid.
- Constrained the community select to its grid column and shortened the
  out-of-boundary option suffix to `(your home)`; the full Auckland coverage
  explanation remains immediately below the controls.
- Browser measurement at 1280 px confirmed the 900 px control row has exactly
  900 px scroll width, with the select and Current/Past group both contained.
- `CommunityChallengesSection` + `LeaderboardPage`: 2 files / 16 tests passed;
  lint and type-check passed.

## Review status

**Independent Codex review and targeted closure complete**
(`specs/ai/reviews/93-v2-community-place-share-codex-review.md`, 2026-08-07):
no Blockers and no unresolved Major findings. The single concentrated Kimi K3
high correction pass closed all four original Majors; Codex independently
reproduced the 12-file/98-test targeted pass, lint, type-check, diff check, and
the corrected Auckland selector boundary in the local browser.

## Correction pass (2026-08-07, closing review 88 findings)

- **Major 1 — Auckland boundary enforced.** `CommunityChallengesSection` now
  derives the Auckland AdministrativeArea via `useCities()`
  (`/v1/regions?type=AdministrativeArea`) and offers only its LocalArea
  descendants (`parentRegionId` match) in the browse selector; the selector
  stays empty until the boundary is known, so Wellington/Christchurch demo
  communities can no longer leak in, and the guest/member default is the
  first *Auckland* local board. **Documented choice**: a signed-in member's
  out-of-boundary home community stays selectable, explicitly labeled
  "Wellington Central (your home community — outside Auckland launch
  coverage)" with an explanatory note, because verified actions genuinely
  attribute to it and hiding it would be untruthful. A failed profile query
  now shows a bounded alert with Retry, never the "no home community" invite
  and never a silent first-region fallback (no challenge request fires until
  the member picks a community). No Region seed data touched.
- **Major 2 — unmistakably text-first location UX.** The `QuestForm`
  Location section now renders "Search and confirm location" (the place
  search + confirmation map) *before* the derived, editable "Location
  description" (which carries a "Filled automatically when you choose a
  place" hint). Raw latitude/longitude moved into a collapsed
  keyboard-operable `<details>` disclosure ("Enter coordinates manually
  (advanced)") whenever the map flow is available; when Maps/Places is
  unconfigured or failed, the manual fields render immediately with a
  truthful note. Validation, the string lat/lng contract, and read-only mode
  are unchanged.
- **Major 3 — distinct per-achievement logos.** `gameArtworkSvg.ts` now maps
  the accepted D5 codes to distinct repository-owned glyphs (path data
  mirroring the installed ISC-licensed Lucide set):
  `verified-completions-1` → Footprints, `verified-completions-3` →
  TrendingUp, `verified-completions-5` → Medal, with Award as the stable
  fallback for unknown codes; locked badges keep the lock glyph. The retired
  shared person silhouette is gone. React (`AchievementBadgeArt`) and canvas
  rasterization consume the same single-source mapping; no remote images.
- **Major 4 — export readiness + badge identity.** Share/Download are
  disabled (with a "Preparing trophy and badge artwork…" status) until the
  achievement-profile query, the earned-achievement query, and the current
  card's artwork have all settled. `CardArtwork` carries `badgeKeys`
  (`code|label`) and the stale-load guard is the new exported
  `isCurrentArtwork()` identity check in `shareCard.ts` — a name-to-code
  re-resolution with an unchanged count now invalidates stale badge images.
  Query failure and SVG decode failure remain exportable via the documented
  truthful fallbacks.

Correction-pass verification (from `frontend/`, observed):

- `npm run test -- --run tests/integration/CommunityChallengesSection.test.tsx tests/integration/CommunityChallengesAdmin.test.tsx tests/integration/LeaderboardPage.test.tsx tests/unit/googleMapsComponents.test.tsx tests/integration/OrganizerQuestCreatePage.test.tsx tests/integration/OrganizerQuestEditPage.test.tsx tests/unit/gameArtworkSvg.test.tsx tests/unit/shareCard.test.ts tests/integration/ShareCardBuilderPage.test.tsx tests/integration/PassportAchievements.test.tsx tests/integration/MyQuestsPage.test.tsx tests/integration/AppShell.test.tsx`
  → **12 files, 98 tests passed** (includes new coverage: non-Auckland
  exclusion + out-of-boundary home community + profile-failure retry state;
  advanced-disclosure structure and search-first ordering; distinct glyph /
  stable fallback / React↔document parity; `isCurrentArtwork` identity
  rejection; export disabled-while-pending and enabled-on-settled/failure).
- `npm run lint` → exit 0. `npm run type-check` → exit 0.
- Per the review's closure rule, no second full gate suite was run; the full
  suite results below are from the original implementation pass, and the
  correction pass re-verified every test file it touched plus all artwork
  consumers.

## Original implementation report (2026-08-07)

## Implemented scope

One frontend-only vertical slice answering the four V2 feedback items
(`需要优化内容V2.pdf`). Contract: `specs/implementation/46-v2-community-place-share-optimisation.md`.
Prompt record: `specs/ai/prompts/102-v2-community-place-share-optimisation.md`.

1. **Community challenges clarity** — `CommunityChallengesSection` now
   explains the monthly LocalArea collective verified-action goal, carries an
   honest "Auckland-first launch" badge, defaults to the signed-in member's
   home community Active challenge ("Your community"), invites members
   without a home community to choose one, and offers a bounded browse
   (community selector over existing active LocalAreas + Current / Past
   results control) using the existing `regionId`/`status` API filters. Cards
   show catalog-resolved reward names or "No bonus reward this month".
   HomePage and MyQuestsPage no longer fall back to another community's or a
   past challenge (`?? challenges[0]` removed; Active-only, home-community
   match required; guests on Home see the first Active challenge labeled
   with its community).
2. **Text-first place search** — new `PlaceSearch` combobox inside
   `CoordinatePicker` (classic Places AutocompleteService + PlacesService,
   NZ-restricted, session tokens, place ID never persisted). Selection
   populates Location description + lat/lng strings and pans/zooms the map
   for confirmation. ARIA combobox keyboard support; manual coordinate entry
   and all existing validation untouched. Graceful degradation when Maps is
   unconfigured, when the APIProvider fails, and when Places is unavailable
   (truthful note, map + manual entry keep working).
3. **Trophy on Passport Share** — Share Card Builder fetches
   `useMyAchievementProfile()` and renders the member's `TrophyArtwork` +
   tier + rarity with loading / error / Locked ("No trophy yet",
   "FIRST TROPHY AWAITS" on the card) states; the trophy is also drawn into
   the exported 1080×1080 canvas.
4. **Share page beautification + achievement badges** — earned achievement
   badge artwork (resolved by joining completion `achievementNames` to
   `useMyAchievements()` by name for codes) appears in the chooser, the
   preview, and the exported card (max 4 with truncated labels).
   `lib/gameArtworkSvg.ts` is the new single source of truth for trophy and
   badge SVG (React components and canvas rasterization share it; the locked
   badge uses a repository-owned vector lock glyph). Rasterization uses
   same-origin `data:image/svg+xml` URLs only — no remote images, no canvas
   taint. `drawShareCard` stays synchronous; the page pre-loads images and a
   null image draws a truthful vector fallback, so export cannot break.
   Verified-only sharing, opt-in name, and all privacy exclusions are
   unchanged.

## Files changed

Production (frontend only; no backend, schema, migration, or dependency
change):

- `frontend/src/components/community/CommunityChallengesSection.tsx` — member-facing rewrite (explanation, Auckland-first badge, home-community default, browse controls, reward labels); admin panel sources its own unfiltered query, behavior unchanged.
- `frontend/src/lib/api/community.ts` — `fetchCommunityChallenges` accepts optional `{ regionId?, status? }` query params.
- `frontend/src/hooks/useCommunity.ts` — `useCommunityChallenges(filters, { enabled })`; base query key kept first so partial invalidation still matches.
- `frontend/src/pages/HomePage.tsx` — Active-only home-community challenge selection; guest fallback labeled by community; truthful reward box; invite state.
- `frontend/src/pages/MyQuestsPage.tsx` — same selection fix; truthful empty/invite copy and reward line.
- `frontend/src/components/maps/PlaceSearch.tsx` — **new**: accessible NZ place-search combobox with failure degradation.
- `frontend/src/components/maps/CoordinatePicker.tsx` — optional `onPlaceSelect`; search + confirmation map lead, with raw coordinates demoted to a collapsed "Enter coordinates manually (advanced)" disclosure when the map works and shown immediately (with a truthful note) when it does not.
- `frontend/src/components/organizer/QuestForm.tsx` — Location section order is now "Search and confirm location" first, then the derived/editable "Location description" (with auto-fill hint); `onPlaceSelect` populates the description.
- `frontend/src/lib/gameArtworkSvg.ts` — **new**: single-source trophy/badge SVG (palettes, inner markup, standalone documents) including the accepted D5 per-code glyph mapping (Footprints / TrendingUp / Medal / Award fallback, lock glyph when locked).
- `frontend/src/lib/svgImageLoader.ts` — **new**: SVG-string → HTMLImageElement via data: URL; resolves null on decode failure.
- `frontend/src/components/game/GameArtwork.tsx` — `TrophyArtwork`/`AchievementBadgeArt` render the shared markup; props/aria unchanged; Lucide `Lock` import removed.
- `frontend/src/lib/shareCard.ts` — `ShareCardOptions` gains `trophy` + `achievementBadges`; trophy showcase, badge row, vector fallbacks, accent divider; title max-width narrows only when artwork present; exported `isCurrentArtwork()` stale-load identity guard.
- `frontend/src/pages/ShareCardBuilderPage.tsx` — achievement-profile/earned-achievements wiring, artwork pre-load with badge-identity stale guard, trophy panel states, chooser badge art, and Share/Download disabled until the profile, earned-achievement resolution, and current artwork have settled.
- `frontend/tsconfig.app.json` — `"types": ["vite/client", "google.maps"]` (`@types/google.maps` was already installed transitively).

Tests:

- `frontend/tests/integration/CommunityChallengesSection.test.tsx` — **new**, 10 tests (default community + query params, region/status switching, past-results separation, reward resolution, invite, empty state, Auckland-first label/anonymous browse, non-Auckland exclusion, labeled out-of-boundary home community, profile-failure bounded retry with no silent fallback).
- `frontend/tests/integration/HomeMemberMomentum.test.tsx` — new test: no cross-community/past fallback on Home.
- `frontend/tests/integration/MyQuestsPage.test.tsx` — new test: invite state for members without a home community; anchor preserved.
- `frontend/tests/integration/LeaderboardPage.test.tsx`, `CommunityChallengesAdmin.test.tsx` — fetch-stub matcher widened for query params; `/v1/regions` stubs extended for the AdministrativeArea (cities) query.
- `frontend/tests/unit/googleMapsComponents.test.tsx` — place-search tests (predictions, keyboard select → onChange/onPlaceSelect/map recenter, unconfigured fallback, Places failure degradation) plus structure tests: advanced coordinate disclosure when the map works, immediate manual entry when it does not.
- `frontend/tests/integration/OrganizerQuestCreatePage.test.tsx` — googleMapsConfig mocked unconfigured (local `.env.local` sets real keys); fallback-path test and search-first label/order structure test.
- `frontend/tests/unit/gameArtworkSvg.test.tsx` — **new**: distinct per-code glyphs, stable Award fallback, locked lock glyph, React↔standalone-document parity.
- `frontend/tests/unit/shareCard.test.ts` — trophy/badge draw assertions, null-image fallbacks, Locked truthfulness, privacy exclusions retained, `isCurrentArtwork` identity guard (including same-count re-resolution rejection).
- `frontend/tests/integration/ShareCardBuilderPage.test.tsx` — achievement-profile/achievements fetch fixtures, loader mocked; trophy states, chooser badges, failure paths, and export readiness (disabled while profile/achievements pending, enabled once settled, enabled on query/decode failure).

## Verification commands and observed results

Targeted (during implementation, from `frontend/`):

- `npm run test -- --run tests/integration/CommunityChallengesSection.test.tsx tests/integration/CommunityChallengesAdmin.test.tsx tests/integration/LeaderboardPage.test.tsx tests/integration/HomeMemberMomentum.test.tsx tests/integration/MyQuestsPage.test.tsx` → 5 files, 24 tests passed.
- `npm run test -- --run tests/unit/googleMapsComponents.test.tsx tests/integration/OrganizerQuestCreatePage.test.tsx tests/integration/OrganizerQuestEditPage.test.tsx` → 3 files, 19 tests passed.
- `npm run test -- --run tests/unit/shareCard.test.ts tests/integration/ShareCardBuilderPage.test.tsx` → 2 files, 15 tests passed.
- `npm run test -- --run tests/integration/AppShell.test.tsx tests/integration/MyQuestsPage.test.tsx tests/integration/PassportAchievements.test.tsx tests/integration/PassportPage.test.tsx` → 4 files, 53 tests passed (artwork-consumer regression check).

Full gates (once each, from `frontend/`, after implementation):

- `npm run lint` → exit 0, no findings.
- `npm run type-check` → exit 0, no errors.
- `npm run test -- --run` → **52 test files, 428 tests, all passed** (11.5s).
- `npm run build` → success (453ms); pre-existing >500kB chunk-size warning only.

Backend gates: not run — no backend production code changed.

Diff review: the full working-tree diff was reviewed by the implementation
owner. `frontend/index.html` shows only the pre-existing unrelated user
modification (title + quote style) and was not touched. No git mutations were
performed.

## Known limitations

- **ADR-0006 conflict (flagged for human)**: ADR-0006 excluded Places
  Autocomplete from MVP scope. The product owner's explicit V2 instruction
  authorizes it; ADR-0006 should be amended to record the scope change.
- **Ops requirement**: the Google Cloud browser key must enable the Places
  API; without it the search degrades to the truthful note plus map/manual
  entry (covered by tests).
- Real Google Maps/Places network behavior, actual map panning, and the
  exported PNG's pixel output (SVG rasterization, medallion composition)
  could not be verified in jsdom; canvas assertions are call-capture based. A
  manual browser check of the share card export and place search is
  recommended. No browser result is claimed.
- Achievement name → code join assumes catalog names are unique; unmatched
  names render a generic badge.
- Home/My Quests challenge selection still reads the unfiltered list
  endpoint; if it is ever paginated, the `find` needs a filtered query.
- The hand-drawn locked-badge glyph is a close visual match to the previous
  Lucide lock, not pixel-identical.

## Blockers

None. All four feedback items were implementable within the authorized
frontend-only scope.

## Follow-up: Passport URL sharing, rarity, and trophy caption

Prompt record: `specs/ai/prompts/105-passport-share-url-rarity-layout-fix.md`.

- `frontend/src/pages/PassportSharePage.tsx` now shares
  `window.location.href` through Web Share, or copies it through the Clipboard
  API when Web Share is unavailable. PNG generation remains a separate
  download action. The UI states that this authenticated route requires
  sign-in and is not a public profile URL.
- Trophy rarity from the achievement profile and per-achievement rarity from
  `/v1/achievement-stats` are shown in the page and supplied to the canvas
  renderer.
- `frontend/src/lib/passportShareCard.ts` renders the locked-trophy caption as
  bounded `FIRST TROPHY` / `AWAITS` lines and includes trophy and achievement
  rarity labels. Each achievement's rarity is placed on its own line below the
  achievement name.
- `frontend/tests/integration/PassportSharePage.test.tsx` and
  `frontend/tests/unit/passportShareCard.test.ts` cover the restored rarity,
  URL-share control, and bounded caption rendering.

Observed verification from `frontend/`:

- `npm run test -- --run tests/unit/passportShareCard.test.ts tests/integration/PassportSharePage.test.tsx` -> 2 files, 6 tests passed.
- `npm run lint` -> exit 0, no findings.
- `npm run type-check` -> exit 0, no errors.
- Local browser verification as Test Member 1 confirmed `Share Passport link`,
  trophy and earned-achievement rarity labels, and a visually contained
  two-line locked-trophy caption in the generated preview.
- `git diff --check` -> exit 0.

## Follow-up correction: restore PNG file sharing

Prompt record: `specs/ai/prompts/106-passport-png-share-restoration.md`.

- The temporary authenticated-page URL share was removed because it was not a
  recipient-viewable public Passport.
- `Share Passport PNG` now creates `kiwimpact-passport.png` and sends that file
  through the Web Share API. The action is disabled until current artwork is
  ready; unsupported browsers direct the member to the separate PNG download.
- Focused integration coverage asserts a file payload and the absence of a
  `url` property.
- `npm run test -- --run tests/integration/PassportSharePage.test.tsx tests/unit/passportShareCard.test.ts` -> 2 files, 6 tests passed.
- `npm run lint` and `npm run type-check` -> both exited 0.
- Local Test Member 1 browser verification confirmed the enabled
  `Share Passport PNG` control and removal of the authenticated-link note.

Final pre-commit frontend gates after all follow-up corrections:

- `npm run test -- --run` -> 55 files, 452 tests passed.
- `npm run build` -> success; the existing chunk-size warning remains.
- `npm run lint` and `npm run type-check` -> both exited 0.
