# Slice 21 Implementation Prompt — Cypress Authenticated Member Journey

## Source

Truthful reconstruction of the implementation instruction executed by Codex
on 2026-07-29 after Slice 20 implementation evidence and its independent K3
read-only review were complete.

## Instruction

Continue from the uncommitted, reviewed Slice 19 and Slice 20 worktree without
discarding or rewriting existing changes. Implement
`specs/implementation/21-cypress-authenticated-member-journey.md` as the second
P1 Cypress Slice.

- Reuse the explicitly approved Cypress dependency and runner from Slice 20;
  add no further dependency.
- Add one stable authenticated Member journey using the accepted
  Development-only personas and process-environment credentials.
- Sign in through the real Login UI and normal HttpOnly cookie/antiforgery
  flow; do not inject a cookie, bypass authentication, add a test endpoint, or
  stub product responses.
- Navigate through the real Member UI to Mission Board and Passport.
- Observe successful session, participation, Passport-completion, and Passport
  summary requests, then assert the persisted Member identity, progression,
  verified-completion count, and completion-history controls.
- Keep the password out of tracked source, screenshots, reports, and Cypress
  command logs; fail clearly when required environment values are absent.
- Add an explicit focused npm command and document the environment-driven
  local invocation without recording a real password.
- Fold in Slice 20 review Minors by statically type-checking Cypress
  configuration/specs and narrowing the public list/detail intercepts.
- Run the focused and combined Cypress journeys, applicable complete
  frontend/backend gates, and whitespace validation.
- Use a real browser to inspect the authenticated flow, form error and relevant
  empty states, Light/Dark themes, desktop/mobile layouts, and horizontal
  overflow.
- Create observed implementation evidence before requesting one independent
  K3 read-only review. Close any Blocker/Major under the bounded review
  workflow.
- Do not change production authentication, authorization, API behavior,
  database schema, seed contracts, product scope, or public infrastructure.
- Do not stage, commit, push, merge, or deploy.
