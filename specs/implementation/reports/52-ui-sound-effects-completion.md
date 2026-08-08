# Completion Report — UI Sound Effects

## Implemented scope

Four CC0 UI feedback sounds in the frontend, with a persistent mute toggle:

- **Click** — global capture-phase listener (`useGlobalClickSound`) plays
  `click.m4a` for any `button`, `a.btn`, navigation link (`nav a`), or
  `[role="button"]` outside of dialogs. Disabled controls are skipped.
  Dialogs are excluded so confirm and cancel buttons do not double-play.
- **Confirm** — `ConfirmActionDialog` and `SocialPostDeleteDialog` play
  `confirm.m4a` when their confirm action is triggered; in the inline
  participation panel (`QuestParticipationPanel`) sounds follow the action's
  meaning, so "Keep participation" (keeping the quest) plays confirm.
- **Cancel** — the same two dialogs play `cancel.m4a` on cancel/close
  (button, backdrop click, and Escape all route through the same close
  handler); the inline participation panel plays it on "Confirm
  cancellation" (cancelling the participation).
- **Achievement fanfare** — `RewardFeedbackProvider` plays `achievement.m4a`
  when a reward toast becomes active.

Mute state persists in `localStorage` under `kiwimpact.sound-muted` and is
toggled from a header button (Volume2/VolumeX icon) next to the theme
switcher. The toggle is exempt from the global click sound: muting is silent,
unmuting plays one click as feedback. `playUiSound` never throws: autoplay
rejection, unsupported media, and unavailable storage all degrade to silence. Three sounds are Kenney CC0
assets (`click_003`, `confirmation_002`, `error_005` from Interface Sounds)
and the achievement fanfare is "Magic Spell 03" by Pixabay creator
universfield (Pixabay Content License, no attribution required), chosen by the
human after previewing a local candidate set (deleted after selection).
All were converted to m4a/AAC for Safari compatibility (Safari does not decode
Ogg Vorbis); total deployed size is ~64 KB. No dependencies were added.

Sound selection and replacement: final selections and sources are documented
in `frontend/public/sounds/README.md`. Replacing a sound is overwriting a file
with the same name — no code change needed.

## Files changed

- `frontend/src/lib/uiSounds.ts` — sound registry, mute state with
  `useSyncExternalStore` hook, safe playback.
- `frontend/src/hooks/useGlobalClickSound.ts` — global click listener.
- `frontend/src/app/AppShell.tsx` — wires the click listener and the
  mute/unmute toggle button.
- `frontend/src/components/organizer/ConfirmActionDialog.tsx` — confirm/cancel
  sounds.
- `frontend/src/components/social/SocialPostDeleteDialog.tsx` — confirm/cancel
  sounds.
- `frontend/src/components/reward/RewardFeedbackProvider.tsx` — fanfare on
  toast activation.
- `frontend/public/sounds/` — 4 m4a assets plus README with attribution and
  replacement instructions.
- `frontend/tests/unit/uiSounds.test.ts` — 5 new unit tests.

## Verification commands and observed results

All run from `frontend/` on 2026-08-08:

- `npm run lint` — 0 warnings, 0 errors (214 files).
- `npm run type-check` — clean, no diagnostics.
- `npm run test -- --run` — 60 files, 490 tests passed (includes the 5 new
  `uiSounds` tests).
- `npm run build` — built successfully in ~0.5 s; the >500 kB chunk-size
  warning is pre-existing and unrelated.

Not verified: audible playback in a real browser (headless CI cannot confirm
sound output), and the specific taste fit of the four chosen defaults — the
human should listen and swap via the documented procedure if desired.

## Known limitations

- Sounds only play after the browser has registered a user gesture (standard
  autoplay policy); the first interaction itself always qualifies because it
  is a click.
- `SocialPostDeleteDialog` backdrop/Escape close and `ConfirmActionDialog`
  Escape close share the cancel sound; there is no distinct "error" sound.
- The reward toast fanfare also plays in the dev-only Reward Lab preview.

## Review status

No independent review requested yet. Evidence documents exist; ready for the
single independent read-only review per the repository workflow.
