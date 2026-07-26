# Project Status

Last reviewed: 2026-07-26

Current `main` baseline: `a974725` (`Merge pull request #15 from
Zephyr724/feat/slice-6a2-achievement-read-api`)

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

The R1 production deployment baseline is also merged through PR #9. It is an
accepted deployment plan only; it does not prove that production deployment
has occurred.

## Current Work

### Slice 6B — Passport Achievements UI

- **Branch:** `feat/slice-6b-passport-achievements-ui`
- **Main baseline:** `a974725` (PR #15 merge of Slice 6A-2)
- **Status:** implemented locally by Codex within the approved frontend-only
  15-primary-file boundary. Targeted verification passed 63/63 tests. Review
  46 independently approved the implementation with 0 Blockers, 0 Majors,
  and 2 non-blocking cosmetic Minors; both were corrected in one concentrated
  pass. The affected tests passed 28/28, then the full frontend gates passed
  again with no lint warnings or type errors, 261/261 tests, and a successful
  production build. The work remains uncommitted and unpushed pending human
  Git approval.
- **Delivered locally:** full active achievement catalog on Passport,
  authoritative locked/unlocked composition, accessible unlock dates,
  guarded icon handling, bounded section states, redemption resync, and
  principal-boundary cache cleanup.
- **Boundary:** no backend, schema, migration, contract, dependency,
  configuration, or excluded achievement feature changed.

### Remaining P0 delivery gaps

- Member-facing achievement UI is implemented and locally verified on the
  active Slice 6B branch and independently approved; it still requires human
  Git approval and merge.
- One simple persisted leaderboard and responsive frontend.
- Complete, persisted light/dark/system theme switching using Zustand for
  genuine cross-component UI state.
- Full frontend/backend/PostgreSQL Dockerization with one documented startup
  path.
- Same-origin production deployment and observed deployed behaviour.
- Final full-product verification, README evidence, advanced-requirement
  selection, and a public submission video no longer than six minutes.

Slice 2B account lifecycle, richer achievements, streaks, Cypress and SignalR
remain P1 work and must not delay these P0 gaps. Google Maps, external-event
claims, Community Challenge, multi-layer community leaderboards and Share Card
remain Deferred under the current delivery scope.

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
