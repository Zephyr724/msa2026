# Slice 17 Implementation Prompt

Implement the product owner's reported Slice 17 corrections on top of the
current Slice 15–16 working stack.

Observed failures:

- signed-in Passport shows `Passport unavailable`;
- Community Challenges shows `Community challenges could not be loaded`;
- Discover Map mode shows neither the Quest list nor visible Quest markers.

Use accepted APIs and the Figma Make Discover map composition as truth.
Diagnose the running local application rather than masking errors. Correct the
macOS local port collision so Vite and the supported API launch profile target
the same Kiwimpact backend. Keep `/api` relative, cookies HttpOnly, and the
existing security model unchanged.

Restore Map mode as a vertical map-plus-results experience. Show every filtered
Quest below the map, show selectable markers only for authoritative
coordinates, synchronize marker/list selection, and keep unmapped Quests
visible with a truthful label. Map configuration or loading failure must not
remove the list.

Do not add dependencies, invent coordinates, change the schema, weaken
authorization/privacy, or change public API contracts. Add regression tests,
run applicable full gates once, capture browser evidence for all three
reported failures, create the completion report, and obtain one independent
K3 read-only review before requesting commit approval.
