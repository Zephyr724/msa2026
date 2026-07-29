# Slice 20 Implementation Prompt — Cypress Public Discovery

## Source

Truthful reconstruction of the implementation instruction executed by Codex
on 2026-07-29 after the product owner explicitly approved adding Cypress as a
frontend development dependency.

## Instruction

Continue from the uncommitted, reviewed Slice 19 worktree without discarding or
rewriting existing changes. Implement
`specs/implementation/20-cypress-public-discovery-journey.md` as the first of
two P1 Cypress Slices.

- Add Cypress as the only new development dependency.
- Add explicit headless commands and a checked-in Cypress configuration.
- Keep the base URL configurable and default it to the supported local Vite
  origin.
- Add one stable anonymous journey that uses the real Development Quest seed
  and real API: open Discover, choose Observe & Measure, search for Water
  Quality Monitoring, observe URL-owned filters and one result, then open the
  real Quest Detail and assert its heading, facts, About section, and
  description.
- Do not stub product requests, mutate the database, add test-only production
  endpoints/selectors, change authentication, or expand product scope.
- Ignore generated Cypress screenshots and videos.
- Run the applicable complete frontend gates and the focused Cypress command.
- Verify the same public flow in a real browser at desktop and mobile widths,
  including horizontal overflow.
- Create observed implementation evidence before requesting one independent
  K3 read-only review.
- Do not stage, commit, push, merge, deploy, or modify public infrastructure.
