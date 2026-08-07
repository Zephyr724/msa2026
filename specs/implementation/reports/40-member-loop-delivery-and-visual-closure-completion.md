# Member Loop Delivery and Visual Closure Completion

- **Date:** 2026-08-07
- **Branch:** `codex/feat/member-loop-gamification`
- **Specification:** `specs/implementation/37-member-loop-delivery-and-visual-closure.md`
- **Prompt:** `specs/ai/prompts/99-member-loop-delivery-and-visual-closure.md`
- **Risk:** Important (durable reward delivery, additive schema change, and
  member-loop presentation)
- **Status:** Complete; correction gates and targeted K3 closure passed

## Implemented scope

- Extended the durable `MemberRewardEvent` snapshot with one immutable
  celebration title and message selected at verification time for both
  Completion Code and Evidence Approval flows.
- Added the approved additive celebration-copy catalogue migration with
  exactly 30 active titles and 50 active messages. Existing reward events
  receive neutral compatibility text; historical completions without an event
  are not backfilled and do not produce a retroactive Toast.
- Made the transient reward Toast remain for 20 active seconds, including
  synchronized hover, focus, and hidden-tab pausing. The existing game-style
  reward composition remains intact, while the `Passport saved` region is now
  a single keyboard-accessible Passport link with a compact `Go` affordance.
- Made asynchronous reward delivery invalidate completion, participation,
  Passport, progression, achievements, leaderboard, claim, and reward-event
  reads so persistent member surfaces converge without a manual reload.
- Completed the persistent verified-Quest resolution with a large decorative
  20%-opacity Mission Completed stamp, stable celebration text, full reward
  details, and three separate actions in the approved order: primary green
  Next Quest, Protect Wildlife-blue Community share, and neutral View
  Passport.
- Added View Quest beside Share on each Verified Passport history item and
  applied the approved blue treatment to completion/share entry points without
  globally recolouring unrelated controls.
- Enlarged the four My Quests state controls while preserving group/button
  semantics. At 320 px they wrap without horizontal page overflow.
- Corrected the Quest detail grid to use a constrained base track after real
  browser verification exposed a 10 px overflow at 320 px. The finished page
  measures `scrollWidth = clientWidth = 320`.
- Updated Reward Lab guidance from the obsolete five-second duration to the
  implemented twenty-second duration.

## Files changed

### Backend

- `backend/src/Kiwimpact.Api/Contracts/QuestCompletionContracts.cs`
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`
- `backend/src/Kiwimpact.Core/Entities/CompletionCelebrationCopy.cs`
- `backend/src/Kiwimpact.Core/Entities/MemberRewardEvent.cs`
- `backend/src/Kiwimpact.Core/Enums/CompletionCelebrationCopyKind.cs`
- `backend/src/Kiwimpact.Core/Repositories/IQuestCompletionRepository.cs`
- `backend/src/Kiwimpact.Core/Services/QuestCompletionModels.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/CompletionCelebrationCopyConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/MemberRewardEventConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260807074101_AddCompletionCelebrationCopy.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260807074101_AddCompletionCelebrationCopy.Designer.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/ProgressionApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestCompletionApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs`

### Frontend

- `frontend/src/components/passport/CompletionHistoryItem.tsx`
- `frontend/src/components/passport/MissionCompletedStamp.tsx`
- `frontend/src/components/passport/ShareCard.tsx`
- `frontend/src/components/quest/QuestCompletionPanel.tsx`
- `frontend/src/components/reward/RewardFeedbackProvider.tsx`
- `frontend/src/components/reward/RewardInboxDelivery.tsx`
- `frontend/src/hooks/useCompletion.ts`
- `frontend/src/index.css`
- `frontend/src/lib/api/completion.ts`
- `frontend/src/lib/validation/completionDto.ts`
- `frontend/src/pages/MyQuestsPage.tsx`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/src/pages/RewardLabPage.tsx`
- `frontend/src/pages/ShareCardBuilderPage.tsx`
- `frontend/src/types/completion.ts`
- `frontend/tests/integration/MyQuestsPage.test.tsx`
- `frontend/tests/integration/PassportPage.test.tsx`
- `frontend/tests/integration/QuestCompletionPanel.test.tsx`
- `frontend/tests/integration/QuestDetailPage.test.tsx`
- `frontend/tests/integration/RewardFeedback.test.tsx`
- `frontend/tests/integration/RewardInboxDelivery.test.tsx`
- `frontend/tests/unit/completionDto.test.ts`
- `frontend/tests/unit/useCompletion.test.tsx`

### Evidence

- `specs/implementation/37-member-loop-delivery-and-visual-closure.md`
- `specs/ai/prompts/99-member-loop-delivery-and-visual-closure.md`
- `specs/implementation/reports/40-member-loop-delivery-and-visual-closure-completion.md`
- `specs/ai/reviews/91-member-loop-delivery-and-visual-closure-k3-review.md`

## Verification observed

- Focused frontend verification passed: 7 files, 82 tests, covering the
  Toast duration and pausing, Passport link, reward-inbox refresh, celebration
  rendering, CTA hierarchy, Passport history actions, Share colour, and My
  Quests controls.
- Focused backend verification passed: 26 tests covering Completion Code,
  Evidence Approval, celebration snapshot selection, category aggregation,
  and migration data.
- `npm run lint` passed after the browser-discovered correction.
- `npm run type-check` passed after the browser-discovered correction.
- `npm run test -- --run` passed after the browser-discovered correction: 54
  files, 421 tests.
- `npm run build` passed after the browser-discovered correction. Vite emitted
  a non-blocking chunk-size advisory for the 852.34 kB minified main JavaScript
  chunk (235.52 kB gzip).
- `dotnet build Kiwimpact.slnx --no-restore` passed with 5 pre-existing EF1002
  warnings in integration-test SQL helpers and 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  passed: 316 tests.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  passed: 350 tests.
- `dotnet ef migrations has-pending-model-changes ... --no-build` reported:
  `No changes have been made to the model since the last migration.`
- `git diff --check` passed after the browser-discovered correction.
- A fresh temporary PostgreSQL database was migrated through
  `20260807074101_AddCompletionCelebrationCopy`; direct observation confirmed
  30 active Title rows and 50 active Message rows.
- The in-app browser used that migrated isolated database to sign in as an
  organizer, create and publish a Quest, generate a Completion Code, sign in
  as a member, join the Quest, and redeem the code. The live result showed the
  reward Toast, +50 XP, Level 3 to 4, Building Momentum, one-week streak,
  Albert-Eden Community Challenge 23 to 24, Passport saved, and the complete
  persistent resolution.
- The selected `Another Win!` title and its message remained identical after
  a page reload. Direct database observation matched the rendered snapshot.
- The isolated member ended with 3 Verified completions and exactly 1 reward
  event, proving that the two seeded historical completions were not
  backfilled.
- The live Passport changed Restore Nature from 1 to 2 rewarded Quests and
  rendered the new completion with a blue Share action and View Quest link.
- The real completed page rendered the decorative stamp at computed opacity
  `0.2`; its CTA order and computed backgrounds were primary green Next Quest,
  `rgb(60, 114, 201)` Community Share, then neutral View Passport.
- Desktop/light, 320 px/light, and 320 px/dark surfaces were inspected. The
  corrected completed Quest, Passport, Reward Lab, and My Quests pages all
  measured `scrollWidth = clientWidth` at 320 px.
- A Reward Lab Toast remained present after 5.6 seconds and its Passport link
  navigated successfully. The exact 20-second active duration and pause/resume
  accounting were additionally verified with deterministic frontend timers.
- Browser logs contained transient SignalR negotiation disconnects during
  navigation followed by successful connections; no application runtime
  exception was observed in the completed localhost flow.
- Verification-only frontend/backend processes were stopped and both
  temporary browser databases were permanently removed. The existing 5091
  development service and its normal database were not modified by the final
  end-to-end flow.

## Known limitations

- Evidence Approval equivalence and automatic refresh are covered by backend
  integration and frontend delivery tests; the manual browser flow exercised
  Completion Code delivery only.
- The browser did not wait the full twenty seconds in real time. Exact
  duration and all pause states are verified by deterministic tests, while the
  browser confirmed that the Toast survives the former five-second boundary.
- Celebration catalogue administration, historical event reconstruction,
  sound, haptics, currency, shop, and icon replacement remain explicitly out
  of scope.
- The existing JavaScript chunk-size advisory remains; no dependency or
  unrelated code-splitting change was authorized for this Slice.
- Deployment verification was not performed; this task did not authorize a
  deploy.

## Review status

- Independent Kimi K3 review is recorded in
  `specs/ai/reviews/91-member-loop-delivery-and-visual-closure-k3-review.md`.
- K3 found no Blocker. Its one Major identified that asynchronous delivery
  relied on the completion-enabled query transition instead of explicitly
  invalidating the per-Quest reward-event read.
- The one concentrated correction pass added the exact reward-event
  invalidation and a focused integration assertion. Lint, type-check, and the
  focused test passed; targeted K3 closure confirmed M1 is closed and no
  original Blocker/Major remains.
- No implementation has been staged, committed, pushed, deployed, or submitted
  as a pull request.
