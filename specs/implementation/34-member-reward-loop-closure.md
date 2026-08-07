# Slice 34 — Member Reward Loop Closure

- **Status:** Approved by the product owner for implementation
- **Approval date:** 2026-08-06
- **Implementation owner:** Current Codex session
- **Database migration:** Approved, additive
- **Dependency change:** None

## Product intent

Close the verified-Quest member loop without turning the transient reward
Toast into a dashboard. A verified action must produce one authoritative,
durable reward event, whether verification happens immediately through a
Completion Code or later through an approved Evidence Claim.

## Experience contract

### Transient reward Toast

The existing reward Toast remains a compact first layer and retains the
current green, warm-neutral, near-gold, rounded-panel, topographic visual
language and motion sequence.

- Standard immediate verification title: `MISSION COMPLETE`.
- A real level, rank, achievement, or streak milestone uses
  `CONGRATULATIONS!`.
- A previously pending Evidence Claim approved asynchronously uses
  `MISSION VERIFIED`.
- The existing singular `Congratulation` copy is removed.
- Always show verified state, authoritative XP, `Saved to your Impact
  Passport`, and the current weekly-streak state.
- Conditionally show only real changes: level/rank, newly unlocked
  achievements, a newly secured/extended streak, and Community Challenge
  `+1`.
- Streak state is present after every verified completion, but receives
  emphasis motion only when the award changes the week state or streak count.
- Existing XP particle, level transition, achievement stamp, reduced-motion,
  focus, pause, dismissal, and queue behaviour remain intact unless the new
  contract explicitly extends them.

### Persistent completion resolution

After the Toast closes, the verified Quest page keeps a persistent resolution
panel containing:

- the verified Quest and verification method;
- XP and progression awarded by that completion;
- newly unlocked achievements;
- weekly streak state;
- Community Challenge before/after values when the completion contributed;
- `View Passport`;
- `Share Verified Story`;
- one concrete recommended next Quest when available, otherwise a filtered
  Quest-discovery action.

The recommended next Quest is the primary action in this resolution surface;
Passport and Verified Story remain available as secondary actions. The visual
hierarchy must advance the member loop rather than merely make all three links
present.

At mobile widths, the persistent mobile shortcut to the Quest actions area
must stop covering the actions once that area is visible. The primary next
Quest and both secondary actions must remain fully reachable above the member
navigation.

The panel reads the persisted reward event. It must not reconstruct historical
reward state from mutable profile totals.

## Durable reward event contract

An additive migration introduces `MemberRewardEvent` and its ordered unlocked
achievement snapshots.

Each event:

- is owned by exactly one member;
- has one stable, unguessable event identifier;
- refers uniquely to one XP-producing verified completion and XP transaction;
- snapshots Quest title, method, XP, before/after progression, before/after
  weekly streak, optional Community Challenge before/after progress, and newly
  unlocked achievement identities/names;
- is created atomically with XP, progression, completion approval, and
  automatic achievement awards;
- has nullable `SeenAtUtc` inbox state;
- is immutable except for the monotonic seen timestamp.

Completion Code redemption returns the same persisted event in its response.
Evidence Approval creates the equivalent event in the approval transaction.
Retry or concurrent review must not create a second event.

Authenticated member APIs support:

- reading a bounded oldest-first batch of unseen reward events;
- marking an owned event seen idempotently;
- reading the reward resolution for an owned Quest completion.

No other member, organizer, guest, or admin acting outside the existing claim
review response may read another member's inbox or resolution.

## Delivery contract

- The app shell checks for unseen reward events after authenticated state is
  established and after relevant cache invalidation.
- Events enter the existing in-memory visual queue once and are marked seen
  only after the client has accepted them into the queue.
- Immediate redemption uses the returned event and marks it seen through the
  same owned endpoint; later inbox reads therefore do not replay it.
- Failed acknowledgement may cause a safe replay on a future session; it must
  never lose the durable reward.
- Inbox payloads contain no evidence description, evidence URL, review note,
  email, precise location, or other sensitive claim data.

## Tooltip correction

The weekly-streak help tooltip on My Quests must render above and outside the
Player Status card instead of being clipped by an ancestor overflow boundary.
The correction must preserve horizontal-overflow safety at 320 px.

## Verification contract

- PostgreSQL integration coverage for atomic event creation, both verification
  methods, ownership, unseen ordering, idempotent acknowledgement, retry and
  concurrent-review protection, and persisted resolution snapshots.
- Frontend DTO, hook, provider, Toast, completion-resolution, async inbox,
  reduced-motion, and tooltip regression coverage.
- Applicable full frontend/backend gates from `AGENTS.md`.
- Real-browser inspection at desktop and 320 px in light/dark themes.
- One K3 CLI independent read-only review after evidence documents exist.

## Explicit exclusions

- Push, email, operating-system notifications, sound, haptics, currency,
  wallet, shop, daily-login rewards, and global icon replacement.
- Reward-event administration or deletion UI.
- Reconstructing durable events for historical completions created before the
  migration.
