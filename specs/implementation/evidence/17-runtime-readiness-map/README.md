# Slice 17 Runtime and Map Evidence

## Runtime

The current Kiwimpact API was launched from the accepted `http` profile on
`http://localhost:5091`. The Vite application was launched on
`http://127.0.0.1:5173` with its `/api` and SignalR requests proxied to that
same backend. The browser reused the signed-in local member
`slice9.member@example.test`.

Port `5000` was not used: on the observed macOS host it was owned by the
system Control Center process rather than the Kiwimpact API. This explained
how a persisted frontend authentication state could coexist with route-level
`404` responses from the wrong local service.

## Browser evidence

All files are JPEG screenshots captured from a 1280 × 720 CSS-pixel browser
viewport. Full-page output preserves each page's actual document height.

| File | Dimensions | Observed state |
| --- | ---: | --- |
| `passport-loaded.jpg` | 1280 × 2608 | Signed-in Passport renders the member identity, Level 3 progression, verified Quest totals, streak, milestone, category progress, achievements, participation, settings, and history; no `Passport unavailable` state is present. |
| `community-challenges-loaded.jpg` | 1280 × 967 | Leaderboard loads successfully and presents the truthful `No community challenge is published yet` empty state; no `Community challenges could not be loaded` error is present. |
| `discover-map-results-and-markers.jpg` | 1280 × 1991 | Discover Map mode renders a real Auckland Google map, visible Quest markers, the coordinate summary, and all 12 current-page Quest results below the map. Two results without authoritative coordinates remain visible and are labelled `Not mapped`. |
| `discover-map-list-selection.jpg` | 1280 × 1991 | Selecting `Māngere Bike Path Planting` in the result list synchronizes the selected map context and opens its `View Quest` InfoWindow. |
| `quest-detail-marker-selection.jpg` | 1280 × 3101 | The existing uncontrolled Quest Detail map usage retains marker selection and opens its matching `View Quest` InfoWindow after the review correction. |

## Additional observed checks

- The browser DOM contained 17 filtered Quests and a 12-item current page.
- The coordinate summary reported `10 of 12 visible Quests include map
  coordinates`.
- Map mode retained a `Details` link for every current-page Quest.
- Browser logs showed the development SignalR connection successfully reaching
  `ws://127.0.0.1:5173/hubs/leaderboard`. React development lifecycle restarts
  produced transient negotiation-cancel messages before the successful
  connection; no challenge load error remained.
- The Google Maps marker/list interaction is also covered by the focused
  component test, including marker selection, map panning, and the `View Quest`
  InfoWindow.
