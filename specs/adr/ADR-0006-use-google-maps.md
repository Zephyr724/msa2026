# ADR-0006: Use Google Maps for Quest Location Discovery

- Status: Accepted
- Date: 2026-07-19
- Decider: Product owner
- Decision source: `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- Supersedes: None

> The map-provider decision is already accepted in the planning baseline. This
d.

## Context

Quest discovery benefits from showing activity locations across Auckland and,
later, other regions of Aotearoa New Zealand. Organizers and Admins also need a
controlled way to choose quest coordinates.

The MVP needs a useful map but does not need route planning, continuous
tracking, traffic, or broad Google Places functionality. A map must not become
the only way to discover or access a quest.

## Decision

Kiwimpact will use Google Maps through `@vis.gl/react-google-maps`.

The MVP map scope is limited to:

- map display;
- quest markers;
- marker summary;
- fit bounds;
- link to Quest Detail;
- click map to choose coordinates for authorized Organizer/Admin flows;
- a complete list fallback.

Excluded from the MVP:

- Places Autocomplete;
- Directions;
- Street View;
- Distance Matrix;
- traffic;
- continuous geolocation.

## Accessibility and fallback

The quest list remains the complete, authoritative discovery interface. Users
must be able to discover and open every available quest without the map. Map
interactions need keyboard-accessible alternatives and visible text
information. Meaning must not rely only on marker color.

## Key and configuration security

Use a dedicated local-development browser key.

Allowed local referrers:

- `http://localhost:5173/*`
- `http://127.0.0.1:5173/*`

Restrict it to the Maps JavaScript API and store it in
`frontend/.env.local`, which is ignored by Git.

Production referrer restrictions require separate review. The real API key is
never committed. Non-secret origin/restriction templates may be committed.
The Google OAuth client secret is a separate backend secret.

## Consequences

### Benefits

- Familiar map interaction and marker support.
- Uses the accepted React integration package.
- Enables coordinate selection without Places or route APIs.
- Keeps the MVP scope controlled.

### Costs and trade-offs

- Dependence on Google availability, pricing, quotas, and policy.
- Browser keys require restrictions and monitoring.
- Map UI adds responsive and accessibility complexity.
- Provider migration would require component/configuration changes.

## Alternatives considered

OpenStreetMap/Leaflet was not selected because the accepted planning decision
is Google Maps and the project benefits from one documented path. No map was
rejected because map discovery is accepted scope. The full Google feature set
was rejected because it expands scope and cost without supporting the core
loop.

## Verification

This decision is implemented only when the package and configuration exist,
local key restrictions are verified, list/map results stay consistent,
markers link to detail, coordinate selection is authorized, the list fallback
works, responsive/keyboard/error behavior is tested, and `PROJECT_STATUS.md`
records observed behavior.

## Review triggers

Review this ADR if cost/quota becomes unsuitable, provider terms or APIs change,
accessibility cannot be met, accepted scope adds routing/autocomplete/tracking,
or nationwide scale requires another strategy.
