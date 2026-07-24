# Slice 3A — Organizer-Owned Quest CRUD Backend

- **Status:** Proposed — pending human approval and independent review
- **Date:** 2026-07-24
- **Risk:** Important — authorization, ownership, mutable public content, and concurrency
- **Implementation owner:** One Codex implementation session

Pre-implementation Kimi K3 review found no blocking architecture contradiction,
two accuracy corrections, and one accepted scope reduction; this revision records them without a separate review file.

## 1. Goal

Deliver the smallest backend-only Slice for Organizer-owned Quest CRUD and accepted Admin management
without changing the frozen anonymous Region or public Quest read contracts.

## 2. Scope

- Add a protected management controller, focused Core service/write repository,
  explicit DTOs, mapping, and registrations.
- Create an Organizer-owned Quest as `Draft`, owned by the authenticated actor.
- List, read, replace, publish, cancel, archive, and (where accepted) delete
  manageable Quests.
- Require one nested cover-image metadata object on create; allow Quest update
  to update or replace that cover within the same application operation.
- Enforce roles, ownership, validation, antiforgery, and `xmin` server-side.
- Document the endpoints in the existing OpenAPI/Scalar surface.
- Add focused Core unit tests and real PostgreSQL API/persistence integration tests.
- Keep `GET /api/v1/quests*` anonymous, Published-only, and DTO-compatible.

### 2.1 Current write-side baseline

Public Quest read repositories/services exist; no Quest write repository or command/application
service exists. `Quest` has encapsulated construction and mutation through an internal constructor
and setters, so Slice 3A adds consistent domain creation, mutation, and lifecycle methods—not public setters.

Likely additions are focused Core write abstractions, an Infrastructure write repository, and application-service
orchestration. Controllers never access `KiwimpactDbContext`; do not add a generic repository, CQRS, MediatR, or new architecture.

## 3. Out of scope

Frontend; participation/join/cancel-participation/completion; XP awarding; achievements; leaderboards;
external claim/review; upload/storage; Maps; SignalR; Cypress; Storybook; packages; and curated-external
authoring. Additional gallery images, individual gallery edit/delete, reordering, and multi-image cover
selection are deferred to future Slice 3C; do not create its contract now. No hard delete except accepted
Draft deletion (§8), and no migration unless §10's stop gate is triggered and separately approved.

## 4. Authorization matrix

| Actor | List/read | Create | Update/status/delete |
| --- | --- | --- | --- |
| Guest | `401` | `401` | `401` |
| Member only | `403` | `403` | `403` |
| Organizer | Own Quests only | Own `OrganizerOwned` Draft | Own Quests only |
| Admin | Any Quest | Own `OrganizerOwned` Draft in this Slice | Any Quest |

Use `[Authorize(Roles = AppRoles.Organizer + "," + AppRoles.Admin)]`; the Core service checks ownership.
A known non-owned ID returns `403`, a missing ID `404`, and all writes use the existing antiforgery filter.

## 5. Ownership rules

- Resolve the actor from the authenticated Identity name-identifier claim; do
  not accept an owner, creator, user ID, role, or source type in a request.
- Creation sets `CreatedByUserId = actorId` and `SourceType = OrganizerOwned`.
- Cover-image ownership always follows the parent Quest; never authorize it independently.
- Constrain Organizer queries to `CreatedByUserId = actorId`; recheck ownership before mutation.
- Admin may manage any Quest under accepted specifications but cannot reassign ownership.
- Management DTOs do not expose `CreatedByUserId`, email, Home Community, or
  other Identity/profile data. Tests assert both access and response allowlists.

## 6. API endpoints and DTO boundaries

| Method | Route | Success |
| --- | --- | --- |
| `GET` | `/api/v1/organizer/quests` | `200 QuestManagementListItemDto[]` |
| `POST` | `/api/v1/organizer/quests` | `201 QuestManagementDetailDto` + `Location` |
| `GET` | `/api/v1/organizer/quests/{id}` | `200 QuestManagementDetailDto` |
| `PUT` | `/api/v1/organizer/quests/{id}` | `200 QuestManagementDetailDto` |
| `DELETE` | `/api/v1/organizer/quests/{id}` | `204`, Draft only |
| `POST` | `/api/v1/organizer/quests/{id}/publish` | `200 QuestManagementDetailDto` |
| `POST` | `/api/v1/organizer/quests/{id}/cancel` | `200 QuestManagementDetailDto` |
| `POST` | `/api/v1/organizer/quests/{id}/archive` | `200 QuestManagementDetailDto` |

Exact request records (JSON uses the shown camel-case property names):

```text
CreateQuestRequest(title, description, category, registrationMode, difficulty,
  capacity, startAtUtc, endAtUtc, locationRegionId, locationDescription,
  externalSourceUrl, coverImage)
UpdateQuestRequest(title, description, category, registrationMode, difficulty,
  capacity, startAtUtc, endAtUtc, locationRegionId, locationDescription,
  externalSourceUrl, coverImage?, version)
CoverImageRequest(imageUrl, altText, creatorName, sourceUrl, licenceNote)
QuestVersionRequest(version)
CancelQuestRequest(version, confirmActiveParticipants = false)
```

Quest `DELETE` requires a JSON `QuestVersionRequest`. Create requires
`coverImage`; update preserves the existing cover when `coverImage` is omitted
and updates or replaces that one cover when supplied. Quest and cover changes
use one application operation and `SaveChangesAsync`. Bodies deliberately omit
`id`, `createdByUserId`, `sourceType`, `status`, `xpAward`, external-source
freshness fields, and timestamps; extra JSON never influences those fields.

Exact response records:

```text
QuestManagementListItemDto(id, title, status, category, difficulty, capacity,
  startAtUtc, endAtUtc, locationRegion, updatedAtUtc, version)
QuestManagementDetailDto(id, title, description, category, status, sourceType,
  registrationMode, difficulty, xpAward, capacity, startAtUtc, endAtUtc,
  locationRegion, locationDescription, externalSourceUrl, externalSourceStatus,
  sourceCheckedAtUtc, nextCheckDueAtUtc, coverImage, createdAtUtc, updatedAtUtc,
  version)
QuestManagementCoverImageDto(id, imageUrl, altText, creatorName,
  sourceUrl, licenceNote)
```

Reuse `QuestLocationRegionDto`; use canonical enum names and ISO 8601 UTC. Sort by
`UpdatedAt DESC, Id ASC`; use Problem Details and exact OpenAPI/Scalar annotations.

Entity properties remain `SourceCheckedAt`, `NextCheckDueAt`, `CreatedAt`, and `UpdatedAt`; DTOs may map
them to `sourceCheckedAtUtc`, `nextCheckDueAtUtc`, `createdAtUtc`, and `updatedAtUtc`. The suffix is only
an API convention: values stay stored as UTC, entity properties are not renamed, and no migration results.

## 7. Validation rules

- Trim strings. `title` and `description` are required non-whitespace, maximum
  200 and 2,000 characters. Optional location text is maximum 500.
- Parse category, registration mode, and difficulty case-insensitively; reject
  numeric and undefined enum values. Organizer-owned Quests require a non-null
  registration mode.
- `capacity` is null (unlimited) or at least zero. Do not invent an upper bound.
- Dates are nullable per the accepted model, must be valid offsets, are stored
  as UTC, and when both exist require `endAtUtc > startAtUtc`.
- A Region must exist and be active; any hierarchy level or null is valid.
- `externalSourceUrl` and image `sourceUrl`, when supplied, are absolute HTTPS
  URLs no longer than 2,000 characters. Never fetch or log full URLs.
- Cover `imageUrl` is required, maximum 2,000, and is either an absolute HTTPS
  URL or a root-relative project asset reference. `altText` is required and at
  most 300; creator max 200; licence note max 500. The service sets `IsCover`
  and ordering; neither is client input in this Slice.
- Create persists Quest+cover consistently; update may update/replace but not remove the cover.
  Non-cover rows remain untouched, and publish verifies a cover.
- `xpAward` is never client input. Creation assigns server-owned `0` (allowed by
  the accepted non-negative rule); updates preserve the stored value. Validate
  the invariant before save. Selecting a non-zero XP policy is outside this Slice.

## 8. Status, disable, and deletion semantics

- Creation always yields `Draft`; bodies cannot publish or choose status.
- `publish`: `Draft -> Published`, after all publish validation, including cover.
- `cancel`: `Published -> Cancelled`; honor the accepted active-participant
  confirmation rule when participation exists. No force-delete behavior.
- `archive`: `Cancelled -> Archived`, or ended `Published -> Archived` when
  `EndAtUtc < now`. It is the soft-delete/disable operation and removes the
  Quest from existing public reads. Draft cannot be archived.
- `DELETE` physically removes only a Draft, as the accepted domain explicitly
  says Drafts should be deleted; images cascade. Any other status returns `409`.
- Invalid/repeated transitions return `409`; management retains archived records.
  Public reads stay Published-only and return the same `404` for every other state or missing row.

## 9. Concurrency behaviour

- Keep `Quest.Version` mapped to PostgreSQL `xmin`; do not add a Version column.
- Require the latest `version` on PUT, DELETE, and status mutations. A cover
  change is part of PUT and uses the same parent Quest version.
- Convert a version mismatch or `DbUpdateConcurrencyException` to generic `409`
  Problem Details; do not retry or overwrite. Every mutation response contains
  the new version. Missing/invalid version is `400`.

## 10. Data or migration impact

Current Quest/image fields, FKs, lifecycle, constraints, indexes, delete rules, and `xmin` support this
Slice: **no schema change or migration**. Add focused writes and encapsulated behavior, preserve §6 entity
timestamp names, and stop for approval before any genuinely necessary additive migration.

## 11. Test requirements

Unit tests cover encapsulated create/mutation/lifecycle, server defaults, validation,
XP preservation, ownership, transitions, and concurrency-result mapping.

PostgreSQL API/integration tests cover Guest/Member denial, Organizer ownership, Admin access, server
fields, antiforgery, CRUD/lifecycle, Region validation, atomic Quest+cover create, optional cover update,
stale `xmin`, new versions, Scalar/OpenAPI, and response allowlists. Assert no gallery endpoints exist;
re-run public Quest tests unchanged.

## 12. Definition of Done

- Protected endpoints and exact DTOs above work through the established layers.
- Role and ownership rules hold server-side; no mass assignment is possible.
- Validation, lifecycle, atomic required-cover, antiforgery, and concurrency
  rules are tested through focused write/domain abstractions.
- Anonymous public Region/Quest behavior and DTOs are unchanged.
- No gallery-management endpoints or public entity setters were introduced.
- No dependency or schema change occurred; Scalar documents the new surface.
- Targeted tests and all applicable backend gates pass; final diff is reviewed.
- Because this is important, one independent read-only review is complete, then
  at most one correction pass and one targeted closure check are performed.

## 13. Verification commands

Run from `backend/` after implementation:

```bash
dotnet build Kiwimpact.slnx
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
```

Then inspect `git diff --check HEAD`, `git diff --stat HEAD`, and
`git diff --name-status HEAD`. Do not claim a gate not actually observed.

## 14. Risks

- The accepted XP model has no calculation schedule; zero is the only bounded,
  non-invented creation value, so product approval is needed before non-zero XP.
- Broader API wording allows an owner exception on public detail, but frozen
  Slice 1 behavior always hides non-Published Quests. This Slice resolves that
  tension by using only the separate management read route.
- Draft hard delete versus soft deletion is status-dependent; tests and Scalar
  must make the boundary unmistakable.
- Admin-wide access and `403` for known non-owned IDs can expose existence to an
  authorized Organizer; this follows the accepted API contract.
- Persist cover metadata atomically without gallery management. Production changes stay within focused
  Quest domain/write/service/controller/contracts/mapping/registration files—no standalone gallery files
  or oversized mixed concerns.

## 15. Human approval gates

Human approval is required before implementation; any product/architecture/
security change; any schema or migration change; any dependency; destructive
repository action; staging, commit, push, PR, merge, reset, revert, or deployment;
and the important-task reviewer selection. A non-zero XP schedule also requires
an accepted product decision.

## 16. Stop condition

Stop and request human direction if evidence conflicts on Quest ownership,
Admin powers, delete versus disable, `xmin` concurrency, publication control,
or migration need; if public Quest behavior cannot remain byte-compatible; if
secure ownership cannot be enforced in the service; or if completion requires
frontend, participation, XP-award, external-claim, upload, or package scope.
