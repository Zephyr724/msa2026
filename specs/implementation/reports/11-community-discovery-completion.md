# Slice 11 — Community Discovery Completion Report

- **Date:** 2026-07-27
- **Branch:** `codex/feat/slice-11-community-discovery`
- **Baseline:** `94a129c`
- **Status:** Complete; independent review approved
- **Risk:** High

## Implemented scope

### Map-assisted Quest discovery

- Added optional paired Quest latitude/longitude values throughout domain,
  persistence, public DTOs and Organizer/Admin mutation contracts.
- Added decimal precision, paired-value and geographic-range database
  constraints plus an additive EF Core migration.
- Added published-Quest Google Maps markers, automatic fit bounds, marker
  summaries and detail links while retaining the complete authoritative list.
- Added map click selection and accessible numeric coordinate fields to Quest
  management, with a no-key/no-map fallback.
- Added deterministic coordinates to the existing local demo Quest seed.

### Community identity, leaderboards and streak

- Added authenticated Home Community read/update and Passport visibility
  preference APIs and UI.
- Enforced active `LocalArea` selection, free first selection and a 30-day
  subsequent-change cooldown without rewriting historical XP attribution.
- Expanded people leaderboards to My Community, Auckland and New Zealand over
  weekly, monthly and all-time periods with pagination.
- Added Auckland/New Zealand community leaderboards over monthly/all-time
  periods.
- Preserved immutable-XP-ledger authority, Pacific/Auckland boundaries,
  deterministic ranking and fail-closed pending-reward behavior.
- Suppressed individual community rankings and sensitive aggregate contributor
  metrics below the accepted threshold of 10. Privacy-protected people
  responses return no rows, exact participant count, or aggregate progress.
- Added a weekly verified-impact streak API and Passport card.

### Sharing, challenges and live refresh

- Added a client-side PNG Share Card with display-name opt-in. It contains
  progression and an optional completion but never community, email, user ID,
  evidence, claim text or review notes.
- Added persisted Community Challenges with one active challenge per Local
  Area, public list/detail/progress and Admin create/edit-before-start/cancel.
- Added `[PeriodStart, PeriodEnd)` XP-derived progress, contributor privacy
  suppression and an optional, idempotent achievement reward finalizer.
- Added configurable 15-minute hosted finalization with a bounded 100-challenge
  pass.
- Added `/hubs/leaderboard` and the `ImpactChanged` event after successful
  completion-code redemption or evidence approval.
- Added a frontend SignalR listener that only invalidates TanStack Query data;
  REST remains authoritative and socket failure is non-fatal.

## Main files changed

- Backend domain/API:
  - `backend/src/Kiwimpact.Core/Entities/CommunityChallenge.cs`
  - `backend/src/Kiwimpact.Core/Entities/Quest.cs`
  - `backend/src/Kiwimpact.Core/Entities/UserProfile.cs`
  - `backend/src/Kiwimpact.Core/Progression/WeeklyStreakCalculator.cs`
  - `backend/src/Kiwimpact.Core/Services/LeaderboardService.cs`
  - `backend/src/Kiwimpact.Api/Controllers/CommunityChallengesController.cs`
  - `backend/src/Kiwimpact.Api/Controllers/LeaderboardsController.cs`
  - `backend/src/Kiwimpact.Api/Controllers/ProfileController.cs`
  - `backend/src/Kiwimpact.Api/Controllers/StreakController.cs`
  - `backend/src/Kiwimpact.Api/Hubs/LeaderboardHub.cs`
  - `backend/src/Kiwimpact.Api/Reconciliation/CommunityChallengeFinalizer.cs`
- Backend persistence:
  - `backend/src/Kiwimpact.Infrastructure/Data/Configurations/CommunityChallengeConfiguration.cs`
  - `backend/src/Kiwimpact.Infrastructure/Data/Configurations/QuestConfiguration.cs`
  - `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserAchievementConfiguration.cs`
  - `backend/src/Kiwimpact.Infrastructure/Repositories/LeaderboardRepository.cs`
  - `backend/src/Kiwimpact.Infrastructure/Migrations/20260726233101_AddCommunityDiscovery.cs`
- Frontend:
  - `frontend/src/components/maps/QuestMap.tsx`
  - `frontend/src/components/maps/CoordinatePicker.tsx`
  - `frontend/src/components/community/CommunityProfileCard.tsx`
  - `frontend/src/components/community/CommunityChallengesSection.tsx`
  - `frontend/src/components/community/LiveImpactInvalidation.tsx`
  - `frontend/src/components/community/WeeklyStreakCard.tsx`
  - `frontend/src/components/passport/ShareCard.tsx`
  - `frontend/src/pages/QuestListPage.tsx`
  - `frontend/src/pages/LeaderboardPage.tsx`
  - `frontend/src/pages/PassportPage.tsx`
  - `frontend/src/hooks/useCommunity.ts`
  - `frontend/src/hooks/useLeaderboard.ts`
- Verification:
  - `backend/tests/Kiwimpact.UnitTests/Core/CommunityDiscoveryDomainTests.cs`
  - `backend/tests/Kiwimpact.UnitTests/Core/LeaderboardServiceTests.cs`
  - `backend/tests/Kiwimpact.IntegrationTests/Api/CommunityDiscoveryApiTests.cs`
  - updated Quest, leaderboard, achievement and migration integration tests
  - updated frontend leaderboard, Passport, App shell, DTO and query tests
- Configuration/evidence:
  - `frontend/package.json`, `frontend/package-lock.json`,
    `frontend/.env.example`
  - `backend/src/Kiwimpact.Api/appsettings.json`
  - `PROJECT_STATUS.md`
  - `specs/implementation/11-community-discovery.md`
  - Prompt 61 and this report

## Verification observed

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — 35 files, 308 tests passed.
- `npm run build` — passed; 1,953 modules transformed. Vite reported the
  non-blocking main-chunk advisory at 619.65 kB.
- `dotnet build Kiwimpact.slnx` — passed. It observed five pre-existing EF1002
  warnings in integration-test raw-SQL helpers and no errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — 247 tests passed.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — 284 tests passed.
- Targeted Slice 11 API integration tests — 3/3 passed.
- Targeted migrated leaderboard/Quest/achievement regression set — 86/86
  passed.
- `git diff --check` — passed.
- `npm audit --omit=dev` — reported two high-severity findings through
  `react-router-dom`/`react-router`. The suggested automated remediation is a
  forced breaking downgrade and was not applied.

## Known limitations

- No Google Maps browser key was available in this workspace, so the
  no-key/list/numeric-input fallback is implemented and tested but a live
  Google-rendered map was not visually observed. A restricted local key belongs
  in `frontend/.env.local`; production referrer restrictions need separate
  deployment review.
- Production email delivery and Google OAuth/account linking remain outside
  this Slice.
- SignalR is best-effort invalidation only; clients always recover through
  authoritative REST queries.
- The Vite main bundle is over its advisory threshold. Code splitting can be
  considered in a later performance Slice.
- The current React Router advisory is recorded above. This SPA does not use
  React Server Components/actions, but dependency remediation requires a
  separately approved compatible dependency change.
- Dockerization, deployment and public-production verification remain paused
  and out of scope.

## Review status

- Independent Kimi K3 Review 57: **APPROVED**.
- Initial findings: 0 Blocker, 1 Major, 6 grouped Minors.
- The bounded correction pass closed Major M1 by withholding all exact
  sub-threshold My Community metrics. The same Kimi session's targeted closure
  check marked M1 closed and the Slice commit-ready.
- Share Card's Verified-only selection was also corrected. Remaining Minors and
  residual risks are recorded in Review 57.

## Repository hygiene

The existing user-owned `.playwright-mcp/`, `docs/UI/`, and
`figma-make-1.jpeg` remain untracked and are excluded from Slice 11.
