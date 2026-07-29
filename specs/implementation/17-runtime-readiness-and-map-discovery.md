# Slice 17 — Runtime Readiness and Map Discovery

## Status

**Accepted — explicitly requested by the product owner on 2026-07-27.**

## Problem statement

The product owner observed three failures while signed in:

1. Passport displayed `Passport unavailable`.
2. Community Challenges displayed `Community challenges could not be loaded`.
3. Discover Map mode showed neither the Quest result list nor visible Quest
   markers.

Observed repository/runtime evidence separates these into two causes:

- local Vite configuration targets `http://localhost:5000`, but on the current
  macOS host that port belongs to the system Control Center process rather
  than Kiwimpact. A persisted authentication cookie can therefore make the UI
  look signed in while newer API routes answer `404`;
- Map mode renders only `QuestMap`, hiding the result list that remains present
  in the accepted Figma Make design. Marker visibility also depends entirely
  on returned coordinates and lacks a strong list-based fallback.

## Goal

Make the supported local runtime deterministic and restore the accepted
Discover Map composition:

- Passport and Community Challenge requests reach the current Kiwimpact API;
- Map mode shows the map and the complete filtered Quest list together;
- Quests with coordinates show selectable markers;
- Quests without coordinates remain visible in the list and are clearly
  labelled rather than disappearing;
- map failure never removes the Quest results.

## Scope

### Local runtime

- Move the supported local API launch/proxy port from macOS-conflicting `5000`
  to `5091`.
- Keep the browser API base path relative (`/api`) and preserve the
  single-origin cookie/antiforgery model.
- Update the launch profile, Vite default/example, ignored local environment,
  and current README instructions consistently.
- Verify `/health`, Passport, and Community Challenge endpoints against the
  same running backend.

### Passport and Community Challenges

- Do not change their accepted API contracts or authorization.
- Stop treating every generic `404` as proof that a user profile is missing;
  only the server's profile-specific Problem Details response may produce the
  `Passport unavailable` state.
- Preserve truthful loading, not-ready, empty, privacy, and retry states.

### Discover Map mode

- Match the Make vertical layout: full-width map followed by a compact Quest
  result list.
- Hoist selected Quest state so clicking a marker or list row highlights and
  opens the same Quest context.
- Fit the map to coordinate-bearing filtered results.
- Keep all filtered results visible below the map, including unmapped Quests.
- Keep paging and URL filters unchanged.

## Explicit exclusions

- No database schema migration.
- No public API or privacy-contract change.
- No new dependency.
- No synthetic coordinates for organizer or external Quests.
- No deployment or Google Cloud configuration change.

## Acceptance

- Signed-in Passport loads its real summary without the observed false
  `Passport unavailable` state.
- Community Challenges returns either real cards or the accepted empty state,
  not the observed route error.
- Map mode visibly contains both a map region and the complete current Quest
  result list.
- Coordinate-bearing Quests produce selectable markers and marker/list
  selection stays synchronized.
- Unmapped Quests remain discoverable.
- Applicable frontend/backend gates pass.
- Browser evidence covers the three reported failures.
- One independent K3 read-only review closes all original Blocker/Major
  findings before commit.
