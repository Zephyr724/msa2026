# Slice 46 — V2 Community, Place, and Share Optimisation Independent Review

## Review status

**Approved after targeted closure.** No Blocker findings and no unresolved
Major findings. The single concentrated Kimi K3 high correction pass closed
all four original Major findings; the Codex closure check below was limited to
those findings and their targeted tests.

Reviewer: Codex (independent of the Kimi K3 high implementation owner)
Review date: 2026-08-07

## Reviewed evidence

- `specs/implementation/46-v2-community-place-share-optimisation.md`
- `specs/ai/prompts/102-v2-community-place-share-optimisation.md`
- `specs/implementation/reports/46-v2-community-place-share-optimisation-completion.md`
- Complete working-tree production and test diff, excluding the pre-existing
  unrelated `frontend/index.html` modification from the implementation scope.

## Findings

### Major 1 — The Auckland-only coverage claim contradicts the selectable and rendered data

`CommunityChallengesSection` labels the feature "Auckland-first launch" and
states that coverage currently spans Auckland local boards, but builds its
selector from every active `LocalArea`. In the observed local browser session,
the selector included `Christchurch Central` and `Wellington Central`; selecting
`Wellington Central` successfully rendered its Active challenge while the
Auckland-only claim remained visible. This reproduces the exact coverage/data
confusion raised by the V2 feedback rather than resolving it.

The correction must define one truthful boundary and enforce it in both data
selection and copy. For this authorized slice, the requested boundary is the
Auckland administrative area's LocalArea descendants, plus a signed-in
member's home community only if product rules intentionally permit an
out-of-bound home selection. Do not expand or rewrite Region seed data.

Also avoid treating a signed-in profile-query failure as "no home community"
or silently defaulting that member to the first browse option; show a bounded
retry/error state instead.

Affected implementation: `frontend/src/components/community/CommunityChallengesSection.tsx:22`.

### Major 2 — The organizer flow is still visually description/coordinate-first

The new Places combobox works technically, but `QuestForm` still renders the
free-text `Location description` first and then a fieldset labelled `Map
coordinates`; the search is nested inside that coordinate-labelled control and
latitude/longitude inputs are always prominent. That does not satisfy the V2
outcome of searching a place first and using the map to confirm it.

Make the configured primary control unmistakably "Search and confirm
location", place it before the derived/editable description, and demote raw
latitude/longitude to an advanced/manual fallback. When Maps/Places is
unavailable, the manual path must remain immediately discoverable and usable.

Affected implementation: `frontend/src/components/organizer/QuestForm.tsx:440`,
`frontend/src/components/maps/CoordinatePicker.tsx:28`.

### Major 3 — Achievement badges are not the per-achievement logos required by the feedback

All unlocked badges currently use the same person-silhouette SVG. Only the
accent changes through substring checks for `"3"` and `"5"`. The accepted
achievement UI decision already defines distinct code mappings:
`verified-completions-1` → Footprints, `verified-completions-3` → TrendingUp,
`verified-completions-5` → Medal, with Award fallback. The share chooser,
preview, and export therefore do not yet show each achievement's distinct
logo/artwork.

Implement distinct repository-owned SVG glyphs keyed by the accepted codes and
reuse the same mapping for React and canvas rasterization. Preserve the safe
local-data-URL export path and stable unknown-code fallback.

Affected implementation: `frontend/src/lib/gameArtworkSvg.ts:50`.

### Major 4 — Export can run before required trophy/badge state is final

The Share and Download buttons remain enabled while the achievement profile is
pending and while artwork is loading. During profile loading the canvas is
drawn without a trophy, so an immediate export can omit the requested trophy.
In addition, `CardArtwork` validates only completion id, trophy tier, and badge
count; if name-to-code resolution changes while the count is unchanged, stale
badge images are temporarily accepted.

Gate Share/Download until the achievement queries and current artwork identity
have settled, and include a stable badge identity/key in the stale-load guard.
Keep the documented truthful fallback when a query or SVG decode actually
fails.

Affected implementation: `frontend/src/pages/ShareCardBuilderPage.tsx:63`,
`frontend/src/pages/ShareCardBuilderPage.tsx:165`, and
`frontend/src/pages/ShareCardBuilderPage.tsx:428`.

## Verification observed by the reviewer

Run from `frontend/` after the implementation evidence existed:

- `npm run lint` — exit 0.
- `npm run type-check` — exit 0.
- `npm run test -- --run` — exit 0; 52 files and 428 tests passed. jsdom printed
  its known `HTMLCanvasElement.getContext()` not-implemented diagnostics.
- `npm run build` — exit 0; Vite build succeeded with the existing chunk-size
  warning.
- Local browser check at `/leaderboard` — community section rendered without a
  page crash; selecting Wellington reproduced Major 1.

The passing automated gates establish compilation and tested behavior but do
not close the four product/interaction findings above.

## Closure rule

Use one concentrated correction pass by the same Kimi K3 high implementation
owner. The closure check is limited to these original Major findings and their
targeted tests; do not perform a second full independent review.

## Targeted closure check

Closure date: 2026-08-07

- **Major 1 — closed.** The selector now derives Auckland from the
  `AdministrativeArea` query and includes only `LocalArea` descendants whose
  `parentRegionId` matches Auckland. A signed-in member's out-of-boundary home
  community is retained only as an explicitly labeled exception. Profile
  failure renders a Retry alert and does not issue a silent default challenge
  request. In the local browser at `/leaderboard`, the refreshed selector
  contained the 21 Auckland local boards (Albert-Eden through
  Ōtara-Papatoetoe) and contained neither Wellington nor Christchurch; the
  Auckland-first copy and rendered Albert-Eden challenge were consistent.
- **Major 2 — closed.** `QuestForm` now leads with "Search and confirm
  location", followed by the auto-filled/editable description. Configured map
  flows place latitude/longitude in the "Enter coordinates manually
  (advanced)" disclosure; unconfigured or failed map flows render the manual
  fields directly with a truthful fallback message.
- **Major 3 — closed.** The shared SVG source maps the accepted codes to
  Footprints, TrendingUp, and Medal, with Award fallback and a separate locked
  glyph. React and standalone/canvas SVG output consume the same mapping.
- **Major 4 — closed.** Export controls wait for both achievement queries and
  artwork matching completion, tier, and ordered `code|label` badge keys.
  Query and decode failures settle to exportable truthful fallbacks rather
  than omitting requested state or accepting stale artwork.

Reviewer-observed closure verification from `frontend/`:

- Targeted Vitest command covering the 12 correction-related files — exit 0;
  **12 files and 98 tests passed**. jsdom printed its known canvas
  `getContext()` diagnostics.
- `npm run lint` — exit 0.
- `npm run type-check` — exit 0.
- `git diff --check` from the repository root — exit 0.
- Local in-app browser refresh at `/leaderboard` — no page crash; community
  coverage and selector boundary matched as described above.

Per the closure rule, no second full suite or second full review was run.
