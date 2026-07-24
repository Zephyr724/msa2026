# Slice 1 — Regions and Public Quest Read

- **Status:** Implemented / Merged / Frozen
- **Date:** 2026-07-22
- **Historical branch:** `feat/slice-1-region-quest-read`
- **Predecessor:** Slice 0 Foundation
- **Historical implementation agent:** DeepSeek through Cline
- **Historical review agent:** Codex, read-only
- **Closure:** Merged through PR #3 and frozen

## 1. Objective

Deliver Kiwimpact's first data-backed public vertical slice.

A Guest must be able to:

1. retrieve the active Auckland Region hierarchy;
2. browse published Quests from PostgreSQL;
3. filter, search, sort, and paginate published Quests;
4. open a public Quest detail page;
5. view Quest images and safe source information;
6. use the experience on desktop and mobile without authentication.

This slice activates the first EF Core migration, PostgreSQL integration-test
project, Region system seed, and fictional development Quest seed.

## 2. Preconditions and Prerequisite Transition Workflow

Do not begin Slice 1 implementation until all prerequisites below are satisfied.

### 2.1 Current planning-branch state

The planning branch already exists:

```text
feat/slice-1-region-quest-read
```

Do not run `git switch -c feat/slice-1-region-quest-read` again.

Before any branch transition:

1. place substantial task prompts under `specs/ai/prompts/`;
2. place genuine completed review outputs under `specs/ai/reviews/`;
3. obtain independent approval of this plan;
4. commit only the approved plan and its review evidence on the existing Slice 1
   branch;
5. leave application source unchanged.

### 2.2 Separate prerequisite branch

Repository prerequisites must be corrected separately from Slice 1 feature work.

A human performs:

```bash
git switch main
git pull --ff-only
git switch -c chore/slice-1-prerequisites
```

That prerequisite branch may change only:

```text
PROJECT_STATUS.md
.github/workflows/
documentation directly required to describe verified CI commands
```

It must:

- correct stale Slice 0 status claims;
- add basic GitHub Actions CI using commands already verified by Slice 0;
- pass independent review;
- be merged into `main` through a separate pull request.

Docker installation is a human-machine prerequisite and is not committed to
the repository. Before implementation, the human must verify:

```bash
docker version
docker info
```

### 2.3 Bring corrected main into the existing Slice 1 branch

After the prerequisite pull request is merged:

```bash
git switch main
git pull --ff-only
git switch feat/slice-1-region-quest-read
git merge main
```

Do not rebase, delete, recreate, or force-update the Slice 1 branch.

Then verify:

```bash
git merge-base --is-ancestor main HEAD
git status --short
docker version
docker info
```

Implementation may begin only when:

1. Slice 0 and the prerequisite PR are present in `main`;
2. `PROJECT_STATUS.md` matches the actual repository;
3. basic CI is green;
4. Docker is installed and available;
5. the Slice 1 plan and review artifacts are correctly classified;
6. the working tree is clean;
7. the current branch is `feat/slice-1-region-quest-read`.

If any precondition is false, stop and report it. Do not work around it inside
the feature implementation.

## 3. Required Reading

Read before changing files:

```text
AGENTS.md
PROJECT_STATUS.md
README.md

.clinerules/00-harness-core.md
.clinerules/01-architecture.md
.clinerules/02-technology-stack.md
.clinerules/03-database.md
.clinerules/04a-security-baseline.md
.clinerules/04b-auth-security.md
.clinerules/04c-dependency-security.md
.clinerules/04d-runtime-security.md
.clinerules/05-testing.md
.clinerules/06-development-workflow.md
.clinerules/07-agent-workflow.md
.clinerules/08-typescript.md
.clinerules/09-msa-assessment.md
.clinerules/11-git-branch-and-merge-safety.md

specs/Kiwimpact_Final_Planning_Baseline_v1.0.md
specs/00-project-profile.md
specs/product/01-product-requirements.md
specs/product/02-community-identity-and-gamification-scope-update.md
specs/architecture/01-domain-model-region.md
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/data/01-community-identity-data-model.md
specs/security/01-community-privacy-rules.md
specs/adr/ADR-0001-use-postgresql.md
specs/adr/ADR-0002-use-identity-cookie-authentication.md
specs/adr/ADR-0003-use-clean-architecture-lite.md
specs/adr/ADR-0004-use-react-vite-tailwind-daisyui.md
specs/adr/ADR-0005-use-tanstack-query-and-zustand.md
specs/adr/ADR-0007-use-postgresql-integration-tests.md
specs/implementation/00-slice-0-foundation.md
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
specs/ai/reviews/14-slice-0-final-codex-commit-readiness-review-2026-07-22.md

backend/src/Kiwimpact.Api/Program.cs
backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs
backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs
backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj

frontend/src/app/router.tsx
frontend/src/lib/api/apiFetch.ts
frontend/src/app/providers.tsx
frontend/src/index.css
frontend/package.json
frontend/vite.config.ts
```

## 4. Scope

### 4.1 Backend domain and application scope

Implement only:

- `Region`;
- `Quest`;
- `QuestImage`;
- the enums required by those three entities;
- Region read repository and application service;
- Quest public-read repository and application service;
- public API contracts for Regions, Quest discovery, Quest detail, and Quest
  images;
- PostgreSQL persistence, configuration, migration, and seed support needed by
  this slice;
- the minimal Identity persistence prerequisite described in Section 7.

### 4.2 Public API scope

Implement these accepted anonymous endpoints:

```text
GET /api/v1/regions
GET /api/v1/regions/{id}
GET /api/v1/regions/{id}/children
GET /api/v1/regions/{id}/ancestors

GET /api/v1/quests
GET /api/v1/quests/{id}
GET /api/v1/quests/{id}/images
```

### 4.3 Frontend scope

Implement:

```text
/quests
/quests/:questId
```

The existing home page may receive a navigation link or call-to-action to
`/quests`, but it must not be redesigned beyond what this slice needs.

### 4.4 Testing scope

Implement:

- backend unit tests for pure Region and query-validation rules;
- a new `Kiwimpact.IntegrationTests` project;
- PostgreSQL Testcontainers;
- real EF Core migration application in integration tests;
- repository integration tests;
- public API integration tests through `WebApplicationFactory`;
- frontend unit/integration tests for discovery and detail states;
- runtime verification against local PostgreSQL.

## 5. Explicit Non-goals

Do not implement:

- registration, login, logout, cookies, antiforgery, Google login, email, roles,
  password flows, or authenticated account UI;
- `UserProfile` or Home Community selection/mutation;
- Organizer/Admin Quest CRUD;
- Quest create, edit, publish, cancel, archive, or delete endpoints;
- participation, join, cancel, or tracking;
- Completion Codes;
- Evidence Claims;
- SelfReported completion;
- XP, levels, ranks, streaks, achievements, Passport, leaderboards, or
  Community Challenges;
- SignalR;
- Google Maps;
- admin source-review workflows;
- source scraping, previews, server-side external URL fetching, or automated
  source checking;
- image upload;
- Cypress E2E;
- deployment configuration;
- CI redesign beyond the prerequisite basic CI;
- new architecture frameworks, MediatR, AutoMapper, CQRS, GraphQL, event bus,
  generic repository framework, or another state manager/UI framework.

Do not weaken an accepted schema invariant to avoid a sequencing problem.

## 6. Architecture Constraints

Use the accepted three-production-project structure:

```text
Kiwimpact.Api
Kiwimpact.Core
Kiwimpact.Infrastructure
```

Add the accepted test project:

```text
Kiwimpact.IntegrationTests
```

Reference direction:

```text
Kiwimpact.Core
  -> no Kiwimpact project references

Kiwimpact.Infrastructure
  -> Kiwimpact.Core

Kiwimpact.Api
  -> Kiwimpact.Core
  -> Kiwimpact.Infrastructure

Kiwimpact.UnitTests
  -> Kiwimpact.Core

Kiwimpact.IntegrationTests
  -> Kiwimpact.Api
  -> Kiwimpact.Core
  -> Kiwimpact.Infrastructure
```

Layer responsibilities:

- **Api:** controllers, request/query contracts, public response DTOs, manual
  response mapping, Problem Details, composition root.
- **Core:** entities, enums, repository interfaces, application service
  interfaces and implementations, query objects, paged result type, pure
  validation and hierarchy rules.
- **Infrastructure:** EF Core configurations, repositories, Identity storage
  prerequisite, migrations, Region seed, development/demo seed.
- **Controllers:** HTTP parameter mapping and status responses only.
- **Application services:** orchestration and validation; no `DbContext`.
- **Repositories:** all EF Core access.
- **Core:** no `IServiceCollection`, EF Core, ASP.NET Core, Infrastructure, or
  Api dependency.
- Use manual mapping. Do not add AutoMapper.

## 7. Identity Persistence Sequencing Gate

### 7.1 Problem

The accepted Quest schema requires:

```text
Quest.CreatedByUserId
  -> non-null FK to AspNetUsers.Id
```

Authentication endpoints and cookie flows are intentionally out of scope, but
the Quest table must not be created with:

- a nullable temporary owner;
- no foreign key;
- a fake non-Identity owner table;
- a raw owner GUID without referential integrity;
- a migration that knowingly violates the accepted schema.

### 7.2 Exact persistence-only design

This slice may introduce only the Identity persistence types required to create
the accepted tables and Quest owner foreign key.

Infrastructure defines public persistence types with valid class bodies:

```csharp
public sealed class ApplicationUser : IdentityUser<Guid>
{
}

public sealed class ApplicationRole : IdentityRole<Guid>
{
}
```

`KiwimpactDbContext` remains publicly accessible and becomes:

```csharp
public sealed class KiwimpactDbContext
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    // DbSets, constructor, and model configuration remain here.
}
```

The three public types above remain Infrastructure persistence implementation
types. Public accessibility is required for a coherent public generic base
construction and design-time/runtime DbContext use; it does not make them Core
domain types, API contracts, or public response DTOs.

Requirements:

- call `base.OnModelCreating(modelBuilder)` before Kiwimpact entity
  configuration;
- use the standard Guid-key Identity entity types produced by that base context,
  including Guid user/role keys;
- keep `ApplicationUser`, `ApplicationRole`, `KiwimpactDbContext`, and all
  Identity-specific EF configuration inside Infrastructure;
- Core entities do not reference Infrastructure Identity types;
- configure the Quest creator relationship in Infrastructure:

  ```csharp
  builder.HasOne<ApplicationUser>()
      .WithMany()
      .HasForeignKey(quest => quest.CreatedByUserId)
      .IsRequired()
      .OnDelete(DeleteBehavior.Restrict);
  ```

### 7.3 No Identity or authentication service activation

Migrations require the Identity EF model, not Identity runtime services.

This slice must not call or register:

```text
AddIdentity
AddIdentityCore
AddDefaultIdentity
AddAuthentication
AddCookie
AddAuthorization
MapIdentityApi
UseAuthentication
UseAuthorization
```

It must not add:

- `UserManager<ApplicationUser>`;
- `SignInManager<ApplicationUser>`;
- `RoleManager<ApplicationRole>`;
- cookie schemes or handlers;
- auth controllers/endpoints;
- antiforgery token flow;
- password/token configuration;
- authorization policies;
- Google OAuth;
- frontend auth state or pages.

Any technical need to register Identity/auth services is a stop condition
requiring separate human approval.

### 7.4 Development-only curator row

The fictional development Quest seed may create one deterministic
`ApplicationUser` directly through `KiwimpactDbContext`, not through
`UserManager`.

The row must:

- use a deterministic Guid reserved for development seed data;
- use a clearly reserved username such as `dev-seed-curator`;
- use an address under the reserved `.invalid` domain, for example
  `dev-seed-curator@kiwimpact.invalid`;
- set normalized username/email consistently;
- have `PasswordHash = null`;
- have no external login, claim, token, or role rows;
- be disabled for future sign-in by an explicit Development-only marker or
  deterministic reserved identity policy documented for the Authentication
  slice;
- never be created outside explicitly enabled Development/demo seeding;
- never collide with a user-created or Google-authenticated account.

The completion report must record the deterministic ID, reserved identifier
policy, and proof that no secret/password was created.

### 7.5 Boundary verification

Integration tests must prove:

- the Identity tables exist after migration;
- Quest has a required FK to `AspNetUsers.Id`;
- deleting the curator is restricted while referenced;
- `PasswordHash` is null;
- no role, claim, login, or token rows are seeded;
- `UserManager<ApplicationUser>`, `SignInManager<ApplicationUser>`, and
  `RoleManager<ApplicationRole>` are not resolvable;
- the endpoint data source contains no Identity/auth endpoints;
- no authentication scheme or cookie handler is registered;
- anonymous public Region/Quest APIs still work.

### 7.6 Review requirement

Codex must explicitly review and approve this sequencing boundary.

If Codex rejects the persistence-only design, the safe alternative is:

1. reduce this slice to Region read only;
2. implement Authentication/Profile before Quest persistence;
3. implement public Quest read in the following slice.

Do not resolve a rejection by weakening `CreatedByUserId`.

## 8. Domain Model

### 8.1 Region

Implement the accepted fields:

```text
Id                 Guid
Name               string, required, max 200
Type               RegionType stored as string, max 50
ParentRegionId     Guid?, self-reference
IsActive           bool, default true
CreatedAt          DateTimeOffset
UpdatedAt          DateTimeOffset
```

`RegionType`:

```text
Country
AdministrativeArea
LocalArea
```

Rules:

- Country has no parent.
- Name is non-empty.
- Parent type must be broader than child type.
- `IsActive=false` removes the Region from all public Region and Quest-filter
  operations.
- Deactivate; do not delete referenced Regions.
- Region foreign keys use `Restrict`.
- Database does not enforce fixed hierarchy depth/type order; Core validation
  does.

### 8.2 Quest

Implement the accepted fields:

```text
Id                    Guid
Title                 string, required, max 200
Description           string, required, max 2000
Category              QuestCategory stored as string, max 50
Status                QuestStatus stored as string, max 50
SourceType            QuestSourceType stored as string, max 50
RegistrationMode      RegistrationMode?, stored as string, max 50
Difficulty            QuestDifficulty stored as string, max 50
XpAward               int, >= 0
Capacity              int?, null = unlimited
StartAtUtc            DateTimeOffset?
EndAtUtc              DateTimeOffset?
LocationRegionId      Guid?
LocationDescription   string?, max 500
ExternalSourceUrl     string?, max 2000
ExternalSourceStatus  ExternalSourceStatus?, max 50
SourceCheckedAt       DateTimeOffset?
NextCheckDueAt        DateTimeOffset?
CreatedByUserId       Guid, non-null FK to AspNetUsers.Id
Version               uint, EF concurrency token mapped to PostgreSQL xmin
CreatedAt             DateTimeOffset
UpdatedAt             DateTimeOffset
```

Enums must exactly match the accepted core data model.

This slice reads only `Status=Published` from public endpoints.

### 8.3 QuestImage

Implement:

```text
Id            Guid
QuestId       Guid, FK to Quest, Cascade delete
ImageUrl      string, required, max 2000
AltText       string, required, max 300
SortOrder     int, default 0
IsCover       bool, default false
CreatorName   string?, max 200
SourceUrl     string?, max 2000, HTTPS when present
LicenceNote   string?, max 500
```

Rules:

- every seeded Published Quest has at least one cover image;
- image records are distinct from completion evidence;
- public ordering is `SortOrder ASC`, then `Id ASC`.

## 9. EF Core Configuration and Indexes

### 9.1 Region

Configure:

- primary key;
- required lengths and string enum conversion;
- self-reference with `Restrict`;
- unique `(Name, Type, ParentRegionId)` using PostgreSQL
  `NULLS NOT DISTINCT` when supported by the pinned provider;
- otherwise use the accepted pair of partial unique indexes;
- index `(Type, IsActive)`;
- index `ParentRegionId`.

### 9.2 Quest

Configure:

- primary key;
- required lengths and enum string conversions;
- `XpAward >= 0` check constraint;
- `Capacity IS NULL OR Capacity >= 0` check constraint;
- Region FK with `Restrict`;
- creator Identity FK with `Restrict`;
- optimistic concurrency using PostgreSQL's system `xmin` column;
- map `Quest.Version` as a generated row-version/concurrency token using the
  Npgsql-supported `uint` row-version mapping;
- the migration must not create a separate application-owned `Version` column;
  it must rely on PostgreSQL `xmin`;
- indexes supporting public reads:

  ```text
  (Status, StartAtUtc)
  (Status, Category)
  (Status, SourceType)
  (Status, Difficulty)
  (Status, LocationRegionId)
  ```

Do not add full-text search infrastructure in this slice.

### 9.3 QuestImage

Configure:

- primary key;
- Quest FK with `Cascade`;
- required lengths;
- index `(QuestId, SortOrder)`;
- index `(QuestId, IsCover)`.

Do not add an unapproved database rule requiring exactly one cover image. The
accepted rule is at least one cover image and will be enforced by write
services in the CRUD slice; seed validation enforces it now.

## 10. Migration Strategy

Create the first real migration in Infrastructure.

Suggested name:

```text
InitialRegionQuestRead
```

The migration must contain only the schema required by:

- minimal Identity persistence prerequisite;
- Regions;
- Quests;
- QuestImages.

For Quest concurrency:

- the EF model snapshot must record `Version` as a generated concurrency token;
- PostgreSQL `xmin` is the physical token;
- migration SQL must not add a normal user-defined `Version` column;
- a stale tracked Quest update must produce `DbUpdateConcurrencyException`.

It must not contain application/demo seed rows.

Use and record the verified repository commands, expected to be equivalent to:

```bash
cd backend

dotnet tool restore

dotnet ef migrations add InitialRegionQuestRead \
  --project src/Kiwimpact.Infrastructure \
  --startup-project src/Kiwimpact.Api \
  --output-dir Data/Migrations

dotnet ef database update \
  --project src/Kiwimpact.Infrastructure \
  --startup-project src/Kiwimpact.Api
```

Add a repository-local `dotnet-ef` tool manifest when one does not already
exist. Pin its version to the compatible .NET/EF Core major in the project.

Do not use `EnsureCreated`.

Update `PROJECT_STATUS.md` with the exact commands only after they have run
successfully.

## 11. Seed Strategy

### 11.1 Region system seed

Create an idempotent `RegionSeed` in Infrastructure.

Seed deterministic IDs for:

```text
New Zealand                         Country
Auckland                            AdministrativeArea
Auckland's 21 local board areas     LocalArea
```

Use the official Auckland Council local-board list.

Approved source for this implementation plan:

```text
Auckland Council — Local board plans 2026
https://akhaveyoursay.aucklandcouncil.govt.nz/local-board-plans-2026
```

The source identifies the 21 official local boards, including
Albert-Eden, Henderson-Massey, Devonport-Takapuna, and Waitākere Ranges.

Seed requirements:

- safe to run repeatedly;
- deterministic GUIDs;
- insert missing rows;
- correct accepted names/type/parent for matching deterministic rows;
- do not delete unknown or historical Regions;
- validate the hierarchy before saving;
- record source title, URL, and retrieval date in code comments or seed
  metadata and in the completion report;
- Region seed is not embedded in the migration.

### 11.2 Development/demo Quest seed

Create a separate idempotent development/demo seed.

Requirements:

- active only when explicitly enabled in Development configuration;
- 18 fictional Quests total;
- at least 14 Published so default pagination spans more than one page;
- include all six categories;
- include all source types and difficulties;
- include dated, undated, region-wide, LocalArea, and location-agnostic
  examples;
- include Draft, Cancelled, and Archived records to prove public visibility
  filtering;
- every Published Quest has a cover image;
- use local project-owned placeholder assets under
  `frontend/public/images/quests/`;
- use meaningful `AltText`;
- do not copy real provider event descriptions, logos, posters, or photos;
- any external demo URL must be HTTPS and clearly fictional/safe;
- use the deterministic development curator `CreatedByUserId`;
- no passwords, tokens, evidence, private profiles, or production-like
  credentials.

## 12. Repository and Application Services

### 12.1 Region repository interface

Core interface must support the accepted read needs, including:

```text
GetByIdAsync
GetActiveLocalAreasAsync(search)
GetActiveChildrenAsync
GetActiveAncestorsAsync
GetActiveDescendantIdsAsync
```

The exact method signatures may use query objects and cancellation tokens.

### 12.2 Quest read repository interface

Create a public-read-specific repository abstraction, not a generic repository.

It must support:

```text
GetPublishedPageAsync(query)
GetPublishedByIdAsync(id)
GetPublishedImagesAsync(id)
```

### 12.3 Application services

Create focused Core application services:

```text
IRegionReadService
IQuestDiscoveryService
```

Services own:

- query validation;
- page/pageSize bounds;
- enum/filter validation;
- active Region validation;
- region-descendant expansion;
- not-found outcomes;
- orchestration of repositories.

Repositories own EF translation and persistence access.

Controllers must not reference `KiwimpactDbContext`.

## 13. Public API Decisions

These are Slice-specific implementation decisions and must be reviewed by
Codex and approved by the human owner before implementation.

### 13.1 General conventions

- Base path `/api/v1`.
- Anonymous access.
- JSON responses.
- ISO 8601 UTC timestamps.
- Problem Details for errors.
- Cancellation tokens flow to async database operations.
- Public DTOs are explicit allowlists.
- No EF entity is serialized directly.

### 13.2 Region endpoints

#### `GET /api/v1/regions`

Purpose:

- return active `LocalArea` Regions for selectors;
- optional `search`;
- no pagination for the initial Auckland list.

Query:

```text
search: optional, trim whitespace, maximum 100 characters
```

Sort:

```text
Name ASC, Id ASC
```

Response item:

```json
{
  "id": "uuid",
  "name": "Henderson-Massey",
  "type": "LocalArea",
  "parentRegionId": "uuid"
}
```

#### `GET /api/v1/regions/{id}`

Return the active Region:

```json
{
  "id": "uuid",
  "name": "Auckland",
  "type": "AdministrativeArea",
  "parentRegionId": "uuid-or-null"
}
```

Return `404` when missing or inactive.

#### `GET /api/v1/regions/{id}/children`

- target must exist and be active;
- return active direct children only;
- sort `Name ASC, Id ASC`;
- `404` for missing/inactive target.

#### `GET /api/v1/regions/{id}/ancestors`

- target must exist and be active;
- return active ancestors from nearest parent to root;
- `404` for missing/inactive target.

### 13.3 Quest pagination

Defaults:

```text
page = 1
pageSize = 12
maximum pageSize = 50
```

Response:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 12,
  "totalCount": 0,
  "totalPages": 0,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

Invalid `page` or `pageSize` returns `400` validation Problem Details.

### 13.4 Quest filters

`GET /api/v1/quests` supports:

```text
category
sourceType
difficulty
regionId
search
sortBy
sortDirection
page
pageSize
```

Rules:

- enum values accept canonical enum names case-insensitively;
- invalid enum values return `400`;
- `search` is trimmed, maximum 100 characters;
- search matches `Title`, `Description`, and `LocationDescription`
  case-insensitively through parameterized EF/Npgsql translation;
- malformed `regionId` returns `400`;
- missing or inactive Region filter returns `400` validation Problem Details;
- all filters are server-side;
- only `Published` Quests are ever returned.

### 13.5 Region filter semantics

`regionId` matches:

```text
the selected active Region itself
plus all active descendant Regions
```

Examples:

- selecting a LocalArea matches that LocalArea only;
- selecting Auckland matches Auckland-wide Quests and Quests assigned to its
  active LocalArea descendants;
- a location-agnostic Quest with null `LocationRegionId` does not match a
  region filter.

No continuous location, GPS, address, or Home Community data is involved.

### 13.6 Quest sorting

Supported `sortBy`:

```text
startAt
createdAt
title
```

Supported `sortDirection`:

```text
asc
desc
```

Default:

```text
sortBy=startAt
sortDirection=asc
```

Default ordering is deterministic:

1. non-null `StartAtUtc` before null;
2. `StartAtUtc ASC`;
3. `CreatedAt DESC`;
4. `Id ASC`.

For explicit sort fields, always add `Id ASC` as a stable final tiebreaker.

Do not invent `Featured`; no such accepted Quest field exists.

### 13.7 Quest list DTO

```json
{
  "id": "uuid",
  "title": "Community Stream Cleanup",
  "description": "Plain-text description",
  "category": "CleanReduceWaste",
  "sourceType": "OrganizerOwned",
  "registrationMode": "Native",
  "difficulty": "Easy",
  "xpAward": 50,
  "capacity": 30,
  "startAtUtc": "2026-08-01T22:00:00Z",
  "endAtUtc": "2026-08-02T01:00:00Z",
  "locationRegion": {
    "id": "uuid",
    "name": "Henderson-Massey",
    "type": "LocalArea"
  },
  "locationDescription": "Plain-text location",
  "coverImage": {
    "id": "uuid",
    "imageUrl": "/images/quests/stream-cleanup.svg",
    "altText": "Volunteers collecting litter beside a stream"
  }
}
```

Do not include:

```text
CreatedByUserId
CreatedAt
UpdatedAt
NextCheckDueAt
internal ownership data
private user/community data
```

### 13.8 Quest detail DTO

Return all list fields plus the public source fields:

```json
{
  "externalSourceUrl": "https://...",
  "sourceCheckedAt": "2026-07-22T00:00:00Z"
}
```

Rules:

- only Published Quests are accessible;
- Draft, Cancelled, Archived, and missing Quests all return the same `404`;
- do not expose internal owner IDs;
- do not expose `NextCheckDueAt`;
- descriptions render as plain text; no raw HTML.

### 13.9 Quest images DTO

`GET /api/v1/quests/{id}/images`:

```json
[
  {
    "id": "uuid",
    "imageUrl": "/images/quests/stream-cleanup.svg",
    "altText": "Volunteers collecting litter beside a stream",
    "sortOrder": 0,
    "isCover": true,
    "creatorName": "Kiwimpact",
    "sourceUrl": null,
    "licenceNote": "Project-owned demo illustration"
  }
]
```

Return `404` when the Quest is missing or not Published.

## 14. Security and Privacy Requirements

- Public responses use allowlisted DTOs only.
- Public endpoints expose no user email, user ID, Home Community, evidence,
  review data, internal owner ID, password/token field, or private profile
  field.
- Inactive Regions are not public.
- Non-Published Quests are indistinguishable from missing Quests (`404`).
- Query parameters are validated and bounded.
- All database input uses EF Core LINQ or parameterized SQL.
- Do not concatenate SQL.
- Do not use `dangerouslySetInnerHTML`.
- Treat external source and image source URLs as untrusted links.
- The backend must never scrape, preview, download, follow, or fetch public
  external URLs.
- Frontend external links open with:

  ```text
  target="_blank"
  rel="noopener noreferrer"
  ```

- Show the accepted external-source disclaimer when an external URL exists:

  ```text
  Registration is managed by the original event provider.
  The official source is authoritative.
  Last checked: <date when available>
  ```

- Do not log full external URLs by default.
- Problem Details must not contain exception, SQL, path, stack-trace, or
  dependency-object details.
- Public endpoints remain anonymous; do not add authentication shortcuts or
  nullable actor behavior to future protected services.
- Run NuGet and npm vulnerability scans before completion.

## 15. Frontend Implementation Plan

### 15.1 State ownership

- TanStack Query owns Regions and Quest server state.
- URL search parameters own search, filters, sort, page, and page size.
- React local state may own temporary input state.
- Zustand must not store Quest lists, Quest detail, Regions, filters, sort, or
  pagination.

### 15.2 API modules, untrusted input, and types

Add focused modules such as:

```text
frontend/src/lib/api/regions.ts
frontend/src/lib/api/quests.ts
frontend/src/types/region.ts
frontend/src/types/quest.ts
frontend/src/lib/validation/regionDto.ts
frontend/src/lib/validation/questDto.ts
```

Use the existing shared `apiFetch`, but every new Region/Quest call must request
`unknown` at the HTTP boundary:

```ts
const payload = await apiFetch<unknown>(...);
```

Then validate and narrow before returning typed data to TanStack Query or
components.

Requirements:

- untrusted JSON begins as `unknown`;
- use explicit hand-written parsers/type guards for DTOs and paged responses;
- validate required object shape, strings, enum values, UUID strings, nullable
  timestamps, pagination metadata, Region nesting, and image DTOs;
- reject malformed payloads with a typed application error suitable for the
  existing recoverable error UI;
- never use `as Quest`, `as Region`, or unchecked generic typing to bypass
  validation;
- malformed-response tests are required for Region list, Quest page, Quest
  detail, and Quest images.

No runtime validation dependency is approved in this plan. Do not add Zod,
Valibot, io-ts, Axios, or another HTTP/validation dependency without a separate
approval and dependency review.

### 15.3 Routes

```text
/quests
/quests/:questId
```

The router must preserve the existing root and not-found routes.

### 15.4 Discover page

The page must include:

- semantic page heading;
- search input;
- category filter;
- source-type filter;
- difficulty filter;
- Region filter populated from `/api/v1/regions`;
- sort control;
- responsive Quest-card grid;
- pagination;
- loading skeletons;
- empty state;
- recoverable error state with retry;
- clear-filters action;
- preserved URL state across refresh and link sharing.

Quest cards show:

- cover image;
- title;
- category;
- difficulty;
- Region label when present;
- date/time or an accessible undated label;
- XP;
- registration/source indicator;
- link to detail.

All Quest cards must have an image. Missing/broken images use a project-owned
fallback with useful alt text.

### 15.5 Quest detail page

Show:

- cover image;
- title and plain-text description;
- category, difficulty, XP;
- dates;
- Region and location description;
- registration mode;
- safe external source block where applicable;
- all additional images from the images endpoint;
- loading, error, and not-found states;
- navigation back to discovery that preserves the prior query string where
  practical.

Do not show join, claim, complete, track, Organizer, or Admin actions.

### 15.6 Accessibility and responsive behavior

Verify:

- semantic headings and landmarks;
- form labels;
- keyboard-operable filters and pagination;
- visible focus states;
- useful image alt text;
- status messages that do not rely only on color;
- touch targets suitable for mobile;
- responsive cards at mobile, tablet, and desktop widths;
- reduced-motion preferences are not overridden;
- errors are recoverable and announced appropriately.

## 16. Testing Strategy

### 16.1 Backend unit tests

Add meaningful Core tests for:

- Region hierarchy type validation;
- Country parent rule;
- page/pageSize validation;
- enum/filter validation;
- deterministic sort selection;
- region-filter expansion orchestration where pure test boundaries permit.

Do not test EF behavior with mocks in unit tests.

### 16.2 Integration-test project

Create:

```text
backend/tests/Kiwimpact.IntegrationTests
```

Use:

- xUnit v3;
- `Microsoft.AspNetCore.Mvc.Testing`;
- Testcontainers PostgreSQL;
- real EF Core migrations;
- real Npgsql provider;
- `WebApplicationFactory`;
- isolated test data.

Do not use SQLite or EF InMemory for persistence/API claims.

The initial isolation strategy may use one temporary PostgreSQL container per
test collection with a unique database per test class when reliable. Record
the measured setup and cleanup approach in the completion report.

### 16.3 Migration and seed tests

Verify:

- empty PostgreSQL database migrates successfully;
- expected Identity, Region, Quest, and QuestImage tables exist;
- all required FK/delete rules and indexes exist;
- Region seed creates the accepted hierarchy;
- Region seed is idempotent;
- root Region uniqueness handles null parent correctly;
- demo Quest seed is Development-only and idempotent;
- every seeded Published Quest has a cover image;
- no migration embeds application seed rows;
- Quest `Version` maps to PostgreSQL `xmin` rather than a normal column;
- two DbContext instances loading the same Quest cause the second stale save to
  throw `DbUpdateConcurrencyException`;
- the Identity persistence-only boundary tests in Section 7.5 pass.

### 16.4 Repository integration tests

Regions:

- active LocalArea list only;
- case-insensitive search;
- inactive exclusion;
- children direct-only;
- ancestors nearest-to-root;
- descendant expansion;
- hierarchy/status behavior.

Quests:

- Published only;
- Draft/Cancelled/Archived excluded;
- all enum filters;
- case-insensitive search;
- selected Region plus active descendants;
- null Region behavior;
- page defaults and maximum;
- total metadata;
- stable default ordering;
- explicit sorting;
- detail visibility;
- images ordered deterministically.

### 16.5 API integration tests

Verify anonymous requests:

```text
GET /api/v1/regions
GET /api/v1/regions/{id}
GET /api/v1/regions/{id}/children
GET /api/v1/regions/{id}/ancestors
GET /api/v1/quests
GET /api/v1/quests/{id}
GET /api/v1/quests/{id}/images
```

Cover:

- `200` success;
- `400` invalid/bounded query values using Problem Details;
- `404` inactive/missing Region;
- `404` missing or non-Published Quest;
- pagination metadata;
- filters and default ordering;
- public DTO allowlist;
- absence of `CreatedByUserId`, Identity fields, and private data;
- Scalar/OpenAPI includes the new endpoints and query contracts.

### 16.6 Frontend tests

Use Vitest and React Testing Library with the existing approved fetch test
boundary.

Discover page:

- loading;
- data;
- empty;
- error/retry;
- filters update URL;
- initial URL restores controls;
- pagination updates URL;
- region options load;
- Quest cards render meaningful images and labels;
- card link preserves navigation intent.

Detail page:

- loading;
- success;
- not found;
- server error;
- images;
- external-source disclaimer;
- external link uses `noopener` and `noreferrer`;
- no join/complete action.

API-boundary validation:

- malformed Region-list response is rejected;
- malformed Quest-page response is rejected;
- malformed Quest-detail response is rejected;
- malformed Quest-image response is rejected;
- malformed data never reaches rendered components as a trusted DTO.

Do not add MSW or a runtime validation package without separate approval.

### 16.7 Runtime verification

With local PostgreSQL and both applications running, observe:

- Region endpoints;
- Quest list with default and filtered queries;
- Quest detail;
- Quest images;
- `400` Problem Details;
- `404` visibility behavior;
- Scalar docs;
- `/quests` desktop and mobile;
- `/quests/:id`;
- loading, empty, and recoverable error states;
- URL persistence;
- safe external link attributes;
- frontend still handles backend unavailability without crashing.

Use Playwright/browser inspection for visual and responsive claims.

## 17. Dependency Governance

The intended additions must be enumerated before installation and independently
reviewed.

Expected additions, subject to actual repository compatibility:

### Infrastructure/application persistence

```text
Microsoft.AspNetCore.Identity.EntityFrameworkCore
Microsoft.EntityFrameworkCore.Design
dotnet-ef local tool
```

`Microsoft.EntityFrameworkCore.Design` must be a private development/build-time
asset rather than a transitive runtime dependency:

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Design"
                  Version="<approved-compatible-version>">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>
    runtime; build; native; contentfiles; analyzers; buildtransitive
  </IncludeAssets>
</PackageReference>
```

`Npgsql.EntityFrameworkCore.PostgreSQL` should remain the existing provider
unless a compatible approved update is required.

### Integration tests

```text
xunit.v3
xunit.runner.visualstudio
Microsoft.NET.Test.Sdk
Microsoft.AspNetCore.Mvc.Testing
Testcontainers.PostgreSql
```

The VSTest runner must follow the same private development-asset pattern as the
existing UnitTests project:

```xml
<PackageReference Include="xunit.runner.visualstudio"
                  Version="<approved-compatible-version>">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>
    runtime; build; native; contentfiles; analyzers; buildtransitive
  </IncludeAssets>
</PackageReference>
```

The implementation must verify that `dotnet test` discovers and executes the
IntegrationTests project. An MTP-based alternative is not approved by this
plan; choosing one requires a separate plan amendment and independent review.

Rules:

- align Microsoft/EF/ASP.NET package majors with the repository's .NET 10 and EF
  Core major;
- keep xUnit v3 aligned with the accepted UnitTests setup unless a compatible
  approved update is required;
- use official NuGet packages and the official Testcontainers module;
- record exact requested and resolved versions;
- record package source/publisher;
- verify active maintenance and current release compatibility;
- record SPDX/license information and confirm compatibility with the project;
- run direct and transitive vulnerability scans;
- do not add a package only for convenience when platform/framework code is
  sufficient;
- any additional package requires explicit human approval before installation.

The completion report must include a table:

```text
Package | Purpose | Requested version | Resolved version | Publisher/source |
Maintenance evidence | License | Vulnerability result | Approval
```

## 18. Verification Commands

Discover exact commands from the repository and update this section only when
verified.

Expected backend commands:

```bash
cd backend
dotnet tool restore
dotnet restore
dotnet build
dotnet test
dotnet ef database update \
  --project src/Kiwimpact.Infrastructure \
  --startup-project src/Kiwimpact.Api
dotnet list package --vulnerable --include-transitive
```

Expected frontend commands:

```bash
cd frontend
npm ci
npm run lint
npm run type-check
npm run test -- --run
npm run build
npm audit --audit-level=high
```

Repository checks:

```bash
git branch --show-current
git status --short
git diff --check
git diff --stat
git diff
```

Do not report a command as passing unless its actual result was observed.

## 19. Documentation Updates

Update only after evidence exists:

```text
README.md
PROJECT_STATUS.md
specs/00-project-profile.md
```

Document:

- verified migration commands;
- verified integration-test command;
- local seed configuration;
- Region/Quest public routes;
- frontend `/quests` routes;
- demo data behavior;
- exact quality-gate results.

Do not claim:

- authentication;
- Organizer CRUD;
- participation;
- completion;
- XP/gamification;
- deployment;
- nationwide Region coverage.

## 20. Acceptance Criteria

### Repository and architecture

- [ ] Slice 0 is merged into `main`.
- [ ] Slice 1 branch was created from updated `main`.
- [ ] `PROJECT_STATUS.md` accurately records Slice 0 before Slice 1 begins.
- [ ] The separate prerequisite PR corrected `PROJECT_STATUS.md`.
- [ ] Basic CI exists and is green before feature implementation.
- [ ] Updated `main` was merged into the existing Slice 1 branch without rebase
      or branch recreation.
- [ ] Docker availability is verified before Testcontainers work.
- [ ] Prompt and review artifacts are stored in their correct directories.
- [ ] Three production projects remain.
- [ ] IntegrationTests project exists with accepted references.
- [ ] Core has no Infrastructure, Api, EF Core, ASP.NET Core, or DI dependency.
- [ ] Controllers do not use `DbContext`.
- [ ] No unapproved architecture dependency exists.

### Persistence

- [ ] First EF Core migration applies to an empty PostgreSQL database.
- [ ] Migration contains no application seed rows.
- [ ] Region, Quest, and QuestImage mappings match accepted fields.
- [ ] Quest owner FK remains non-null and valid.
- [ ] Minimal Identity persistence boundary is independently approved.
- [ ] `ApplicationUser` and `ApplicationRole` are public sealed Infrastructure
      persistence classes with valid class bodies.
- [ ] Public `KiwimpactDbContext` inherits from the approved Guid-key
      `IdentityDbContext<ApplicationUser, ApplicationRole, Guid>` shape without
      inconsistent-accessibility compiler errors.
- [ ] No Identity/authentication runtime services, handlers, middleware, or
      endpoints are activated.
- [ ] Development curator has no password, role, login, claim, or token data.
- [ ] Quest `Version` is an EF concurrency token backed by PostgreSQL `xmin`.
- [ ] A stale Quest update throws `DbUpdateConcurrencyException`.
- [ ] Region indexes and null-parent uniqueness are verified.
- [ ] Quest visibility/filter indexes exist.
- [ ] Region FKs use Restrict.
- [ ] QuestImage FK uses Cascade.
- [ ] No SQLite or EnsureCreated is used.

### Seed data

- [ ] Region seed uses deterministic IDs.
- [ ] Region seed is idempotent.
- [ ] Official Auckland Council source is recorded.
- [ ] New Zealand, Auckland, and all 21 official local boards are present.
- [ ] Demo Quest seed is explicitly Development-only.
- [ ] Demo seed is idempotent.
- [ ] Demo Quests are fictional and cover accepted enum/filter cases.
- [ ] Every Published demo Quest has a cover image.
- [ ] No secret or real password is seeded.

### Regions API

- [ ] All four accepted Region GET endpoints work anonymously.
- [ ] Only active Regions are returned.
- [ ] `/regions` returns active LocalArea Regions.
- [ ] Search is bounded and case-insensitive.
- [ ] Children and ancestors are ordered deterministically.
- [ ] Missing/inactive targets return safe `404` Problem Details.

### Quest API

- [ ] All three accepted public Quest GET endpoints work anonymously.
- [ ] List returns only Published Quests.
- [ ] Non-Published detail/images return the same `404` as missing records.
- [ ] Pagination defaults to 12 and is capped at 50.
- [ ] Pagination metadata is correct.
- [ ] Category/source/difficulty/region/search filters work.
- [ ] Region filter includes selected Region and active descendants.
- [ ] Default sorting is deterministic and documented.
- [ ] Invalid query values return `400` Problem Details.
- [ ] Public DTOs expose no owner ID, Identity data, or private community data.
- [ ] Image order is deterministic.
- [ ] Scalar/OpenAPI documents endpoints and query contracts.

### Frontend

- [ ] `/quests` renders through React Router.
- [ ] `/quests/:questId` renders through React Router.
- [ ] TanStack Query owns server data.
- [ ] URL search params own filters/sort/pagination.
- [ ] Zustand does not duplicate server/query state.
- [ ] Loading, data, empty, error, and retry states are implemented.
- [ ] Filter/pagination state survives refresh and shareable URLs.
- [ ] Cards are responsive and image-led.
- [ ] Detail page handles success, `404`, and server error.
- [ ] External links use `noopener noreferrer`.
- [ ] External source disclaimer is shown.
- [ ] No unauthorized future-slice action is visible.
- [ ] Semantic, keyboard, focus, alt-text, and touch-target checks pass.

### Tests and quality

- [ ] Backend unit tests pass.
- [ ] PostgreSQL Testcontainers integration tests pass.
- [ ] Real migrations run in integration tests.
- [ ] Repository tests cover hierarchy, visibility, filters, sorting, and
      pagination.
- [ ] API tests cover anonymous access, `400`, `404`, and DTO allowlists.
- [ ] Frontend tests cover discovery/detail states and URL ownership.
- [ ] Region and Quest API payloads begin as `unknown` and are validated before
      use.
- [ ] Malformed Region/Quest payload tests pass.
- [ ] Dependency versions, maintenance, licences, vulnerabilities, and human
      approvals are recorded.
- [ ] `Microsoft.EntityFrameworkCore.Design` is configured with
      `PrivateAssets=all` and the normal approved `IncludeAssets` set.
- [ ] `xunit.runner.visualstudio` is included for IntegrationTests with
      `PrivateAssets=all`, aligned with UnitTests.
- [ ] `dotnet test` discovers and executes IntegrationTests.
- [ ] Backend restore/build/test pass.
- [ ] Frontend lint/type-check/test/build pass.
- [ ] NuGet vulnerability scan has no unresolved high/critical production
      finding.
- [ ] npm high-level audit passes or has compliant documented triage.
- [ ] Runtime and browser verification are observed, not inferred.
- [ ] `git diff --check` is clean.

### Scope

- [ ] No auth flow or auth UI is implemented.
- [ ] No Organizer/Admin CRUD is implemented.
- [ ] No participation/completion/XP/gamification is implemented.
- [ ] No maps, SignalR, Cypress, or deployment expansion is implemented.
- [ ] No external source is fetched by the backend.

## 21. AI Evidence Provenance for This Plan

The plan-review task must exist at:

```text
specs/ai/prompts/15-slice-1-region-quest-read-plan-review-task.md
```

The genuine first Codex review output must exist at:

```text
specs/ai/reviews/15-slice-1-region-quest-read-plan-review-2026-07-22.md
```

Task instructions must not remain under `specs/ai/reviews/`.

Any rereview uses the next available number and keeps the same separation:

```text
specs/ai/prompts/<number>-...-rereview-task.md
specs/ai/reviews/<number>-...-rereview-<actual-date>.md
```

## 22. Completion Report

Create:

Use the actual calendar date on which implementation verification finishes:

```text
specs/implementation/reports/01-slice-1-region-quest-read-completion-report-YYYY-MM-DD.md
```

`YYYY-MM-DD` is a placeholder in this plan only. The created filename and the
report's Date field must use the actual completion date. Do not predate or
hard-code the report to the plan-review date.

Required sections:

```md
# Slice 1 — Regions and Public Quest Read Completion Report

- Date
- Agent
- Branch
- Commit status
- Final status

## 1. Scope Summary
## 2. Created, Modified, and Deleted Files
## 3. Architecture and Project Reference Graph
## 4. Identity Persistence Sequencing Decision
## 5. Domain and Persistence Implementation
## 6. Migration Evidence
## 7. Region Seed Source and Idempotency Evidence
## 8. Development Quest Seed Evidence
## 9. API Contract Evidence
## 10. Frontend Evidence
## 11. Backend Unit-Test Results
## 12. PostgreSQL Integration-Test Results
## 13. Frontend Test Results
## 14. Dependency Governance, Licences, and Vulnerability Results
## 15. Runtime and Browser Verification
## 16. Acceptance Criteria
## 17. Deferred Work
## 18. Deviations and Approvals
## 19. Remaining Risks
## 20. Final Git State
## Final Result
```

For commands include:

- exact working directory;
- exact command;
- exit status/result;
- warnings;
- test totals;
- observed URL/status where applicable.

For Git include the final observed output or faithful complete transcription of:

```bash
git status --short
git ls-files --others --exclude-standard
git diff --check
git diff --stat
```

Use exactly one final result:

```text
SLICE 1 COMPLETE — READY FOR INDEPENDENT IMPLEMENTATION REVIEW
```

or:

```text
SLICE 1 INCOMPLETE — HUMAN ACTION REQUIRED
```

Do not claim completion when any required criterion is failed or unverified.

## 23. Implementation Stop Conditions

Stop and request human guidance when:

- Slice 0 is not merged into main;
- CI prerequisite is absent or failing;
- the Identity persistence sequencing decision is rejected;
- the official Region source cannot be verified;
- Docker/Testcontainers cannot run;
- the prerequisite branch/PR and merge-to-existing-feature-branch workflow has
  not been completed;
- prompt/review artifacts remain misclassified;
- Identity or authentication runtime service registration appears necessary;
- the Npgsql `xmin` concurrency mapping cannot be demonstrated with the pinned
  provider;
- migration generation requires weakening accepted schema;
- a high/critical dependency vulnerability lacks a compatible fix or approved
  exception;
- implementation requires auth, CRUD, maps, completion, or another non-goal;
- accepted specifications conflict;
- destructive database action would be required;
- branch is `main`;
- unrelated working-tree changes make the slice boundary unclear.
