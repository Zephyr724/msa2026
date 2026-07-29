# Slice 20 — Cypress Public Discovery Completion Report

## Status

Production/test implementation, local verification, and the single independent
K3 read-only review are complete. K3 approved the Slice with zero Blockers,
zero Majors, and three non-blocking Minors.

## Implemented scope

- Added Cypress `15.19.0` as the explicitly approved frontend development
  dependency.
- Added a Cypress configuration with:
  - configurable `CYPRESS_BASE_URL`;
  - supported local default `http://localhost:5173`;
  - explicit end-to-end spec pattern;
  - no support-file requirement;
  - 1280 × 800 default viewport;
  - video capture and normal failure screenshots;
  - retries disabled so a flaky first run cannot be hidden.
- Added `test:e2e` and `test:e2e:public` npm commands.
- Added generated Cypress screenshot/video directories to the frontend ignore
  rules.
- Added one real anonymous core journey:
  - Discover loads from the real API;
  - Observe & Measure is selected;
  - Water Quality Monitoring is searched;
  - category/search state is present in the URL;
  - the real result count and Quest card are observed;
  - the card opens the persisted Quest Detail;
  - the detail heading, fact region, About heading, and description are
    observed.
- The Cypress intercepts are read-only observers. No response is stubbed or
  rewritten.
- No production component, API, authentication behavior, database schema, or
  seed definition changed in Slice 20.

## Files changed

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/.gitignore`
- `frontend/cypress.config.ts`
- `frontend/cypress/e2e/public-discovery.cy.ts`
- `specs/implementation/20-cypress-public-discovery-journey.md`
- `specs/implementation/21-cypress-authenticated-member-journey.md`
  (the next-Slice boundary only)
- `specs/ai/prompts/76-slice-20-cypress-public-discovery.md`
- `specs/implementation/reports/20-cypress-public-discovery-completion.md`

The worktree also retains the separate uncommitted Slice 19 implementation and
evidence. No existing Slice 19 change was discarded or overwritten.

## Verification commands and observed results

| Command or check | Observed result |
| --- | --- |
| `npx cypress verify` | Passed outside the filesystem sandbox; Cypress package and binary `15.19.0`, Electron `37.6.0` |
| `npm run test:e2e:public` | Passed: 1 spec, 1 test, 0 failures; Electron 138 headless; 2-second spec duration |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed: 46 files, 347 tests |
| `npm run build` | Passed; 1,963 modules; existing main-chunk size advisory remains |
| `git diff --check` | Passed |
| `npm audit --json` | Completed with the existing React Router RSC advisory: 2 high-severity package entries, 0 critical |

### Runtime used by Cypress

Docker Desktop's daemon was unavailable and displayed its own error state.
Rather than claim Docker verification, the run used:

- an isolated PostgreSQL 17 cluster under `/private/tmp`;
- the repository's real EF migrations;
- the real Development Region, Quest, persona, and activity seeds;
- the current ASP.NET Core API on `http://localhost:5091`;
- the current Vite application on `http://localhost:5173`.

No existing user database was modified. No credential file was created.

## Browser evidence

The same data-backed flow was inspected with the in-app browser:

| View | Observation |
| --- | --- |
| Discover, 1280 × 800 | `Discover eco quests`, Observe & Measure filtering, the Water Quality Monitoring search, `1 quest found`, and one matching card were observed |
| Quest Detail, 1280 × 800 | Exact title, Quest details, Howick/Auckland/New Zealand location trail, About section, and description were observed |
| Discover, 390 × 844 | One matching card was observed; `innerWidth == scrollWidth == 390` |
| Quest Detail, 390 × 844 | Title, details, and About section were observed; `innerWidth == scrollWidth == 390` |

The in-app browser's Enter key did not submit the search form during one manual
interaction attempt. The same user action passed in Cypress, and direct
navigation to the resulting URL confirmed the rendered browser state. This is
recorded as a browser-control limitation, not hidden as a product failure.

## Known limitations

- Slice 20 supplies one of the two required stable P1 Cypress journeys. The
  authenticated Member journey remains Slice 21.
- The local Cypress command assumes the application is already running. It
  does not start PostgreSQL, API, or Vite and therefore does not conceal
  runtime ownership.
- Docker Desktop was not verified in this Slice because its daemon was
  unavailable. The repository's previously reviewed Docker runtime was not
  modified.
- `npm audit` continues to report the accepted/known React Router RSC-mode
  advisory. The current application is a Vite SPA and does not use the
  affected RSC mode. Changing React Router requires separate dependency
  approval and is outside this Slice.
- Generated Cypress video/screenshot artifacts are intentionally ignored and
  are not implementation evidence committed to the repository.

## Review status

Independent K3 Review 74 returned **APPROVED WITH NON-BLOCKING MINORS**:

- Blocker: 0
- Major: 0
- Minor: 3

K3 independently reran the Cypress journey, lint, type-check, 347 frontend
tests, build, diff check, live API determinism check, audit, and lockfile
comparison. No original Blocker/Major exists and no correction round is
required.

The accepted Minors are:

1. Cypress TypeScript files are not statically covered by the current
   `type-check` projects;
2. the public Quest-list intercept is broader than necessary;
3. the 390 px browser observation is manual evidence that K3 did not repeat.

The first two are assigned to Slice 21's shared Cypress-foundation refinement.
The third is retained as an evidence limitation rather than a production
defect. Slice 20 is independently ready to commit as part of the current
uncommitted Slice 19–21 worktree, subject to the final combined verification
and explicit human Git authorization.
