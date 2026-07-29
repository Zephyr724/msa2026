# Slice 21 — Independent K3 Read-only Review

## Reviewer and scope

- **Reviewer:** Kimi K3 via Kimi Code CLI
- **Date:** 2026-07-29
- **Mode:** independent and read-only; Codex remained the sole implementation
  owner
- **Scope:** Slice 21 contract, implementation prompt, completion report,
  Slice 20 evidence/review, Cypress dependency/config/specs, TypeScript
  project coverage, ignored artifacts, relevant auth/participation/Passport
  production code and Development seed evidence, and the actual worktree
  diff/status

## Result

- Blocker: 0
- Major: 0
- Minor: 1
- Verdict: **APPROVED WITH ONE NON-BLOCKING MINOR**
- Original Blocker/Major closure: none existed; nothing remains to close

## Contract and safety observations

K3 confirmed:

- all Member-spec intercepts are method/path-scoped, observe-only, and map to
  real backend routes;
- login uses the real UI and normal cookie flow, with no cookie injection,
  `cy.session`, test endpoint, response stub, or test-only production
  selector;
- credentials are environment-driven, required explicitly, suppressed during
  form typing, and absent from tracked source/evidence;
- the README contains only a local-password placeholder;
- demo identity/activity seeding remains Development-gated and
  configuration-supplied;
- every tested selector maps to existing production markup;
- the deterministic Test Member 1 identity and progression assertions are
  backed by the reviewed Slice 19 Development activity seed;
- the two Slice 20/21 journeys satisfy the accepted P1 Cypress boundary;
- no unexpected production drift was introduced after Review 74.

## Slice 20 Minor closure

### Minor 1 — Cypress outside the static type-check graph

**Closed.** `frontend/tsconfig.node.json` now includes
`cypress.config.ts` and `cypress/**/*.ts` with Cypress types. K3 used
TypeScript file-list output to confirm that the config and both specs are in
the program, then observed `npm run type-check` pass.

### Minor 2 — broad public Quest intercept

**Closed.** The public spec now uses method-scoped exact list and detail
pathname matchers. The list matcher no longer includes detail requests.

Review 74's third Minor concerned manual mobile evidence and did not identify a
production defect. Slice 21 retains truthful manual mobile evidence rather
than converting it into an automated claim.

## Independently observed checks

K3 reported:

- `npm run lint`: passed;
- `npm run type-check`: passed with the Cypress sources included;
- `npm run test -- --run`: passed, 46 files and 347 tests;
- `npm run build`: passed with the existing main-chunk advisory;
- `git diff --check`: passed;
- `dotnet build Kiwimpact.slnx`: passed with zero errors on the incremental
  reviewer run;
- backend unit tests: passed, 250 tests;
- `npm audit`: 2 high and 0 critical, both the known React Router entries;
- lockfile comparison: 0 packages removed, 0 existing package-version
  changes, and only the approved Cypress dependency tree added;
- Cypress videos are ignored and current generated videos for both specs
  corroborated the implementation owner's recorded run;
- the API was no longer running during review, so K3 did not rerun the
  secret-dependent Member journey and did not invent an E2E result;
- Docker remained unresponsive, independently corroborating the completion
  report's cancelled integration-test rerun. Slice 20/21 make no backend
  change, and Slice 19 retains its recorded 307-test passing evidence.

## Non-blocking Minor

The Passport assertions use the shared styling selector
`.kiwi-topography`. It is functionally correct in the observed page and the
E2E passes, but a Passport-summary section/ARIA-scoped locator would be more
durable if additional topography containers are later introduced.

This is accepted as non-blocking test-maintainability debt. It does not weaken
authentication, authoritative-data, or route assertions and does not require
the bounded Blocker/Major correction workflow.

## Commit-readiness conclusion

Slice 21 is independently **ready to commit**, together with its uncommitted
Slice 19/20 dependencies, subject to:

- the documented Docker/integration-rerun limitation;
- the accepted non-blocking selector Minor; and
- explicit human authorization for every Git write.
