# Project Status

Last reviewed: 2026-07-27

Current `main` baseline: `73e79fa` (`Merge pull request #20 from
Zephyr724/fix/slice-8-storage-access`)

## Current Implementation Status

The following Slices are implemented and merged into `main`. “Merged” records
repository state; detailed verification and independent-review results remain
in the linked completion and review evidence.

| Slice | Delivered behaviour | Mainline merge | Completion evidence |
| --- | --- | --- | --- |
| 0 | React/.NET foundation, PostgreSQL local infrastructure, CI and initial tests | PR #1 | `specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md` |
| 1 | Public Region and Quest discovery/detail | PR #3 | `specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md` |
| 2A | Email/password registration, login, session and logout with HttpOnly cookie authentication and antiforgery | PR #5 | `specs/implementation/reports/02a-email-password-auth-core-completion.md` |
| 3A | Organizer/Admin-owned Quest CRUD backend | PR #6 | `specs/implementation/reports/03a-organizer-quest-crud-backend-completion.md` |
| 3B | Organizer/Admin Quest management frontend | PR #7 | `specs/implementation/reports/03b-organizer-quest-management-frontend-completion.md` |
| 4A | Member Quest participation join/cancel flow | PR #8 | `specs/implementation/reports/04a-quest-participation-core-completion.md` |
| 4B-1 | Completion Code persistence, management and redemption backend | PR #10 | `specs/implementation/reports/04b1-completion-code-backend-completion.md` |
| 4B-2 | Completion Code Organizer and Member frontend flows | PR #11 | `specs/implementation/reports/04b2-completion-code-frontend-completion.md` |
| 5A | Server-authoritative XP ledger, reconciliation, levels and rank progression | PR #12 | `specs/implementation/reports/05a-xp-ledger-and-progression-core-completion.md` |
| 5B | Responsive Passport-lite summary, level progress and verified completion history | PR #13 | `specs/implementation/reports/05b-passport-lite-completion.md` |
| 6A-1 | Persisted achievement catalog, atomic milestone awards and historical backfill | PR #14 | `specs/implementation/reports/06a1-achievement-award-core-completion.md` |
| 6A-2 | Anonymous achievement catalog and private earned-achievement read APIs | PR #15 | `specs/implementation/reports/06a2-achievement-read-api-completion.md` |
| 6B | Responsive Passport achievement catalog with authoritative locked/unlocked state and redemption resync | PR #16 | `specs/implementation/reports/06b-passport-achievements-ui-completion.md` |
| 7A | Anonymous ledger-authoritative NZ/all-time Top-10 people leaderboard backend | PR #17 | `specs/implementation/reports/07a-simple-leaderboard-backend-completion.md` |
| 7B | Responsive public NZ/all-time leaderboard frontend with strict validation and TanStack Query ownership | PR #18 | `specs/implementation/reports/07b-simple-leaderboard-frontend-completion.md` |
| 8 | Persisted Light/Dark/System theme switching with system-theme synchronization and a responsive cross-route switcher | PR #19 | `specs/implementation/reports/08-theme-switching-completion.md` |

The R1 production deployment baseline is also merged through PR #9. It is an
accepted deployment plan only; it does not prove that production deployment
has occurred.

## Current Work

### Slices 9–12 — MVP Product Convergence

- **Slice 9:** committed and pushed as `7cd3b1a` on
  `codex/feat/slice-9-mvp-ui-convergence`. The production UI now follows the
  local Figma Make reference; My Quests and the Completion Reward Overlay are
  included. Kimi K3 Review 55 approved it with 0 Blockers and 0 Majors.
- **Slice 10:** committed and pushed as `94a129c` on
  `codex/feat/slice-10-trusted-impact`. Evidence-reviewed and self-reported
  completion, Admin Review, evidence purge, broader Passport history, and the
  email/password account lifecycle are included. Kimi K3 Review 56 approved it
  with 0 Blockers and 0 Majors.
- **Slice 11 branch:** `codex/feat/slice-11-community-discovery`
- **Slice 11 baseline:** `94a129c`
- **Slice 11 status:** production implementation, full local gates and the
  independent review are complete. Implemented behaviour includes
  Google Maps Quest discovery with list/input fallback, Home Community,
  people/community leaderboards with privacy thresholds, verified weekly
  streak, a privacy-safe PNG Share Card, Community Challenges with idempotent
  reward finalization, and SignalR query invalidation backed by REST.
- **Observed Slice 11 gates:** clean frontend lint/type-check; after the Maps
  runtime correction, 37 frontend test files with 314/314 tests passing;
  successful frontend production build; clean
  backend build apart from five pre-existing test-helper EF1002 warnings;
  247/247 backend unit tests and 284/284 PostgreSQL integration tests passing.
- **Slice 11 review:** Kimi K3 Review 57 approved the bounded correction with
  no remaining Blocker or Major finding.
- **Google Maps runtime correction:** real browser-key and JavaScript map-ID
  configuration now replace the demo map ID, with load-failure/list/input
  fallbacks. K3 Review 58 approved the referrer-policy correction with no
  remaining Blocker or Major. A restricted key and map ID have since been
  supplied locally and live Google map rendering was observed.
- **Slice 12 status:** production implementation, full local gates, and
  independent Kimi K3 Review 59 are complete with no remaining Blocker or
  Major. The remaining Figma Make
  experience gap is closed with a dedicated Share Card Builder, the accepted
  Passport summary/community-participation APIs and full real-data Passport
  hierarchy, a member-momentum Home, and authoritative Mission Board states.
  The prototype's fictional category targets and eight-badge catalog were not
  copied.
- **Observed Slice 12 gates:** frontend lint/type-check/build passed with
  326/326 tests; backend build passed apart from five pre-existing test-helper
  EF1002 warnings, with 247/247 unit and 286/286 PostgreSQL integration tests.
- **Slice 11A/12 commit:** committed and pushed as `cae199d` on
  `codex/feat/slice-11-community-discovery` on 2026-07-27.
- **Known boundary:** Google OAuth/account linking, production email-provider
  setup, production Google Maps credentials/restrictions, public deployment,
  and the final submission workflow remain outside Slices 9–12.

### Slice 13 — Local Production Runtime

- **Branch:** `codex/feat/slice-13-dockerized-runtime`
- **Scope:** provider-neutral Dockerization only. One ASP.NET Core image serves
  the built React application, API, SignalR, Scalar, OpenAPI, and health paths
  from a single origin. Compose adds an explicit EF migration job, PostgreSQL,
  durable Data Protection keys, and optional Mailpit.
- **Verification status:** complete. Independent Kimi K3 Review 60 approved the
  corrected code with no remaining Blocker or Major. The final image built,
  the explicit migration job exited 0, app and PostgreSQL became healthy,
  single-origin route smokes passed, and database plus Data Protection state
  survived an app restart. Public hosting provider selection, DNS, billable
  resources, public deployment, backup/restore, and provider-specific
  forwarded-header behavior remain outside this Slice.

### Remaining P0 delivery gaps

- Same-origin production deployment and observed deployed behaviour.
- Review and explicitly approve the React Router 8.3 compatibility upgrade
  before any future adoption of unstable RSC APIs; the current Vite SPA does
  not use the affected mode.
- Final full-product verification, README evidence, advanced-requirement
  selection, and a public submission video no longer than six minutes.

The previously deferred Google Maps, external-event claims, Community
Challenge, multi-layer community leaderboards, weekly streak, Share Card, and
SignalR invalidation are implemented on the sequential Slice 10/11 work.
Slice 12 completes their member-facing composition. They are not represented
as merged into `main` until the human performs the separate integration
workflow.

## Environment Prerequisites

Before Slice 1 implementation:

- [x] PROJECT_STATUS updated
- [x] GitHub Actions CI workflow added and verified
- [x] Docker availability verified
- [x] PostgreSQL local workflow verified

Evidence:

- Docker Desktop is available.
- `docker-compose.yml` successfully starts PostgreSQL 17 and Mailpit.
- `.github/workflows/ci.yml` is active.
- GitHub Actions `Backend Build and Test` passed.
- GitHub Actions `Frontend Build and Test` passed.

## Accepted Architecture Baseline

| Area                                  | Status   | Evidence                                                                              |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| Planning baseline                     | Accepted | specs/Kiwimpact_Final_Planning_Baseline_v1.0.md                                       |
| Project profile                       | Accepted | specs/00-project-profile.md                                                           |
| ADR-0001 PostgreSQL                   | Accepted | specs/adr/ADR-0001-use-postgresql.md                                                  |
| ADR-0002 Identity + Cookie Auth       | Accepted | specs/adr/ADR-0002-use-identity-cookie-authentication.md                              |
| ADR-0003 Clean Architecture Lite      | Accepted | specs/adr/ADR-0003-use-clean-architecture-lite.md                                     |
| ADR-0004 React/Vite/Tailwind/daisyUI  | Accepted | specs/adr/ADR-0004-use-react-vite-tailwind-daisyui.md                                 |
| ADR-0005 TanStack Query + Zustand     | Accepted | specs/adr/ADR-0005-use-tanstack-query-and-zustand.md                                  |
| ADR-0006 Google Maps                  | Accepted | specs/adr/ADR-0006-use-google-maps.md                                                 |
| ADR-0007 PostgreSQL Integration Tests | Accepted | specs/adr/ADR-0007-use-postgresql-integration-tests.md                                |
| ADR-0008 Community Identity           | Accepted | specs/adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md |
| ADR-0009 Single-Origin Deployment     | Accepted | specs/adr/ADR-0009-use-single-origin-deployment.md                                    |

## Historical Review Baseline

The following section records pre-development decisions and is preserved as historical context.

Historical records:

- Figma reviews
- Pre-development reviews
- Community scope reviews
- Initial scaffold status before Slice 0

The historical status below should not be interpreted as current implementation status.

## Historical Baseline (Before Slice 0)

| Control or component            | Status          | Notes           |
| ------------------------------- | --------------- | --------------- |
| Frontend scaffold               | Not implemented | Before Slice 0  |
| Backend scaffold                | Not implemented | Before Slice 0  |
| PostgreSQL local infrastructure | Not implemented | Before Slice 0  |
| Test commands                   | Not verified    | Before Slice 0  |
| GitHub Actions                  | Not active      | Before Slice 0  |
| Deployment                      | Not configured  | Future decision |
