# ADR-0008: Community Identity, Local Leaderboards, and Virtual Economy Scope

- **Status:** Accepted
- **Date:** 2026-07-20
- **Decider:** Product owner
- **Decision source:** Product-owner discussion following the first-pass UI review and gamification benchmark
- **Related documents:**
- `specs/product/02-community-identity-and-gamification-scope-update.md`
- `specs/ux/03-figma-ai-first-pass-ui-review.md`
- `specs/ux/04-community-identity-leaderboard-and-selector.md`
- `specs/architecture/01-domain-model-region.md`
- `specs/data/01-community-identity-data-model.md`
- `specs/security/01-community-privacy-rules.md`
- `specs/testing/01-community-leaderboard-and-privacy-tests.md`
- **Supersedes:** None

> Acceptance of this ADR approves the product and architecture direction. It does not claim that the database, API, UI, SignalR integration, or tests have already been implemented.

## Context

Kiwimpact is an Auckland-first environmental participation platform intended for a broad audience, from younger users to adults around 60 years old. Its gamification must support belonging, progress, and continued participation without becoming a child-only product or a hardcore game.

The first-pass UI already includes XP, levels, achievements, a Passport, and a leaderboard. Two additional directions were evaluated:

1. community identity and geographically scoped leaderboards;
2. a virtual currency and cosmetic shop.

Community identity has direct product value:

- users can feel that they belong to a real local community;
- a local leaderboard is more achievable than a city-wide or national board;
- local collective progress can reward users who do not enter the Top 10;
- the same model can later support comparisons between regions;
- it strengthens the value of the planned SignalR leaderboard feature.

A virtual currency and cosmetic shop could support collection, personalisation, and future social identity. However, it is not an isolated UI page. A reliable economy would require wallets, transaction history, catalogue items, inventory, purchase idempotency, equipment state, balance rules, administration, additional security, content assets, and substantial testing.

The MSA MVP must prioritise a complete, deployed, tested full-stack product. Adding a complete economy before the Quest, completion, XP, Passport, leaderboard, security, SignalR, and Cypress flows are stable would create disproportionate delivery risk.

## Decision

### 1. Community identity is part of the MVP

Kiwimpact will support a user-selected, coarse-grained **Home Community** and geographically scoped leaderboards.

Initial leaderboard scopes are:

1. **My Community**
2. **Auckland**
3. **New Zealand**

Default leaderboard views by user type:

- **Member with a Home Community:** My Community + Weekly
- **Member without a Home Community:** Auckland + Weekly
- **Guest:** Auckland + Weekly

The model must be expandable beyond Auckland without assuming that every country uses identical administrative terminology.

### 2. Use a hierarchical Region model

The target domain model is conceptually:

```text
Region
- Id
- Name
- Type
- ParentRegionId
- IsActive
```

The accepted `RegionType` values are:

```text
Country
AdministrativeArea
LocalArea
```

Initial example:

```text
New Zealand
└── Auckland
    ├── Henderson-Massey
    ├── Waitākere Ranges
    ├── Albert-Eden
    └── other supported local areas
```

The exact Auckland seed list must use an approved and stable regional source. Do not invent informal boundaries as authoritative administrative regions.

### 3. Separate user identity from Quest location

The system must not treat a user's community and an activity location as the same field.

```text
UserProfile.HomeCommunityRegionId
Quest.LocationRegionId
```

- `HomeCommunityRegionId` represents the community the Member chooses to identify with for local participation and leaderboard purposes.
- `LocationRegionId` represents where a Quest takes place.

A user may belong to one community and complete a Quest in another.

### 4. Snapshot community attribution when XP is awarded

Historical leaderboard attribution must not be recalculated whenever a user changes community.

The target XP ledger includes:

```text
XpTransaction.CommunityRegionIdAtAward
```

Only verified XP-producing completions contribute to competitive leaderboards. Self-reported completions remain visible in the Passport but do not contribute XP, leaderboard ranking, streak, or reward credit.

### 5. Community selection and privacy rules

The MVP will:

- ask the Member to select a community manually;
- store only the selected coarse-grained Region identifier;
- not request continuous geolocation;
- not infer Home Community from GPS, IP address, or a precise home address;
- not require a street address;
- allow the Member to change the selection later (first selection is free; subsequent changes are subject to an initial configurable 30-day cooldown);
- not retroactively move historical XP between communities;
- allow the Member to hide the community label on personal surfaces where appropriate;
- keep Home Community hidden from Share Cards (never included).

Quest Detail may show the location needed to attend a public activity, but the product must not expose a user's residential location or build a public user movement history.

### 6. Local leaderboard presentation

For a sufficiently active community, the leaderboard should show:

- Top 10;
- the current Member;
- a small context range around the current Member where useful;
- `Your Position`;
- `Personal Best`;
- rank movement where data exists;
- verified XP and verified Quest counts;
- Weekly, Monthly, and All-time periods.

The system must avoid public humiliation of low-ranked users and must not make competition the only source of motivation.

### 7. Small-community protection

A community with too few active leaderboard participants must not display a full identifiable ranking.

The initial product threshold is:

```text
10 active ranked Members
```

This is a configurable product threshold, not a legal constant.

Below the threshold, the UI shows a collective-progress state instead of a full ranking, for example:

- verified Quest completions;
- a privacy-safe indication of active contributors (exact counts are omitted when they may identify individuals);
- Quest categories represented;
- a link to the wider Auckland leaderboard.

### 8. Community progress metrics

MVP community metrics may include:

- verified Quest completions;
- active contributors;
- total verified XP;
- number of Quest categories represented.

Future regional comparison should distinguish:

1. actions completed **by Members belonging to a region**;
2. actions completed **at Quest locations within a region**.

Future comparisons should include both totals and normalised measures, such as completions per active Member. Large-region totals must not be presented as proof that a large region is inherently more environmentally successful.

The MVP must not claim:

- carbon saved;
- nature restored;
- environmental improvement scores; or
- verified ecological outcomes

unless a separately accepted and validated methodology exists.

### 9. Virtual currency and a shop are excluded from the MVP

The MVP will not implement:

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

This exclusion applies to both implementation and the second Figma iteration.

### 10. Achievement-unlocked cosmetics are an optional stretch feature

If the core MVP is implemented, tested, deployed, and stable, a small non-economic cosmetic system may be considered.

Allowed stretch examples:

- Passport border unlocked by an Achievement;
- Achievement stamp;
- Rank Title plate;
- Avatar frame.

Constraints:

- no currency;
- no purchasing;
- no Shop;
- no random reward;
- no gameplay advantage;
- no effect on XP or leaderboard position;
- unlock source must be clear;
- the system must be small enough to test completely.

A full virtual economy requires a new ADR and a separate product/economy specification.

## Consequences

### Benefits

- Local identity strengthens belonging and makes progress more achievable.
- Community progress supports non-competitive motivation.
- Geographic leaderboard scopes provide meaningful SignalR use.
- Coarse, user-selected location limits unnecessary personal-data collection.
- Region hierarchy supports future New Zealand expansion.
- Excluding the economy protects the delivery of the core assessed MVP.
- Achievement unlocks preserve a path toward future personalisation.

### Costs and trade-offs

- Region seed data and hierarchy need governance.
- Leaderboard queries and SignalR groups become more complex.
- Historical community attribution needs an XP-time snapshot.
- Small-community thresholds require additional UI states and tests.
- Community changes require explicit business rules.
- The MVP postpones a potentially valuable retention loop based on collecting and spending currency.

## Alternatives considered

### National leaderboard only

Rejected because it gives new users a weak sense of attainability and does not support local belonging.

### Automatic location detection

Rejected because it collects or infers more location information than is needed, creates permission friction, and may assign the wrong community.

### Exact suburb, street, or home-address storage

Rejected because Home Community does not require precise residential location.

### Full virtual economy in the MVP

Rejected because it creates a new transactional domain and content burden that is disproportionate to the current assessment schedule.

### Cosmetic shop without a currency ledger

Rejected for the MVP because a purchase-like interaction still requires catalogue, ownership, duplicate handling, inventory, and equip-state rules.

## Required verification

This ADR is considered implemented only when evidence confirms:

- hierarchical Region seed data exists;
- Home Community and Quest location are separate;
- community selection is manual and coarse-grained;
- no GPS/IP/home-address inference is used for Home Community;
- XP transactions preserve the community-at-award snapshot;
- My Community, Auckland, and New Zealand scopes return correct results;
- only verified XP contributes to leaderboards;
- small-community suppression works;
- SignalR updates are scoped correctly;
- Share Card excludes Home Community by default;
- community-change rules are tested;
- the application contains no Wallet, virtual-currency balance, purchasing, or Shop implementation;
- `PROJECT_STATUS.md` records observed implementation and test evidence.

## Review triggers

Review this ADR if:

- the product expands outside New Zealand;
- the accepted regional hierarchy changes;
- a public profile or social feed is added;
- community sizes make the privacy threshold unsuitable;
- users can join multiple communities;
- competitive abuse requires stronger controls;
- a validated environmental-impact methodology is introduced;
- a virtual currency, shop, trading, gifting, or real-money feature is proposed.
