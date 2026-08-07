# Slice 34 implementation instruction — Member Reward Loop Closure

- **Recorded:** 2026-08-06
- **Source:** Truthful reconstruction of the product-owner discussion and
  explicit approval in the current Codex task.

Implement `specs/implementation/34-member-reward-loop-closure.md` completely.
Preserve the current reward Toast's style, colours, accessibility, animation
sequence, and authoritative server-data rule. Replace the singular title with
the approved `MISSION COMPLETE`, `CONGRATULATIONS!`, and `MISSION VERIFIED`
rules. Keep the Toast concise, move complete details and next actions into a
persistent Quest resolution, persist an owned reward inbox event for both
Completion Code and Evidence Approval, and fix the clipped weekly-streak
tooltip. Use an approved additive migration, add no dependency, do not change
the icon system, and do not stage, commit, push, deploy, or create a PR.

## Follow-up completion correction — 2026-08-07

The product owner challenged whether the implementation genuinely closed the
member loop. Correct the persistent completion resolution inside this Slice:
make the concrete Next Quest the first and primary CTA, demote View Passport
and Share Verified Story to secondary actions, and ensure the mobile fixed
Quest-actions shortcut cannot obscure these actions. Treat this as unfinished
Slice 34 work, not a new Slice. Add regression coverage and verify the actual
desktop and 320 px experience without redesigning the existing visual system.
