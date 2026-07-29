# Slice 11A — Google Maps Runtime Configuration Correction

## Status

Implementation, local verification, and independent review are complete. Live
Google-rendered map verification remains pending a human-provided restricted
browser key and map ID.

## Implemented scope

- Added one typed Google Maps configuration boundary that normalizes
  `VITE_GOOGLE_MAPS_API_KEY` and `VITE_GOOGLE_MAPS_MAP_ID` and enables maps only
  when both are present.
- Replaced the hard-coded `DEMO_MAP_ID` in Quest discovery and coordinate
  picking with the configured JavaScript map ID.
- Configured the loader for the New Zealand region and English language while
  retaining the accepted ADR's full website-referrer restriction pattern.
- Added loader-error fallback behavior that preserves the complete Quest list
  and manual numeric coordinate fields.
- Hardened mapped-Quest filtering against absent/non-number coordinates.
- Added stable single-marker centering and zoom while retaining multi-marker
  fit bounds.
- Added a visible Advanced Marker for the organizer's selected coordinates.
- Documented local and production build-time configuration, billing/API
  prerequisites, and browser-key restrictions.

## Files changed

- `README.md`
- `PROJECT_STATUS.md`
- `frontend/.env.example`
- `frontend/src/components/maps/CoordinatePicker.tsx`
- `frontend/src/components/maps/QuestMap.tsx`
- `frontend/src/lib/googleMapsConfig.ts`
- `frontend/src/vite-env.d.ts`
- `frontend/tests/integration/QuestListPage.test.tsx`
- `frontend/tests/unit/googleMapsComponents.test.tsx`
- `frontend/tests/unit/googleMapsConfig.test.ts`
- `specs/ai/prompts/62-google-maps-runtime-configuration-correction.md`
- `specs/ai/reviews/58-slice-11a-k3-independent-review.md`
- `specs/implementation/reports/11a-google-maps-runtime-configuration-correction.md`

## Verification commands and observed results

Run from `frontend/`:

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run tests/unit/googleMapsConfig.test.ts tests/unit/googleMapsComponents.test.tsx tests/integration/QuestListPage.test.tsx`
  — 3 files and 10/10 tests passed.
- `npm run test -- --run` — 37 files and 314/314 tests passed.
- `npm run build` — passed; Vite transformed 1,954 modules. The existing
  advisory for a JavaScript chunk over 500 kB remains.

Run from the repository root:

- `git diff --check` — passed after the correction and evidence updates.

## External configuration still required

The repository cannot create or infer the user's Google Cloud credentials.
Before live verification:

1. Select or create a Google Cloud project and attach billing.
2. Enable only the Maps JavaScript API needed by the accepted MVP.
3. Create a JavaScript map ID in Map Management.
4. Create a dedicated browser API key.
5. Apply Websites restrictions for the two documented local origins and, for
   production, the exact deployed HTTPS origins.
6. Restrict the key to Maps JavaScript API.
7. Put the local values in ignored `frontend/.env.local`; inject production
   values into the Vite build environment.
8. Restart/rebuild the frontend and observe discovery markers, fit bounds,
   marker Quest links, coordinate selection, browser console errors, and quota
   metrics.

## Known limitations

- No real Google Maps credential or JavaScript map ID was present, so a live
  Google-rendered map and Cloud restriction behavior were not observed.
- Production configuration injection cannot be finalized until the deployment
  provider and exact HTTPS origins are approved.
- The Maps JavaScript API browser key is necessarily visible in downloaded
  frontend assets; security depends on Website and API restrictions rather
  than treating the browser key as a server secret.
- This correction does not add Places, Directions, Street View, geolocation,
  or other deferred Google APIs.

## Review status

Independent K3 Review 58 initially identified one Major referrer-policy
configuration mismatch. The bounded correction removed the conflicting loader
option and preserved ADR-0006's accepted website-referrer rules. Targeted
closure marked the Major closed and returned **APPROVED**, with no remaining
Blocker or Major.
