# Slice 10 — Trusted Impact Completion Report

- **Date:** 2026-07-27
- **Branch:** `codex/feat/slice-10-trusted-impact`
- **Baseline:** `7cd3b1a`
- **Status:** Complete; independent review approved
- **Risk:** High

## Implemented scope

### Trusted completion

- Added `EvidenceClaimDetail`, its privacy/review/purge fields, cascade
  ownership, reviewer FK, purge index, and the accepted pending-claim and
  self-report partial unique indexes.
- Added evidence-claim create/list/detail/update/withdraw APIs.
- Added Admin pending queue/detail/approve/reject APIs.
- Approval changes Pending to Verified and creates XP, progression, and
  milestone awards in the same database transaction.
- Added SelfReported completion creation with no XP transaction.
- Added 90-day evidence purge with a bounded hosted service running at least
  twice per day.
- Broadened current completion state and Passport history to all accepted
  methods/statuses and one-record-per-Quest precedence.
- Added Quest detail evidence/self-report UI, Passport claim/status UI, and an
  Admin Review queue.

### Account lifecycle

- Enabled required email confirmation by default.
- Added confirm/resend, forgot/reset, and authenticated change-password APIs
  and frontend flows.
- Configured Identity confirmation token lifetime to 24 hours and a distinct
  reset-token provider lifetime to 45 minutes.
- Kept forgot/resend responses non-enumerating.
- Added Development-only SMTP delivery for Mailpit.
- Kept Google OAuth/account linking and production email-provider selection
  outside this Slice.

## Main files changed

- Backend domain and persistence:
  - `backend/src/Kiwimpact.Core/Entities/EvidenceClaimDetail.cs`
  - `backend/src/Kiwimpact.Core/Entities/QuestCompletion.cs`
  - `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs`
  - `backend/src/Kiwimpact.Infrastructure/Repositories/PassportRepository.cs`
  - `backend/src/Kiwimpact.Infrastructure/Migrations/20260726224611_AddTrustedCompletionClaims.cs`
- Backend API/security:
  - `backend/src/Kiwimpact.Api/Controllers/EvidenceClaimsController.cs`
  - `backend/src/Kiwimpact.Api/Controllers/AuthController.cs`
  - `backend/src/Kiwimpact.Api/Security/AccountEmailSender.cs`
  - `backend/src/Kiwimpact.Api/Security/PasswordResetTokenProvider.cs`
  - `backend/src/Kiwimpact.Api/Reconciliation/EvidencePurgeHostedService.cs`
- Frontend:
  - `frontend/src/components/quest/TrustedCompletionPanel.tsx`
  - `frontend/src/pages/AdminReviewPage.tsx`
  - `frontend/src/pages/AccountLifecyclePages.tsx`
  - `frontend/src/pages/PassportPage.tsx`

## Verification observed

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — 35 files, 316 tests passed.
- `npm run build` — passed; 1,916 modules transformed. Vite reported the
  existing advisory that the main JavaScript chunk is over 500 kB.
- `dotnet build Kiwimpact.slnx` — passed. The full build observed five
  pre-existing EF1002 warnings in test-only raw-SQL helpers; a later targeted
  rebuild observed 0 warnings.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — 237 tests passed.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — 281 tests passed after the bounded correction pass.
- Targeted `EvidenceClaimDomainTests` — passed, 2/2.
- `git diff --check` — passed.

## Known limitations

- Production email delivery is deliberately not configured. A deployment must
  supply an approved provider before public registration is enabled.
- Google login/account linking remains deferred.
- Passport precedence is composed from the caller's completion rows in the
  repository and is suitable for the current MVP data volume; a future
  high-volume implementation should move ranking/pagination fully into SQL.
- Evidence is URL/text based; file upload, URL fetching, and previews are
  intentionally excluded.
- The Vite main-chunk size advisory remains non-blocking.

## Review status

- Independent Kimi K3 Review 56: **APPROVED**.
- Findings: 0 Blocker, 0 Major, 8 Minor.
- A bounded correction pass addressed email failure logging/resilience,
  withdraw/review concurrency, internal invariant mapping, and non-Admin
  review-query gating.
- Residual Minors are recorded in Review 56.

## Repository hygiene

The existing user-owned `.playwright-mcp/`, `docs/UI/`, and
`figma-make-1.jpeg` remain untracked and excluded from Slice 10.
