# Slice 15 visual evidence

## Reference

The design baseline is the runnable local Figma Make export under
`docs/UI/Kiwimpact MVP UI Design/` plus the paired Slice 14 captures under
`specs/implementation/evidence/14-figma-parity/prototype/`.

Public production captures were observed from the current frontend at
`http://127.0.0.1:5173`. Representative authenticated captures were observed
from an isolated frontend at `http://127.0.0.1:5174` with its proxy pinned to
the isolated backend at `127.0.0.1:5000`.

## Captures

### Desktop

- `desktop/landing-initial.jpg`
- `desktop/landing-restored.jpg`
- `desktop/discover-cards.jpg`
- `desktop/discover-map.jpg`
- `desktop/quest-detail-initial.jpg`
- `desktop/quest-detail-restored.jpg`

### Mobile

- `mobile/landing.jpg`
- `mobile/discover-cards.jpg`
- `mobile/quest-detail.jpg`

### Tablet and narrow-width closure

- `tablet/landing-light.jpg`
- `tablet/landing-dark.jpg`
- `tablet/quest-detail-dark.jpg`
- `narrow/discover-dark-320.jpg`

### Representative confirmed Member — desktop

- `member/desktop/completion-reward-overlay.jpg`
- `member/desktop/mission-board.jpg`
- `member/desktop/passport.jpg`
- `member/desktop/share-card.jpg`
- `member/desktop/leaderboard-current-user.jpg`

### Representative confirmed Member — 390 px mobile

- `member/mobile/completed-quest.jpg`
- `member/mobile/mission-board.jpg`
- `member/mobile/passport.jpg`
- `member/mobile/share-card.jpg`
- `member/mobile/leaderboard-current-user.jpg`

The earlier public mobile captures requested 390 × 844 and emitted 375 × 812
because the in-app browser reserved surrounding UI chrome. The representative
Member session explicitly reset and applied the viewport override; its mobile
captures emit at 390 px wide (with full-page height varying by route).

## Observed interactions

- Discover opens in Cards mode.
- Cards and Map controls change the visible content without changing filters.
- The configured Google map renders in Map mode.
- Quest Detail renders its gallery, action column, related Quest rail, and
  mobile sticky action.
- The corrected Landing renders Personal Progress, a distinct Passport
  showcase, closing guest CTA, and footer at desktop and tablet width.
- The corrected Quest Detail renders one method chooser whose visible choices
  are derived from the Quest's accepted source/registration boundaries.
- Light and dark theme captures were observed at tablet width.
- Discover rendered at a requested 320 px dark viewport with its compact
  controls and horizontal category control.
- Light theme and the default desktop viewport were restored before the
  browser evidence session was finalized.
- The isolated Member was registered through the real UI. Mailpit received the
  account email, and direct use of the emitted link displayed
  `Email confirmed.`.
- The Member joined two active Quests and completed one Organizer-owned native
  Quest with the one-time code generated through the Organizer UI.
- The reward overlay displayed 100 XP, Level 3, Passport, Share Card, and
  Continue actions.
- Mission Board displayed two active missions, one verified completion,
  one-week streak, First Steps, and Passport preview without a classification
  error.
- Passport displayed 100 XP, category impact, First Steps, community
  preferences, claims empty state, verified history, and Share Card entry.
- Share Card Builder displayed the selected verified completion and its single
  canvas preview/export model.
- Leaderboard displayed the authenticated Member with the identity-safe `You`
  marker on desktop and mobile.
- The 390 px Passport capture remained 390 px wide after page-level horizontal
  overflow was removed.

## Fixture and runtime notes

- PostgreSQL and Mailpit ran in isolated `--rm` containers. The backend applied
  existing migrations/seeds; no schema change was made.
- A local Organizer-owned native Quest was created and published through the
  protected API because the isolated Organizer location picker did not load the
  Google Maps script. The completion code itself is not stored in evidence.
- One isolated fixture update made the verified award represent a Member whose
  Waitematā Home Community was already set at award time. This populated the
  Auckland people leaderboard without changing production attribution rules.
- The isolated frontend, backend, PostgreSQL, Mailpit, disposable users, Quests,
  participation, completion, and XP rows were stopped and removed after
  capture.
- Google Maps evidence remains the configured public `desktop/discover-map.jpg`
  capture. No fake marker or client-side ranking value was added.
