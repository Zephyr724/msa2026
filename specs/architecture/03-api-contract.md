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
- Response: issues a fresh antiforgery token; client stores it and sends as `X-CSRF-TOKEN` header on every state-changing request.
- Token refresh: client calls `GET /api/v1/auth/csrf-token` after login, after any 400 antiforgery rejection, and periodically. Exact refresh trigger behaviour is implemented during Slice 3 (Authentication).
- The issuance endpoint requires authentication (prevents unauthenticated token harvesting).

### 1.7 CORS

- Explicit origins only; never wildcard origin with credentials.
- Local Vite proxies `/api/*` and `/hubs/*` to the .NET backend.

## 2. Endpoint Groups

### 2.1 Authentication

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/v1/auth/register` | None | Register with email/password. Sends confirmation email. Returns 201. |
| `POST` | `/api/v1/auth/login` | None | Login with email/password. Sets HttpOnly cookie. Returns user profile summary. |
| `POST` | `/api/v1/auth/logout` | Member+ | Clears authentication cookie. |
| `GET` | `/api/v1/auth/me` | Member+ | Returns authenticated user's profile and auth state. |
| `POST` | `/api/v1/auth/confirm-email` | None | Confirm email with token. |
| `POST` | `/api/v1/auth/resend-confirmation` | None | Resend confirmation email. Rate limited. |
| `POST` | `/api/v1/auth/forgot-password` | None | Send password reset email. Does not reveal account existence. |
| `POST` | `/api/v1/auth/reset-password` | None | Reset password with token. |
| `POST` | `/api/v1/auth/change-password` | Member+ | Change password (requires current password). Not available for pure-Google users without a local password. |
| `GET` | `/api/v1/auth/csrf-token` | Member+ | Issue a fresh antiforgery token. |
| `GET` | `/api/v1/auth/external-login/google` | None | Initiate Google external login (redirect). |
| `POST` | `/api/v1/auth/external-login/google/callback` | None | Google callback. Sets HttpOnly cookie. |
| `POST` | `/api/v1/auth/link/google` | Member+ | Link Google account to authenticated session. |

**Important error conditions:**
- Register: 409 if email already registered.
- Login: 401 generic failure (no account-existence leak). 403 if email not confirmed.
- Confirm-email: 400 if token invalid/expired.
- Forgot-password: 200 always (no account-existence leak).
- Reset-password: 400 if token invalid/expired.
- Change-password: 403 if pure-Google user without local password.
- Rate limiting: 429 on login, register, forgot-password, reset-password.

### 2.2 Profile and Home Community

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/v1/users/me` | Member+ | Return authenticated user's full profile. Ownership: self. |
| `PATCH` | `/api/v1/users/me` | Member+ | Update display name, Home Community, privacy toggles. Ownership: self. |
| `DELETE` | `/api/v1/users/me` | Member+ | Request account deletion. |

**Important error conditions:**
- `PATCH`: 409 if Home Community change within cooldown period. 400 if Region invalid/inactive/not LocalArea.
- `PATCH`: first Home Community selection has no cooldown.
- `PATCH` response includes `nextAllowedCommunityChangeAt` when cooldown is active.

### 2.3 Regions

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/v1/regions` | None | List active LocalArea regions for community selector. Supports `search` query param. |
| `GET` | `/api/v1/regions/{id}` | None | Get single region by ID. |
| `GET` | `/api/v1/regions/{id}/children` | None | Get active child regions. |
| `GET` | `/api/v1/regions/{id}/ancestors` | None | Get ancestor chain. |

**Important error conditions:**
- 404 if region not found or inactive.

### 2.4 Public Quest Discovery

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/v1/quests` | None | List published quests. Supports `category`, `sourceType`, `difficulty`, `regionId`, `search`, `sortBy`, `sortDirection`, `page`, `pageSize`. |
| `GET` | `/api/v1/quests/{id}` | None | Get quest detail including cover image, location, source info. |
| `GET` | `/api/v1/quests/{id}/images` | None | List all images for a quest. |

**Important error conditions:**
- 404 if quest not found, not published, or archived (unless Organizer/Admin and owned).

### 2.5 Organizer/Admin Quest CRUD

| Method | Route | Auth | Role | Purpose |
|--------|-------|------|------|---------|
| `GET` | `/api/v1/organizer/quests` | Member+ | Organizer, Admin | List quests owned by the authenticated Organizer, or all for Admin. |
| `POST` | `/api/v1/organizer/quests` | Member+ | Organizer, Admin | Create a new quest. |
| `GET` | `/api/v1/organizer/quests/{id}` | Member+ | Organizer, Admin | Get quest detail (including non-public fields). Ownership: Organizer owns own quests; Admin owns all. |
| `PUT` | `/api/v1/organizer/quests/{id}` | Member+ | Organizer, Admin | Full update of quest. Ownership: Organizer owns own quests; Admin owns all. |
| `DELETE` | `/api/v1/organizer/quests/{id}` | Member+ | Organizer, Admin | Delete quest. Ownership: same. 409 if has active participants. |
| `POST` | `/api/v1/organizer/quests/{id}/publish` | Member+ | Organizer, Admin | Publish a Draft quest. |
| `POST` | `/api/v1/organizer/quests/{id}/cancel` | Member+ | Organizer, Admin | Cancel a Published quest. |
| `POST` | `/api/v1/organizer/quests/{id}/archive` | Member+ | Organizer, Admin | Archive a Cancelled or completed quest. |

**Important error conditions:**
- 403 if not owner (Organizer) or Admin.
- 409 if publishing with missing required fields (cover image, category, etc.).
- 409 if cancelling with active participants (requires confirmation or force flag).

### 2.6 Quest Images

| Method | Route | Auth | Role | Purpose |
|--------|-------|------|------|---------|
| `POST` | `/api/v1/organizer/quests/{questId}/images` | Member+ | Organizer, Admin | Add image to quest. |
| `PUT` | `/api/v1/organizer/quests/{questId}/images/{imageId}` | Member+ | Organizer, Admin | Update image metadata. |
| `DELETE` | `/api/v1/organizer/quests/{questId}/images/{imageId}` | Member+ | Organizer, Admin | Remove image. Quest must retain at least one cover image. |
| `PATCH` | `/api/v1/organizer/quests/{questId}/images/{imageId}/cover` | Member+ | Organizer, Admin | Set image as cover. |

**Important error conditions:**
- 409 if deleting the only cover image.

### 2.7 Participation

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/v1/quests/{questId}/join` | Member+ | Join a quest (creates QuestParticipation). |
| `POST` | `/api/v1/quests/{questId}/cancel` | Member+ | Cancel own active participation. |
| `POST` | `/api/v1/quests/{questId}/track` | Member+ | Track an External quest (creates QuestParticipation without registration). |
| `GET` | `/api/v1/users/me/participations` | Member+ | List own participations. Supports `status` filter (active, cancelled, all). |

**Important error conditions:**
- 404 if quest not found or not published.
- 409 if already joined (active participation exists).
- 409 if quest at capacity.
- 409 if quest is Cancelled or Archived.
- 400 if joining a quest that requires Native registration but the endpoint used is `/track`.

### 2.8 Completion Code

| Method | Route | Auth | Role | Purpose |
|--------|-------|------|------|---------|
| `POST` | `/api/v1/organizer/quests/{questId}/completion-codes` | Member+ | Organizer, Admin | Generate a new completion code. Returns plaintext code once (never stored plaintext). |
| `GET` | `/api/v1/organizer/quests/{questId}/completion-codes` | Member+ | Organizer, Admin | List completion codes (hashes only, not plaintext). |
| `PATCH` | `/api/v1/organizer/quests/{questId}/completion-codes/{codeId}/revoke` | Member+ | Organizer, Admin | Revoke a code. |
| `POST` | `/api/v1/quests/{questId}/redeem` | Member+ | Redeem a completion code. Creates Verified QuestCompletion + XpTransaction. |

**Important error conditions:**
- Redeem: 400 if code invalid, expired, or revoked.
- Redeem: 409 if Member already has a Verified completion for this Quest.
- Redeem: 401 if not authenticated.
- Generate: 403 if not Organizer owner or Admin.

### 2.9 Evidence Claims

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/v1/quests/{questId}/claims` | Member+ | Submit an evidence claim. Creates Pending QuestCompletion + EvidenceClaimDetail. |
| `GET` | `/api/v1/users/me/claims` | Member+ | List own claims. Supports `status` filter. |
| `GET` | `/api/v1/users/me/claims/{claimId}` | Member+ | Get own claim detail (includes EvidenceClaimDetail). |
| `PUT` | `/api/v1/users/me/claims/{claimId}` | Member+ | Update own pending claim. 409 if already reviewed. |
| `DELETE` | `/api/v1/users/me/claims/{claimId}` | Member+ | Withdraw own pending claim. Clears evidence immediately. |

**Important error conditions:**
- 409 if already has a Verified completion for this Quest.
- 409 if updating/withdrawing a reviewed claim.
- 400 if EvidenceUrl is not HTTPS.

### 2.10 Self Reporting

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/v1/quests/{questId}/self-report` | Member+ | Self-report a completion. Creates QuestCompletion with Status=SelfReported. No XP awarded. |

**Important error conditions:**
- 409 if already has a Verified completion for this Quest.
- Self-reported completions are always accepted (no review).

### 2.11 Passport

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/v1/users/me/passport` | Member+ | Return own Personal Impact Passport. |
| `GET` | `/api/v1/users/me/passport/completions` | Member+ | Paginated completion history (all QuestCompletions, any Status). |
| `GET` | `/api/v1/users/me/passport/community-participation` | Member+ | Community Participation section: historical contributions by community (from XpTransaction.CommunityRegionIdAtAward), including departed communities. |

**Important error conditions:**
- Passport includes Home Community label only when `ShowCommunityOnPassport` is enabled.
- Community Participation uses `CommunityRegionIdAtAward` snapshot — no current-HomeCommunity filtering.

### 2.12 Achievements

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/v1/achievements` | None | List all achievements (catalog). |
| `GET` | `/api/v1/users/me/achievements` | Member+ | List own earned achievements. |

### 2.13 Community Challenges

| Method | Route | Auth | Role | Purpose |
|--------|-------|------|------|---------|
| `GET` | `/api/v1/community-challenges` | None | List active and past challenges. Supports `regionId`, `status` filter. |
| `GET` | `/api/v1/community-challenges/{id}` | None | Get challenge detail including current progress. |
| `GET` | `/api/v1/community-challenges/{id}/progress` | None | Get challenge progress: target, current count, percentage, contributors count. |
| `POST` | `/api/v1/admin/community-challenges` | Member+ | Admin | Create a new monthly challenge for a LocalArea. |
| `PATCH` | `/api/v1/admin/community-challenges/{id}` | Member+ | Admin | Update challenge (target, period, reward). |
| `POST` | `/api/v1/admin/community-challenges/{id}/cancel` | Member+ | Admin | Cancel an Active challenge. |

**Important error conditions:**
- Create: 409 if an Active challenge already exists for the LocalArea.
- Create: 400 if Region is not LocalArea type.
- Progress is derived from XpTransaction, not from a contribution table.

### 2.14 People Leaderboards

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/v1/leaderboards/people` | None | People leaderboard. Supports `scope` (myCommunity, auckland, nz), `period` (weekly, monthly, allTime), `page`, `pageSize`. |
| `GET` | `/api/v1/leaderboards/people/me` | Member+ | Current Member's position, XP, and context rows for the given scope/period. |

**Important error conditions:**
- `myCommunity` scope requires authentication. 401 if unauthenticated.
- `myCommunity` scope: if Member has no Home Community, falls back to Auckland scope (or returns 400 with guidance).
- Small-community protection: if active ranked Members < threshold (default 10), returns collective-progress response instead of full ranking.
- Only verified XP contributes. Self-reported completions excluded.
- Leaderboard does not expose per-row Home Community.

### 2.15 Communities Leaderboard

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/v1/leaderboards/communities` | None | Communities ranked by `verified completions / active contributors`. Supports `scope` (auckland, nz), `period` (monthly, allTime). Returns: rank, region name, total verified completions, active contributors, ratio. |

**Important error conditions:**
- Read-only aggregate query; no new entity.
- MVP-lite: no seasons, leagues, editable scoring formulas, or trend analytics.

### 2.16 Admin Review

| Method | Route | Auth | Role | Purpose |
|--------|-------|------|------|---------|
| `GET` | `/api/v1/admin/claims` | Member+ | Admin | List evidence claims for review. Supports `status` filter (pending, verified, rejected). |
| `GET` | `/api/v1/admin/claims/{claimId}` | Member+ | Admin | Get claim detail including evidence. |
| `POST` | `/api/v1/admin/claims/{claimId}/approve` | Member+ | Admin | Approve claim. Sets QuestCompletion.Status = Verified, creates XpTransaction. |
| `POST` | `/api/v1/admin/claims/{claimId}/reject` | Member+ | Admin | Reject claim with review note. |
| `GET` | `/api/v1/admin/external-sources/needs-review` | Member+ | Admin | List external quests with source status NeedsReview. |
| `POST` | `/api/v1/admin/external-sources/{questId}/check` | Member+ | Admin | Mark source as checked (updates SourceCheckedAt, NextCheckDueAt). |

**Important error conditions:**
- Approve/reject: 409 if claim not in Pending status.
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

| Role | Abilities |
|------|-----------|
| Guest | Public quest discovery, leaderboards (Auckland/NZ), regions, achievements catalog, community challenges |
| Member | All Guest abilities + self-profile, participation, completion, Passport, achievements, Share Card |
| Organizer | All Member abilities + CRUD for owned quests, completion codes, images for owned quests |
| Admin | All Organizer abilities + manage all quests, review claims, manage external sources, manage community challenges, manage regions |

Resource-level authorization rules are enforced in application services per the ownership boundaries in `specs/architecture/02-core-domain-data-model.md` §6.

## 5. Rate Limiting

The following endpoints require rate limiting:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/auth/register` | 5 | per IP per 15 minutes |
| `/api/v1/auth/login` | 10 | per IP per 15 minutes |
| `/api/v1/auth/forgot-password` | 3 | per IP per 15 minutes |
| `/api/v1/auth/reset-password` | 3 | per IP per 15 minutes |
| `/api/v1/auth/resend-confirmation` | 3 | per IP per 15 minutes |

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