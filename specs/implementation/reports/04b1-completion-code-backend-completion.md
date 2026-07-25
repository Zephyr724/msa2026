# Slice 4B-1 — Completion Code Backend Completion Report

- **Date:** 2026-07-25
- **Status:** Backend implementation complete; pending independent review
- **Review status:** PENDING INDEPENDENT REVIEW

## Implemented scope

- Added `QuestCompletion` persistence for the `CompletionCode` method and
  `Verified` status, including the active `ParticipationId`, `VerifiedAtUtc`,
  immutable difficulty and community-region reward snapshots, timestamps, and
  PostgreSQL `xmin` concurrency.
- Added `CompletionCode` persistence with Quest-bound Base64 HMAC-SHA256 hashes,
  nullable expiry, active/revoked history, creator identity, and no plaintext,
  salt, update timestamp, or concurrency column.
- Added one additive migration creating only `QuestCompletions` and
  `CompletionCodes`, with the approved partial unique indexes, lookup indexes,
  validity-window check, Restrict FKs, participation SetNull FK, and `xmin`.
- Added generate/rotate and metadata-only status endpoints for Organizer/Admin,
  with owner/Admin authorization, atomic rotation, one reveal-only plaintext
  response, and no plaintext/hash/secret in the status response.
- Added redeem and exact four-field current-user state endpoints for explicit
  Member/Organizer/Admin roles. Actor identity comes only from the authenticated
  `NameIdentifier` claim.
- Enforced creator self-completion prevention, visible Quest/status/source/mode
  gates, active participation, duplicate Verified completion precedence,
  in-window active code verification, immutable snapshot capture, and generic
  invalid-code responses.
- Implemented redemption using one EF Core context, connection, transaction,
  and materialized parameterized Quest `SELECT ... FOR UPDATE`; saved before
  commit and rolled back every failed path. Only PostgreSQL `23505` for
  `UX_QuestCompletions_UserId_QuestId_Verified` is translated to
  AlreadyCompleted.
- Implemented generate/rotate with the same Quest lock; validity is derived
  from generation time and Quest dates, the old code is revoked only after a
  valid replacement is prepared, and the active-code unique index is the
  database backstop.
- Serialized Quest date edits on the Quest row and revoked active codes in the
  same transaction when `StartAtUtc` or `EndAtUtc` changes.
- Added the named fixed-window redeem limiter: canonical authenticated-user and
  Quest GUID partition, 10 requests per 10 minutes, queue limit zero, authentication
  before rate limiting, and `Retry-After` when lease metadata supplies it.
- Added OpenAPI/Scalar response documentation and retained global Cookie,
  antiforgery, authorization, CORS, and existing rate-limit behavior.

## Deliberately excluded

- No frontend implementation or frontend test change.
- No XP calculation, `XpTransaction`, reward display, level, rank, achievement,
  streak, leaderboard, evidence upload, SelfReported completion, Admin review,
  notification, QR, or participant-management behavior.
- No dependency, authentication-model, or unrelated schema change.
- No commit, stage, push, pull request, merge, reset, deployment, or destructive
  operation.

## Files changed

Backend production:

- `backend/src/Kiwimpact.Core/Entities/CompletionCode.cs`
- `backend/src/Kiwimpact.Core/Entities/QuestCompletion.cs`
- `backend/src/Kiwimpact.Core/Enums/CompletionMethod.cs`
- `backend/src/Kiwimpact.Core/Enums/QuestCompletionStatus.cs`
- `backend/src/Kiwimpact.Core/Repositories/IQuestCompletionRepository.cs`
- `backend/src/Kiwimpact.Core/Repositories/IQuestWriteRepository.cs`
- `backend/src/Kiwimpact.Core/Security/CompletionCodeProtector.cs`
- `backend/src/Kiwimpact.Core/Services/IQuestCompletionService.cs`
- `backend/src/Kiwimpact.Core/Services/QuestCompletionModels.cs`
- `backend/src/Kiwimpact.Core/Services/QuestCompletionService.cs`
- `backend/src/Kiwimpact.Core/Services/QuestManagementService.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/CompletionCodeConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/QuestCompletionConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260725063439_AddQuestCompletionCodes.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260725063439_AddQuestCompletionCodes.Designer.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestWriteRepository.cs`
- `backend/src/Kiwimpact.Api/Contracts/QuestCompletionContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/CompletionCodesController.cs`
- `backend/src/Kiwimpact.Api/Controllers/QuestCompletionController.cs`
- `backend/src/Kiwimpact.Api/Controllers/QuestCompletionProblemMapper.cs`
- `backend/src/Kiwimpact.Api/Helpers/ProblemDetailsHelper.cs`
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`
- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/src/Kiwimpact.Api/Security/CompletionCodeOptions.cs`
- `backend/src/Kiwimpact.Api/Security/CompletionCodeRateLimitPolicies.cs`

Backend tests:

- `backend/tests/Kiwimpact.UnitTests/Core/QuestCompletionDomainTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/OrganizerQuestsApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestCompletionApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/QuestCompletionMigrationUpgradeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/QuestCompletionPersistenceTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`

Evidence:

- `specs/ai/prompts/42-slice-4b1-completion-code-backend-implementation.md`
- `specs/implementation/reports/04b1-completion-code-backend-completion.md`

## Schema and migration evidence

Migration `20260725063439_AddQuestCompletionCodes` was generated after the EF
model compiled. Real PostgreSQL tests observed:

- clean migration to the current schema;
- upgrade from `20260724174740_AddQuestParticipation`;
- unique partial `(UserId, QuestId)` Verified-completion index and named `23505`;
- unique partial active-code-per-Quest index and active lookup index;
- `CK_CompletionCodes_ValidityWindow` rejecting `ValidTo <= ValidFrom`;
- Restrict Quest/user/region relationships and SetNull participation deletion;
- store-generated `QuestCompletion.xmin` and no CompletionCode concurrency or
  plaintext/salt/update/version column;
- no `XpTransactions` table and no evidence/SelfReported completion index.

## Security, transaction, and concurrency evidence

- Unit tests observed the 32-symbol alphabet, ten-character/50-bit format,
  normalization matrix, exact UTF-8 `QuestId:D + ":" + NormalizedCode` HMAC
  serialization, Base64 output, cross-Quest binding, match/mismatch behavior,
  and missing/invalid/short key rejection.
- Development and Production test hosts both rejected an invalid HMAC key at
  startup. Test hosts inject only a deterministic non-production 32-byte key.
- Invalid, malformed, revoked/rotated, expired, and unconfigured submissions
  produced identical status/type/title/detail ProblemDetails.
- A deterministic PostgreSQL contention test externally held the Quest row,
  observed two redeem sessions blocked on `FOR UPDATE`, then observed exactly
  one `201`, one AlreadyCompleted `409`, and one Verified row.
- A second deterministic lock test observed two concurrent rotation sessions
  blocked, then two serial `201` responses with exactly one active and one
  revoked code.
- A failed empty-window rotation left the prior active code and its plaintext
  redemption behavior intact.
- Rate-limit testing observed requests 1–10 admitted across alternating case
  representations of the same Quest GUID, duplicate `409` before the threshold,
  request 11 returning `429` with `Retry-After`, and anonymous requests remaining
  `401` rather than consuming the authenticated partition.
- CSRF tests observed `400 invalid-csrf-token` for both management and redeem
  POSTs without the required header.

## Verification commands and observed results

Final complete backend gates, run from `backend/` after implementation:

- `dotnet build Kiwimpact.slnx` — passed; 0 warnings, 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — passed; 102 passed, 0 failed, 0 skipped.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — passed; 148 passed, 0 failed, 0 skipped against PostgreSQL Testcontainers.
- `git diff --check HEAD` immediately before evidence creation — passed.

No frontend command was run because the human explicitly restricted this task
to backend implementation and no frontend file changed.

## Configuration and operational note

`CompletionCodes__HmacKey` is mandatory in every environment and must be valid
Base64 decoding to at least 32 cryptographically random bytes. It has no
committed default. Changing the configured key invalidates every active
Completion Code because plaintext is unrecoverable and no multi-version key
fallback exists. After a key change, operators must regenerate all active
codes. Existing Verified completions remain valid.

## Known limitations

- Independent implementation review has not occurred in this implementation
  session and is required before commit.
- This backend-only Slice does not supply the approved frontend generate,
  reveal/copy, redeem, or persisted-state user interface.
- Verified completion means accepted completion only. No XP was created or
  awarded; Slice 5A must use the immutable completion snapshots and an
  idempotent `SourceCompletionId` boundary before reward state can be complete.
- No browser smoke was run because the explicit scope was backend-only. HTTP,
  OpenAPI, authorization, Cookie/CSRF, rate-limit, and PostgreSQL behavior were
  exercised through the integration host.

## Review status

PENDING INDEPENDENT REVIEW
