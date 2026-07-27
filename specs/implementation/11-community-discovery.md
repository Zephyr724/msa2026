# Slice 11 — Community Discovery and Momentum

## Status

Accepted for implementation by the product owner on 2026-07-27.

## Goal

Complete the accepted MVP community and discovery experience after Slice 10:
map-assisted Quest discovery, an editable coarse-grained Home Community,
multi-scope leaderboards, verified weekly streak, privacy-safe sharing,
community challenges, and SignalR invalidation backed by authoritative REST
queries.

## Approved implementation decisions

1. Add an additive EF Core migration for Quest coordinates and Community
   Challenge persistence.
2. Store Quest `Latitude` and `Longitude` as nullable `decimal(9,6)` values.
   They must be supplied together and remain within geographic bounds.
3. Add the already accepted frontend dependencies
   `@vis.gl/react-google-maps` and `@microsoft/signalr`.
4. Keep authentication lifecycle behavior from Slice 10: confirmed email,
   24-hour confirmation links, and 45-minute password-reset links.
5. Google OAuth and account linking remain outside Slice 11.

## In scope

### Quest map

- Published Quest list remains the complete authoritative fallback.
- Published Quests with both coordinates appear as Google Maps markers.
- Markers expose a text summary and link to Quest Detail.
- Organizer/Admin Quest forms support click-to-select coordinates and numeric
  keyboard-accessible inputs.
- Missing/invalid map configuration never prevents list or form use.
- No Places, routing, Street View, traffic, or continuous geolocation.

### Community identity

- Authenticated Members can read and update Home Community and the
  `ShowCommunityOnPassport` preference.
- Home Community must be an active `LocalArea`.
- First selection is free; later changes use the accepted 30-day cooldown.
- Historical XP attribution is not rewritten.

### Leaderboards and streak

- People: My Community, Auckland, and New Zealand; weekly, monthly, all-time.
- Communities: Auckland and New Zealand; monthly and all-time.
- Only immutable XP ledger entries contribute.
- Identifiable community rankings require at least 10 ranked Members.
- Community aggregate contributor counts and ratios are suppressed below 10.
- Weekly streak derives from verified XP-producing completions using
  Pacific/Auckland calendar weeks.

### Share Card

- Generated client-side from the authenticated Member's existing Passport and
  progression data.
- Display name is opt-in in the card UI.
- Home Community, email, user ID, evidence, claim text, and review notes are
  never included.

### Community Challenge

- Persist one active challenge per LocalArea.
- Public aggregate list/detail/progress; Admin create, edit-before-start, and
  cancel.
- Progress derives from XP ledger rows in `[PeriodStart, PeriodEnd)`.
- Contributor count is privacy-suppressed below 10.
- A hosted finalizer completes ended challenges and awards an optional
  achievement idempotently to eligible contributors.

### Live refresh

- REST remains authoritative.
- `/hubs/leaderboard` sends one `ImpactChanged` invalidation event after
  successful verified-impact writes.
- The frontend invalidates and refetches leaderboard/challenge queries.
- No chat, presence, regional groups, or client-authored leaderboard state.

## Verification

- Targeted unit/integration/frontend tests cover coordinate validation,
  community cooldown and privacy, period boundaries, challenge lifecycle,
  share-card privacy, and REST fallback.
- Run all applicable frontend and backend gates from `AGENTS.md`.
- Create an implementation prompt, completion report, and one independent
  Kimi K3 read-only review before commit.

## Explicitly excluded

- Google OAuth/account linking.
- Places autocomplete, directions, Street View, traffic, and continuous
  location.
- Seasons, leagues, chat, social feed, and a virtual economy.
- Environmental outcome claims such as carbon saved.
