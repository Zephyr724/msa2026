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
   near the upper-right surface. A slightly upward-curved, near-gold
   `Pinyon Script` `Congratulation` title spans about 86% of the Toast, leaving
   roughly 7% on either side. Its final 550-weight presentation and restrained
   outline sit between the earlier medium and heavy refinements. The state,
   Quest name, and XP actually committed by the server sit beneath it.
2. The Toast can be closed explicitly. A standard reward otherwise dismisses
   after five seconds; a combined level/rank-plus-achievement reward remains for
   ten seconds so the complete sequence is readable. Auto-dismiss pauses while
   the Toast is hovered, contains focus, or the document is hidden.
3. Seven clearly visible gold, 27-pixel hollow single four-point sparkle particles
   (50% larger than the preceding 18-pixel refinement) follow one
   shared curved path from the XP reward row to the visible header XP target.
   Each particle contains one rounded outline path with no fill or satellite
   sparkles; its final 3.168 px stroke applies two successive 20% increases to
   the original 2.2 px version. Dense Bézier sampling and linear interpolation keep the route
   smooth. Each later particle has a shorter duration than the preceding one,
   creating an accelerating stream whose last arrival occurs within two
   seconds. Particles remain fully legible above the Toast until reaching the
   navigation target and only disappear at arrival. The target then updates
   from the server-provided previous state to the committed current state.
4. Only the near-gold XP amount animates with a compact scale-and-rise entrance;
   its `Sparkles` icon remains still. The particle stream follows the XP reveal.
   When the reward crosses a level or rank boundary, the final particle is
   followed by a one-second pause, then the arrow extends right from the
   previous level and the new level reveals in near-gold at a slightly enlarged
   size. Once visible, the new level finishes with a restrained, decaying
   horizontal shake of about two pixels.
5. Newly committed achievements appear last in the same queued reward surface.
   After the level-arrow animation completes, the sequence pauses for one
   second, then each near-gold achievement title stamps straight down the Z axis
   from in front of the screen to its final size while its containing panel
   remains stable. More than two
   achievements are summarized rather than expanding without bound. If no
   level/rank change occurred, the stamp follows the particle stream without
   reserving an absent level step.
6. Reward events queue and deduplicate in memory by the authoritative reward
   event ID. Persistent completion UI remains available after the transient
   Toast closes.
7. The Toast is polite live-region feedback, does not steal focus, has a
   44-pixel close target, and has no focus trap. Reduced-motion preference
   removes particle travel, count-up, and non-essential entrance motion while
   preserving the complete reward information.
8. The header exposes an XP target on mobile as well as desktop. Presentation
   uses the current green, warm neutral, amber, rounded-panel, and topographic
   vocabulary rather than mascots, candy styling, or juvenile copy. XP uses
   the `Sparkles` glyph consistently across the product; the lightning-bolt
   glyph is not used for XP.

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
  particle mounting and measured in-flight movement, progression arrival,
  manual close, five-second close, reduced motion, and horizontal overflow.
- One independent read-only review is required before commit readiness.

## Explicitly deferred

- Streaks, daily-login pressure, loot boxes, virtual currency, competitive
  reward inflation, sound/haptics, and a global notification inbox.
- Reward feedback for admin Evidence Claim approval; this Slice owns the
  immediate Completion Code redemption path only.
- Any schema, progression formula, achievement catalog, authentication, or
  dependency change.
