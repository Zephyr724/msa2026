# Slice 17 — Runtime Readiness and Map Discovery Completion Report

## Status

Implementation and verification are complete. The initial independent K3
review reported no Blockers, one shared-map regression Major, and one stale
comment Minor. Both findings were corrected, and the targeted closure check
confirmed that no original Blocker or Major remains.

## Root cause

The three reported symptoms were not three unrelated feature gaps.

1. The accepted local launch profile and Vite proxy used port `5000`, but the
   observed macOS host had that port bound by Control Center/AirPlay. Stale
   frontend/backend processes and a persisted authentication cookie made the
   shell appear signed in while newer Passport and Community Challenge routes
   returned generic `404` responses from the wrong runtime.
2. Passport interpreted every `404` as a missing user profile, so a route-level
   runtime error was presented as the false terminal state
   `Passport unavailable`.
3. Discover Map mode replaced the card result area with the map. Only Quests
   with coordinates could appear as markers, leaving no result fallback and
   making unmapped Quests disappear from that view.

## Implemented scope

- Moved the supported local API launch profile and Vite proxy default from
  port `5000` to `5091`, while preserving the relative `/api` browser base,
  HttpOnly cookie authentication, antiforgery handling, and same-origin
  development proxy model.
- Updated the current README and frontend environment example so a fresh local
  run uses the same non-conflicting backend.
- Added a bounded `profile-not-found` Problem Details type for the existing
  authenticated missing-profile `404` responses.
- Updated Passport and Achievements error classification so only that exact
  server response produces `Passport unavailable`; unrelated `404` responses
  remain retriable section errors.
- Rebuilt Discover Map mode as the accepted vertical map-plus-results
  composition.
- Added controlled marker/list selection, selected-marker emphasis, InfoWindow
  state, map fitting, and selected-Quest panning, while preserving the
  uncontrolled Quest Detail marker interaction.
- Kept every current-page filtered Quest in a compact list below the map,
  including truthful `Not mapped` labels and `Details` links for Quests without
  authoritative coordinates.
- Added frontend and backend regression coverage for the bounded Passport error
  contract and map/list fallback and selection behavior.

## Slice 17 files changed

Production and runtime:

- `README.md`
- `backend/src/Kiwimpact.Api/Controllers/PassportController.cs`
- `backend/src/Kiwimpact.Api/Controllers/ProgressionController.cs`
- `backend/src/Kiwimpact.Api/Controllers/UserAchievementsController.cs`
- `backend/src/Kiwimpact.Api/Helpers/ProblemDetailsHelper.cs`
- `backend/src/Kiwimpact.Api/Properties/launchSettings.json`
- `backend/src/Kiwimpact.Api/Program.cs`
- `frontend/.env.example`
- `frontend/vite.config.ts`
- `frontend/src/components/maps/QuestMap.tsx`
- `frontend/src/components/passport/AchievementsSection.tsx`
- `frontend/src/pages/PassportPage.tsx`
- `frontend/src/pages/QuestListPage.tsx`
- `specs/architecture/03-api-contract.md`

Tests:

- `backend/tests/Kiwimpact.IntegrationTests/Api/AchievementsApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/PassportApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/ProgressionApiTests.cs`
- `frontend/tests/integration/PassportAchievements.test.tsx`
- `frontend/tests/integration/PassportPage.test.tsx`
- `frontend/tests/integration/QuestListPage.test.tsx`
- `frontend/tests/unit/googleMapsComponents.test.tsx`

Evidence and records:

- `specs/implementation/17-runtime-readiness-and-map-discovery.md`
- `specs/ai/prompts/68-slice-17-runtime-readiness-and-map-discovery.md`
- `specs/ai/reviews/68-slice-17-runtime-readiness-map-k3-review.md`
- `specs/implementation/evidence/17-runtime-readiness-map/`
- `specs/implementation/reports/17-runtime-readiness-and-map-discovery-report.md`

The ignored `frontend/.env.local` was corrected locally to target `5091`
without exposing or changing the restricted Google Maps key. It is not a
versioned Slice file.

This report lists only the Slice 17 delta. The branch also contains the
uncommitted Slice 14–16 implementation stack, recorded separately in their
completion reports.

## Verification

Observed after the final production and test changes:

| Command or check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed: 44 files, 336 tests |
| `npm run build` | Passed; Vite emitted the existing chunk-size advisory |
| `dotnet build Kiwimpact.slnx` | Passed: 0 warnings, 0 errors |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 250 tests |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Passed: 302 tests |
| `git diff --check` | Passed |
| Browser, signed-in Passport | Loaded real Level 3 member summary, achievements, settings, and history; false unavailable state absent |
| Browser, Community Challenges | Loaded the accepted no-published-challenge empty state; route error absent |
| Browser, Discover Map | Real map, 10 coordinate-bearing markers, all 12 current-page results, 2 truthful unmapped labels |
| Browser, map/list selection | Selecting Māngere in the list opened its matching map InfoWindow and `View Quest` link |
| Browser, Quest Detail marker | Existing uncontrolled marker call opened its matching InfoWindow and `View Quest` link |
| Post-review `npm run lint` | Passed |
| Post-review `npm run type-check` | Passed |
| Post-review focused map/Discover/Quest Detail tests | Passed: 3 files, 11 tests |
| Post-review `git diff --check` | Passed |

## Known limitations

- Only Quests with authoritative latitude and longitude receive map markers.
  This Slice deliberately does not invent coordinates for the two current-page
  Quests that lack them.
- The production bundle still emits the previously known warning that the main
  JavaScript chunk exceeds 500 kB. No dependency was added and code splitting
  is outside this Slice.
- Existing local Vite/backend processes must be restarted once after pulling
  the port correction; an already-running stale process cannot adopt changed
  launch or environment configuration.
- React development lifecycle restarts can log a transient SignalR negotiation
  cancellation immediately followed by a successful WebSocket connection.
  The accepted live connection and challenge reads both succeeded.

## Review status

The initial independent K3 read-only review found:

- Blocker: 0;
- Major: 1 — converting the shared `QuestMap` to a controlled component broke
  marker selection in its existing uncontrolled Quest Detail usage;
- Minor: 1 — a `Program.cs` comment still named the old local port `5000`.

The concentrated correction pass restored a controlled/uncontrolled dual mode,
added direct regression coverage for the uncontrolled Quest Detail call, and
made the development-proxy comment port-neutral.

The targeted K3 closure check confirmed:

- original Blocker: 0;
- original Major: closed;
- original Minor: closed;
- unresolved original Blocker/Major: 0.

Slice 17 satisfies the documented commit-readiness gates.
