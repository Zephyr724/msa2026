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
- Added explicit close and five-second auto-dismiss for ordinary rewards,
  extended to ten seconds for combined level/rank-plus-achievement rewards,
  pausing for hover, focus, or document visibility loss.
- Added seven enlarged transform/opacity-only gold, single four-point sparkle
  glyphs that enter sequentially along one curved path from the Toast XP row to
  a responsive XP target, followed by target pulse and XP count-up. Flight
  particles deliberately omit the smaller satellite stars present in the
  Lucide `Sparkles` XP icon.
- Increased each flight sparkle from 18 px to 27 px, enlarged the revealed
  target level slightly, and changed the achievement-title stamp to a direct
  perspective/translate-Z impact with no horizontal travel.
- Extended the new-level entrance to 480 ms so its fully visible state ends with
  a restrained four-step horizontal shake that decays from 2 px to rest.
- Changed flight sparkles from solid fills to one hollow gold outline path with
  rounded joins and a non-scaling stroke, preserving clarity as they move and
  resize.
- Increased the hollow flight-star outline twice by 20%, from 2.2 px to 2.64 px
  and finally 3.168 px, while keeping the interior unfilled.
- Refined the Toast hierarchy with an approximately 86%-width, upward-curved,
  near-gold `Pinyon Script` `Congratulation` heading above all reward details.
  The final version leaves roughly 7% on either side and uses a softened
  550-weight presentation with a restrained outline.
- Added a scale-and-rise entrance to only the near-gold XP amount; its
  `Sparkles` icon remains static. The sequence then runs the particle stream,
  waits one second, plays the rightward arrow and near-gold target-level reveal,
  waits one second after the arrow finishes, and finally stamps the near-gold
  achievement title from large to its resting size while the panel stays still.
- Standardized every frontend XP icon on Lucide `Sparkles`, including reward,
  header, progression, Quest discovery/detail, completion history, home, and
  authentication surfaces; no lightning-bolt XP glyph remains in frontend
  source.
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
- `frontend/src/components/PlayerStatusSummary.tsx`
- `frontend/src/components/passport/CompletionHistoryItem.tsx`
- `frontend/src/components/passport/PassportSummaryCard.tsx`
- `frontend/src/components/quest/QuestCard.tsx`
- `frontend/src/components/quest/QuestCompletionMethods.tsx`
- `frontend/src/components/quest/QuestCompletionPanel.tsx`
- `frontend/src/components/reward/RewardFeedbackProvider.tsx`
- `frontend/src/components/reward/rewardFeedback.ts`
- `frontend/src/hooks/useCompletion.ts`
- `frontend/src/index.css`
- `frontend/src/lib/api/completion.ts`
- `frontend/src/lib/validation/completionDto.ts`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/MyQuestsPage.tsx`
- `frontend/src/pages/QuestListPage.tsx`
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
| `npm run test -- --run` | Passed after the final visual refinement: 50 test files, 399 tests |
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
- After the follow-up correction, full-motion particles exposed a ready CSS
  trajectory. At 80 ms the first particle had non-zero opacity and a non-identity
  transform under `kiwi-reward-particle-flight`; the simulated header XP target
  showed 220 XP / Level 4 in flight and 270 XP / Level 5 after 720 ms.
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

## Follow-up particle correction

The product owner reported that Reward Lab Toasts appeared without visible
particle movement. Reproduction confirmed two defects that the initial browser
check had not measured:

- the particle child could initialize before the sibling XP source ref was
  available and return without calculating a trajectory;
- the animation depended exclusively on `HTMLElement.animate()`, while the
  exercised in-app browser did not expose that API to the particle element.

The correction initializes after the complete commit, assigns densely sampled
shared Bézier-path CSS variables, and starts a CSS Keyframes trajectory only after
`data-ready=true`. Unready particles remain transparent, preventing the former
top-left artifact. The final refinement uses seven enlarged single four-point
sparkles with 130 ms staggering and progressively shorter durations from 1300 ms
to 700 ms. Linear interpolation removes the visible hitching caused by applying
the same easing to sparse path segments. The final particle arrives at 1960 ms,
the layer permits visible overflow, and opacity stays at one until 98% of each
flight so every glyph remains clear through the navigation target. The
authoritative progression update waits until the final star completes. Toast
entrance duration remains 260 ms.

Automated coverage asserts seven particles, ready state, source coordinates,
one shared curved trajectory, sequential delays, and duration without requiring
the Web Animations API. It also covers the title hierarchy and the XP, arrow,
and target-level animation hooks.

## Follow-up visual refinement

The final Reward Lab presentation was inspected in the local browser. The
curved `Pinyon Script` title measured 86% of the Toast content width and exposed
a computed weight of 550. The Toast XP amount was near-gold and animated while
its near-gold `Sparkles` icon reported no animation.

All seven flight nodes were SVGs containing exactly one path and exposed the
`single-four-point` shape marker. Their delays increased from 480 ms to 1260 ms
while durations decreased from 1300 ms to 700 ms. The final arrival therefore
occurred at 1960 ms. The layer reported visible overflow, the path animation
used linear interpolation, and an in-flight sample showed five separated
particles simultaneously at full opacity. After arrival, the preview header
showed the committed 889 XP / Level 10 state and no particle remained visible.

The level arrow used its staged entrance and the near-gold target-level reveal
followed. The achievement panel reported no animation or transform; only the
near-gold achievement title used `kiwi-reward-achievement-stamp`, with its delay
set to 4280 ms—one second after the 320 ms arrow animation completes. The final
browser audit measured the new level at 18 px versus the previous level's 16 px,
each flight sparkle at 27 by 27 px, and the combined timer at 10 seconds. The
420 ms stamp keyframes used only perspective, `translateZ`, and scale (from
360 px in front of the screen through a brief pressed state to rest), with no
horizontal translation.

The hollow-star browser audit found seven 27 by 27 px flight SVGs, each with one
`single-four-point-outline` path. Every path computed to `fill: none`, a 2.2 px
non-scaling stroke, and the intended gold `rgb(244, 197, 66)` color.

The Level-up browser scenario confirmed `Level 5` uses the 480 ms
`kiwi-reward-level-target-enter` sequence. It reaches full opacity before the
shake begins, then decays through -2 px, +1.7 px, -1 px, and +0.5 px offsets
before returning to rest.

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
