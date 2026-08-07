# Slice 35 — Relative Progress and Scope Escalation

- **Status:** Approved by the product owner for implementation
- **Approval date:** 2026-08-06
- **Implementation owner:** Current Codex session
- **Database migration:** None expected
- **Dependency change:** None

## Product intent

Make weekly progress legible and attainable beyond the Top 10. A member should
understand how many active members they surpassed, their percentile, and when
they are ready to compare at the next geographic scope without the interface
changing scope behind their back.

## Ranking contract

- People leaderboards remain ranked primarily by verified XP, with verified
  completion count as the first tie-breaker and the existing deterministic
  identity tie-breakers after it.
- The authenticated member summary is returned even when the member is outside
  the requested Top 10 page.
- The summary includes rank, active ranked-member count, verified XP, verified
  completion count, surpassed-member count, and percentile.
- `surpassedMemberCount = totalCount - rank`.
- For more than one participant, percentile is the percentage of other active
  members surpassed. A sole participant has percentile 100.
- The backend computes rank and percentile from the same ordered projection as
  the visible rows. The frontend does not infer either value from a truncated
  page.
- Existing small-community privacy protection suppresses both rows and the
  current-member competitive summary.

## Scope experience contract

- Scope order is My Community → Auckland → New Zealand.
- Member default remains My Community + Weekly when a Home Community exists;
  Auckland + Weekly otherwise. Guest default remains Auckland + Weekly.
- Scope never changes automatically.
- Reaching at least the 80th percentile means leading at least 80% of active
  ranked members, equivalent to the Top 20% threshold.
- At the threshold, show a clear CTA to try the next wider scope. Below the
  threshold, show progress toward the threshold without shame-oriented copy.
- New Zealand has no wider-scope CTA.
- The selected scope remains explicit and user-controlled after navigation,
  refresh, loading, empty, or error states.

## Presentation contract

- The leaderboard keeps its current visual structure and adds one concise
  `Your weekly position` summary surface.
- Preserve the accepted selector colour hierarchy: People/Communities and
  geographic Scope use the dark-neutral selected state; Period uses the brand
  primary-green selected state in light and dark themes.
- The summary leads with members surpassed and percentile; XP and completion
  count remain supporting values.
- Landing-page authenticated progress distinguishes `MY PROGRESS` from
  `OUR PROGRESS` so personal progression and collective Community Challenge
  progress cannot be mistaken for one another.
- No broad layout rewrite, new icon system, currency, league, season, or
  humiliation mechanic is introduced.

## Verification contract

- Backend tests cover outside-page current user, deterministic ties, percentile
  boundaries, single participant, unauthenticated response, missing community,
  and small-community suppression.
- Frontend tests cover default scope, manual scope retention, 79.x versus 80
  percentile CTA boundary, wider-scope CTA, and MY/OUR hierarchy.
- Applicable frontend/backend gates and responsive light/dark browser checks.
- One K3 CLI independent read-only review after evidence documents exist.
