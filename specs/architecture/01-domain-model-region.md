# Region Domain Model

- **Status:** Accepted
- **Date:** 2026-07-20
- **Source:** ADR-0008 Community Identity, Local Leaderboards, and Virtual Economy Scope
- **Purpose:** Define the hierarchical Region domain model for community identity, quest location, and leaderboard scoping.

> This document records accepted architecture direction. It does not claim that the database, migrations, API, or seed data have been implemented.

## 1. Region Entity

The Region entity models a hierarchical geographic area. It supports community identity, quest location, and leaderboard scoping without assuming that every country uses identical administrative terminology.

### Conceptual Model

```text
Region
- Id (GUID)
- Name (string)
- Type (RegionType enum)
- ParentRegionId (GUID?, nullable)
- IsActive (bool)
```

### RegionType Enum

Initial values:

```text
Country
AdministrativeArea
LocalArea
```

The set is extensible. Do not add a new type without an accepted specification or ADR.

### Hierarchy Example (Initial Auckland Seed)

```text
New Zealand (Country)
└── Auckland (AdministrativeArea)
    ├── Henderson-Massey (LocalArea)
    ├── Waitākere Ranges (LocalArea)
    ├── Albert-Eden (LocalArea)
    └── other supported local areas
```

The exact Auckland seed list must use an approved and stable regional source. Do not invent informal boundaries as authoritative administrative regions.

## 2. Domain Invariants

1. **Every Region has a Type.** The type determines its role in the hierarchy.
2. **ParentRegionId is self-referencing.** A Region may have a parent Region of a broader type (e.g. a LocalArea belongs to an AdministrativeArea).
3. **A Country-level Region has no parent.** `ParentRegionId` is null for Country regions.
4. **Name is required** and must be non-empty.
5. **IsActive controls availability.** Inactive regions are excluded from community selection, leaderboard scopes, and quest location options. Historical data (XP snapshots, past quest locations) must reference the Region by Id and must not be deleted or orphaned when a Region is deactivated.
6. **Type ordering is not enforced by the database.** The application layer validates that a LocalArea cannot be the parent of a Country. Do not add a database constraint that assumes a fixed depth or type order.

## 3. Relationships to Other Domains

### UserProfile

```text
UserProfile.HomeCommunityRegionId → Region.Id
```

- Nullable. A Member may not have selected a Home Community.
- When set, must reference an active Region of type LocalArea (or the most granular supported type).
- Changing the Home Community must respect the cooldown business rule (see `specs/product/02-community-identity-and-gamification-scope-update.md`).

### Quest

```text
Quest.LocationRegionId → Region.Id
```

- Nullable. Not all quests have a specific geographic region (e.g. online challenges).
- May reference any active Region at any hierarchy level, depending on how precise the quest location is defined.
- Used for filtering quests by region and for future regional impact metrics.

### XpTransaction

```text
XpTransaction.CommunityRegionIdAtAward → Region.Id
```

- Nullable. Set at the time XP is awarded for verified completions only when the user has a Home Community.
- Snapshots the user's Home Community at the moment of the award.
- **Must not be recalculated or updated** when the user later changes community.
- Leaderboard queries for community-attribution scopes (My Community, Auckland) use this snapshot field, not the user's current Home Community.

### Unattributed XP Rule

- Verified XP earned without a Home Community keeps a null `CommunityRegionIdAtAward`.
- Unattributed XP contributes to personal progression (levels, ranks, achievements, Passport) and the **New Zealand** leaderboard.
- Unattributed XP does **not** contribute to **My Community** or **Auckland** community-attribution leaderboards.
- Later community selection does not retroactively assign unattributed XP.

## 4. Seed Data Governance

- Region seed data is managed through EF Core seed classes in `Kiwimpact.Infrastructure`, not through migrations.
- The seed must be idempotent (safe to run repeatedly).
- Adding a new local area requires updating the seed class and is a normal development task, not an ADR.
- Changing the Region model (new types, new hierarchy rules, or a fundamental restructure) requires an ADR or accepted specification update.
- The Auckland local-area list must cite its approved source (e.g. Stats NZ, LINZ, or an accepted official regional classification).

## 5. Repository Interface

The Region repository should expose at minimum:

- `GetByIdAsync(Guid id)` — single Region by Id
- `GetActiveByTypeAsync(RegionType type, Guid? parentId)` — active regions filtered by type and optional parent
- `GetActiveChildrenAsync(Guid parentId)` — active child regions
- `GetAncestorsAsync(Guid regionId)` — the ancestor chain for a given region, useful for scope expansion (e.g. a LocalArea → its AdministrativeArea → its Country)

These are application needs, not an exhaustive interface contract. Add methods as required by service implementations.

## 6. Layering

- **Core:** Region entity, RegionType enum, IRegionRepository interface.
- **Infrastructure:** RegionConfiguration (EF Core), RegionRepository implementation, RegionSeed.
- **Api:** Region-related DTOs (read-only list responses for the community selector), RegionController (read-only public endpoints for the community selector).

The community selector needs a read-only public endpoint returning active LocalArea regions (or the active hierarchy). This does not expose administrative Region CRUD in the MVP.

## 7. Future Expansion Notes

The model supports future expansion without schema changes:

- Adding regions beyond Auckland (new seed data);
- Adding new RegionTypes (e.g. `Ward`, `District`, `Region`);
- Multi-country support (multiple Country-level regions);
- Regional comparison metrics (completions by members of a region vs completions at quests in a region).

These are capability notes, not MVP commitments.

## 8. Related Documents

- ADR-0008: Community Identity, Local Leaderboards, and Virtual Economy Scope
- `specs/product/02-community-identity-and-gamification-scope-update.md`
- `specs/data/01-community-identity-data-model.md`
- `specs/security/01-community-privacy-rules.md`