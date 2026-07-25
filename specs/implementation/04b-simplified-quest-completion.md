# Slice 4B — Simplified Verified Quest Completion

- **Status:** Approved — human completion decisions recorded (2026-07-25); design-review findings M1–M5 closed; pending implementation
- **Date:** 2026-07-25
- **Risk:** High — secret-code handling, verified-completion writes under concurrency, additive schema
- **Implementation owner:** One implementation session (per AGENTS.md routing)

## 1. Status and decision summary

Approved for implementation. Every previously open decision is resolved by the human-approved
decision set (2026-07-25), recorded in §19. Independent design review findings M1–M5 are closed in
this revision: immutable reward snapshots (§7, §9, §18); date-change revocation and validity-window
invariants (§8, §9); authenticated-partition limiter ordering and precedence (§14); explicit
MutationCache plaintext-removal rule (§12, §16); API amendment record and exact completion-state
shape (§11). No
production code, migration, dependency, or accepted-document change has been made. Implementation
follows the AGENTS.md workflow (prompt record, gates, completion report, independent implementation
review).

## 2. Goal

Deliver the smallest full-stack Slice in which an Organizer or Admin configures a Completion Code
for an eligible Quest, an authenticated active participant redeems that code, and the server
creates exactly one authoritative `Verified` `QuestCompletion` (accepted unified model,
`02-core-domain-data-model.md` §3.7) that the current user can see across reloads. **No XP is
awarded in this Slice** (approved staged exception, §18). Completion Code redemption is the sole
completion method: it produces a Verified completion without evidence upload, SelfReported
completion, or Admin claim review, and is therefore the smallest safe P0 path
(`04-phase-2-delivery-scope.md` §2.1 "one simplified completion flow").

## 3. Current implementation baseline

- Slice 4A delivered `QuestParticipation`: entity, partial unique active index, join/cancel/state
  endpoints, `SELECT ... FOR UPDATE` join transaction, 23505 → `409` translation, deterministic
  lock-contention test.
- `QuestCompletion` and `CompletionCode` exist only in the accepted data model (§3.7/§3.9) and API
  contract (`03-api-contract.md` §2.8); no code exists.
- Conventions reused unchanged: `AppRoles` three-role `[Authorize]`, `NameIdentifier` actor
  resolution, global antiforgery filter (`X-CSRF-TOKEN`), `ProblemDetailsHelper`, `xmin` `Version`
  mapping, fixed-window rate limiter (429), Testcontainers fixtures, `apiFetch`, `useAuthQuery`
  (`['auth','me']`), `QuestDetailPage` + `QuestParticipationPanel`, `OrganizerQuestEditPage` +
  `ConfirmActionDialog`.
- Accepted Completion Code route paths exist (`03-api-contract.md` §2.8) and are kept; the accepted
  behavior is amended as recorded in §11 (review M5).

## 4. Scope

- New `QuestCompletion` and `CompletionCode` persistence with one additive EF Core migration (§9).
- Organizer/Admin: generate-or-rotate the active Completion Code and read its configuration status
  for a manageable Quest.
- Member/Organizer/Admin: redeem a code against an eligible Quest and read own completion state;
  server-authoritative eligibility, self-dealing prevention, duplicate-safe creation.
- Immutable reward snapshots recorded on each completion for later XP calculation (§7, §9; review
  M1). No XP calculation, award, or display.
- Redemption rate limiting per §14; Scalar documentation; Organizer edit-page code management;
  Quest detail completion UI; focused tests (§16).

## 5. Out of scope

Evidence Claim, evidence-image upload, SelfReported completion, external-activity claim, attendance
approval, Admin completion review, QR/scanning, email delivery, XP transaction, level/rank,
achievements, streak, leaderboard, Share Card, notifications, participant-management dashboard,
Google Maps, SignalR, Cypress, Storybook, Slice 2B, R1 deployment implementation, new dependencies,
multi-version HMAC key rotation, a configurable grace-period setting,
`PATCH .../completion-codes/{codeId}/revoke` (rotation covers invalidation; deferred), the Organizer
code-history list view, and the unresolved rules on multiple Pending Evidence Claims, multiple
SelfReported completions, and later SelfReported verification.

## 6. Actor and authorization matrix

| Actor | Generate/rotate/status | Redeem / read own completion |
| --- | --- | --- |
| Guest | `401` | `401` (frontend shows sign-in CTA) |
| Member | `403` | Own completion only; never a Quest they created |
| Organizer | Owned Quests only (`403` otherwise) | Same rule as Member |
| Admin | All Quests | Same rule; never a Quest they created |

Explicit role sets, never role-inheritance assumptions: management = Organizer+Admin;
redemption/state = Member+Organizer+Admin. Actor identity comes only from `ClaimTypes.NameIdentifier`;
requests carry no user ID; the client can never choose the Quest owner or completion creator.
`Quest.CreatedByUserId` plus session identity drives every ownership and self-dealing decision;
Organizer/Admin privilege cannot bypass the creator prohibition. Frontend hiding is UX only; the
backend is authoritative.

## 7. Completion method and eligibility rules

For `POST /api/v1/quests/{questId}/redeem`, in this deterministic order:

1. Missing Quest → `404`. Existing Quest created by the caller → `409` OwnQuest with the accepted
   ProblemDetails behavior, evaluated before status, mode, dates, participation, duplicates, and
   code verification; the code is not verified on this path; no `QuestCompletion` is created and no
   `CompletionCode` is changed. Applies to Member, Organizer, and Admin.
2. Non-owner Draft Quest → `404` (not disclosed, mirrors Slice 4A).
3. Cancelled or Archived Quest → `409` (these also cannot generate or rotate codes).
4. `Status = Published`, `SourceType = OrganizerOwned`, `RegistrationMode = Native` only; any other
   source/mode → `400` (approved boundary; generation and rotation share it).
5. Date rule (approved): redemption requires an active code with `ValidFromUtc ≤ now` and
   `ValidToUtc` null or `> now`. `ValidToUtc = EndAtUtc + 7 calendar days` when `EndAtUtc` exists;
   redemption after `EndAtUtc` is allowed only inside this grace period; after `ValidToUtc` the
   generic invalid-code `400` applies. A Quest without `EndAtUtc` has no date-based expiry. All
   comparisons UTC.
6. No active participation (`CancelledAt IS NULL` row) → `409`. A cancelled historical participation
   is insufficient; the user must successfully rejoin (new active row, Slice 4A) before redeeming.
7. Existing `Verified` completion for `(UserId, QuestId)` → `409` AlreadyCompleted; the submitted
   code is not verified and nothing about it is revealed; the existing completion is untouched.
   Every repeat redemption returns the same `409`.
8. No active, non-revoked, in-window code for the Quest, or a non-matching/malformed submission →
   one generic `400` `invalid-completion-code`. Wrong, malformed, revoked, expired, rotated-out,
   and unconfigured are indistinguishable (§15).
9. Success: create one `QuestCompletion` (`Method = CompletionCode`, `Status = Verified`,
   `ParticipationId` = the active participation used for eligibility, server-generated `CompletedAt`
   and `VerifiedAtUtc`, `CreatedAt`/`UpdatedAt`), `201`. The row also records the immutable reward
   inputs (review M1): `RewardDifficultySnapshot` copied from the Quest's current `Difficulty`, and
   `CommunityRegionIdAtCompletion` copied from the user's current Home Community (null when none).
   Later Quest or profile mutation never alters these snapshots.

Self-dealing (approved): a Quest creator can never complete their own Quest, for Member, Organizer,
and Admin alike. Organizer/Admin may complete eligible Quests created by others. Ownership grants no
participation, completion, verification, approval, or reward shortcut. A rejected creator
self-redemption creates no `QuestCompletion` and can never become eligible for later XP.

## 8. Completion Code security model

- Format (approved): exactly ten characters from the canonical 32-symbol alphabet
  `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes `I`, `O`, `0`, `1`), displayed grouped `XXXXX-XXXXX`
  (the dash is display-only). Ten independent characters × 5 bits = 50 bits of entropy. Generated
  with `System.Security.Cryptography.RandomNumberGenerator` only — never `System.Random`, timestamps,
  sequential values, truncated GUIDs, database IDs, or user/Quest data.
- Normalization (approved): trim surrounding whitespace; remove ASCII hyphens and spaces; uppercase
  invariant; require exactly ten canonical-alphabet characters. Any normalization or validity failure
  produces the same generic invalid-code response; which check failed is never revealed.
- Storage (approved): no usable plaintext anywhere. The HMAC input is the exact UTF-8 bytes of
  `QuestIdCanonical + ":" + NormalizedCode` (stable canonical Quest ID string; the Quest binding
  prevents cross-Quest hash reuse). `CodeHash` stores the Base64-encoded HMAC-SHA256 output under
  `CompletionCodes__HmacKey`. No salt column. Verification recomputes the HMAC and compares the
  computed and stored bytes with `CryptographicOperations.FixedTimeEquals` — never ordinary string
  equality.
- Key configuration (approved): `CompletionCodes__HmacKey` — at least 32 cryptographically random
  bytes, valid Base64, supplied via environment/user-secret/provider-secret configuration; never
  committed, logged, returned, or given a hard-coded default; never in frontend output or
  ProblemDetails. Startup validation fails safely in **every** environment where Completion Code
  endpoints are enabled when the key is missing, invalid Base64, or shorter than 32 bytes. Tests
  inject a deterministic non-production key through test configuration.
- Key lifecycle (approved): multi-version rotation is out of scope; no key-version column; no silent
  fallback to an old key. Changing the key invalidates every active Completion Code (plaintext is
  unrecoverable), so it is an explicit maintenance/security operation after which all active codes
  must be regenerated; existing Verified completions remain valid; the deployment documentation must
  record this consequence.
- One active code (approved): at most one active code per Quest, enforced by the §9 partial unique
  index; revoked rows remain as history. The status endpoint never exposes usable plaintext, hash,
  or secret material.
- Generate/rotate (approved): the accepted POST endpoint handles both — acquire the Quest row lock,
  revoke the previous active code when present, create the new active code, save and commit
  atomically; `201 Created` with `Location` set to the code-status resource; plaintext only in this
  response. A failed rotation leaves the prior active code valid. After successful rotation the old
  code is invalid immediately and existing Verified completions remain valid. Concurrent generation
  or rotation cannot produce two active codes (Quest lock + §9 index). Rotation recomputes
  `ValidFromUtc`/`ValidToUtc` from the current Quest dates and generation time. Generation/rotation
  rejects an empty validity window (`ValidFromUtc >= ValidToUtc`) with `409`; the §9 check
  constraint is the database backstop.
- Quest date changes (review M2): validity is generated from Quest dates at code-creation time and
  is not recomputed for an existing code. If `StartAtUtc` or `EndAtUtc` changes while an active
  Completion Code exists, all active codes for that Quest are revoked in the same transaction as the
  Quest update; the Organizer must generate/rotate a new code. The revoked old code then fails
  redemption with the generic invalid-code `400`.
- Validity derivation (approved): `GeneratedAtUtc` = server generation time; `ValidFromUtc` =
  `GeneratedAtUtc` when `StartAtUtc` is null, else the later of the two; `ValidToUtc` = `EndAtUtc +
  7 calendar days` when `EndAtUtc` exists, else null.
- Plaintext never appears in URLs, query strings, logs, ProblemDetails, localStorage,
  sessionStorage, Zustand, tracked configuration, or analytics (frontend discipline in §12).

## 9. Data model and migration proposal

One additive migration (created during implementation, not planning; applies to clean and current
schemas). All schema decisions are human-approved; recorded amendments to the accepted model:
`CompletionCodes.ValidTo` nullable (approved validity derivation), `QuestCompletions.VerifiedAtUtc`
additive (approved completion-state DTO), `RewardDifficultySnapshot` and
`CommunityRegionIdAtCompletion` additive (review M1), and the validity-window check constraint
(review M2).

`QuestCompletions` (accepted §3.7, §5, §8; no evidence/XP columns):

- `Id uuid PK`; `UserId uuid not null` FK → `AspNetUsers.Id` Restrict; `QuestId uuid not null` FK →
  `Quests.Id` Restrict; `ParticipationId uuid null` FK → `QuestParticipations.Id` SetNull (accepted
  §5.2); `Method`, `Status` enum-as-string (max 50); `CompletedAt timestamptz not null`;
  `VerifiedAtUtc timestamptz null` (approved additive; set at redemption for the CompletionCode
  method); `RewardDifficultySnapshot text (max 50) not null` (review M1: immutable `QuestDifficulty`
  at completion time); `CommunityRegionIdAtCompletion uuid null` FK → `Region.Id` Restrict (review
  M1: immutable Home Community attribution snapshot required by the accepted XP attribution rules);
  `CreatedAt`, `UpdatedAt timestamptz not null`; `Version` → `xmin` (accepted concurrency-token list
  includes `QuestCompletion`).
- `UX_QuestCompletions_UserId_QuestId_Verified`: partial unique `(UserId, QuestId) WHERE "Status" =
  'Verified'`; and `IX_QuestCompletions_ParticipationId` (accepted §5.1). EvidenceClaim and
  SelfReported partial indexes are **not** created — out of scope.

`CompletionCodes` (accepted §3.9 with the approved `ValidTo` nullability; no plaintext, no salt, no
`UpdatedAt`, no `xmin` — CompletionCode is not in the accepted concurrency-token list and receives
no unapproved mapping; rotation serializes on the Quest-row lock, §10):

- `Id uuid PK`; `QuestId uuid not null` FK → `Quests.Id` Restrict; `CodeHash text (max 256) not
  null` (Base64 HMAC-SHA256); `ValidFrom timestamptz not null`; `ValidTo timestamptz null`;
  `IsActive`, `IsRevoked bool not null`; `CreatedByUserId uuid not null` FK → `AspNetUsers.Id`
  Restrict; `CreatedAt timestamptz not null`.
- `IX_CompletionCodes_QuestId_IsActive_IsRevoked` (accepted §5.1).
- `UX_CompletionCodes_QuestId_Active`: partial unique `("QuestId") WHERE "IsActive" AND NOT
  "IsRevoked"` — the approved schema-level one-active-code guarantee.
- `CK_CompletionCodes_ValidityWindow`: check (`"ValidTo" IS NULL OR "ValidTo" > "ValidFrom"`) —
  review M2 database backstop rejecting empty validity windows.

No `XpTransaction`, Achievement, EvidenceClaimDetail, SelfReported, review, or leaderboard schema.
No placeholder or zero-value `XpTransaction` is ever created. `Quest` is untouched.

## 10. Transaction and uniqueness design

One authoritative redemption operation mirroring the Slice 4A join design: one scoped
`KiwimpactDbContext`, one connection, one active EF Core transaction — begin; materialize the Quest
with parameterized `SELECT ... FOR UPDATE`; evaluate §7 rules 1–7 against tracked data in the locked
transaction; load the active non-revoked code and verify the HMAC (fixed-time); insert the
completion (including the immutable snapshots); `SaveChangesAsync`; commit; roll back on every
failed path. No second context, connection, distributed lock, Redis, queue, or new dependency. The
partial unique index is the authoritative backstop: concurrent redemptions create exactly one
`Verified` row; the loser receives deterministic `409` AlreadyCompleted. PostgreSQL 23505 is
translated to AlreadyCompleted **only** after confirming the violation names the approved
`UX_QuestCompletions_UserId_QuestId_Verified` constraint; unrelated unique violations are never
converted. `DbUpdateConcurrencyException` → generic `409`; no server retry. Generation/rotation uses
the same Quest-row lock — lock Quest, revoke active code, insert new code, save, commit — so a
failed rotation leaves the prior code valid and concurrent operations cannot produce two active
codes (lock plus the `UX_CompletionCodes_QuestId_Active` backstop). The Quest date-update path
(review M2) revokes all active codes for the Quest inside the same transaction as the Quest save.

## 11. API endpoints and DTOs

API amendment (review M5): Slice 4B **amends** the accepted §2.8 completion-code surface; the routes
are not unchanged. The accepted route paths are kept, but behavior differs from the accepted text:
`GET .../completion-codes` returns metadata-only configuration status for the single active code
(the accepted "list codes, hashes only" shape is narrowed — hashes and secret material are never
exposed); `POST .../completion-codes` doubles as rotation; the revoke endpoint is deferred; and the
additive current-user completion-state route is added.

| Method | Route | Auth | Success |
| --- | --- | --- | --- |
| `POST` | `/api/v1/organizer/quests/{questId}/completion-codes` | Organizer+Admin | `201 GeneratedCompletionCodeDto` + `Location` |
| `GET` | `/api/v1/organizer/quests/{questId}/completion-codes` | Organizer+Admin | `200 CompletionCodeStatusDto` |
| `POST` | `/api/v1/quests/{questId}/redeem` | Member+ | `201 MyQuestCompletionDto` + `Location` |
| `GET` | `/api/v1/quests/{questId}/completion` | Member+ | `200 MyQuestCompletionDto` |

- POST generate takes **no body**; repeat calls rotate. `Location` targets the code-status resource
  (`GET .../completion-codes`). Redeem body: `RedeemCompletionCodeRequest(code)` (`400` on
  missing/overlong input). Redeem `201` `Location: /api/v1/quests/{questId}/completion`.
- DTOs (camel-case JSON, canonical enum names, ISO 8601 UTC, exact keys):
  - `GeneratedCompletionCodeDto(code, validFromUtc, validToUtc)` — plaintext only here, only once.
  - `CompletionCodeStatusDto(isConfigured, validFromUtc, validToUtc, createdAtUtc)` — nulls when not
    configured; never plaintext, `CodeHash`, or secret material.
  - `MyQuestCompletionDto` — exactly `{ status, method, completedAtUtc, verifiedAtUtc }`: `status`:
    `"None" | "Verified"`; `method`: `"CompletionCode" | null`; `completedAtUtc`, `verifiedAtUtc`:
    string | null. User-facing completion state carries **no** `completionId` and **no** `questId`
    (review M5; no accepted API contract requires them), and never XP or expected XP, reward status,
    participant ID, user ID, email, another user's state, Completion Code ID, plaintext, hash, or
    secret material. The same shape serves both the redeem response and the state GET.
- Visibility gates mirror Slice 4A: missing or non-owner Draft → `404`; GET state answers `404` for
  any Draft including the creator's. Accepted Quest visibility and OwnQuest behavior are applied
  before returning state; OwnQuest is enforced authoritatively on redeem (`409`).

## 12. Organizer frontend behavior

A Completion Code section on the existing `OrganizerQuestEditPage` (no separate dashboard):
not-configured state with Generate action; configured state showing the validity window and a Rotate
action behind the existing `ConfirmActionDialog`.

Reveal-once plaintext lifecycle (approved; review M4 closure): the plaintext Completion Code
returned by generate/rotate must never remain in TanStack Query MutationCache after extraction. The
implementation must choose one of two approved approaches:

- **Option A (preferred):** the plaintext response never enters persistent MutationCache storage.
  The generate/rotate response is handled through a flow where the plaintext is extracted directly
  and is not retained as mutation cache data.
- **Option B:** if the plaintext response enters MutationCache temporarily, the exact mutation cache
  entry containing the plaintext is explicitly removed from MutationCache, after the plaintext has
  been copied into local component memory. `mutation.reset()` may be used only as observer/UI
  cleanup; it must never be considered a security cleanup mechanism, and observer reset is never
  treated as equivalent to cache deletion.

After extraction, the only allowed location is short-lived local component memory required for
immediate display/copy. The plaintext is never stored in the URL, query string, browser history
state, localStorage, sessionStorage, Zustand, persistent React state, TanStack Query QueryCache,
TanStack Query MutationCache, logs, or analytics. It must disappear on route unmount, page reload,
explicit dismissal, or successful rotation replacement. A Copy action and a clear "not recoverable
after leaving" warning are provided. Loading, error, `403` (forbidden view), `404`, `409` (resync),
and `429` states follow the edit-page conventions; controls are keyboard-reachable with accessible
names and responsive.

## 13. Member frontend behavior

A completion section inside the existing Quest detail participation area: anonymous sign-in CTA;
OwnQuest non-actionable explanation (from the participation-state DTO); not-participating state;
when redemption is not available, one generic safe completion-unavailable message that never
distinguishes "not configured" from any other unavailability; single code input with client-side
normalization (trim/uppercase/dashes optional) and submit; pending disables repeat submission (no
optimistic completion, mutation `retry: false`, no automatic retry of `429`); generic invalid-code
error; `429` rate-limit message honoring `Retry-After` when present; success renders the Verified
state from the server response and invalidates `['quest', questId]`, `['quest', questId,
'my-participation']`, and the new `['quest', questId, 'my-completion']`; already-completed state
(`status = "Verified"`, `completedAtUtc`/`verifiedAtUtc`) survives reload via the GET. TanStack
Query owns completion state; auth Query owns identity; component state owns only the entered code
and confirmation UI; no XP, reward, level, or rank UI.

## 14. Rate limiting and abuse protection

Approved named fixed-window policy on `redeem` only: partition key `authenticatedUserId + ":" +
questId`; permit limit 10 requests per 10 minutes; queue limit 0; auto-replenishment enabled;
rejection `429 Too Many Requests`. The submitted code never forms part of the partition key. A
successful redemption does not reset the window. `Retry-After` is returned when the fixed-window
lease supplies the metadata and is never invented otherwise. The existing global/IP rate limit
remains a secondary boundary.

Middleware ordering (review M3): the policy partitions by authenticated user ID, so the
implementation must guarantee the authentication context exists before the user-based limiter
executes (authentication runs before the rate limiter in the pipeline), or use an explicitly
approved alternative; middleware order is verified by test — anonymous callers receive `401`, never
`429`. Precedence: a normal duplicate redemption is `409`; once the threshold is exceeded, rate
limiting takes precedence and excessive attempts return `429` regardless of which rule they would
otherwise hit.

Code-guessing responses follow §15: identical status, ProblemDetails type, title, and safe detail
for every failure class; when no active code exists, an equivalent safe verification path (e.g.
computing the HMAC against a fixed dummy value) is used where practical so the response is not an
obvious configuration oracle. No CAPTCHA or external abuse service. Management endpoints need no new
limiter.

## 15. Error and ProblemDetails behavior

Via `ProblemDetailsHelper`: `400` malformed request; `400` single `invalid-completion-code` type —
identical status, type, title, and safe detail — for wrong/malformed/revoked/expired/rotated/
unconfigured codes, never including the submitted or normalized code, configuration status, validity
timestamps, expected hash, or timing/diagnostic detail; `401` anonymous; `403` wrong role or
non-owner Organizer on management; `404` missing/non-owner Draft; `409` OwnQuest (accepted
ProblemDetails behavior) / Cancelled / Archived / no active participation / AlreadyCompleted
(accepted type) / empty validity window on generation / concurrency; `429` rate limit.
Constraint-verified 23505 and `DbUpdateConcurrencyException` map to generic `409` without internals.
No failed redemption creates or modifies completion or code data.

## 16. Test requirements

Backend unit (Core): 10-character format and canonical alphabet; normalization matrix (whitespace,
hyphens, spaces, case, invalid characters, wrong length) → single generic failure; 50-bit entropy
assumptions; exact HMAC serialization (UTF-8 `QuestIdCanonical + ":" + code` input, Base64 output);
HMAC match/mismatch including cross-Quest binding; `FixedTimeEquals` usage; startup key validation
fails safely in every enabled environment (missing/invalid Base64/< 32 bytes); §7 rule matrix and
precedence (OwnQuest and AlreadyCompleted precede code verification); no-active-participation;
cancelled-then-rejoin; `ValidFrom`/`ValidTo` derivation, 7-day grace boundaries, and empty-window
rejection (`ValidFromUtc >= ValidToUtc`); rotation invalidates old code, keeps completions, failed
rotation preserves the old code; Quest date-change revocation rule; immutable snapshot capture
(difficulty, community) independent of later Quest/profile mutation; completion-state and
error/status mapping; no `XpTransaction` creation.

PostgreSQL integration (Testcontainers, existing fixtures; session user and persisted
`CreatedByUserId` only; deterministic test HMAC key):

1. Anonymous redemption → `401` (never `429` — proves authentication precedes the user-partitioned
   limiter, review M3); principal outside the three roles → `403`; Member/Organizer/Admin explicit
   authorization.
2. Session identity authoritative; no client-supplied user ID exists/honored.
3. Active participant redeems a valid code → `201`, one Verified row linked to the active
   participation, immutable snapshots persisted; `Location` targets `/completion`.
4. No active participation → `409`; cancelled participation → `409`; rejoin restores eligibility.
5. Creator self-redemption → `409` for Member, Organizer, and Admin (no completion, no code change);
   each may redeem on another creator's eligible Quest.
6. Wrong, malformed, revoked, expired, and unconfigured submissions → identical generic `400`
   (status/type/title/detail asserted equal).
7. Rotation: old code fails, new code succeeds, existing Verified completions survive; concurrent
   generation/rotation yields exactly one active code; empty validity window rejected `409`.
8. Quest date change with an active code: active codes revoked atomically with the update; old code
   redemption fails generically; regeneration succeeds (review M2).
9. Duplicate redemption → deterministic `409` AlreadyCompleted with the code unverified;
   deterministic concurrent duplicate (externally held Quest-row lock, Slice 4A M3 pattern) creates
   exactly one Verified row; 23505 translated only for the named Verified-completion constraint.
10. Unsupported source/mode → `400`; before-`ValidFrom`, in-grace, and after-`ValidTo` date
    behavior; no-expiry Quest without `EndAtUtc`.
11. Rate limiting → `429` (+ `Retry-After` when supplied); window not reset by success; after the
    threshold, `429` takes precedence over would-be `400`/`409` outcomes (review M3); POST without
    CSRF → `400` `invalid-csrf-token`.
12. Exact-key DTO assertions on every completion DTO, including the exact
    `{ status, method, completedAtUtc, verifiedAtUtc }` shape with no `completionId`/`questId`
    (review M5); no plaintext/hash/salt/secret exposure anywhere, including the status endpoint.
13. Migration applies to clean and current schemas; both partial unique indexes (columns +
    predicates), the validity-window check constraint, Restrict/SetNull delete behaviors, and `xmin`
    mapping proven on real PostgreSQL (catalogue + behavioral, Slice 4A style); no `XpTransaction`
    row is created.

Frontend (Vitest + Testing Library): Organizer not-configured state; rotate confirmation;
`403/404/409/429` handling; anonymous CTA; participant form; no-participation state; OwnQuest
state; generic completion-unavailable message with no not-configured-specific copy; generic
invalid-code error; pending duplicate-submit protection; no automatic `429` retry; successful
Verified state; already-completed state; Query invalidation/refetch; `apiFetch`/CSRF transport; no
XP/reward UI; exact-key four-field completion-state DTO; accessible labels, focus, responsive
controls. Reveal-once tests (review M4 closure) explicitly verify:

1. The generate/rotate response returns the plaintext only once; a subsequent status GET contains
   no plaintext.
2. The plaintext does not remain in the TanStack Query QueryCache after response handling.
3. The plaintext does not remain in the TanStack Query MutationCache after response handling — the
   chosen Option A/B mechanism (§12) is asserted directly against MutationCache contents.
4. `mutation.reset()` alone is not considered sufficient: the security assertion inspects
   MutationCache entries, not observer state.
5. The status endpoint/UI never returns or renders plaintext, hash, or secret material.
6. URL, localStorage, sessionStorage, and Zustand never contain the plaintext; local component
   plaintext is cleared on route unmount, page reload, explicit dismissal, and successful rotation
   replacement.

## 17. Definition of Done

Organizer/Admin generates or rotates a code for an eligible Quest without persisting usable
plaintext; an active eligible participant redeems a valid code; exactly one authoritative Verified
`QuestCompletion` is created, linked to the active participation and carrying immutable reward
snapshots; creator self-completion is blocked for every role; wrong/malformed/rotated/expired codes
fail with one generic response; duplicate and concurrent redemption cannot create duplicate Verified
completions; completion state survives reload; Cookie + CSRF throughout; the approved rate-limit
policy with verified middleware ordering; no participant identity or code secret leaks; **zero
`XpTransaction` rows and no XP, level, achievement, or leaderboard behavior or claim**; migration
and database guarantees proven on real PostgreSQL; applicable gates pass (§21); browser smoke of
generate → redeem → reload where the environment permits; implementation prompt record and
completion report exist before review; one independent read-only review completes before commit.

## 18. Risks

- Staged XP exception (approved; clarified by review M1): the accepted long-term target — Verified
  completion and `XpTransaction` awarded atomically — is deliberately deferred. Slice 4B creates
  zero `XpTransaction` rows, shows no XP/reward/level/rank result, and documentation, frontend, and
  README must never claim or imply XP was awarded. Each Verified completion instead records
  immutable reward inputs (`RewardDifficultySnapshot`, `CommunityRegionIdAtCompletion`) at
  redemption time. Slice 5A must be the next main product Slice: calculate rewards **only** from
  these immutable completion snapshots — current Quest mutable fields (difficulty, XP award, dates)
  must never be used to reconstruct historical rewards; locate every Verified completion without an
  `XpTransaction`; create exactly one per completion using `SourceCompletionId` uniqueness as the
  idempotency boundary; remain safely retryable; process existing 4B completions before presenting
  reward state as complete; update profile/level/rank in the accepted transaction boundary. Until
  then, Verified means the completion is accepted, not that XP was awarded.
- HMAC key change invalidates every active code (plaintext unrecoverable); approved as an explicit
  maintenance operation requiring code regeneration; deployment documentation must record it.
- Approved amendments to the accepted model are recorded in §9 (`ValidTo` nullable; `VerifiedAtUtc`
  additive; M1 snapshot columns; M2 check constraint) so the implementation reviewer can verify them
  against the human decision set and review corrections.
- Quest date updates now carry a side effect (active-code revocation, review M2); the Organizer UI
  and tests must make the regeneration requirement visible.
- One-active-code narrows the accepted 1:N model via approved simplification; the list/revoke
  endpoints are deferred, not deleted.
- Reveal-once means an Organizer who loses the code must rotate; the accepted contract already
  promises plaintext only at generation.
- Displayed eligibility can go stale; the redeem-time `400/409` stays authoritative and the UI
  resyncs.

## 19. Human approval record

Approved 2026-07-25 and no longer open (details in the referenced sections): sole Completion Code
method (§2, §5); immediate Verified completion with zero XP rows (§2, §18); creator self-completion
prohibition for every role (§6, §7); active-participation requirement with completion–participation
association (§7); eligible Quest boundary Published + Native + OrganizerOwned (§7); 10-character
canonical-alphabet `XXXXX-XXXXX` format, 50 bits (§8); normalization with single generic failure
(§8); HMAC-SHA256 Quest-bound storage (exact UTF-8 input, Base64 output), no salt, `FixedTimeEquals`
(§8); `CompletionCodes__HmacKey` configuration and fail-safe startup validation in every enabled
environment (§8); key-change consequence without multi-version rotation (§8, §18); one active code
per Quest with the partial unique index (§8, §9); atomic generate/rotate semantics (§8, §10);
reveal-once plaintext with explicit MutationCache removal, never `mutation.reset()` alone (§12);
`ValidFrom`/`ValidTo` derivation (§8);
`EndAtUtc + 7 days` grace with generic expiry failure (§7, §8); deterministic duplicate `409`
AlreadyCompleted (§7, §15); concurrent-redemption uniqueness with constraint-verified 23505
translation (§10); additive `GET /api/v1/quests/{questId}/completion` with the exact four-key DTO
(§11); redeem rate-limit policy with authenticated-partition ordering (§14); generic code-failure
oracle protection (§14, §15); staged XP exception with Slice 5A obligations (§18); additive schema,
approved index set, Restrict/SetNull behaviors, `xmin` only where the accepted model requires it
(§9).

Design-review corrections applied 2026-07-25 (M1–M5): immutable reward snapshots (§7, §9, §18);
Quest date-change revocation and validity-window invariants (§8, §9, §10); authenticated-partition
limiter ordering and 429 precedence (§14); MutationCache plaintext-removal rule with `mutation.reset()`
demoted to observer/UI cleanup only (§12, §16); API
amendment record and exact completion-state shape without `completionId`/`questId` (§11).

Genuinely unresolved: none.

## 20. Stop condition

Stop and request human direction if implementation reveals a conflict between the approved decisions
and accepted documents that this contract does not already record; if XP cannot remain separated as
approved in §18; if a new dependency appears necessary; or if Evidence Claim, SelfReported, or Admin
review scope is required to finish this Slice.

## 21. Verification commands

```bash
# frontend/
npm run lint
npm run type-check
npm run test -- --run
npm run build

# backend/
dotnet build Kiwimpact.slnx
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
```

Then inspect `git diff --check HEAD`, `git diff --stat HEAD`, `git diff --name-status HEAD`, and
`git ls-files --others --exclude-standard`; never claim a gate not actually executed and observed.
