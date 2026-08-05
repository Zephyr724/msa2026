# Kiwimpact API Contract

- **Status:** Accepted
- **Date:** 2026-07-21
- **Purpose:** Define the complete `/api/v1` REST/JSON API surface for the Kiwimpact MVP, including endpoint groups, HTTP methods, authentication requirements, ownership rules, request/response purposes, and important error conditions.
- **Scope:** All MVP endpoints. Does not define DTO schemas, controller implementations, or service code.

> This document records accepted API contract direction. It does not claim that controllers, DTOs, or middleware have been implemented. Exact DTO shapes, validation rules, and implementation details are derived from this contract plus accepted product and data specifications.

## 1. API Conventions

### 1.1 Base

- Base path: `/api/v1`
- Style: REST/JSON
- Timestamps: ISO 8601 UTC (`yyyy-MM-ddTHH:mm:ssZ`)
- Request body: `application/json`
- Response body: `application/json` (except `204 No Content`)
- Documentation: Scalar

### 1.2 Pagination

- Style: page-number
- Default page size: 12
- Maximum page size: 50
- Query parameters: `page` (1-based), `pageSize`
- Response includes: `items`, `page`, `pageSize`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`

### 1.3 Filtering and Sorting

- Query parameters vary by resource.
- Sorting: `sortBy` and `sortDirection` (`asc`/`desc`) query parameters.
- Default sort is documented per endpoint.

### 1.4 Error Responses

- Format: Problem Details (`application/problem+json`)
- Structure: `type`, `title`, `status`, `detail`, `instance`, `errors` (validation errors map)
- Common status codes:
  - `400` — Validation error
  - `401` — Missing or invalid authentication
  - `403` — Insufficient permissions
  - `404` — Resource not found
  - `409` — Conflict (duplicate, cooldown, capacity, state conflict)
  - `429` — Rate limit exceeded
  - `500` — Unexpected server error

### 1.5 Authentication

- Mechanism: ASP.NET Core Identity HttpOnly cookie
- Cookie: HttpOnly, SameSite=Lax, Secure=false (local dev) / Secure=true (production)
- Every POST/PUT/PATCH/DELETE requires antiforgery token (`X-CSRF-TOKEN` header)

### 1.6 Antiforgery Token Flow

- Endpoint: `GET /api/v1/auth/csrf-token`
- Auth: None. The endpoint generates/stores the antiforgery cookie token and returns the request token. The client sends the request token in `X-CSRF-TOKEN` on every state-changing request.
- Anonymous clients obtain a token before browser POST operations such as register, login, resend confirmation, forgot password, and reset password.
- Authenticated clients obtain a fresh token after successful login and after an antiforgery validation failure.
- The token is not an authentication credential.

### 1.7 CORS

- Explicit origins only; never wildcard origin with credentials.
- Local Vite proxies `/api/*` and `/hubs/*` to the .NET backend.

## 2. Endpoint Groups

### 2.1 Authentication

| Method | Route                                | Auth    | Purpose                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/auth/register`              | None    | Register with email/password. Sends confirmation email. Returns 201.                                                                                                                                                                                                                                                                                                                                           |
| `POST` | `/api/v1/auth/login`                 | None    | Login with email/password. Sets HttpOnly cookie. Returns user profile summary.                                                                                                                                                                                                                                                                                                                                 |
| `POST` | `/api/v1/auth/logout`                | Member+ | Clears authentication cookie.                                                                                                                                                                                                                                                                                                                                                                                  |
| `GET`  | `/api/v1/auth/me`                    | Member+ | Returns authenticated user's profile and auth state.                                                                                                                                                                                                                                                                                                                                                           |
| `POST` | `/api/v1/auth/confirm-email`         | None    | Confirm email with token.                                                                                                                                                                                                                                                                                                                                                                                      |
| `POST` | `/api/v1/auth/resend-confirmation`   | None    | Resend confirmation email. Rate limited.                                                                                                                                                                                                                                                                                                                                                                       |
| `POST` | `/api/v1/auth/forgot-password`       | None    | Send password reset email. Does not reveal account existence.                                                                                                                                                                                                                                                                                                                                                  |
| `POST` | `/api/v1/auth/reset-password`        | None    | Reset password with token.                                                                                                                                                                                                                                                                                                                                                                                     |
| `POST` | `/api/v1/auth/change-password`       | Member+ | Change password (requires current password). Not available for pure-Google users without a local password.                                                                                                                                                                                                                                                                                                     |
| `GET`  | `/api/v1/auth/csrf-token`            | None    | Issue a fresh antiforgery token. Returns request token; sets antiforgery cookie.                                                                                                                                                                                                                                                                                                                               |
| `GET`  | `/api/v1/auth/external-login/google` | None    | Initiate Google external login (redirect). The provider callback is handled as a browser `GET` by ASP.NET Core authentication middleware at the configured callback path, normally `/signin-google`. After successful external authentication, the backend signs in or creates the Identity user and redirects to an approved frontend route. The middleware callback path is not a normal REST/JSON endpoint. |
| `POST` | `/api/v1/auth/link/google`           | Member+ | Link Google account to authenticated session.                                                                                                                                                                                                                                                                                                                                                                  |

**Important error conditions:**

- Register: 409 if email already registered.
- Login: 401 generic failure (no account-existence leak). 403 if email not confirmed.
- Confirm-email: 400 if token invalid/expired.
- Forgot-password: 200 always (no account-existence leak).
- Reset-password: 400 if token invalid/expired.
- Change-password: 403 if pure-Google user without local password.
- Rate limiting: 429 on login, register, forgot-password, reset-password.

### 2.2 Profile and Home Community

| Method   | Route              | Auth    | Purpose                                                                |
| -------- | ------------------ | ------- | ---------------------------------------------------------------------- |
| `GET`    | `/api/v1/users/me` | Member+ | Return authenticated user's full profile. Ownership: self.             |
| `PATCH`  | `/api/v1/users/me` | Member+ | Update display name, Home Community, privacy toggles. Ownership: self. |
| `DELETE` | `/api/v1/users/me` | Member+ | Request account deletion.                                              |
| `GET`    | `/api/v1/users/me/progression` | Member+ | Return the authenticated user's own server-authoritative progression: exactly `{ totalXp, level, rankTitle }`. `rankTitle` is derived from the persisted `Level` at read time. Ownership: self; identity comes only from the authenticated session — no route/query user selector exists. |

**Important error conditions:**

- `PATCH`: 409 if Home Community change within cooldown period. 400 if Region invalid/inactive/not LocalArea.
- `PATCH`: first Home Community selection has no cooldown.
- `PATCH` response includes `nextAllowedCommunityChangeAt` when cooldown is active.
- Progression: `401` anonymous; `503 progression-not-ready` while any Verified completion still lacks its XP row (reward state incomplete; bounded ProblemDetails with no counts or internals; evaluated live on every request, never cached); `404 profile-not-found` when the authenticated user has no profile row.

### 2.3 Regions

| Method | Route                            | Auth | Purpose                                                                              |
| ------ | -------------------------------- | ---- | ------------------------------------------------------------------------------------ |
| `GET`  | `/api/v1/regions`                | None | List active LocalArea regions for community selector. Supports `search` query param. |
| `GET`  | `/api/v1/regions/{id}`           | None | Get single region by ID.                                                             |
| `GET`  | `/api/v1/regions/{id}/children`  | None | Get active child regions.                                                            |
| `GET`  | `/api/v1/regions/{id}/ancestors` | None | Get ancestor chain.                                                                  |

**Important error conditions:**

- 404 if region not found or inactive.

### 2.4 Public Quest Discovery

| Method | Route                        | Auth | Purpose                                                                                                                                      |
| ------ | ---------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/quests`             | None | List published quests. Supports `category`, `sourceType`, `difficulty`, `regionId`, `search`, `sortBy`, `sortDirection`, `page`, `pageSize`. |
| `GET`  | `/api/v1/quests/{id}`        | None | Get quest detail including cover image, location, source info.                                                                               |
| `GET`  | `/api/v1/quests/{id}/images` | None | List all images for a quest.                                                                                                                 |

**Important error conditions:**

- 404 if quest not found, not published, or archived (unless Organizer/Admin and owned).

### 2.5 Organizer/Admin Quest CRUD

| Method   | Route                                             | Auth    | Role             | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/v1/organizer/quests`                        | Member+ | Organizer, Admin | List quests owned by the authenticated Organizer, or all for Admin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `POST`   | `/api/v1/organizer/quests`                        | Member+ | Organizer, Admin | Create a new quest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `GET`    | `/api/v1/organizer/quests/{id}`                   | Member+ | Organizer, Admin | Get quest detail (including non-public fields). Ownership: Organizer owns own quests; Admin owns all.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `PUT`    | `/api/v1/organizer/quests/{id}`                   | Member+ | Organizer, Admin | Full update of quest. Ownership: Organizer owns own quests; Admin owns all.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `DELETE` | `/api/v1/organizer/quests/{id}`                   | Member+ | Organizer, Admin | Delete quest. Ownership: same. 409 if has active participants.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `POST`   | `/api/v1/organizer/quests/{id}/publish`           | Member+ | Organizer, Admin | Publish a Draft quest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `POST`   | `/api/v1/organizer/quests/{id}/cancel`            | Member+ | Organizer, Admin | Cancel a Published quest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `POST`   | `/api/v1/organizer/quests/{id}/archive`           | Member+ | Organizer, Admin | Archive a Cancelled or completed quest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `GET`    | `/api/v1/organizer/quests/{questId}/participants` | Member+ | Organizer, Admin | Paginated limited operational participant list. Returns: `participationId`, `memberDisplayName`, `joinedAt`, `participationStatus`, `completionStatus`, `completionMethod`, `completedAt`, plus aggregate summary (participant count, completion status totals). Never include `email`, `HomeCommunityRegionId`, `EvidenceUrl`, claim description, `UserDeclaration`, `ReviewNote`, or private profile fields. Authorization: Organizer may access only owned quests; Admin may access all quests. 403 if Organizer does not own the Quest. |

**Important error conditions:**

- 403 if not owner (Organizer) or Admin.
- 409 if publishing with missing required fields (cover image, category, etc.).
- 409 if cancelling with active participants (requires confirmation or force flag).
- 409 if archiving a Draft quest (archive requires Cancelled or Published with EndAtUtc in the past).
- `GET participants`: 403 if not Organizer owner or Admin. Response must never expose email, HomeCommunityRegionId, EvidenceUrl, claim description, UserDeclaration, ReviewNote, or private profile fields.

### 2.6 Quest Images

| Method   | Route                                                       | Auth    | Role             | Purpose                                                   |
| -------- | ----------------------------------------------------------- | ------- | ---------------- | --------------------------------------------------------- |
| `POST`   | `/api/v1/organizer/quests/{questId}/images`                 | Member+ | Organizer, Admin | Add image to quest.                                       |
| `PUT`    | `/api/v1/organizer/quests/{questId}/images/{imageId}`       | Member+ | Organizer, Admin | Update image metadata.                                    |
| `DELETE` | `/api/v1/organizer/quests/{questId}/images/{imageId}`       | Member+ | Organizer, Admin | Remove image. Quest must retain at least one cover image. |
| `PATCH`  | `/api/v1/organizer/quests/{questId}/images/{imageId}/cover` | Member+ | Organizer, Admin | Set image as cover.                                       |

**Important error conditions:**

- 409 if deleting the only cover image.

### 2.7 Participation

| Method | Route                             | Auth    | Purpose                                                                     |
| ------ | --------------------------------- | ------- | --------------------------------------------------------------------------- |
| `POST` | `/api/v1/quests/{questId}/join`   | Member+ | Join a quest (creates QuestParticipation).                                  |
| `POST` | `/api/v1/quests/{questId}/cancel` | Member+ | Cancel own active participation.                                            |
| `POST` | `/api/v1/quests/{questId}/track`  | Member+ | Track an External quest (creates QuestParticipation without registration).  |
| `GET`  | `/api/v1/users/me/participations` | Member+ | List own participations. Supports `status` filter (active, cancelled, all). |

**Important error conditions:**

- 404 if quest not found or not published.
- 409 if already joined (active participation exists).
- 409 if quest at capacity (Native registration only; External and NoneRequired quests do not consume platform Capacity).
- 409 if quest is Cancelled or Archived.
- 400 if joining a quest that requires Native registration but the endpoint used is `/track`.
- For Native Quests, Completion Code redemption and Evidence Claim submission require an existing Participation.

### 2.8 Completion Code

| Method  | Route                                                                 | Auth    | Role                                                                        | Purpose                                                                               |
| ------- | --------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `POST`  | `/api/v1/organizer/quests/{questId}/completion-codes`                 | Member+ | Organizer, Admin                                                            | Generate a new completion code. Returns plaintext code once (never stored plaintext). |
| `GET`   | `/api/v1/organizer/quests/{questId}/completion-codes`                 | Member+ | Organizer, Admin                                                            | List completion codes (hashes only, not plaintext).                                   |
| `PATCH` | `/api/v1/organizer/quests/{questId}/completion-codes/{codeId}/revoke` | Member+ | Organizer, Admin                                                            | Revoke a code.                                                                        |
| `POST`  | `/api/v1/quests/{questId}/redeem`                                     | Member+ | Redeem a completion code. Creates Verified QuestCompletion + XpTransaction. |

Successful redemption returns the committed completion and its authoritative
reward in one exact-key envelope:

```json
{
  "completion": {
    "status": "Verified",
    "method": "CompletionCode",
    "completedAtUtc": "2026-08-05T00:00:00.0000000+00:00",
    "verifiedAtUtc": "2026-08-05T00:00:00.0000000+00:00"
  },
  "reward": {
    "rewardEventId": "00000000-0000-0000-0000-000000000000",
    "xpAwarded": 50,
    "previousTotalXp": 170,
    "totalXp": 220,
    "previousLevel": 3,
    "level": 4,
    "previousRankTitle": "Novice",
    "rankTitle": "Novice",
    "unlockedAchievements": []
  }
}
```

`rewardEventId` is the committed XP transaction ID and is suitable for
client-side duplicate-feedback suppression. XP, level, rank, and newly awarded
achievement summaries are calculated and committed by the backend; clients do
not project rewards or recreate progression thresholds. Each unlocked
achievement contains exactly `achievementId`, `code`, and `name`.

**Important error conditions:**

- Redeem: 400 if code invalid, expired, or revoked.
- Redeem: 409 if Member already has a Verified completion for this Quest.
- Redeem: 409 if Organizer attempts to redeem a code for an Organizer-owned Quest they created (self-dealing prevention).
- Redeem: 401 if not authenticated.
- Generate: 403 if not Organizer owner or Admin.

### 2.9 Evidence Claims

| Method   | Route                               | Auth    | Purpose                                                                                                                          |
| -------- | ----------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `/api/v1/quests/{questId}/claims`   | Member+ | Submit an evidence claim. Creates Pending QuestCompletion + EvidenceClaimDetail.                                                 |
| `GET`    | `/api/v1/users/me/claims`           | Member+ | List own claims. Supports `status` filter.                                                                                       |
| `GET`    | `/api/v1/users/me/claims/{claimId}` | Member+ | Get own claim detail (includes EvidenceClaimDetail).                                                                             |
| `PUT`    | `/api/v1/users/me/claims/{claimId}` | Member+ | Update own pending claim. 409 if already reviewed.                                                                               |
| `DELETE` | `/api/v1/users/me/claims/{claimId}` | Member+ | Withdraw own pending claim. Permanently deletes QuestCompletion and EvidenceClaimDetail (cascade). Evidence removed immediately. |

**Important error conditions:**

- 409 if already has a Verified completion for this Quest.
- 409 if a Pending Evidence Claim already exists for the same Member and Quest. The Member must update or withdraw the existing Pending claim.
- 409 if the authenticated user is the Organizer who created the Organizer-owned Quest. No claim record is persisted.
- A Rejected claim does not prevent a new claim submission.
- 409 if updating/withdrawing a reviewed claim.
- 400 if EvidenceUrl is not HTTPS.

### 2.10 Self Reporting

| Method | Route                                  | Auth    | Purpose                                                                                    |
| ------ | -------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `POST` | `/api/v1/quests/{questId}/self-report` | Member+ | Self-report a completion. Creates QuestCompletion with Status=SelfReported. No XP awarded. |

**Important error conditions:**

- 409 if already has a Verified completion for this Quest.
- 409 if a SelfReported completion already exists for the same Member and Quest.
- A SelfReported record may coexist with a Pending, Rejected, or Verified verification record.
- A later verification does not mutate or delete the SelfReported record.
- Self-reported completions are always accepted (no review).

### 2.11 Passport

| Method | Route                                               | Auth    | Purpose                                                                                                                                               |
| ------ | --------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/users/me/passport`                         | Member+ | Return own Personal Impact Passport.                                                                                                                  |
| `GET`  | `/api/v1/users/me/passport/completions`             | Member+ | Paginated completion history. Returns one primary display record per Quest using the precedence: 1) Verified, 2) Pending EvidenceClaim, 3) SelfReported, 4) latest Rejected EvidenceClaim. |
| `GET`  | `/api/v1/users/me/passport/community-participation` | Member+ | Community Participation section: historical contributions by community (from XpTransaction.CommunityRegionIdAtAward), including departed communities. |

The authenticated progression, Passport, Passport completion,
community-participation, and earned-achievement reads use the bounded Problem
Details type `https://kiwimpact.app/problems/profile-not-found` for their
existing missing-profile `404`. A generic or route-level `404` must not be
interpreted by the client as proof that the user's Passport profile is absent.

**Important error conditions:**

- Passport completion history returns one primary display record per Quest — not every raw `QuestCompletion` row. Where more than one Rejected Evidence Claim exists, the latest by `CreatedAt` is used. Full Evidence Claim history remains available from `GET /api/v1/users/me/claims`.
- Passport includes Home Community label only when `ShowCommunityOnPassport` is enabled.
- Community Participation uses `CommunityRegionIdAtAward` snapshot — no current-HomeCommunity filtering.

**Implementation status (Slice 12, 2026-07-27):** all three Passport routes
above are implemented. Slice 12 completed the summary and historical Community
Participation reads without adding a persistence model.

- `GET /api/v1/users/me/passport` returns the caller's display name,
  authoritative XP/level/rank, optional Home Community under the existing
  `ShowCommunityOnPassport` preference, Verified/SelfReported/Pending counts,
  and Verified XP-producing impact grouped by immutable
  `QuestCompletion.QuestCategorySnapshot`. Category values are aggregates, not
  goals or environmental outcome claims.
- `GET /api/v1/users/me/passport/community-participation` groups the caller's
  immutable XP ledger rows by `CommunityRegionIdAtAward`. Each item returns the
  Region summary, whether it is the current Home Community, Verified completion
  count, Verified XP, challenges actually contributed to during their
  half-open period, challenge-sourced achievements earned, and latest
  contribution timestamp. Null-attributed XP is excluded.
- Both routes derive identity only from the authenticated session. They accept
  no user selector and never return email, user id, evidence, claim text, or
  review notes.

- **Completion-history record set:** the authenticated caller's primary
  display record per Quest using the accepted precedence above (Verified >
  Pending EvidenceClaim > SelfReported > latest Rejected).
- **Query:** `page` (1-based, default 1, values < 1 normalize to 1) and
  `pageSize` (default 12, < 1 normalizes to 12, clamped to 50). Ordered by
  `VerifiedAtUtc DESC` with explicit nulls-last semantics, tie-break `Id
  ASC`.
- **Response 200:** the standard `PagedResponse<T>` envelope whose items
  have exactly these keys: `completionId`, `questId`, `questTitle`,
  `questCategory`, `questStatus`, `status`, `method`, `completedAtUtc`,
  `verifiedAtUtc`, `xpAmount`. `questTitle`/`questCategory`/`questStatus`
  reflect the Quest's current mutable row (no completion-time snapshot).
  `xpAmount` is the joined `XpTransaction.XpAmount`, or `null` for an
  ordinary (non-null-timestamp) reward-pending completion. `verifiedAtUtc`
  is non-null for every returned row by construction (see 503 below).
- **Errors:** `401` anonymous or unparseable identity; `404` an
  authenticated principal without a `UserProfile` row (an explicit
  profile-existence check precedes any page composition); `503`
  `progression-not-ready` when the caller owns a Verified completion with a
  null `VerifiedAtUtc` (the unprocessable invariant failure — no page is
  composed for that caller). Responses contain no email, user ID, Home
  Community, region/community labels, evidence, code material, claims,
  review notes, participation IDs, or location data.

### 2.12 Achievements

| Method | Route                           | Auth    | Purpose                          |
| ------ | ------------------------------- | ------- | -------------------------------- |
| `GET`  | `/api/v1/achievements`          | None    | List all achievements (catalog). |
| `GET`  | `/api/v1/users/me/achievements` | Member+ | List own earned achievements.    |
| `GET`  | `/api/v1/achievement-stats` | None | List nationwide rarity aggregates for active achievements. |
| `GET`  | `/api/v1/users/me/achievement-profile` | Member+ | Return the caller's trophy and derived Passport cosmetics. |

`GET /api/v1/achievements` is anonymous and returns a bare array of active
catalog rows ordered by `code ASC`. Each item has exactly six keys:
`id`, `code`, `name`, `description`, `iconUrl`, `category`. `id` is a UUID;
`iconUrl` is nullable; `category` is one of `Milestone`, `Specialist`,
`Explorer`, `Streak`, `Progression`, or `Community`. There is no pagination,
filtering, request body, or authentication error contract.

`GET /api/v1/users/me/achievements` is self-only for Member, Organizer, and
Admin. Identity comes only from the authenticated `NameIdentifier`; no
route/query/body user selector is accepted. A `200` response is a bare array
ordered by `awardedAt ASC`, then `code ASC`. Each active earned item has
exactly seven keys: `achievementId`, `code`, `name`, `description`,
`iconUrl`, `category`, `awardedAt`. Display fields come from the current
active catalog row; `awardedAt` is the persisted award-effective timestamp
formatted with the round-trip (`O`) convention. Inactive earned rows persist
but are excluded.

Errors for the self route: `401` for anonymous or unparseable identity;
`404` for an authenticated principal without a `UserProfile` (checked
first); `503` `progression-not-ready` when the caller has either a Verified
completion without its `XpTransaction` or an
`AchievementEvaluationVersion` behind the current catalog version.
Readiness is caller-scoped and evaluated on every request. Responses expose
no user ID, email, community/region data, completion evidence, code material,
claim data, `SourceCompletionId`, or `XpTransactionId`.

`GET /api/v1/achievement-stats` returns one exact-key item per active catalog
row in catalog-code order: `achievementId`, `nationwideEarnedCount`,
`nationwideMemberCount`, `earnedPercentage`, `rarity`, and
`calculatedAtUtc`. The denominator is distinct email-confirmed Identity users
who have a `UserProfile` and the `Member` role. The numerator is distinct
denominator users with an award for that Achievement ID. Repeated Community
Challenge awards count once. Percentages are rounded to four decimal places;
labels are `Unawarded`, `UltraRare`, `Rare`, `Uncommon`, and `Common` at the
approved 0/1/5/20 percent boundaries. The anonymous endpoint returns bounded
`progression-not-ready` `503` while any profile is behind the current catalog
version or any Verified completion globally lacks its XP transaction. It
exposes no user list, identifier, email, region, evidence, or activity history.
The active catalog, denominator, and per-achievement numerators are read in one
PostgreSQL `REPEATABLE READ` transaction.

`GET /api/v1/users/me/achievement-profile` returns exactly
`earnedDistinctCount`, `activeAchievementCount`, `trophy`, and `cosmetics`.
`earnedDistinctCount` is the lifetime distinct Achievement-ID count, including
later-inactive achievements. Trophy tiers are Locked 0, Bronze 5, Silver 10,
Gold 20, Platinum 30, and Diamond 40. The nested trophy contains `tier`,
`requiredCount`, nullable `nextTier` and `nextRequiredCount`,
`nationwideEarnedCount`, `nationwideMemberCount`, `earnedPercentage`, `rarity`,
and `calculatedAtUtc`. Nationwide tier count means denominator members at or
above the current tier threshold. Cosmetics contain the highest-priority
Passport border, highest-priority avatar frame, and at most three
highest-priority badge stamps. Current allowlists are borders
`forest|kauri|ocean|aurora`, frames `sprout|ember|guardian`, and stamps
`explorer|community|legend`.

Profile errors are `401` for anonymous or unparseable identity, profile-first
bounded `404`, and caller-scoped `503` for reward-pending or stale evaluation
version. Because readiness is caller-scoped, nationwide trophy fields can be a
temporary lower-bound aggregate while a different profile is still awaiting
backfill; the public stats route remains globally fail-closed. The caller's
awards, active catalog, nationwide denominator, and trophy numerator are read
in one PostgreSQL `REPEATABLE READ` transaction.

### 2.13 Community Challenges

| Method  | Route                                            | Auth    | Role                                                                                                                                                                                                                                                                                                               | Purpose                                         |
| ------- | ------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `GET`   | `/api/v1/community-challenges`                   | None    | List active and past challenges. Supports `regionId`, `status` filter.                                                                                                                                                                                                                                             |
| `GET`   | `/api/v1/community-challenges/{id}`              | None    | Get challenge detail including current progress.                                                                                                                                                                                                                                                                   |
| `GET`   | `/api/v1/community-challenges/{id}/progress`     | None    | Get challenge progress: target, current count, percentage. For communities below the privacy threshold (default 10 active ranked Members): `isPrivacyProtected: true`, `activeContributors: null`, `ratio: null`. For communities above the threshold: `isPrivacyProtected: false`, `activeContributors`, `ratio`. |
| `POST`  | `/api/v1/admin/community-challenges`             | Member+ | Admin                                                                                                                                                                                                                                                                                                              | Create a new monthly challenge for a LocalArea. |
| `PATCH` | `/api/v1/admin/community-challenges/{id}`        | Member+ | Admin                                                                                                                                                                                                                                                                                                              | Update challenge (target, period, reward).      |
| `POST`  | `/api/v1/admin/community-challenges/{id}/cancel` | Member+ | Admin                                                                                                                                                                                                                                                                                                              | Cancel an Active challenge.                     |

**Important error conditions:**

- Create: 409 if an Active challenge already exists for the LocalArea.
- Create: 400 if Region is not LocalArea type.
- Create/PATCH: 400 if a non-null reward is unknown, inactive, or not a static
  `CommunityChallengeReward` definition.
- Finalization revalidates that same typed active allowlist. A legacy invalid
  reward reference fails closed before progress evaluation, status mutation,
  or award creation; the challenge stays Active for explicit Admin
  cancellation.
- PATCH: 409 if Admin attempts to change region, period, target, or reward after `PeriodStart`.
- PATCH: 409 if Admin attempts to change those competitive fields after any eligible contribution exists.
- PATCH: 409 if Admin attempts to reduce `TargetValue` below current progress.
- After the challenge has started, cancellation is the only permitted state-changing Admin action.
- Progress is derived from XpTransaction, not from a contribution table.
- Contributor count is suppressed when below the small-community threshold (default 10 active ranked Members). See `specs/security/01-community-privacy-rules.md` §3.
- Guest and Member may read challenge data; Admin creates and manages challenges.

### 2.14 People Leaderboards

| Method | Route                            | Auth    | Purpose                                                                                                                    |
| ------ | -------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/leaderboards/people`    | None    | People leaderboard. Supports `scope` (myCommunity, auckland, nz), `period` (weekly, monthly, allTime), `page`, `pageSize`. |
| `GET`  | `/api/v1/leaderboards/people/me` | Member+ | Current Member's position, XP, and context rows for the given scope/period.                                                |

**Staged P0 implementation (Slice 7A):** only the anonymous
`GET /api/v1/leaderboards/people` route is currently implemented, with
`scope=nz` and `period=allTime` (both optional and defaulted), a fixed Top 10,
and no pagination or `/me` endpoint. Any empty or unsupported scope/period,
or any supplied `page`/`pageSize`, returns 400. Rows use ordinal ranks after
ordering by total XP descending, verified completion count descending,
case-folded display name ascending, then internal UserId ascending; UserId is
never serialized. The exact response is
`{ scope, period, rows[{ rank, displayName, totalXp, verifiedCompletionCount,
isCurrentUser }] }`. `isCurrentUser` is `true` only when the optional
authenticated actor's internal UserId matches that row; it is always `false`
for anonymous reads. Display names are never used as identity. UserId is
never serialized.
While any Verified completion lacks its XP transaction, the route returns
503 `leaderboard-not-ready`. All other capabilities in this section remain
accepted future direction.

**Important error conditions:**

- `myCommunity` scope requires authentication. 401 if unauthenticated.
- `myCommunity` scope: if Member has no Home Community, falls back to Auckland scope (or returns 400 with guidance).
- Small-community protection: if active ranked Members < threshold (default 10), returns collective-progress response instead of full ranking.
- Only verified XP contributes. Self-reported completions excluded.
- Leaderboard does not expose per-row Home Community.

### 2.15 Communities Leaderboard

| Method | Route                              | Auth | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------ | ---------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/leaderboards/communities` | None | Communities ranked by `verified completions / active contributors`. Supports `scope` (auckland, nz), `period` (monthly, allTime). Returns: rank, region name, total verified completions. For communities below the privacy threshold (default 10 active ranked Members): `isPrivacyProtected: true`, `activeContributors: null`, `ratio: null`. For communities above the threshold: `isPrivacyProtected: false`, `activeContributors`, `ratio`. |

**Important error conditions:**

- Read-only aggregate query; no new entity.
- MVP-lite: no seasons, leagues, editable scoring formulas, or trend analytics.
- Small-community contributor-count suppression applies. See `specs/security/01-community-privacy-rules.md` §3.

### 2.16 Admin Review

| Method | Route                                            | Auth    | Role  | Purpose                                                                                                       |
| ------ | ------------------------------------------------ | ------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/admin/claims`                           | Member+ | Admin | List evidence claims for review. Supports `status` filter (pending, verified, rejected).                      |
| `GET`  | `/api/v1/admin/claims/{claimId}`                 | Member+ | Admin | Get claim detail including evidence.                                                                          |
| `POST` | `/api/v1/admin/claims/{claimId}/approve`         | Member+ | Admin | Approve claim. Sets QuestCompletion.Status = Verified, creates XpTransaction. Admin cannot approve own claim. |
| `POST` | `/api/v1/admin/claims/{claimId}/reject`          | Member+ | Admin | Reject claim with review note. Admin cannot reject own claim.                                                 |
| `GET`  | `/api/v1/admin/external-sources/needs-review`    | Member+ | Admin | List external quests with source status NeedsReview.                                                          |
| `POST` | `/api/v1/admin/external-sources/{questId}/check` | Member+ | Admin | Mark source as checked (updates SourceCheckedAt, NextCheckDueAt).                                             |

**Important error conditions:**

- Approve/reject: 409 if claim not in Pending status.
- Approve/reject: 409 if Admin attempts to review own claim (self-dealing prevention; requires a different Admin).
- Approve: 409 if user already has a Verified completion for this Quest.
- 403 if not Admin.

### 2.17 Share Card

Share Card data is assembled client-side from existing endpoints (`/api/v1/users/me/passport`). No dedicated Share Card API endpoint is required for MVP.

The client uses data from:

- User profile (display name, level, XP, rank title)
- Selected completion (quest name, completion date, verification label)
- Passport summary

Share Card rules enforced by the data returned:

- Never include Home Community.
- Never include email, user ID, evidence, claim text, review note.
- `Show my display name` toggle respected (off = display name omitted from Share Card data).

### 2.18 Social Posts Feed

This bounded endpoint group was explicitly approved by the product owner on
2026-07-31 and corrected on 2026-08-04 by
`specs/implementation/29-community-posts-product-correction.md`. It does not
add public profiles, follows, friends, chat, notifications, binary file upload,
draft persistence, or moderation tooling.

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |
| `GET` | `/api/v1/social/posts` | None / Member+ for `mine=true` | Newest-first post feed. Supports case-insensitive `search` over title, content, tags, related Quest title, and author display name, plus `page` (1–10,000), `pageSize` (maximum 24), and authenticated `mine=true`. Guests see public posts; an authenticated viewer additionally sees their own hidden posts. `mine=true` returns only the caller's public and hidden posts. |
| `GET` | `/api/v1/social/posts/{postId}` | None | Read one public post, or an owned hidden post. Inaccessible hidden posts return 404. |
| `POST` | `/api/v1/social/posts` | Member+ | Publish `{ questId?, title, content, images, tags, isHidden }`. A related Quest is optional but strongly recommended; when supplied it must exist and be Published. Images are zero to nine ordered HTTPS URL/alternative-text pairs; tags are bounded and case-insensitively unique. |
| `PATCH` | `/api/v1/social/posts/{postId}/visibility` | Member+ | Author-only switch of an existing published post between public and hidden. Returns the authoritative post. |
| `DELETE` | `/api/v1/social/posts/{postId}` | Member+ | Author-only permanent deletion. Returns 204; owned images, tags, likes, and comments cascade. |
| `PUT` | `/api/v1/social/posts/{postId}/like` | Member+ | Idempotently set the caller's like. Returns authoritative aggregate count and caller state. |
| `DELETE` | `/api/v1/social/posts/{postId}/like` | Member+ | Idempotently remove the caller's like. Returns authoritative aggregate count and caller state. |
| `GET` | `/api/v1/social/posts/{postId}/comments` | None | Page top-level comments (page 1–10,000; maximum 20 roots) and include at most the first 20 direct replies per root. Each root reports authoritative `replyCount` and `hasMoreReplies`. |
| `POST` | `/api/v1/social/posts/{postId}/comments` | Member+ | Create a root comment or a direct reply using optional `parentCommentId`. |
| `PATCH` | `/api/v1/social/posts/{postId}/comments/{commentId}` | Member+ | Author-only bounded content update for a root comment or direct reply. Returns the authoritative comment. |

**Privacy and validation rules:**

- Responses include `authorDisplayName` but never user ID, email, Home
  Community, evidence, claim data, or other private profile fields.
- If an internal author profile is exceptionally absent, public responses use
  the neutral `Community member` display label.
- Post responses contain title, ordered images, tags, optional related-Quest
  summary, aggregate counts, viewer like state, author delete capability, and
  hidden state. They do not expose the author user ID.
- New posts require a 1–120 character title and 1–2,000 character body. A
  related Quest is optional but strongly recommended; when supplied it must be
  currently Published. A post accepts at most nine images and ten tags; image
  alternative text is required and bounded to 200 characters. A supplied Quest
  relationship remains historical context if that Quest later changes
  lifecycle state.
- Hidden is a published visibility state, not a draft. Only the author can see
  a hidden post in the feed or access its likes/comments. Other users and
  guests receive 404 for hidden-post like/comment reads or writes. Only the
  author can restore visibility or delete the post; non-authors receive 403 on
  those ownership endpoints. Existing engagement is retained while hidden and
  becomes visible again after restoration.
- A reply parent must exist on the same post and must be a top-level comment.
  Replying to a reply returns 400.
- Comment thread and reply DTOs expose viewer-specific `canEdit` without
  exposing the author user ID. Only the comment author can update content.
- Reply previews are deliberately bounded to 20 per returned root so a public
  read cannot produce an unbounded response body. Slice 25 does not expose
  independent reply pagination.
- Post content is 1–2000 characters after trimming. Comment content is
  1–1000 characters after trimming. Search is at most 100 characters.
- Image URLs must be absolute HTTPS URLs without embedded credentials.
  Alternative text is required for every image.
- All writes require the existing antiforgery token and actor-partitioned rate
  limiting. Anonymous writes return 401.
- The backend does not fetch, proxy, upload, or moderate linked images.

## 3. SignalR Hubs

### 3.1 Leaderboard Hub

- Hub route: `/hubs/leaderboard`
- Authentication: optional (Guest can subscribe to Auckland/NZ scopes; My Community scope requires authentication)
- Groups: scoped by `scope:period` (e.g., `auckland:weekly`, `myCommunity:monthly`)
- Server-to-client events:
  - `LeaderboardUpdated` — full leaderboard refresh for subscribed scope/period
  - `YourPositionUpdated` — personal position update (authenticated Members only)
- Client joins group on scope/period selection; leaves previous group.
- Small-community-protected communities receive collective-progress updates instead of full rankings.

### 3.2 Challenge Hub

- Hub route: `/hubs/challenges`
- Authentication: optional (read-only)
- Groups: scoped by `regionId` (LocalArea)
- Server-to-client events:
  - `ChallengeProgressUpdated` — progress update for a specific challenge

## 4. Authorization Summary

| Role      | Abilities                                                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guest     | Public quest discovery, leaderboards (Auckland/NZ), regions, achievements catalog and nationwide stats, community challenges, social feed and comments read            |
| Member    | All Guest abilities + self-profile, participation, completion, Passport, achievements, trophy/cosmetic profile, Share Card, publish/like/comment/reply/edit-own-comment and My posts                 |
| Organizer | All Member abilities + CRUD for owned quests, completion codes, images for owned quests                                                                                |
| Admin     | All Organizer abilities + manage all quests, review claims, manage external sources, manage community challenges, manage regions                                     |

Resource-level authorization rules are enforced in application services per the ownership boundaries in `specs/architecture/02-core-domain-data-model.md` §6.

### Admin UserProfile Access Boundary

The MVP does not expose a general
`GET /api/v1/admin/users/{id}` UserProfile endpoint.

Admin access to profile-related fields is limited to explicitly authorised
operational workflows, such as displaying the claimant's display name during
Evidence Claim review. This does not grant unrestricted profile browsing.

## 5. Rate Limiting

The following endpoints require rate limiting:

| Endpoint                           | Limit | Window                |
| ---------------------------------- | ----- | --------------------- |
| `/api/v1/auth/register`            | 5     | per IP per 15 minutes |
| `/api/v1/auth/login`               | 10    | per IP per 15 minutes |
| `/api/v1/auth/forgot-password`     | 3     | per IP per 15 minutes |
| `/api/v1/auth/reset-password`      | 3     | per IP per 15 minutes |
| `/api/v1/auth/resend-confirmation` | 3     | per IP per 15 minutes |
| `POST /api/v1/social/posts`, `PATCH .../visibility`, `DELETE .../{postId}` | 6 shared | per authenticated user per minute |
| `POST /api/v1/social/posts/{postId}/comments`, `PATCH .../comments/{commentId}` | 30 shared | per authenticated user per minute |
| `PUT/DELETE /api/v1/social/posts/{postId}/like` | 120 | per authenticated user per minute |

Exact rate limit values are initial defaults and may be tuned during implementation.

## 6. Related Documents

- `specs/architecture/02-core-domain-data-model.md` — Entity definitions and ownership boundaries
- `specs/product/01-product-requirements.md` — Product requirements
- `specs/product/02-community-identity-and-gamification-scope-update.md` — Community identity scope
- `specs/product/03-community-challenge-scope.md` — Community Challenge scope
- `specs/security/01-community-privacy-rules.md` — Privacy rules
- `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md` — Planning baseline
- ADR-0002: Identity + Cookie Authentication
- ADR-0008: Community Identity, Local Leaderboards, and Virtual Economy Scope
- `.clinerules/04b-auth-security.md` — Auth and authorization rules
- `.clinerules/04d-runtime-security.md` — Rate limiting, CSRF, CORS
