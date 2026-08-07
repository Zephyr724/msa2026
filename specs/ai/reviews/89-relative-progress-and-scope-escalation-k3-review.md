# Review 89 — Relative Progress and Scope Escalation Kimi K3 Review

- **Date:** 2026-08-07
- **Reviewer:** Kimi K3 via Kimi Code CLI 0.31.1
- **Review mode:** independent, read-only; Codex was the implementation owner
- **Scope:** Slice 2 leaderboard backend, frontend, tests, and evidence
- **Verdict:** **CHANGES REQUIRED**

## Blocker findings

None identified.

## Major findings

### M1 — Rounded display percentile was also being used as the unlock authority

- **Evidence:** `backend/src/Kiwimpact.Core/Services/LeaderboardService.cs`
  rounded the percentage to two decimal places, while
  `frontend/src/pages/LeaderboardPage.tsx` compared that rounded value to 80.
  `frontend/src/lib/validation/leaderboardDto.ts` independently reproduced the
  decimal calculation with JavaScript floating-point arithmetic.
- **Why it matters:** A true value just below 80%, such as 79.995%, can be
  displayed as 80.00 and incorrectly unlock the wider-scope CTA. Recomputing
  decimal rounding in JavaScript can also reject a valid backend value at a
  half-cent boundary.
- **Bounded correction:** Return a backend-authoritative threshold boolean
  computed from the integer ratio without rounding, use it for the CTA, and
  validate its integer relationship rather than deriving eligibility from the
  display percentile. Add a rounded-to-80-but-ineligible boundary test.

### M2 — Required final gate and responsive browser evidence is absent

- **Evidence:**
  `specs/implementation/reports/38-relative-progress-and-scope-escalation-completion.md`
  explicitly defers complete gates and responsive light/dark inspection.
- **Why it matters:** The accepted Slice verification contract includes those
  checks, especially for the new responsive current-position surface and
  user-controlled Scope CTA.
- **Bounded correction:** Complete the final gates and desktop/320px
  light/dark browser matrix, correct concrete failures, and update the report
  with observed results only.

## Minor findings

None requiring correction. K3 noted that the dynamic monthly/all-time label is
broader than the phrase “Your weekly position,” but it remains truthful when a
member deliberately changes period and does not alter the approved weekly
default.

## Positive assessment

- Rank comes from the same complete deterministic ordering as visible rows and
  is not inferred from Top 10.
- Anonymous responses omit the current-user summary.
- My Community privacy suppression removes rows, totals, and current-user
  competitive data together.
- Missing Home Community preserves the existing Auckland fallback.
- Scope selection is not changed until the member activates the CTA.
- `MY PROGRESS` and `OUR PROGRESS` establish the approved landing-page
  hierarchy without a layout rewrite.

## Closure requirement

Resolve M1, complete M2 during the unified final verification pass, update the
completion report, and run one targeted closure check limited to M1–M2.

## Targeted closure check

- **Date:** 2026-08-07
- **Verdict:** **CLOSED — no original Blocker/Major remains**
- **M1 CLOSED:** K3 inspected the integer-ratio backend threshold, frontend use
  of the authoritative boolean, DTO relationship validation, and the
  rounded-to-80-but-ineligible boundary. It independently reran the focused
  `LeaderboardServiceTests`: 17/17 passed.
- **M2 CLOSED:** K3 confirmed Report 38 records the applicable final gates and
  browser evidence, including the 320 px no-overflow measurement and separate
  `MY PROGRESS` / `OUR PROGRESS` hierarchy.
- The closure check was limited to the original findings and did not perform a
  second full review.
