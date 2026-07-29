# Slice 15 — Figma-Faithful UI Restoration Implementation Prompt

## Prompt record

This is a truthful reconstruction of the implementation instruction used for
Slice 15 after the product owner approved the Slice 14 recommendation on
2026-07-27.

## Instruction

Implement the accepted
`specs/implementation/15-figma-faithful-ui-restoration.md` contract as the sole
implementation owner.

Use the runnable local Figma Make export at
`docs/UI/Kiwimpact MVP UI Design/` and the paired Slice 14 screenshots as the
design reference. The remote Figma design-context connector cannot read Make
files, so do not invent a Design-mode node or claim remote inspection.

Restore the seven target pages as one shared visual system:

- Landing;
- Discover Cards and Map;
- Quest Detail;
- Mission Board;
- Passport;
- Leaderboard;
- Share Card Builder.

Preserve existing React, TypeScript, Vite, React Router, Tailwind, daisyUI,
TanStack Query, Zustand, Google Maps, SignalR, authentication, authorization,
privacy, completion, claim, and Passport behavior. Do not add a dependency,
change schema/auth architecture, hard-code Make demo values, use remote
Unsplash assets, or claim unavailable data.

Use real API data in the Make hierarchy. Add truthful bounded fallbacks where
data is absent. Make Cards the default Discover view, keep the real map behind
the Map switch, add gallery/location/related-Quest composition to Quest Detail,
restore gameful repository-owned emblem/crest/badge/medal art, expose actual
SignalR connection status, and keep filtered Passport history complete rather
than filtering only one visible page.

Run targeted tests while implementing, then the applicable full frontend gates.
Capture observed browser evidence at desktop and 390 × 844 where local state
allows it. Record limitations truthfully. Create the completion report before
requesting one independent read-only K3 review.

## Approved closure extension

After the bounded K3 review/correction workflow, the product owner explicitly
approved:

1. adding an identity-safe `isCurrentUser` field to the people leaderboard API
   and using it for current-member presentation; and
2. repairing the local Mailpit/backend confirmation environment and creating a
   representative confirmed Member fixture for authenticated browser evidence.

Complete those items without exposing email, user ID, or completion code in the
public leaderboard contract or stored screenshots. When the representative
journey exposes an in-scope runtime failure, fix the smallest production cause,
add a regression test, rerun the applicable full gates, and update the evidence
and completion records with observed facts only.
