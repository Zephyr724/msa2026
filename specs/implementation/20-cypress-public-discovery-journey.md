# Slice 20 — Cypress Public Discovery Journey

## Status

**Accepted — bounded by the product owner's 2026-07-29 delegation and explicit
approval to add Cypress as a frontend development dependency.**

## Evidence-based scope

The Phase 2 delivery scope places Cypress end-to-end testing with two or three
stable core journeys in P1. Repository inspection after Slice 19 found no
Cypress dependency, configuration, command, or end-to-end spec. The remaining
P1 items already have implementation evidence:

- account confirmation, resend, recovery, password reset/change, and Mailpit;
- richer achievements and the verified weekly streak;
- scoped and privacy-protected leaderboard refinements;
- REST-authoritative SignalR leaderboard invalidation.

Slice 20 delivers the first stable Cypress journey and the reusable runner
foundation. It exercises the real browser application and real API rather than
stubbing product requests.

## Goals

- Add Cypress as an approved frontend development dependency.
- Add a checked-in Cypress configuration and explicit npm commands.
- Keep the test base URL configurable while defaulting to the supported local
  Vite origin.
- Exercise an anonymous user journey from Discover through a data-backed
  category/search result to Quest Detail.
- Assert URL-owned discovery state, a real API result, the selected Quest
  heading, and the primary detail content.
- Use semantic roles, labels, and visible content instead of adding
  test-specific production selectors.
- Make failures preserve Cypress screenshots/videos through the normal Cypress
  artifact locations while keeping generated artifacts out of Git.

## P1 coverage

This Slice supplies one of the required two or three stable Cypress core
journeys and the infrastructure used by Slice 21.

## Explicit exclusions and deferred work

- The authenticated Member journey belongs to Slice 21.
- Google login/account linking remains Deferred and is not authorized.
- No database schema, authentication/security model, API contract, dependency
  other than the approved Cypress development dependency, or product scope
  change.
- No network request stubbing that could make a broken backend appear healthy.
- No stage, commit, push, merge, deployment, or public-host mutation.

## Acceptance

- `npm run test:e2e:public` runs the anonymous discovery journey headlessly
  against a running Kiwimpact application.
- The journey observes real Quest discovery and detail responses.
- The test is deterministic against the Development Quest seed and does not
  mutate persisted state.
- Existing frontend lint, type-check, unit/integration tests, and build pass.
- A real-browser check covers the same public path at desktop and mobile
  widths.
- The implementation prompt and completion report record observed facts.
- One independent K3 read-only review closes every original Blocker/Major
  finding before the Slice is considered ready to commit.
