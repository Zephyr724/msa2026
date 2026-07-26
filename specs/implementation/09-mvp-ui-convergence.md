# Slice 9 — MVP UI Convergence

- **Status:** Approved
- **Date:** 2026-07-27
- **Risk:** Important — broad responsive UI change plus one authenticated read API
- **Design reference:** `docs/UI/Kiwimpact MVP UI Design/`

## 1. Goal

Bring the implemented Slice 0–8 product into the cohesive visual language of
the approved Kiwimpact Make prototype without replacing the production
architecture or presenting deferred demo features as implemented.

The production React routes, API contracts, authorization rules, TanStack Query
server state, Zustand UI state, and backend enforcement remain authoritative.
The Make export is a visual and interaction reference, not code to merge.

## 2. Approved scope

### 9A — UI foundation and public journey

- Establish Kiwimpact color, typography, elevation, radius, focus, and motion
  tokens for both light and dark themes.
- Add reusable brand, page-heading, quest-card, metadata, status, and empty/error
  presentation patterns using the existing stack.
- Redesign AppShell, guest/member navigation, and member mobile navigation.
- Redesign Landing, Discover, and Quest Detail.
- Preserve current search, filters, paging, image fallback, join/cancel, external
  registration, and Completion Code behavior.

### 9B — member core loop

- Add `GET /api/v1/users/me/participations` as an authenticated, read-only
  endpoint with no database schema change.
- Add a My Quests route that renders real participation records and real Quest
  state only.
- Add the cross-page Player Status presentation using existing progression data.
- Present Completion Code entry as a responsive dialog/sheet.
- Add an authoritative Completion Reward Overlay after a successful code
  redemption. It may show the Quest XP award and newly re-fetched progression
  state, but must not invent an achievement award or level-up.
- Redesign Passport-lite and the existing NZ/all-time People leaderboard.

### 9C — auth, organizer, and closure

- Redesign Login and Register using the shared Kiwimpact visual system.
- Redesign Organizer Quest list, create/edit form, lifecycle actions, dialogs,
  and completion-code management without changing permissions or behavior.
- Provide coherent loading, empty, error, forbidden, not-found, disabled, and
  success states.
- Verify responsive layouts, keyboard interaction, visible focus, reduced
  motion, and light/dark readability.

## 3. Explicit exclusions

- Google Maps
- Evidence-reviewed claims and Admin review
- Self-reported completion
- Community Challenge
- My Community/Auckland/NZ multi-layer leaderboards
- People/Communities leaderboard switching
- Share Card
- Weekly streak
- SignalR
- Email confirmation, recovery, password change, Google login, or other account
  lifecycle expansion
- New dependencies, database schema changes, or authentication-model changes

## 4. My Quests API contract

`GET /api/v1/users/me/participations`

- Requires an authenticated Member-or-higher session.
- Supports `status=active|cancelled|all`; defaults to `all`.
- Returns the authenticated user's participations only.
- Includes the public Quest summary required to render the Mission Board.
- Uses existing `QuestParticipation` and Quest data; it introduces no new
  persistence model or migration.
- Returns records in a stable newest-participation-first order.
- Never accepts or exposes another user's identifier.

## 5. Reward overlay rules

- Opens only after the completion redemption API succeeds.
- Shows a verified-completion state and the Quest's server-projected XP award.
  The projection uses the accepted difficulty rule (Easy 50 / Medium 100 /
  Hard 150); it never presents the deprecated `Quest.XpAward` persistence
  column as the reward source.
- Re-fetches progression, Passport, achievements, leaderboard, My Quests, and
  participation state through the existing authoritative query model.
- May show the resulting total XP, level, and rank only when successfully
  returned by the progression API.
- Does not claim a new level, rank, or achievement by inference.
- Is dismissible by button, Escape, and backdrop interaction, with focus
  returned to the completion trigger.

## 6. Definition of done

- All production routes in Slice 9 use the shared Kiwimpact visual system.
- The public and member core journeys match the Make prototype's hierarchy and
  interaction intent at desktop and mobile sizes.
- My Quests is backed by the authenticated read-only API and has API, service,
  repository, validation, and UI tests.
- Completion Reward Overlay is driven only by successful authoritative state.
- Existing auth, authorization, ownership, CSRF, participation, completion,
  progression, Passport, achievement, and leaderboard behavior remains intact.
- Frontend lint, type-check, tests, and build pass.
- Backend build, unit tests, and integration tests pass.
- Browser smoke evidence covers guest, member, organizer, desktop, mobile,
  light, dark, success, empty, and error-relevant states.
- Implementation prompt evidence, completion report, and one independent
  read-only review record exist before commit readiness.

## 7. Source handling

Do not copy the Make dependency tree, generated wrapper component set,
`node_modules`, `dist`, demo toolbar, hard-coded demo state, or remote Unsplash
URLs into production. Reuse the existing Tailwind, daisyUI, Lucide, React
Router, TanStack Query, and Zustand stack. Any new production image must have a
known source and license or be authored within the repository.
