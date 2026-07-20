# Community Identity and Gamification Scope Update

- **Status:** Accepted
- **Date:** 2026-07-20
- **Source:** ADR-0008 Community Identity, Local Leaderboards, and Virtual Economy Scope
- **Purpose:** Extend the MVP product scope with community identity, geographically scoped leaderboards, and explicit scope exclusions.

> This document records accepted product decisions. It does not claim that implementation is complete.

## 1. Community Identity — MVP Inclusion

Kiwimpact will support a user-selected, coarse-grained **Home Community** and geographically scoped leaderboards.

A Member selects one Home Community from a hierarchical Region model (see `specs/architecture/01-domain-model-region.md`). The selection is:

- manual and explicit;
- coarse-grained (LocalArea, not a street or suburb);
- optional — a Member may not have a Home Community selected;
- changeable with a configurable cooldown (initially 30 days);
- not inferred from GPS, IP address, or a precise home address;
- not tied to a street address;
- subject to no cooldown for the first selection;
- subject to an initial 30-day cooldown for subsequent changes.

The Home Community provides:

- belonging and local identity;
- a scoped leaderboard that feels more achievable than a national board;
- community-level collective progress metrics;
- a foundation for future regional comparison.

## 2. Leaderboard Scopes and Periods

### Geographic Scopes

1. **My Community** — the Member's selected Home Community (requires authentication and a selected Home Community)
2. **Auckland** — the Auckland administrative area
3. **New Zealand** — the national scope

### Time Periods

- **Weekly** (current NZ calendar week, Monday–Sunday, Pacific/Auckland)
- **Monthly** (current calendar month, Pacific/Auckland)
- **All-time**

### Defaults

- Member with a Home Community: **My Community + Weekly**
- Member without a Home Community: **Auckland + Weekly**
- Guest: **Auckland + Weekly**

Only verified XP contributes to competitive leaderboards. Self-reported completions remain visible in the Passport but do not contribute XP, leaderboard ranking, streak, or reward credit.

### Small-Community Protection

A community with fewer than 10 active ranked Members (configurable threshold, default 10) must not display a full identifiable ranking. Below the threshold, the UI shows a collective-progress state:

- verified Quest completions;
- active contributors;
- Quest categories represented;
- a link to the wider Auckland leaderboard.

The threshold is a configurable product value, not a legal constant.

## 3. Community Progress Metrics

MVP community metrics include:

- verified Quest completions;
- active contributors;
- total verified XP;
- number of Quest categories represented.

The MVP must not claim:

- carbon saved;
- nature restored;
- environmental improvement scores;
- verified ecological outcomes

unless a separately accepted and validated methodology exists.

Future regional comparison should distinguish:

1. actions completed **by Members belonging to a region**;
2. actions completed **at Quest locations within a region**.

Future comparisons should include both totals and normalised measures, such as completions per active Member.

## 4. Separation of Identity and Quest Location

The system must not treat a user's community and an activity location as the same field:

- `UserProfile.HomeCommunityRegionId` — the community the Member identifies with for local participation and leaderboard purposes.
- `Quest.LocationRegionId` — where a Quest takes place.

A user may belong to one community and complete a Quest in another.

## 5. XP Transaction Snapshot

Historical leaderboard attribution must not be recalculated when a user changes community. The XP ledger records `XpTransaction.CommunityRegionIdAtAward` at the time XP is awarded:

- For verified completions with a Home Community: the snapshot references the Home Community Region ID.
- For verified completions without a Home Community: the snapshot is null.
- Past XP stays attributed to the community in which it was earned (or remains unattributed).

### Unattributed XP Rules

- `CommunityRegionIdAtAward` is nullable.
- Verified XP earned without a Home Community keeps a null snapshot.
- Unattributed XP contributes to personal progression (levels, ranks, achievements, Passport) and the **New Zealand** leaderboard.
- Unattributed XP does **not** contribute to **My Community** or **Auckland** community-attribution leaderboards.
- Later community selection does not retroactively assign unattributed XP.

## 6. Virtual Currency and Shop — Explicit MVP Exclusion

The MVP will **not** implement:

- diamonds, coins, or another spendable virtual currency;
- Wallet or currency balance;
- a Shop destination;
- product prices;
- purchasing;
- transaction history for purchases;
- tradeable or giftable items;
- loot boxes or random rewards;
- real-money purchases;
- power advantages or pay-to-win effects.

This exclusion applies to both implementation and UI design.

## 7. Achievement-Unlocked Cosmetics — Optional Stretch

If the core MVP is implemented, tested, deployed, and stable, a small non-economic cosmetic system may be considered as a stretch feature.

Allowed stretch examples:

- Passport border unlocked by an Achievement;
- Achievement stamp;
- Rank Title plate;
- Avatar frame.

Hard constraints for any stretch cosmetic system:

- no currency;
- no purchasing;
- no Shop;
- no random reward;
- no gameplay advantage;
- no effect on XP or leaderboard position;
- unlock source must be clear;
- the system must be small enough to test completely.

A full virtual economy requires a new ADR and a separate product/economy specification.

## 8. Community Privacy Principles

- Store only the selected coarse-grained Region identifier.
- Do not request continuous geolocation.
- Do not infer Home Community from GPS, IP address, or a precise home address.
- Do not require a street address.
- Allow the Member to change the selection later (with cooldown).
- Allow the Member to hide the community label on personal surfaces.
- Keep Home Community hidden from Share Cards (never included).
- Passport toggle default is off.
- Quest Detail may show the location needed to attend a public activity, but the product must not expose a user's residential location or build a public user movement history.

See `specs/security/01-community-privacy-rules.md` for detailed privacy rules.

## 9. Related Documents

- ADR-0008: Community Identity, Local Leaderboards, and Virtual Economy Scope
- `specs/architecture/01-domain-model-region.md`
- `specs/data/01-community-identity-data-model.md`
- `specs/security/01-community-privacy-rules.md`
- `specs/testing/01-community-leaderboard-and-privacy-tests.md`
- `specs/ux/04-community-identity-leaderboard-and-selector.md`