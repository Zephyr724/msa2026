# Prompt 42 — Slice 4B-1 Completion Code Backend Implementation

- **Date:** 2026-07-25
- **Tool/model:** OpenAI Codex (GPT-5)
- **Role:** Sole implementation owner
- **Review status:** PENDING INDEPENDENT REVIEW

## Actual implementation instruction

The human supplied this implementation instruction:

> Implement Slice 4B-1 — Completion Code Backend.
>
> Use only the approved contract:
> `specs/implementation/04b-simplified-quest-completion.md`
>
> Scope:
> Backend only.
>
> Do not implement frontend.
> Do not implement XP.
> Do not implement achievements.
> Do not implement leaderboard.
>
> Before editing:
> - inspect branch;
> - inspect working tree;
> - provide a short implementation plan.
>
> Required:
> - QuestCompletion persistence;
> - CompletionCode persistence;
> - additive migration;
> - HMAC-SHA256 code storage;
> - reveal-once backend response;
> - creator self-completion prevention;
> - active participation requirement;
> - transaction-safe redemption;
> - duplicate Verified completion protection;
> - code rotation;
> - rate limiting;
> - PostgreSQL tests;
> - evidence prompt and completion report after gates pass.
>
> Do not commit.

## Implemented interpretation

- Kept the change backend-only and implemented only the approved Completion
  Code method and current-user completion state.
- Added no XP transaction, XP calculation, achievements, leaderboard,
  Evidence Claim, SelfReported completion, frontend code, dependency, or
  deployment behavior.
- Used one scoped EF Core context, connection, transaction, and materialized
  PostgreSQL Quest `FOR UPDATE` lock for redemption and generation/rotation.
- Used the same Quest lock for date-edit serialization and revoked active codes
  inside the Quest-update transaction when `StartAtUtc` or `EndAtUtc` changes.
- Added strict startup validation for the Base64 HMAC key in every environment,
  with deterministic non-production keys only in test host configuration.
- Added real PostgreSQL tests for clean/current migration, catalog definitions,
  constraints, delete behavior, `xmin`, API authorization/privacy, invalid-code
  equivalence, date windows, rotation, deterministic lock contention, and rate
  limiting.

## Verification observed before this record was created

- `dotnet build Kiwimpact.slnx` — passed; 0 warnings, 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — passed; 102 passed, 0 failed, 0 skipped.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — passed; 148 passed, 0 failed, 0 skipped against PostgreSQL Testcontainers.
- `git diff --check HEAD` before evidence creation — passed.

No frontend gate was run because the explicit implementation scope was backend
only and no frontend file changed.

## Review status

PENDING INDEPENDENT REVIEW. This high-risk Slice requires a read-only review by
a different session before commit.
