# Community Identity — Leaderboard, Selector, and Passport Updates

- **Status:** Accepted
- **Date:** 2026-07-20
- **Source:** ADR-0008 Community Identity, Local Leaderboards, and Virtual Economy Scope
- **Purpose:** Extend the UX specification with community-scoped leaderboards, a community selector, passport updates, and virtual currency/shop exclusions from the MVP UI.

> This document records accepted UX direction. It does not claim that the Figma designs or implementation are complete.

## 1. Leaderboard — Updated Design

### 1.1 Scope Selector

The leaderboard page must include a scope selector above the ranking table. The selector combines two dimensions:

**Geographic scope:**

- My Community (default for Members)
- Auckland
- New Zealand

**Time period:**

- Weekly (default)
- Monthly
- All-time

The selector can be implemented as:

- a horizontal segmented control for time periods;
- a dropdown or horizontal pill group for geographic scope.

Default states by user type:

- **Member with a Home Community:** My Community + Weekly
- **Member without a Home Community:** Auckland + Weekly
- **Guest:** Auckland + Weekly

### 1.2 Live Status

Retain the existing live-update indicator. The SignalR connection should broadcast leaderboard changes scoped to the active geographic scope.

### 1.3 Top Three

The top-three podium or cards display for the selected scope and period as in the current leaderboard design.

### 1.4 Ranked Rows (Position 4+)

Each row displays:

- rank;
- avatar or initials;
- display name;
- level and rank title;
- verified quests for the period;
- XP for the period.

### 1.5 Current User Highlight

When the current Member is outside the visible range, show:

- a pinned or highlighted current-user row;
- `Your Position` with rank movement where data exists;
- `Personal Best` for the scope and period when available.

### 1.6 Small-Community Collective State

When the selected community has fewer than 10 active ranked Members, replace the full ranking with a collective-progress card:

- `Your community is building momentum.`
- verified Quest completions for the period;
- active contributors count;
- Quest categories represented;
- a link to the Auckland leaderboard.

Do not show individual rankings in this state. The current Member's own position and XP may still be shown privately above the collective card.

### 1.7 Empty and Disconnected States

Retain existing patterns:

- No leaderboard activity for the period
- Reconnecting to live updates
- Live updates unavailable; data visible with refresh action

### 1.8 Mobile Adaptation

- Use a compact scope selector (horizontal scroll for geographic scope, segmented control for time).
- Stack rank, identity, level, and XP in compact rows.
- Move secondary metrics into row detail or omit them on the smallest screens.

## 2. Community Selector

### 2.1 Entry Point

The community selector is accessed from:

- Account Settings (`/settings`) — a dedicated "Home Community" section;
- optionally from the leaderboard page as a shortcut when "My Community" is selected but the Member has no Home Community set.

### 2.2 Selector Design

The selector should present Region choices in a hierarchical or flat list:

- If the Region model supports a flat list for the Auckland local areas, present it as a searchable list or grouped list.
- If the Region model is hierarchical, present a tree or drill-down: Country → AdministrativeArea → LocalArea.

**Desktop:** a modal or settings-section list with search.

**Mobile:** a full-height bottom sheet with search.

### 2.3 Selection Flow

1. The Member sees their current Home Community (or "Not selected").
2. Tapping "Change" or selecting a new community opens the selector.
3. The Member picks a LocalArea-level Region.
4. Confirmation shows the selected community name and a note about the cooldown period.
5. After confirmation, the Home Community is updated and the leaderboard reflects the new scope.

### 2.4 Cooldown UI

After changing Home Community:

- The selector shows the current selection and the date when a new change is allowed.
- Display: `You can change your Home Community again after [date].`
- The change button is disabled or replaced with the cooldown message.

The initial cooldown is 30 days (configurable product value).

### 2.5 Privacy Toggle

In Account Settings, include a toggle:

- `Show my community on my Passport` — default off.

When off, the community label is hidden from the Passport view when viewed by the owning Member on their own personal surfaces. The community is never shown on Share Cards regardless of this toggle.

### 2.6 Empty State

When no Home Community is selected:

- The leaderboard defaults to Auckland scope.
- A gentle prompt may appear on the leaderboard or dashboard: `Choose your community to see your local leaderboard.`

## 3. Passport — Updated Design

### 3.1 Community Label (Optional)

The Passport profile summary **may** show the Member's Home Community label when the privacy toggle is enabled. The label is a simple text badge (e.g. "Henderson-Massey"), not a map or address.

When the toggle is off, the community label is omitted entirely from the Passport view.

### 3.2 Share Card Exclusion

Home Community is **never** included on Share Cards. This is a hard rule, not configurable.

### 3.3 No Other Passport Changes

The existing Passport design (player summary, achievements, completion timeline, filters, share-card entry) remains unchanged. The community label is the only addition.

## 4. Virtual Currency and Shop — MVP UI Exclusion

The following must **not** appear in any MVP Figma frame, component, or prototype:

- Wallet or currency balance display;
- Shop, Store, or Market destination in navigation or as a page;
- product cards, price labels, or purchase buttons;
- coin, diamond, or gem icons used as a spendable currency (XP badges are fine);
- transaction history for purchases;
- trade, gift, or send-currency UI;
- loot box or random-reward UI;
- real-money purchase flows;
- power-up or boost purchase UI.

The Figma file must not contain placeholder Shop pages, currency-balance components, or economy-related prototype flows.

## 5. Navigation — No New Destinations

The community selector lives inside Account Settings. It does not require a new top-level or bottom-navigation destination.

The leaderboard retains its existing navigation position.

## 6. Required States

In addition to existing leaderboard states, the following community-specific states must be designed:

| State | Description |
|-------|-------------|
| Leaderboard — small community | Collective-progress card instead of full ranking |
| Leaderboard — no community selected | Auckland scope, gentle prompt to select a community |
| Community selector — first selection | Empty state with "Choose your community" prompt |
| Community selector — cooldown active | Current selection shown, change button disabled with next-available date |
| Community selector — search no results | No communities match the search |
| Passport — community label visible | Toggle on, label shown |
| Passport — community label hidden | Toggle off, label omitted |

## 7. Related Documents

- `specs/product/02-community-identity-and-gamification-scope-update.md`
- `specs/ux/02-figma-ai-mvp-ui-generation-spec.md` (base leaderboard and passport designs)
- `specs/ux/03-figma-ai-first-pass-ui-review.md`
- `specs/architecture/01-domain-model-region.md`
- `specs/security/01-community-privacy-rules.md`