# Slice 31 — Authoritative Reward Feedback and Development Lab

- **Status:** Approved by the product owner for implementation
- **Approval date:** 2026-08-05
- **Implementation owner:** Current Codex session
- **Database migration:** Not required
- **Dependency change:** Not required

## Product intent

Quest completion should feel consequential and game-like while staying aligned
with Kiwimpact's mature environmental field-journal visual language. Reward
feedback must celebrate verified progress without becoming childish, blocking
navigation, or presenting projected client-side state as fact.

## Accepted experience contract

1. A successful Completion Code redemption presents one non-modal reward Toast
   near the upper-right surface. It congratulates the member, names the Quest,
   and shows the XP actually committed by the server.
2. The Toast can be closed explicitly and otherwise dismisses after five
   seconds. Auto-dismiss pauses while the Toast is hovered, contains focus, or
   the document is hidden.
3. A restrained group of gold particles travels from the XP reward row to the
   visible header XP target. The target updates from the server-provided
   previous state to the committed current state when the particles arrive.
4. When the reward crosses a level or rank boundary, the same Toast includes a
   prominent level/rank-up panel. This avoids competing duplicate Toasts for a
   single atomic reward while still explicitly congratulating the upgrade.
5. Newly committed achievements appear in the same queued reward surface. More
   than two achievements are summarized rather than expanding without bound.
6. Reward events queue and deduplicate in memory by the authoritative reward
   event ID. Persistent completion UI remains available after the transient
   Toast closes.
7. The Toast is polite live-region feedback, does not steal focus, has a
   44-pixel close target, and has no focus trap. Reduced-motion preference
   removes particle travel, count-up, and non-essential entrance motion while
   preserving the complete reward information.
8. The header exposes an XP target on mobile as well as desktop. Presentation
   uses the current green, warm neutral, amber, rounded-panel, and topographic
   vocabulary rather than mascots, candy styling, or juvenile copy.

## Authoritative response contract

`POST /api/v1/quests/{questId}/redeem` returns an envelope containing the
committed completion plus:

- stable `rewardEventId` from the XP transaction;
- actual `xpAwarded`;
- previous/current total XP, level, and rank title;
- only achievements newly awarded in that transaction.

The frontend validates the exact response shape and does not infer XP, level,
rank, or achievement unlocks from Quest display data.

## Development test contract

- `/dev/rewards` exists only in Vite Development and is absent from Production
  routing.
- The Lab needs no login and provides explicit scenarios for completion, level
  up, rank up, achievement, combined reward, and reduced motion.
- Lab scenarios are memory-only, carry a visible Preview label, and never call
  a mutation endpoint or change persisted progression.
- The Lab provides a simulated header XP target so every visual and motion
  state can be exercised without a local secret.
- The existing Development-only seeded member account remains the real-path
  test persona. Its password stays in ignored local configuration; no password
  or authentication bypass is added to tracked source.

## Verification contract

- Backend PostgreSQL/API coverage verifies the exact response envelope,
  transaction ID, actual XP, previous/current progression, and newly awarded
  achievement summaries.
- Frontend validation, hook, completion-panel, and reward-provider coverage
  verifies strict DTO handling, authoritative synchronization, deduplication,
  level/rank/achievement rendering, explicit and timed dismissal, pause, and
  reduced motion.
- Applicable complete frontend and backend gates from `AGENTS.md`.
- Real-browser inspection covers light/dark presentation, desktop, 320 px,
  particle mounting, progression arrival, manual close, five-second close,
  reduced motion, and horizontal overflow.
- One independent read-only review is required before commit readiness.

## Explicitly deferred

- Streaks, daily-login pressure, loot boxes, virtual currency, competitive
  reward inflation, sound/haptics, and a global notification inbox.
- Reward feedback for admin Evidence Claim approval; this Slice owns the
  immediate Completion Code redemption path only.
- Any schema, progression formula, achievement catalog, authentication, or
  dependency change.
