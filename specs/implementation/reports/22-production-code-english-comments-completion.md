# Production Code English Comments — Completion Report

## Status

Implementation and applicable local verification are complete on
`docs/english-production-comments`. No production behavior was intentionally
changed.

## Implemented scope

- Inventoried and screened 152 backend and 113 frontend human-maintained
  production source files.
- Added 213 lines and removed one existing comment line across 44 production
  files. The removal replaced a shorter catch-block comment with a more useful
  explanation.
- Added comments around:
  - authentication lifecycle and account-enumeration defenses;
  - antiforgery retry behavior and stable Problem Details types;
  - Quest ownership, lifecycle, completion-code validity, and optimistic
    concurrency;
  - transactional locks, unique constraints, idempotency, and query
    determinism;
  - evidence retention, immutable community attribution, and privacy
    thresholds;
  - Auckland calendar boundaries, weekly streaks, and challenge periods;
  - React URL state, query invalidation, dirty-form protection, focus
    restoration, and authoritative server-state synchronization;
  - map and image fallbacks, coordinate entry accessibility, share-card
    privacy, fixed-resolution rendering, and reduced motion;
  - shared CSS theme and layout primitives.
- Left generated migrations, tests, direct DTO/type declarations, obvious
  assignments, and straightforward JSX unchanged.
- Added no dependency, configuration, schema, API, or runtime behavior change.

## Files changed

Backend production source:

- `backend/src/Kiwimpact.Api/Controllers/AuthController.cs`
- `backend/src/Kiwimpact.Api/Controllers/CommunityChallengesController.cs`
- `backend/src/Kiwimpact.Api/Controllers/EvidenceClaimsController.cs`
- `backend/src/Kiwimpact.Api/Controllers/ProfileController.cs`
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`
- `backend/src/Kiwimpact.Api/Reconciliation/CommunityChallengeFinalizer.cs`
- `backend/src/Kiwimpact.Api/Security/ApiAntiforgeryFilter.cs`
- `backend/src/Kiwimpact.Core/Entities/CommunityChallenge.cs`
- `backend/src/Kiwimpact.Core/Entities/EvidenceClaimDetail.cs`
- `backend/src/Kiwimpact.Core/Entities/Quest.cs`
- `backend/src/Kiwimpact.Core/Entities/QuestCompletion.cs`
- `backend/src/Kiwimpact.Core/Progression/WeeklyStreakCalculator.cs`
- `backend/src/Kiwimpact.Core/Security/CompletionCodeProtector.cs`
- `backend/src/Kiwimpact.Core/Services/LeaderboardService.cs`
- `backend/src/Kiwimpact.Core/Services/QuestCompletionModels.cs`
- `backend/src/Kiwimpact.Core/Services/QuestManagementService.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/IdentitySeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/AchievementRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/LeaderboardRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/PassportRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestParticipationRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestWriteRepository.cs`

Frontend production source:

- `frontend/src/components/PlayerStatusSummary.tsx`
- `frontend/src/components/community/CommunityChallengesSection.tsx`
- `frontend/src/components/maps/CoordinatePicker.tsx`
- `frontend/src/components/maps/QuestMap.tsx`
- `frontend/src/components/organizer/QuestForm.tsx`
- `frontend/src/components/organizer/QuestLifecycleActions.tsx`
- `frontend/src/components/quest/QuestCompletionPanel.tsx`
- `frontend/src/components/quest/TrustedCompletionPanel.tsx`
- `frontend/src/hooks/useOrganizerQuests.ts`
- `frontend/src/hooks/useParticipation.ts`
- `frontend/src/hooks/useThemeSync.ts`
- `frontend/src/index.css`
- `frontend/src/lib/questPresentation.ts`
- `frontend/src/lib/shareCard.ts`
- `frontend/src/pages/AccountLifecyclePages.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/LeaderboardPage.tsx`
- `frontend/src/pages/MyQuestsPage.tsx`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/src/pages/QuestListPage.tsx`
- `frontend/src/pages/ShareCardBuilderPage.tsx`

Implementation evidence:

- `specs/ai/prompts/78-production-code-english-comments.md`
- `specs/implementation/reports/22-production-code-english-comments-completion.md`

## Verification commands and observed results

| Command or check | Observed result |
| --- | --- |
| `npm run lint` | Passed with no reported warning |
| Initial `npm run type-check` | Could not start because the locally installed dependency tree lacked the lockfile-declared `cypress` package |
| `npm ci` | Restored 331 packages from the existing lockfile; no tracked dependency declaration changed |
| Final `npm run type-check` | Passed |
| `npm run build` | Passed; 1,963 modules transformed; the existing main-chunk size advisory remains |
| `npm run test -- --run` | Passed: 46 files, 347 tests |
| `dotnet build Kiwimpact.slnx` | Passed: 0 errors and 5 existing EF1002 warnings in integration-test source |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 250 tests |
| `git diff --check` | Passed after production edits and again after evidence creation |

## Known limitations

- Comments were added selectively. Screening every human-maintained production
  file did not imply changing every file; direct declarations and self-evident
  rendering remain intentionally uncommented.
- Backend integration tests were not run because the change is comment-only,
  the solution compiled successfully, and the unit gates passed.
- Vite continues to report the existing main-chunk size advisory.
- The backend build continues to report five existing EF1002 warnings in test
  source.
- Account-level ChatGPT usage was not observable from the Codex session, so the
  requested 85-percent stop threshold could not be measured automatically.

## Review status

This is a low-risk, comment-only documentation change. Under the accepted
deadline workflow, it does not require an independent model review unless the
human requests one. No independent review was performed.

The work remains unstaged and uncommitted pending explicit human Git
authorization.
