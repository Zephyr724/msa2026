# Slice 19 — Figma Deep Parity and Demo Activity

## Status

**Accepted — explicitly requested by the product owner on 2026-07-28.**

## Reference

The checked-in runnable Figma Make prototype under
`docs/UI/Kiwimpact MVP UI Design/` is the visual source. The original URL is a
Make file rather than an addressable Figma Design node, so its source and
rendered local prototype are used for inspection.

## Goals

### Landing

- Restore the Make composition for Community Goal.
- Restore the green `Build your Impact Passport` feature band, including its
  right-hand feature rows.

### My Quests

- Restore the Make Player Status layout and interactions without fabricating
  progression, ranking, streak, or community values.
- Restore horizontal Make-style mission rows with state, next action, precise
  location, and a full-card detail target.

### Passport

- Restore Make XP progress and category goal composition.
- Show explicit per-category quest targets.
- Restore Make-style Community challenge participation rows while retaining
  historical award-time attribution.
- Keep Home Community changes in Profile Settings as the one primary control.

### Leaderboard

- Restore icon/text alignment and the Make 2–1–3 podium composition.
- Use medal artwork, avatar/place identity, wider gold/silver/bronze steps, and
  two-line long names for both People and Communities.
- Keep the current 900 px content width.
- Treat Auckland Communities as Local Area comparison within the city.
- Treat New Zealand Communities as Administrative Area/city comparison.

### Region hierarchy and navigation

- Expose Administrative Areas as Cities without a schema migration.
- Add City and Community controls to Discover.
- Prevent primary navigation labels and the XP/level phrase from splitting
  internally; hide icons and reduce text before allowing broader header
  wrapping.

### Development data

- Seed persisted, idempotent Development-only completion, XP, participation,
  streak, Passport, challenge, People leaderboard, and Communities leaderboard
  state for the accepted nine demo personas.
- Add passwordless supporting neighbours only to satisfy the accepted
  community privacy threshold.
- Add Development-only Wellington and Christchurch city/local-area fixtures so
  the New Zealand city leaderboard is visibly testable.
- Do not add a role, schema migration, production password, or dependency.

## Acceptance

- Landing, My Quests, Passport, and Leaderboard visibly follow the Make
  structure while preserving real API data and accepted error/empty states.
- People and Communities both show a gold/silver/bronze podium when three
  visible rows exist.
- Auckland community results contain Local Areas; New Zealand results contain
  cities.
- Discover offers separate City and Community controls.
- Development APIs return enough persisted rows to inspect every listed view.
- Applicable full frontend and backend gates pass.
- One independent K3 read-only review closes all original Blocker/Major
  findings before commit.
