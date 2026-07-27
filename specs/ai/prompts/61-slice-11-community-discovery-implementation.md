# Prompt 61 — Slice 11 Community Discovery Implementation

- **Date:** 2026-07-27
- **Implementation owner:** Codex
- **Review model:** Kimi K3

## Reconstructed implementation instruction

Implement Slice 11 on `codex/feat/slice-11-community-discovery` after the
reviewed and pushed Slice 10 commit `94a129c`.

The human explicitly approved:

1. additive schema changes for Community Challenge and evidence-related data;
2. nullable paired Quest coordinates stored as `decimal(9,6)`;
3. the `@vis.gl/react-google-maps` and `@microsoft/signalr` frontend
   dependencies;
4. the Slice 10 account-lifecycle choices;
5. exclusion of Google OAuth/account linking.

For Slice 11:

- add published-Quest map markers, fit bounds, marker summaries and Quest
  Detail links while preserving the complete list fallback;
- add Organizer/Admin click-to-select coordinates plus keyboard-accessible
  numeric fields, with server-side pair/range constraints;
- add authenticated Home Community read/update with active-LocalArea
  validation, first-selection freedom, 30-day change cooldown and a Passport
  visibility preference;
- expand people leaderboards to My Community/Auckland/New Zealand and
  weekly/monthly/all-time, and add Auckland/New Zealand community leaderboards
  for monthly/all-time;
- preserve ledger authority, use Pacific/Auckland time boundaries, and suppress
  identifying community results below 10 contributors;
- derive and render a verified weekly streak;
- generate a client-side PNG Share Card that excludes community, email, user
  IDs, evidence, claim text and review notes, with display name opt-in;
- persist one active Community Challenge per Local Area, expose public
  aggregate reads and Admin create/edit-before-start/cancel operations, derive
  progress from XP rows in `[start, end)`, and finalize optional achievement
  rewards idempotently;
- add `/hubs/leaderboard` with an `ImpactChanged` invalidation event after
  successful verified-impact writes, while keeping REST authoritative;
- add focused domain, API, persistence, migration and frontend tests;
- run all applicable frontend/backend gates;
- create truthful implementation evidence before one independent read-only
  Kimi K3 review;
- preserve and exclude the user-owned `.playwright-mcp/`, `docs/UI/`, and
  `figma-make-1.jpeg` paths from the Slice commit.

Do not add Places, routing, geolocation, chat, social feeds, seasons, leagues,
virtual economy, Google OAuth, or client-authored leaderboard state. Do not
weaken cookie authentication, antiforgery, role/ownership enforcement, privacy
thresholds, immutable XP authority, or evidence privacy.
