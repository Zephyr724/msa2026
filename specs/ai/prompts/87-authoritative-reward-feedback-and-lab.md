# Prompt Record 87 — Authoritative Reward Feedback and Development Lab

- **Date:** 2026-08-05
- **Implementation owner:** Current Codex session
- **Accepted specification:** `specs/implementation/31-reward-feedback-and-lab.md`

## Product-owner instruction

> Based on what we discussed before, design a plan to enhance the interaction and visual effects — no implementation yet, just prepare the plan and the technology first. My requirements here are: fit the game theme, add animation, and match the current style — it must not be childish. At minimum, implement: 1. When a quest is completed, pop up a toast that congratulates the user on completing the quest, and from the toast have a star particle effect fly to the XP in the top-right corner. The user can click to close the toast, or it disappears automatically after 5 seconds. Or a similar approach. 2. When levelling up, also pop up a toast congratulating the level-up. For other suggestions that could improve gamification, tell me after you have researched.

The product owner then approved implementation and required a complete test
path:

> The plan above is fine, implement it. Also consider designing a test account or a test feature for me — I want to run through all of the designs.

After exercising the Lab, the product owner reported that the preview buttons
showed no visible animation and explicitly requested the correction:

> [http://localhost:5173/dev/rewards](http://localhost:5173/dev/rewards) On this page I click each test button and cannot see any animation. Why?

> Fix it.

The product owner then refined the approved visual hierarchy and motion:

> Modify the effects: 1. The layout is wrong — the title Congratulation goes at the very top, with all other content placed below it. 2. Use an exaggerated English script font for Congratulation, in a yellow close to gold. 3. The Congratulation should have a slight upward-bulging arc, and its width should fill up to 70% of the toast width. 4. The star effect is hard to see — enlarge the particles a bit. Can you make them follow an arc, with the stars flying one by one to that spot?

> The stars fly to the destination one after another.

> Slow the star movement animation down — 20% slower; right now it is too fast to see clearly.

> **+50** **XP** needs a suitable entrance animation; **→ Level** **10 also needs an entrance animation — the arrow moves rightward from the last letter of the level on the left, and level 10 appears from invisible. Level** **10 uses a yellow close to gold.**

The product owner clarified the intended XP symbol:

> When I said stars, I meant the Sparkles icon — change all XP-related icons to this one, not the lightning bolt.

The product owner selected the exact title face and weight:

> Use the Pinyon Script font for Congraculation, the middle weight.

The product owner clarified that the in-flight particles use the same symbol:

> The stars that fly up also use this Sparkles icon.

The product owner then specified the complete reward sequence:

> **+50** **XP is the same golden yellow; only +50** **XP has animation, the icon does not. Optimise the sequence: gain XP, then the stars fly; one second after the stars finish flying, play the level-up animation; and finally the achievement-earned animation. The achievement is also golden yellow, and its animation is like a stamp — from large to small, "stamping onto" that spot. Make the Congratulation font one weight bolder.

> After the level arrow animation plays, pause for 1 second, then play the achievement.

The product owner requested a smoother, accelerating particle stream:

> The star flight animation is not smooth — it always feels like a few frames are missing in the middle. For the star speed, make the stars that appear later move faster, so the overall speed keeps increasing. Keep the whole animation within 2.5 seconds. I cannot tell whether it is an opacity issue or the stars being covered and clipped by the toast frame, but once they leave the frame they seem to go transparent instead of clearly flying to the level in the nav.

The product owner clarified the stamp target:

> The achievement is not stamped as a whole — it is the achievement's title that has the stamp effect, for example “**Building Momentum**”.

The product owner further increased the title emphasis and width:

> Make COngraculation one level bolder, and the width is not enough — take up more space to the left and right; leaving 10% on each side is enough.

The product owner simplified the flight glyph and shortened the stream:

> For the star particles, use a four-point star similar to sparkles — not the form that also has small stars to the left and right of the four-point star. Complete the whole animation within 2 seconds.

The product owner made the final title width/weight adjustment:

> Let Congraculation take up a bit more space left and right, but reduce the font weight slightly.

The product owner enlarged the level and particles, extended combined rewards,
and corrected the stamp's depth direction:

> Enlarge the size of level 10 after level-up. If it is a **Combined reward, keep the toast on screen for 5 more seconds. The stamp effect is not the current one — the previous version looked more like stamping. Now it looks more like it slides in from the right. The effect I need is more like stamping down along the z-axis, that is, from outside the screen. Make that flying star particle 50% bigger.

The product owner selected a hollow flight-star treatment:

> Is there a hollow four-point star to replace the current one?

The product owner added a restrained arrival accent to the new level:

> After level 5 appears, add a slight shake effect.

The product owner increased the hollow sparkle outline weight:

> Make the star outline 20% thicker.

> Another 20% thicker.

## Reconstructed implementation instruction

Implement the approved mature Kiwimpact reward feedback as the sole
implementation owner without adding a dependency, schema change, authentication
bypass, or unrelated product expansion.

- Make Completion Code redemption return one committed, server-authoritative
  reward envelope with event ID, actual XP, previous/current progression, and
  newly awarded achievement summaries.
- Validate that exact DTO at the frontend boundary and stop projecting reward
  state from Quest display data.
- Present a queued, deduplicated, non-modal five-second Toast with explicit
  close, hover/focus/document-hidden pause, completion copy, XP, combined
  level/rank congratulations, and bounded achievement reveal.
- Animate a restrained star/ember particle group from the Toast to a visible
  mobile/desktop XP target and update the target at arrival. Respect reduced
  motion and accessibility semantics.
- Lead the Toast with a 70%-width, slightly upward-curved calligraphic
  `Congratulation` title in near-gold. Keep all reward details below it.
- Use larger star particles on one shared curved trajectory, staggered one
  after another. Sample the Bézier route densely and interpolate it linearly so
  motion does not hitch between sparse keyframes. Shorten each later particle's
  duration to create an accelerating stream, complete the group within two
  seconds, keep it above the Toast without clipping, and preserve full opacity
  until each particle visibly reaches the navigation XP target. Use a single
  four-point sparkle shape with no smaller satellite sparkles for flight.
- Animate only the near-gold XP amount while its `Sparkles` icon stays still.
  Then fly the Sparkles particles. One second after the final particle, animate
  the arrow rightward from the previous `Level` label and reveal the new level
  from transparent in near-gold. After the arrow animation completes, hold for
  another second before stamping only each near-gold achievement title (for
  example, `Building Momentum`) from large to its final size. The containing
  achievement panel stays still.
- Enlarge the revealed target level slightly. Increase the single flight
  sparkle from 18 px to 27 px. Keep ordinary Toasts at five seconds, but extend
  combined level/rank-plus-achievement rewards to ten seconds. The achievement
  title stamp must travel directly along the Z axis from in front of the screen,
  with no lateral insertion.
- After any new level (including Level 5) becomes visible, finish its entrance
  with a subtle, rapidly decaying horizontal shake of approximately two pixels.
- Render each flight particle as one hollow, rounded gold four-point outline
  with no fill and no satellite sparkles. Apply two successive 20% outline
  increases, from 2.2 px to 2.64 px and finally 3.168 px.
- Replace lightning-bolt XP glyphs with Lucide `Sparkles` throughout the
  frontend, including every in-flight particle, so the reward and persistent XP
  surfaces use one visual language.
- Load `Pinyon Script` through the existing Google Fonts stylesheet, render the
  curved title at a slightly softened 550 weight, and expand the actual curved
  text to about 86% of the Toast so roughly 7% remains on either side.
- Keep the established environmental visual system and avoid childish motifs,
  random rewards, or intrusive full-screen celebration.
- Add a Development-only, unauthenticated, memory-only Reward Lab covering all
  supported states, plus document the existing seeded Development member as
  the real persisted-path persona. Never commit a demo password.
- Add targeted backend/frontend tests, run all applicable gates, perform real
  desktop/dark/320 px browser verification, and record only observed evidence.
- Correct the discovered particle initialization and browser-compatibility
  defects. Do not treat mounted particle nodes as evidence of movement; verify
  a ready trajectory, non-zero in-flight opacity/transform, and final XP arrival.
- Do not stage, commit, push, deploy, or create/update a pull request without
  separate explicit approval.
