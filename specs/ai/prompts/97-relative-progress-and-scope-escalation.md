# Slice 35 implementation instruction — Relative Progress and Scope Escalation

- **Recorded:** 2026-08-06
- **Source:** Truthful reconstruction of the product-owner discussion and
  explicit approval in the current Codex task.

Implement `specs/implementation/35-relative-progress-and-scope-escalation.md`
completely. Show the authenticated member's weekly relative progress even
outside the Top 10. Lock wider-scope readiness to the 80th percentile/Top 20%,
show a CTA without automatically changing scope, preserve privacy suppression,
and distinguish personal from community progress on the landing page. Reuse
the current design language, add no dependency, do not replace icons, and do
not stage, commit, push, deploy, or create a PR.

## Follow-up colour restoration — 2026-08-07

Preserve all Slice 35 behaviour but restore the Leaderboard selector colours
to the accepted original design. View and geographic Scope selections remain
dark neutral; the Period selection uses brand primary green. Do not alter the
global palette, existing layout, or the new ranking functionality. Add a
regression assertion and verify light/dark desktop plus 320 px.
