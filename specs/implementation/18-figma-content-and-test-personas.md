# Slice 18 — Figma Content Parity and Test Personas

## Status

**Accepted — explicitly requested by the product owner on 2026-07-28.**

## Interpretation

The product owner requested three account types with three local accounts each:

- Member;
- External;
- Admin.

The accepted authorization model contains `Member`, `Organizer`, and `Admin`.
This Slice therefore implements “External” test personas as Organizer accounts
whose display names and intended use are external-event management. It does not
add an unaccepted fourth role.

The Figma Make source under `docs/UI/Kiwimpact MVP UI Design/` is the visual
reference. The connected Make file does not expose a Figma Design node ID, so
the runnable prototype and its checked-in source are used for exact inspection.

## Goals

### Local test personas

- Seed three confirmed Member accounts, three confirmed External Organizer
  accounts, and three confirmed Admin accounts in Development only.
- Use predictable test emails and one password supplied only by ignored local
  configuration or environment variables.
- Keep production and Docker demo-account seeding disabled by default.
- Make seeding idempotent and preserve the accepted role hierarchy.

### Landing

- Match the Make map frame, corner radius, border, and hover ring.
- Restore the Make-style Personal Progress and Community Goal separation.
- Restore the green `Build your Impact Passport` band with progress features
  and achievement preview.

### Quest cards and Discover

- Keep category emblems above the image/body seam without clipping.
- Remove the permanent decorative sparkle from repository fallback artwork.
- Restore colored category, difficulty, registration/completion-condition, and
  source chips.
- Restore the Make highlight position with data-backed labels:
  platform-owned items may be `Featured challenge`, Easy items may be
  `Good first Quest`, and `Almost full` must use derived remaining capacity.
  Do not label an array's first row as a personalised recommendation.
- Make the complete card navigate to Quest Detail.
- Restore green control borders, left-aligned sort icon, and Make-style
  card/map segmented control.

### Quest Detail and map

- Enlarge the marker InfoWindow, add right padding, and show Quest media.
- Always render a Quest gallery, using repository-native placeholders when the
  API has no additional media.
- Show the precise seeded address in the Hero, fact card, map InfoWindow, and
  Quest Location section.
- Show address context as Country, Region/City, and Community without
  fabricating coordinates.

### My Quests and Passport

- Re-align page width, density, headings, tabs, cards, status chips, milestone,
  community, achievement, and Passport-history composition with the Make
  reference.
- Preserve all accepted real APIs, empty/error states, evidence review,
  self-reporting, rewards, privacy, and account behavior.

## Data and API decisions

- No database schema migration is required. `Quest.LocationDescription`
  already supports precise address text and `Region` already models
  Country → Administrative Area → Local Area.
- Development Quest seed rows are updated idempotently with precise Auckland,
  New Zealand addresses.
- Quest read DTOs may expose non-sensitive location hierarchy labels and
  remaining capacity derived from active participation counts.
- “Almost full” is shown only when a bounded remaining-capacity value exists
  and is five or fewer; it is never inferred from total capacity alone.

## Exclusions

- No production passwords or secrets in Git.
- No Google Places address-autocomplete dependency in this Slice.
- No bulk import of every postal address in New Zealand.
- No new authorization role.
- No synthetic coordinates for Quests without authoritative coordinates.

## Acceptance

- Nine confirmed Development accounts exist with the intended roles and can
  sign in after the current API starts with local test-persona configuration.
- The listed Landing, card, Discover, Quest Detail, My Quests, and Passport
  gaps visibly match the Make composition at desktop and remain responsive.
- Every published demo Quest has a precise address or an explicitly truthful
  online/area-wide location.
- Map/list/detail media and location context remain usable when Maps or extra
  gallery media are unavailable.
- Applicable full gates pass.
- Browser evidence compares the Make reference and the current product.
- One independent K3 read-only review closes all original Blocker/Major
  findings before commit.
