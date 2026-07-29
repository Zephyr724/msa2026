# Slice 21 — Cypress Authenticated Member Journey

## Status

**Accepted — bounded by the product owner's 2026-07-29 delegation and explicit
approval to add Cypress as a frontend development dependency.**

## Dependency on Slice 20

Slice 21 reuses the Cypress dependency, configuration, and local-runtime
contract established by Slice 20. It begins only after Slice 20 evidence and
the independent read-only review exist.

## Goals

- Add a stable authenticated Member journey using the accepted
  Development-only test personas and ignored/environment-supplied password.
- Sign in through the real Login UI and HttpOnly cookie/antiforgery flow.
- Verify Member navigation and load the real Mission Board.
- Follow the Passport action and verify the persisted Passport identity,
  progression summary, and completion history.
- Prove that authentication and authoritative Member data work without
  seeding accounts in Production or placing a password in tracked source.
- Keep credentials environment-driven and fail clearly when the local
  Development persona configuration is absent.

## P1 coverage

Together with Slice 20, this Slice completes the accepted P1 requirement for
two or three stable Cypress end-to-end core journeys. It also exercises the
already implemented P1 progression, streak, Passport, and account-session
surfaces as an integrated browser flow.

## Explicit exclusions and deferred work

- No Google login/account linking, production email-provider selection, or
  public deployment.
- No Cypress-only authentication bypass, direct cookie injection, private test
  endpoint, or production demo-account enablement.
- No database schema, role, authentication/security model, API contract, or
  additional dependency change.
- No organizer/admin mutation journey; two stable core journeys satisfy the
  accepted P1 boundary without introducing data cleanup fragility.
- No stage, commit, push, merge, deployment, or public-host mutation.

## Acceptance

- `npm run test:e2e:member` signs in a configured Development Member through
  the UI and reaches both My Quests and Passport.
- The test asserts real session, mission, Passport, and completion-history
  content without stubbing product requests.
- No credential is committed or printed into evidence.
- The combined Cypress command runs both Slice 20 and Slice 21 journeys.
- Applicable frontend/backend full gates pass after the final combined state.
- Real-browser checks cover the authenticated journey, error/empty behavior
  relevant to the touched surfaces, Light/Dark, and desktop/mobile layouts.
- The implementation prompt and completion report record observed facts.
- One independent K3 read-only review closes every original Blocker/Major
  finding before the Slice is considered ready to commit.
