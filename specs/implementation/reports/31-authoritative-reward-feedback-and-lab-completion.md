# Slice 31 — Authoritative Reward Feedback and Development Lab Completion Report

- **Date:** 2026-08-05
- **Implementation status:** Complete locally
- **Commit readiness:** Pending one independent read-only review

## Implemented scope

### Authoritative reward transaction

- Expanded successful Completion Code redemption from a completion-only DTO to
  one exact `completion` plus `reward` envelope.
- Used the committed XP transaction ID as the reward event ID and returned the
  actual XP amount, previous/current XP, previous/current level and rank, and
  only achievements newly staged for that redemption.
- Preserved the existing completion, XP, progression, and automatic achievement
  writes in their transaction boundary; no schema or progression-formula change
  was made.
- Updated the frontend API validator and mutation boundary so UI feedback is
  based on the authoritative response rather than projected Quest XP.

### Reward experience

- Added an application-level memory-only reward queue with event-ID
  deduplication.
- Added a mature Kiwimpact-styled reward Toast with Quest completion, actual XP,
  level/rank transitions, and bounded achievement reveals.
- Added explicit close and five-second auto-dismiss, pausing for hover, focus,
  or document visibility loss.
- Added nine transform/opacity-only gold particles that travel from the Toast XP
  row to a responsive XP target, followed by target pulse and XP count-up.
- Added a compact mobile XP target and kept the persistent verified-completion
  panel after the transient reward closes.
- Added polite live-region semantics, a 44-pixel close target, no focus trap,
  and reduced-motion handling that removes particles and count-up while keeping
  the full information.

### Complete test path

- Added `/dev/rewards`, an unauthenticated Vite-Development-only Reward Lab.
- Added standard completion, level-up, rank-up, achievement, combined, and
  reduced-motion scenarios. All are visibly marked Preview, remain in memory,
  and perform no backend mutation.
- Added a simulated header XP target for unauthenticated previews.
- Documented `member1@kiwimpact.test` as the persisted-path persona using the
  existing ignored local `DemoAccounts:Password`; no credential or auth bypass
  was added to tracked source.
- Confirmed the production Vite build succeeds with the Development route
  condition compiled as false.

## Files changed

Backend production and tests:

- `backend/src/Kiwimpact.Api/Contracts/QuestCompletionContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/QuestCompletionController.cs`
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`
- `backend/src/Kiwimpact.Core/Repositories/IQuestCompletionRepository.cs`
- `backend/src/Kiwimpact.Core/Services/IQuestCompletionService.cs`
- `backend/src/Kiwimpact.Core/Services/QuestCompletionModels.cs`
- `backend/src/Kiwimpact.Core/Services/QuestCompletionService.cs`
- `backend/src/Kiwimpact.Infrastructure/Achievements/AchievementAwardService.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/ProgressionApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestCompletionApiTests.cs`

Frontend production and tests:

- `frontend/src/app/AppShell.tsx`
- `frontend/src/app/router.tsx`
- `frontend/src/components/PlayerStatusCapsule.tsx`
- `frontend/src/components/quest/QuestCompletionMethods.tsx`
- `frontend/src/components/quest/QuestCompletionPanel.tsx`
- `frontend/src/components/reward/RewardFeedbackProvider.tsx`
- `frontend/src/components/reward/rewardFeedback.ts`
- `frontend/src/hooks/useCompletion.ts`
- `frontend/src/index.css`
- `frontend/src/lib/api/completion.ts`
- `frontend/src/lib/validation/completionDto.ts`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/src/pages/RewardLabPage.tsx`
- `frontend/src/types/completion.ts`
- `frontend/tests/integration/QuestCompletionPanel.test.tsx`
- `frontend/tests/integration/RewardFeedback.test.tsx`
- `frontend/tests/unit/completionDto.test.ts`
- `frontend/tests/unit/useCompletion.test.tsx`

Specification and operator guidance:

- `README.md`
- `specs/architecture/03-api-contract.md`
- `specs/implementation/31-reward-feedback-and-lab.md`
- `specs/ai/prompts/87-authoritative-reward-feedback-and-lab.md`
- `specs/implementation/reports/31-authoritative-reward-feedback-and-lab-completion.md`

Several shared files already contained unrelated Community work in the dirty
worktree. This Slice did not discard or rewrite those changes.

## Verification commands and observed results

| Command or check | Observed result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed after correcting the reward motion-preference union from the draft name to the existing `system` value |
| `npm run test -- --run` | Passed: 50 test files, 396 tests |
| `npm run build` | Passed; Vite reported the existing greater-than-500-kB chunk-size advisory |
| `dotnet build Kiwimpact.slnx` | Passed: 0 errors; 5 existing EF1002 warnings in integration-test raw-SQL fixtures |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 308 tests, 0 failed, 0 skipped |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Passed after correcting one stale completion-only response assertion: 342 tests, 0 failed, 0 skipped |
| Focused reward frontend suite | Passed: 4 files, 48 tests |
| Focused completion API integration suite | Passed: 20 tests |

## Real-browser verification

The local Vite frontend at `http://127.0.0.1:5173` and ASP.NET Core API at
`http://localhost:5091` were exercised through the in-app browser.

- Reward Lab opened without authentication and exposed all six intended
  scenarios.
- Combined reward showed actual XP, Level 9 to 10, Scout rank unlock, and
  Building Momentum achievement in one non-modal Toast.
- The particle layer mounted for full-motion scenarios; the simulated header
  XP target showed the previous 220 XP / Level 4 state before arrival and the
  270 XP / Level 5 state after arrival.
- Explicit close removed the Toast; another Toast was observed to disappear
  automatically after 5.3 seconds.
- Dark-mode rendering was visually inspected.
- A 320 by 720 viewport was inspected. An initial 28-pixel header overflow was
  traced to the Development preview target plus public join action and fixed;
  the final body and document scroll widths both equalled the 320-pixel
  viewport.
- Reduced-motion preview mounted no particle layer and updated immediately to
  270 XP / Level 5 without count-up.
- Browser logs contained existing hydration-fallback and local SignalR
  negotiation messages plus transient Vite hot-reload errors during editing;
  no Reward Lab runtime error was observed after the corrected reload.

## Known limitations

- Immediate reward feedback is attached to Completion Code redemption. Later
  reward-producing flows, including asynchronous Evidence Claim approval, need
  their own notification delivery contract before they can reuse the queue.
- The queue is deliberately memory-only; a page reload does not replay old
  celebrations.
- The five-second progress line pauses through CSS for hover/focus while the
  JavaScript dismissal clock also pauses for hover, focus, and document hidden.
  It is not a persistence timer and does not survive navigation/reload.
- No Production deployment, authenticated manual Completion Code redemption,
  audio, haptics, schema change, or dependency change was performed.
- No file was staged, committed, pushed, deployed, or added to a pull request.

## Review status

This cross-layer API and reward-experience change is treated as important. The
required implementation prompt, accepted specification, and completion report
now exist, so it is ready for one independent read-only review selected by the
product owner. All original Blocker/Major findings from that review must be
closed before commit readiness.
