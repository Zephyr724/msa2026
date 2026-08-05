# Phase 2 Delivery Scope

- **Status:** Proposed — pending design review
- **Date:** 2026-07-24
- **Purpose:** Freeze submission priorities for the MSA 2026 Phase 2 deadline

> This document controls scheduling for the current assessment. It preserves,
> but does not require immediate implementation of, the broader accepted
> product direction. It does not claim that any listed feature is implemented.

## 1. Scheduling rule

Work is ordered P0, then P1, then Deferred. P1 and Deferred work must not delay
P0 deployment, testing, README completion, or the six-minute submission video.

Long-term product, architecture, data, API, security, UX, and testing
specifications remain valid future direction unless separately amended. Where
those documents describe a larger MVP, this document controls current
assessment scheduling.

## 2. P0 — Must be complete and deployed

### 2.1 Core product

- Existing public Region and Quest discovery/detail.
- Email/password authentication core.
- HttpOnly cookie authentication.
- Anti-CSRF protection.
- Member, Organizer, and Admin authorization boundaries.
- Organizer-owned Quest CRUD.
- Join and cancel participation.
- One simplified completion flow.
- Server-authoritative XP and level/rank progression.
- Passport-lite profile/dashboard.
- At least three simple achievements.
- One simple persisted leaderboard.
- Responsive desktop and mobile UI.
- Frontend and backend tests for key paths.
- Scalar API documentation.
- Same-origin production deployment.
- README and `/specs` evidence.
- A publicly accessible submission video no longer than six minutes.

P0 is the minimum submission-ready product. A feature is not complete until
its implementation, tests, deployed behaviour, and evidence have been
observed.

### 2.2 Committed advanced requirements

Four advanced requirements are committed for delivery. The final README will
explicitly nominate only the three strongest completed requirements for
marking, based on actual completion quality and evidence.

#### Security Measures

- Implement at least two approved controls.
- Planned evidence may include RBAC, anti-CSRF protection, ASP.NET Core
  Identity password hashing, validation, and rate limiting where implemented.
- The final README explains why each claimed control matters and how it was
  implemented.

#### Zustand state management

- Use Zustand for genuine cross-component client/UI state.
- Do not duplicate TanStack Query server state.
- Do not store authenticated user identity in Zustand.

#### Theme switching

- Provide light and dark themes.
- Persist the user's preference.
- Use system-theme-aware initial behaviour.
- Keep key screens readable in both themes.

#### Dockerization

- Dockerize the frontend application, backend application, and PostgreSQL
  environment.
- Provide one reproducible, documented startup path.
- A PostgreSQL-only Compose file is not full application Dockerization.

## 3. P1 — Only after P0 works in deployment

- Email confirmation and resend.
- Forgot, reset, and change password.
- Local Mailpit email flow.
- Richer achievements.
- Streak.
- Leaderboard refinements.
- Cypress end-to-end testing with two or three stable core journeys.
- SignalR WebSockets for leaderboard invalidation only.

### SignalR constraints

- The REST leaderboard works correctly without SignalR.
- SignalR is an enhancement, not a correctness dependency.
- Use one server-to-client invalidation event.
- The client invalidates and refetches the authoritative TanStack Query.
- Do not implement chat, presence, regional groups, or client-side
  leaderboard writes.

## 4. Deferred unless substantial time remains

- Comprehensive Storybook integration for all implemented reusable UI
  components.
- Google login and account linking.
- Google Maps.
- External-event claims and Admin review.
- Community Challenge.
- Multi-layer community leaderboard.
- Share Card.
- Seasons, leagues, or chat.

The bounded social-post feed in `specs/implementation/25-social-posts-feed.md`
was separately approved by explicit product-owner instruction on 2026-07-31.
The product correction in
`specs/implementation/29-community-posts-product-correction.md` was approved on
2026-08-04 and adds the Xiaohongshu-inspired button/modal composition flow,
required title and Published Quest relationship, tags, ordered URL-based
multi-image carousel, author deletion, and public/hidden published visibility.
Public search/paging, likes, and two-level comments remain part of the accepted
surface. Draft persistence, public profiles, follows, friends, chat,
notifications, binary file upload, and moderation tooling remain deferred.

Storybook must not be claimed complete unless the implemented reusable UI
component set is comprehensively integrated.

The accepted Community Challenge specification and other long-term documents
remain valid future direction; deferral changes delivery order, not their
design content.

## 5. Delivery guardrails

- Do not begin P1 while a P0 path is incomplete or undeployed.
- Prefer one demonstrable behaviour per task.
- Do not expand a simplified P0 feature into its long-term form unless the
  P0 deployment, tests, README, and video are safe.
- Do not claim an advanced requirement from configuration or package presence
  alone.
- Select the final Top 3 only after source, tests, runtime, deployment, and
  evidence quality are known.
- Do not let P1 or Deferred work consume the contingency reserved for final
  deployment and submission verification.

## 6. Related documents

- `specs/00-project-profile.md`
- `specs/adr/ADR-0009-use-single-origin-deployment.md`
- `specs/implementation/02a-email-password-auth-core.md`
- `specs/implementation/02b-account-lifecycle-and-auth-hardening.md`
- `.clinerules/09-msa-assessment.md`

This document supersedes earlier scheduling and fixed advanced-requirement
selection statements for the current assessment only. It does not claim to
supersede the underlying long-term product or technical decisions.
