# Community Identity Data Model

- **Status:** Accepted
- **Date:** 2026-07-20
- **Source:** ADR-0008 Community Identity, Local Leaderboards, and Virtual Economy Scope
- **Purpose:** Define the data model changes for Region, UserProfile, Quest, and XpTransaction to support community identity and geographically scoped leaderboards.

> This document records accepted data model direction. It does not claim that migrations, seed data, or EF Core configuration have been implemented.

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

- Unique index on `(Name, Type, ParentRegionId)` to prevent duplicate region entries within the same parent scope.
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

## 2. UserProfile — New Column

### 2.1 HomeCommunityRegionId

| Column | Type | Constraints |
|--------|------|-------------|
| `HomeCommunityRegionId` | `uuid?` | Nullable. FK → `Region.Id`. |

### 2.2 Business Rules

- Nullable. A Member is not required to select a Home Community.
- When set, must reference an active Region of type `LocalArea` (or the most granular supported type).
- Changing the value is subject to a cooldown (enforced in the application layer, not at the database level).
- No history table for past selections. The previous value is overwritten on change.
- Deleted when the `UserProfile` is deleted (standard cascade or manual removal).

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
- Nullable: self-reported completions (which earn no XP) do not set this field, and historical XP transactions from before this column was added may have null values.
- **Must not be recalculated or updated** when the user later changes their Home Community (see `specs/testing/01-community-leaderboard-and-privacy-tests.md` §4).
- Leaderboard queries for a community scope (`My Community`) use this snapshot field, **not** the user's current `UserProfile.HomeCommunityRegionId`.

### 4.3 Leaderboard Query Pattern (Conceptual)

For the "My Community" scope, the effective query filters `XpTransaction` by:

```text
CommunityRegionIdAtAward == <user's ancestor region matching the requested scope>
  AND IsVerified == true
  AND CreatedAt within the selected time period
```

Then aggregates XP per user and ranks.

For "Auckland" scope, the query finds all LocalArea regions under the Auckland AdministrativeArea and aggregates XP where `CommunityRegionIdAtAward` is any of those local areas.

For "New Zealand" scope, no community filter is applied (all verified XP nationwide).

## 5. Migration Notes

### 5.1 New Migration Required

A new EF Core migration must:

1. Create the `Regions` table with columns and indexes as defined in §1.
2. Add `HomeCommunityRegionId` (nullable FK → `Regions.Id`) to the `UserProfiles` table (or equivalent Identity-related user profile table).
3. Add `ShowCommunityOnPassport` (bool, default false) to the user profile table.
4. Add `LocationRegionId` (nullable FK → `Regions.Id`) to the `Quests` table.
5. Add `CommunityRegionIdAtAward` (nullable FK → `Regions.Id`) to the `XpTransactions` table.

### 5.2 Existing Data

- Existing `UserProfiles`: `HomeCommunityRegionId` starts as null.
- Existing `Quests`: `LocationRegionId` starts as null. Existing quests may be backfilled with appropriate region values as seed data or manual update.
- Existing `XpTransactions`: `CommunityRegionIdAtAward` starts as null. Historical leaderboard queries for "My Community" scope will exclude transactions with null snapshot values.

### 5.3 Seed Data

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

builder.HasIndex(r => new { r.Name, r.Type, r.ParentRegionId })
    .IsUnique();

builder.HasIndex(r => new { r.Type, r.IsActive });
```

### 6.2 UserProfile Configuration (Excerpt)

```csharp
builder.HasOne<UserProfile>()
    .WithMany()
    .HasForeignKey(p => p.HomeCommunityRegionId)
    .OnDelete(DeleteBehavior.SetNull);
```

### 6.3 Quest Configuration (Excerpt)

```csharp
builder.HasOne<Region>()
    .WithMany()
    .HasForeignKey(q => q.LocationRegionId)
    .OnDelete(DeleteBehavior.SetNull);
```

### 6.4 XpTransaction Configuration (Excerpt)

```csharp
builder.HasOne<Region>()
    .WithMany()
    .HasForeignKey(x => x.CommunityRegionIdAtAward)
    .OnDelete(DeleteBehavior.SetNull);
```

`SetNull` is used for all Region foreign keys: deactivating a Region does not delete historical data.

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
- `03-database.md` (database rules and migration governance)
- `01-architecture.md` (Clean Architecture Lite layering)