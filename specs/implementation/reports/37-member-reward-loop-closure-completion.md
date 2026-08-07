# Member Reward Loop Closure Completion

- **Date:** 2026-08-07
- **Branch:** `codex/feat/member-loop-gamification`
- **Specification:** `specs/implementation/34-member-reward-loop-closure.md`
- **Prompt:** `specs/ai/prompts/96-member-reward-loop-closure.md`
- **Risk:** Important (cross-stack reward delivery and additive schema change)
- **Status:** Complete; automated/browser verification and targeted K3 closure passed

## Implemented scope

- Added a durable, per-member reward-event inbox with immutable reward,
  progression, streak, achievement, and optional active-community-challenge
  snapshots.
- Created reward events atomically for both Completion Code redemption and
  asynchronous Evidence Approval. The event identifier is the XP transaction
  identifier, and the completion relationship is unique, so retries cannot
  create a second reward event for the same verified completion.
- Added authenticated APIs to list unseen events, acknowledge an owned event,
  and read the persistent reward resolution for an owned Quest completion.
- Delivered unseen events into the existing in-memory Toast queue and
  acknowledged them only after queue acceptance. Failed acknowledgements are
  replayable, while the provider deduplicates events during the session.
- Kept Toast transient and compact: the approved game-style heading, Quest
  verification, XP and Passport save are always shown; level/rank,
  achievement, streak, and community challenge changes remain conditional.
- Restored the curved handwritten heading to readable Title Case for all three
  visible variants (`Mission Complete`, `Congratulations!`, and
  `Mission Verified`) while retaining the approved uppercase semantic names
  for assistive technology and product rules. Reward Lab now exposes standard
  completion and Evidence Approval previews separately.
- Added a persistent Quest completion resolution with the full reward,
  challenge delta, Passport action, Verified Story action, and a concrete
  same-category next Quest where available. A completion correction promotes
  that next Quest to the first, full-width primary action; Passport and
  Verified Story are secondary, so CTA hierarchy now advances the loop rather
  than only satisfying link presence.
- Corrected the mobile Quest-detail shortcut so it remains available while the
  actions surface is off screen but disappears while that surface is visible;
  it no longer covers the primary Next Quest or the two secondary actions.
- Fixed the My Quest week-streak tooltip clipping by allowing the Player
  Status panel to render overflow and raising the tooltip stacking layer.
- Preserved the existing visual system and icon set; global icon replacement
  remains outside this Slice.

## Files changed

- `backend/src/Kiwimpact.Core/Entities/MemberRewardEvent.cs`
- `backend/src/Kiwimpact.Core/Entities/MemberRewardEventAchievement.cs`
- `backend/src/Kiwimpact.Core/Repositories/IQuestCompletionRepository.cs`
- `backend/src/Kiwimpact.Core/Services/IQuestCompletionService.cs`
- `backend/src/Kiwimpact.Core/Services/QuestCompletionModels.cs`
- `backend/src/Kiwimpact.Core/Services/QuestCompletionService.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/MemberRewardEventConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/MemberRewardEventAchievementConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260806161953_AddMemberRewardInbox.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260806161953_AddMemberRewardInbox.Designer.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`
- `backend/src/Kiwimpact.Api/Contracts/QuestCompletionContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/QuestCompletionController.cs`
- `backend/src/Kiwimpact.Api/Controllers/RewardEventsController.cs`
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestCompletionApiTests.cs`
- `frontend/src/app/AppShell.tsx`
- `frontend/src/components/PlayerStatusSummary.tsx`
- `frontend/src/components/quest/QuestCompletionMethods.tsx`
- `frontend/src/components/quest/QuestCompletionPanel.tsx`
- `frontend/src/components/reward/RewardFeedbackProvider.tsx`
- `frontend/src/components/reward/RewardInboxDelivery.tsx`
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
- `specs/implementation/34-member-reward-loop-closure.md`
- `specs/ai/prompts/96-member-reward-loop-closure.md`
- `specs/implementation/reports/37-member-reward-loop-closure-completion.md`

## Verification observed

- `npm run test -- --run tests/integration/QuestCompletionPanel.test.tsx tests/integration/RewardFeedback.test.tsx tests/unit/completionDto.test.ts tests/unit/useCompletion.test.tsx` passed: 4 files, 50 tests.
- `npm run type-check` passed.
- `dotnet build Kiwimpact.slnx --no-restore` passed with 5 pre-existing
  EF1002 warnings in integration-test SQL helpers and no errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  passed: 309 tests.
- Focused Quest Completion integration verification passed: Completion Code
  delivery/resolution/acknowledgement and Evidence Approval inbox delivery,
  2 tests.
- `dotnet ef migrations has-pending-model-changes ... --no-build` reported:
  `No changes have been made to the model since the last migration.`
- `npm run lint` passed.
- `npm run test -- --run` passed after the final correction pass: 53 files,
  416 tests.
- `npm run build` passed with only the existing JavaScript chunk-size advisory.
- Final `dotnet build Kiwimpact.slnx` passed with 5 pre-existing EF1002
  warnings in integration-test SQL helpers and 0 errors.
- Final Unit Tests passed: 316 tests. Full Integration Tests passed: 350 tests.
- In-app browser inspection covered the transient Toast in light/dark desktop
  and dark 320 px states, including the game heading, XP, weekly streak,
  Passport save, conditional milestone composition, animation timing, and the
  absence of Next Quest/dashboard content in the Toast.
- The persistent verified-completion surface was observed with Passport,
  Verified Story, and next-Quest actions. Its complete reward, achievement,
  community delta, and action composition is additionally exercised by the
  passing Quest completion integration/component tests.
- The My Quests Week Streak tooltip was hovered at 320 px and was visibly
  rendered above the Player Status card rather than clipped by it.
- `git diff --check` passed.
- After the Title Case readability correction, focused reward verification
  passed: 2 files, 28 tests; lint, type-check, production build, and
  `git diff --check` also passed. Browser inspection confirmed all three titles
  in the dark desktop state and `Congratulations!` at 320 px without horizontal
  overflow.
- After correcting the persistent CTA hierarchy, the focused Quest completion
  and mobile shortcut behaviour, the focused Quest completion/detail suites
  passed 25/25. `npm run lint`, `npm run type-check`, and `npm run build`
  passed; the build retained only the existing chunk-size advisory. The CTA
  regression verifies a concrete recommendation is the first primary action
  while Passport and Verified Story are not primary, and the detail-page
  regression verifies the mobile shortcut leaves when the actions region is
  visible.
- The final frontend suite after this correction passed: 53 files, 419 tests.
- Real-browser correction verification used the persisted completion for
  `Mt Roskill Stream Planting`. At desktop width, Next Quest rendered first as
  the solid green 48 px action while Passport and Verified Story remained
  secondary. At an explicit 320 × 800 viewport, entering the Quest actions
  area removed the fixed shortcut and fully exposed Next Quest, View Passport,
  and Share Verified Story above the member navigation; the Next Quest bounds
  remained within the 320 px viewport.

## Known limitations

- Events intentionally begin with newly verified completions after this
  migration; no historical reward-event backfill was specified or added.
- The migration intentionally does not backfill historical completions, so an
  older seeded completion can show the compatible action fallback rather than
  a reward snapshot. All newly verified completions use the durable resolution.

## Review status

- The initial Kimi K3 review is recorded in
  `specs/ai/reviews/88-member-reward-loop-closure-k3-review.md`.
- Its optional concurrency finding was corrected by serializing the community
  count-and-snapshot operation on the active challenge row and adding focused
  concurrency coverage.
- Targeted K3 closure passed: M1 and the optional concurrency finding are
  closed; no original Blocker/Major remains.
