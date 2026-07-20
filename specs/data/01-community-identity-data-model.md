# Community Identity Data Model

- **Status:** Accepted
- **Date:** 2026-07-20
- **Source:** ADR-0008 Community Identity, Local Leaderboards, and Virtual Economy Scope
- **Purpose:** Define the data model changes for Region, UserProfile, Quest, and XpTransaction to support community identity and geographically scoped leaderboards.

> This document records accepted data model direction. It does not claim that migrations, seed data, or EF Core configuration have been implemented. Exact column types, migration structure, and EF Core configuration are verified after scaffold.

## 1. New Entity: Region

### 1.1 Table

| Column | Type | Constraints |
|--------|------|-------------|
| `Id` | `uuid` | PK, not null |
| `Name` | `text` (max 200) | Not null |
| `Type` | `text` (max 50) | Not null. Stores the `RegionType` enum as a string. |
| `ParentRegionId` | `uuid?` | Nullable. FK → `Region.Id`. Self-referencing. |
| `IsActive` | `bool` | Not null, default `true`. |
| `CreatedAt` | `timestamp with time zone` | Not null. |
| `UpdatedAt` | `timestamp with time zone` | Not null. |

### 1.2 Indexes

- Unique index on `(Name, Type, ParentRegionId)` using `NULLS NOT DISTINCT` (PostgreSQL 15+) to correctly handle null parent regions for root-level entries.
  - If `NULLS NOT DISTINCT` is not available or suitable, use separate indexes: a filtered unique index on `(Name, Type)` where `ParentRegionId IS NULL` for root regions, and a standard unique index on `(Name, Type, ParentRegionId)` where `ParentRegionId IS NOT NULL` for child regions.
- Index on `(Type, IsActive)` for the community selector query (filter active regions by type).
- Index on `ParentRegionId` for hierarchy traversal.

### 1.3 RegionType Enum (Core)

```csharp
public enum RegionType
{
    Country,
    AdministrativeArea,
    LocalArea
}
```

Stored as a string in the database for readability and migration safety.

### 1.4 Navigation Properties

```csharp
public Region? ParentRegion { get; set; }
public ICollection<Region> ChildRegions { get; set; } = new List<Region>();
```

## 2. UserProfile — New Columns

These are initial schema additions or a later additive migration, depending on when the UserProfile table is created relative to the Region table.

### 2.1 HomeCommunityRegionId

| Column | Type | Constraints |
|--------|------|-------------|
| `HomeCommunityRegionId` | `uuid?` | Nullable. FK → `Region.Id`. |

### 2.2 Business Rules

- Nullable. A Member is not required to select a Home Community.
- When set, must reference an active Region of type `LocalArea` (or the most granular supported type).
- Changing the value is subject to a cooldown (enforced in the application layer, not at the database level).
- No history table for past selections. The previous value is overwritten on change.
- Removed when the `UserProfile` is deleted.

### 2.3 ShowCommunityOnPassport

| Column | Type | Constraints |
|--------|------|-------------|
| `ShowCommunityOnPassport` | `bool` | Not null, default `false`. |

Controls whether the Home Community label appears on the Member's own Passport view. Does not affect Share Cards (Home Community is never on Share Cards).

## 3. Quest — New Column

### 3.1 LocationRegionId

| Column | Type | Constraints |
|--------|------|-------------|
| `LocationRegionId` | `uuid?` | Nullable. FK → `Region.Id`. |

### 3.2 Business Rules

- Nullable. Online or location-agnostic quests may have no region.
- May reference any active Region at any hierarchy level (Country, AdministrativeArea, or LocalArea).
- Used for discovery filtering and future regional impact metrics.
- This is the quest's location, not any user's Home Community. The privacy rules in `specs/security/01-community-privacy-rules.md` §4 apply.

## 4. XpTransaction — New Column

### 4.1 CommunityRegionIdAtAward

| Column | Type | Constraints |
|--------|------|-------------|
| `CommunityRegionIdAtAward` | `uuid?` | Nullable. FK → `Region.Id`. |

### 4.2 Business Rules

- Set at the time XP is awarded for verified completions.
- Snapshots the user's `HomeCommunityRegionId` at the moment of the award.
- Null when the user had no Home Community at the time of award.
- Self-reported completions do not create XP transactions.
- **Must not be recalculated or updated** when the user later changes their Home Community.
- Leaderboard queries for community-attribution scopes (My Community, Auckland) use this snapshot field, **not** the user's current `UserProfile.HomeCommunityRegionId`.

### 4.3 Unattributed XP Rule

- Verified XP earned without a Home Community keeps a null `CommunityRegionIdAtAward`.
- Unattributed XP contributes to personal progression and the New Zealand leaderboard.
- Unattributed XP does not contribute to My Community or Auckland community-attribution leaderboards.
- Later community selection does not retroactively assign unattributed XP.

### 4.4 Leaderboard Query Pattern (Conceptual)

Leaderboard-eligible XP transactions are those created by verified completions (self-reported completions do not create XP transactions).

For the "My Community" scope, the effective query filters `XpTransaction` by:

```text
CommunityRegionIdAtAward == <user's Home Community Region ID>
  AND <leaderboard-eligible>
  AND CreatedAt within the selected time period
```

Then aggregates XP per user and ranks.

For "Auckland" scope, the query finds all LocalArea regions under the Auckland AdministrativeArea and aggregates XP where `CommunityRegionIdAtAward` is any of those local areas (null snapshots excluded).

For "New Zealand" scope, all leaderboard-eligible XP is counted regardless of `CommunityRegionIdAtAward`.

## 5. Migration Notes

### 5.1 Migration Strategy

Whether the Region and community-identity columns are part of the initial
schema or a later additive migration depends on when the Region table and
related tables are first scaffolded. In either case the schema must include:

1. Create the `Regions` table with columns and indexes as defined in §1.
2. Add `HomeCommunityRegionId` (nullable FK → `Regions.Id`) to the user profile table.
3. Add `ShowCommunityOnPassport` (bool, default false) to the user profile table.
4. Add `LocationRegionId` (nullable FK → `Regions.Id`) to the `Quests` table.
5. Add `CommunityRegionIdAtAward` (nullable FK → `Regions.Id`) to the `XpTransactions` table.

The exact migration implementation is verified after scaffold.

### 5.2 Seed Data

Region seed data is managed through a dedicated `RegionSeed` class in `Kiwimpact.Infrastructure`, not through migrations. The seed is idempotent.

The initial seed includes:

- New Zealand (Country)
- Auckland (AdministrativeArea, parent: New Zealand)
- Auckland local areas (LocalArea, parent: Auckland) from an approved source

## 6. EF Core Configuration Excerpts

### 6.1 RegionConfiguration

```csharp
builder.ToTable("Regions");

builder.HasKey(r => r.Id);

builder.Property(r => r.Name)
    .IsRequired()
    .HasMaxLength(200);

builder.Property(r => r.Type)
    .IsRequired()
    .HasMaxLength(50)
    .HasConversion<string>();

builder.Property(r => r.IsActive)
    .IsRequired()
    .HasDefaultValue(true);

builder.HasOne(r => r.ParentRegion)
    .WithMany(r => r.ChildRegions)
    .HasForeignKey(r => r.ParentRegionId)
    .OnDelete(DeleteBehavior.Restrict);

// Region-name uniqueness within a parent scope requires careful NULL
// handling for root regions (ParentRegionId IS NULL). The exact EF Core
// configuration is selected at scaffold time after verifying the target
// PostgreSQL version and EF Core provider capabilities.

builder.HasIndex(r => new { r.Type, r.IsActive });
```

### 6.2 UserProfile Configuration (Excerpt)

```csharp
builder.HasOne<Region>()
    .WithMany()
    .HasForeignKey(p => p.HomeCommunityRegionId)
    .OnDelete(DeleteBehavior.Restrict);
```

### 6.3 Quest Configuration (Excerpt)

```csharp
builder.HasOne<Region>()
    .WithMany()
    .HasForeignKey(q => q.LocationRegionId)
    .OnDelete(DeleteBehavior.Restrict);
```

### 6.4 XpTransaction Configuration (Excerpt)

```csharp
builder.HasOne<Region>()
    .WithMany()
    .HasForeignKey(x => x.CommunityRegionIdAtAward)
    .OnDelete(DeleteBehavior.Restrict);
```

`Restrict` is used for all Region foreign keys: Regions referenced by historical data cannot be deleted. Normal deactivation uses the `IsActive` flag.

## 7. Conceptual Entity Relationships

```text
Region (1) ──── (0..*) Region (self-referencing parent/child)
Region (1) ──── (0..*) UserProfile (HomeCommunityRegionId)
Region (1) ──── (0..*) Quest (LocationRegionId)
Region (1) ──── (0..*) XpTransaction (CommunityRegionIdAtAward)
```

## 8. Related Documents

- ADR-0008: Community Identity, Local Leaderboards, and Virtual Economy Scope
- `specs/product/02-community-identity-and-gamification-scope-update.md`
- `specs/architecture/01-domain-model-region.md`
- `specs/security/01-community-privacy-rules.md`
- `specs/testing/01-community-leaderboard-and-privacy-tests.md`
- `.clinerules/03-database.md` (database rules and migration governance)
- `.clinerules/01-architecture.md` (Clean Architecture Lite layering)
