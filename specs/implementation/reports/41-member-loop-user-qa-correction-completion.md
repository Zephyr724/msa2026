# Member Loop User-QA Correction Completion

- **Date:** 2026-08-07
- **Branch:** `codex/feat/member-loop-gamification`
- **Parent specification:** `specs/implementation/37-member-loop-delivery-and-visual-closure.md`
- **Prompt:** `specs/ai/prompts/100-member-loop-user-qa-correction.md`
- **Risk:** Important (real reward delivery and primary completion feedback)
- **Status:** Complete; independent K3 review approved with no Blocker or Major

## Implemented scope

- Diagnosed the missing real Completion Code Toast from the persisted event,
  not from the synthetic component path. The reward existed and remained
  unseen, but its seeded Community Challenge identifier was a canonical .NET
  `Guid` whose version and variant nibbles did not satisfy the frontend's
  narrower RFC UUID regular expression. The inbox validator therefore rejected
  the complete response before `RewardInboxDelivery` could show it.
- Changed completion-reward identifier validation to accept the canonical
  8-4-4-4-12 hexadecimal `Guid` shape exposed by ASP.NET while retaining exact
  DTO keys and all reward-transition validation. Added a regression using the
  observed challenge identifier shape.
- Cached the transactional reward resolution immediately after successful
  redemption so the persistent Quest-page feedback is available in the same
  render turn as the Toast while authoritative refetch remains active.
- Moved the decorative stamp from the right-side completion panel to a
  pointer-events-none overlay aligned to the Quest page's left grid track. It
  begins within the cover and extends through Basic Information, encouragement,
  and Rewards without entering the right action column.
- Moved the persisted celebration title/message immediately below Quest details
  and above Rewards. Removed the duplicate celebration and small stamp from the
  right-side completion panel.
- Applied `btn-error` to controls whose visible action is Cancel, including
  participation cancellation and confirmation, Quest cancellation and
  confirmation, challenge edit cancellation, and comment edit cancellation.
- Widened the desktop Toast to 27 rem, kept `Your record is updated` on one line
  at the desktop breakpoint, and added a green `Review Quest` link from the
  Toast to the persistent Quest resolution.
- Updated the frontend document title to
  `Kiwimpact | Eco Quests, Real Impact`.
- Applied the product owner's final celebration treatment to the persisted
  Quest-page copy: the title uses the theme's brighter ecological green with a
  fine deep-forest outline and restrained shadow, while the message uses the
  normal high-contrast body colour. The green eyebrow and existing card surface
  remain unchanged.
- Changed the participation-cancellation confirmation to a vertical,
  full-width button layout so the narrow Quest sidebar cannot overflow. `Keep
  participation` now uses the green success treatment while confirmation
  remains red.
- Removed the entire cancellation entry and confirmation UI once a Quest has a
  final `Verified` or `SelfReported` completion. The joined status remains
  visible, but a completed Quest can no longer offer participation withdrawal.
- Applied the green success treatment to both the Organizer `Publish quest`
  trigger and its confirmation action, without changing the remaining
  lifecycle controls.
- Reduced the large Quest-page `MISSION COMPLETED` stamp opacity from 20% to
  8% while preserving its size, position, clipping, and left-column scope.
- Deepened the celebration-title shadow after authenticated visual inspection
  and raised the celebration message from semibold to bold.

## Files changed by this correction

- `frontend/index.html`
- `frontend/src/components/community/CommunityChallengesSection.tsx`
- `frontend/src/components/organizer/ConfirmActionDialog.tsx`
- `frontend/src/components/organizer/QuestLifecycleActions.tsx`
- `frontend/src/components/quest/QuestCompletionPanel.tsx`
- `frontend/src/components/quest/QuestParticipationPanel.tsx`
- `frontend/src/components/reward/RewardFeedbackProvider.tsx`
- `frontend/src/components/social/SocialComments.tsx`
- `frontend/src/hooks/useCompletion.ts`
- `frontend/src/lib/validation/completionDto.ts`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/tests/integration/OrganizerQuestListPage.test.tsx`
- `frontend/tests/integration/QuestCompletionPanel.test.tsx`
- `frontend/tests/integration/QuestDetailPage.test.tsx`
- `frontend/tests/integration/QuestParticipationPanel.test.tsx`
- `frontend/tests/integration/RewardFeedback.test.tsx`
- `frontend/tests/unit/completionDto.test.ts`
- `frontend/tests/unit/useCompletion.test.tsx`
- `specs/ai/prompts/100-member-loop-user-qa-correction.md`
- `specs/implementation/reports/41-member-loop-user-qa-correction-completion.md`
- `specs/ai/reviews/92-member-loop-user-qa-correction-k3-review.md`

## Verification observed

- Targeted user-QA verification passed: 8 files, 77 tests. The post-review
  hidden-tab correction test also passed: 1 file, 9 tests.
- `npm run type-check` passed.
- `npm run lint` passed.
- Post-review celebration-colour verification passed: Quest detail 5/5 tests,
  followed by type-check and lint.
- Post-review participation-state verification passed: Quest participation and
  Quest detail 18/18 tests, followed by type-check and lint.
- Post-review publish-button colour verification passed: Organizer Quest list
  6/6 tests, followed by type-check, lint, and `git diff --check`.
- Post-review stamp-opacity verification passed: Quest detail 5/5 tests,
  followed by type-check and lint.
- Full `npm run test -- --run` passed after the review correction: 54 files,
  424 tests.
- `npm run build` passed. Vite emitted the existing non-blocking main-chunk
  size advisory; the generated main JavaScript was 853.12 kB minified and
  235.67 kB gzip.
- `git diff --check` passed.
- Before the fix, the real `member2@kiwimpact.test` Completion Code event for
  `test quest 2` existed with `SeenAtUtc = null`; its Community Challenge id
  was `caa2449f-10e1-f33f-f25d-e3cbea3c5af6`. After the corrected frontend
  hot-reloaded, both pending reward events were marked seen at
  `2026-08-07 10:13:56Z`. `RewardInboxDelivery` structurally invokes
  `showReward` before acknowledgement; its focused integration test verifies
  both delivery and acknowledgement calls.
- The authenticated browser rendered `test quest 2` with the stamp beginning
  in the cover and clipped to the left grid track, the `Green Momentum!`
  encouragement below Quest details and above Rewards, and no stamp or
  celebration in the right completion panel.
- The authenticated browser rendered the completed `test quest 2`
  participation panel with its joined status and no cancellation trigger,
  confirmation copy, or cancellation controls.
- The browser observed both `Cancel participation` and `Confirm cancellation`
  with `btn-error`; no cancellation mutation was submitted during visual QA.
- Reward Lab browser verification rendered the widened Toast with
  `Your record is updated` on one line and a green `Review Quest` action linked
  to the reward's Quest.
- The running Vite server returned
  `<title>Kiwimpact | Eco Quests, Real Impact</title>`.

## Known limitations

- The existing real reward was acknowledged automatically as soon as the
  corrected validator hot-reloaded, before the later screenshot was captured.
  The database transition plus the delivery integration test verifies the real
  inbox path; the final Toast layout was visually inspected through Reward Lab.
- This correction did not create another completion, rotate an organizer's
  active code, or cancel the member's participation merely to manufacture
  additional screenshots.
- The pre-existing Vite chunk-size advisory remains. No dependency or unrelated
  code-splitting change was authorized.
- No deployment verification was performed.

## Review status

- Independent Kimi K3 read-only Review 92 approved the correction with 0
  Blocker and 0 Major findings.
- One non-blocking hidden-tab observation was corrected: a Toast delivered
  while the document is already hidden now waits for visibility before its
  active-time dismissal clock begins. A deterministic regression covers the
  hidden-to-visible transition.
- The subsequent reward-gold title/message adjustment was a low-risk,
  product-owner-directed visual-token change and did not trigger another full
  independent review.
- The subsequent cancellation-layout and completed-state adjustment was a
  low-risk, product-owner-directed participation UI correction covered by
  integration tests and authenticated browser verification; it did not trigger
  another full independent review.
- No file has been staged, committed, pushed, deployed, or submitted as a pull
  request.
