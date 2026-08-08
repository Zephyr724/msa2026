# UI sounds

Four interface sounds, converted to m4a (AAC) so they play in every modern
browser including Safari.

| File | Used for | Source |
| --- | --- | --- |
| `click.m4a` | Button clicks (global listener in `useGlobalClickSound`) | Kenney Interface Sounds `click_003.ogg` (CC0) |
| `confirm.m4a` | Confirm actions in dialogs | Kenney Interface Sounds `confirmation_002.ogg` (CC0) |
| `cancel.m4a` | Cancel/close actions in dialogs | Kenney Interface Sounds `error_005.ogg` (CC0) |
| `achievement.m4a` | Reward toast fanfare (`RewardFeedbackProvider`) | universfield "Magic Spell 03" via Pixabay (Pixabay Content License, no attribution required) |

Kenney sources: <https://kenney.nl/assets/interface-sounds>,
Creative Commons CC0. Achievement sound: "Magic Spell 03" by Universfield
(<https://pixabay.com/sound-effects/film-special-effects-magic-spell-03-242245/>,
creator page <https://pixabay.com/users/universfield-28281460/>), downloaded
as `universfield-magic-spell-03-242245.mp3`; Pixabay Content License, no
attribution required.

## Replacing a sound

1. Convert any short sound to m4a (AAC).
2. Overwrite the matching file in this directory, keeping the same filename
   (`click.m4a`, `confirm.m4a`, `cancel.m4a`, `achievement.m4a`).
3. Rebuild the frontend. No code changes are needed.

Per-sound playback volume lives in `SOUND_VOLUMES` in
`frontend/src/lib/uiSounds.ts`.
