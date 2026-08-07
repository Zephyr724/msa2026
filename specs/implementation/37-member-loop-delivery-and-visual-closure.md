# Slice 37 — Member Loop Delivery and Visual Closure

- **Status:** Approved by the product owner for implementation
- **Approval date:** 2026-08-07
- **Implementation owner:** Current Codex session
- **Database migration:** Approved, additive
- **Dependency change:** None

## Product intent

Close the remaining member-loop delivery and presentation gaps found after
Slices 34–36 without replacing Kiwimpact's established green, warm-neutral,
gold, rounded-panel, and category-colour visual system. The transient Toast
remains concise; the verified Quest page remains the persistent resolution.

## Transient reward Toast

- Every reward Toast remains visible for 20 seconds unless dismissed. Hover,
  focus, and background-tab pauses must pause both dismissal and its timer.
- The existing game-style heading, colours, topography, reward composition,
  and motion remain intact.
- The `Passport saved` region becomes one keyboard-accessible link to the
  private Passport and gains a compact vertical `Go` affordance on its right.
- Completion Code redemption and newly delivered Evidence Approval events
  must both show the equivalent Toast once through the durable reward event.
- Historical Quest completions without a `MemberRewardEvent` are not
  backfilled and must not produce retroactive Toasts.

## Authoritative refresh and delivery

- Accepting a newly delivered asynchronous reward event must invalidate the
  member's completion, participation, Passport, progression, achievements,
  leaderboard, claims, and reward-event reads so persistent surfaces converge
  without a reload.
- Category progress continues to use authoritative rewarded verified
  completions and XP. Verification must cover both API aggregation and client
  refresh after immediate and asynchronous completion.

## Persistent completion resolution

- A completed native Quest renders the existing Passport-style `Mission
  Completed` stamp as a large decorative mark on the left at 20% opacity.
- A newly verified completion renders one stable celebration title and message
  between its basic verified information and reward details.
- Actions render as three separate rows in this order:
  1. `Next Quest`, the only primary green action.
  2. `Share your story in Community`, using the Protect Wildlife blue and
     visually emphasizing `Community`.
  3. `View Passport`, using a neutral secondary treatment.
- The persistent resolution remains usable at 320 px and must not be covered
  by the mobile action shortcut or member navigation.

## Celebration-copy catalogue and snapshot

An additive migration introduces a database catalogue containing 30 active
titles and 50 active messages. All titles and messages are written so any
active title can be safely combined with any active message.

- Exactly one active title and one active message are selected when a new
  `MemberRewardEvent` is created, for either Completion Code or Evidence
  Approval verification.
- The selected text is copied into immutable reward-event snapshot columns.
  Refreshing or revisiting the Quest must never reroll the copy, and later
  catalogue edits must not rewrite historical reward resolutions.
- Existing reward events receive a neutral compatibility value during the
  additive migration. Historical completions that have no reward event remain
  without a reconstructed reward resolution.
- The catalogue is internal in this Slice; no administration API or editor is
  added.

## Passport, sharing, and My Quests

- Every Verified Passport completion-history card gains a `View Quest` action
  beside its Share action.
- Completion/share entry-point actions use the existing Protect Wildlife blue
  consistently; this does not recolour unrelated social interactions or
  replace category colours globally.
- The My Quests `Active`, `Ready to Complete`, `Under Review`, and `Completed`
  controls gain stronger size and hierarchy while retaining correct
  interactive semantics. They are not misrepresented as four document
  headings.

## Verification contract

- PostgreSQL integration coverage for catalogue migration data, selection for
  both verification methods, immutable/stable snapshots, Passport category
  aggregation, and the explicit absence of historical event backfill.
- Frontend coverage for the 20-second pausable Toast, Passport link, async
  refresh, stable celebration rendering, three-row CTA hierarchy, stamp,
  Passport history actions, blue Share convention, and enlarged My Quests
  controls.
- Applicable full frontend/backend gates from `AGENTS.md`.
- Real-browser inspection of immediate completion, Passport category progress,
  completed Quest resolution, Toast, Passport history, and My Quests at
  desktop and 320 px in light/dark themes.
- One independent K3 CLI read-only review after implementation evidence exists,
  followed by at most one concentrated correction pass and a targeted closure
  check for original Blocker/Major findings.

## Explicit exclusions

- Historical reward-event or Toast backfill.
- Sound, haptics, currency, shop, icon replacement, celebration-copy admin UI,
  and redesign of unrelated page colours or layout.
