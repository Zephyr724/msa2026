# Slice 20 — Independent K3 Read-only Review

## Reviewer and scope

- **Reviewer:** Kimi K3 via Kimi Code CLI
- **Date:** 2026-07-29
- **Mode:** independent and read-only; Codex remained the sole implementation
  owner
- **Scope:** Slice 20 contract, implementation prompt, completion report,
  Cypress dependency/config/spec, package lock, ignore rules, relevant
  existing discovery/detail/seed code, and the actual worktree diff

## Result

- Blocker: 0
- Major: 0
- Minor: 3
- Verdict: **APPROVED WITH NON-BLOCKING MINORS**
- Original Blocker/Major closure: none existed; nothing remains to close

## Non-blocking Minors

### 1. Cypress TypeScript is outside the current type-check projects

`frontend/tsconfig.app.json` includes only `src`, while
`frontend/tsconfig.node.json` includes only `vite.config.ts`. Therefore
`cypress.config.ts` and `cypress/e2e/**/*.cy.ts` are compiled by Cypress during
execution but are not statically checked by `npm run type-check`.

The reviewer recommended adding Cypress files to an applicable TypeScript
project in Slice 21 or a small follow-up. This is accepted as Slice 21 work.

### 2. Public Quest intercept is broader than necessary

`**/api/v1/quests*` can also match a Quest detail URL. This does not affect the
current test because no `@questList` wait occurs after detail navigation, but a
narrower query-only observation would be more durable if the spec grows.

This is accepted as a Slice 21 test-foundation refinement.

### 3. Mobile browser evidence is manual

The 390 × 844 observation is truthful manual browser evidence and the report
records the in-app browser Enter-key limitation. K3 independently reproduced
the desktop Cypress journey but did not reproduce the historical mobile manual
interaction. No production defect was identified.

## Independently observed checks

K3 reported:

- `npm run test:e2e:public`: passed, 1 spec and 1 test;
- the live real API returned exactly one Water Quality Monitoring item for the
  ObserveMeasure + full-title search, with the asserted GUID;
- `npm run lint`: passed;
- `npm run type-check`: passed, subject to Minor 1;
- `npm run test -- --run`: passed, 46 files and 347 tests;
- `npm run build`: passed with the existing main-chunk size advisory;
- `git diff --check`: passed;
- `npm audit --json`: 2 high, 0 critical, both the known React Router entries;
- no existing lockfile package version changed and no package was removed;
- Cypress intercepts observe rather than stub responses;
- no credentials, private test endpoint, or test-only production selector was
  introduced;
- screenshot/video paths are ignored;
- reviewer checks left the same 109-entry modified/untracked worktree set.

## Commit-readiness conclusion

Slice 20 is independently approved and has no Blocker/Major finding. The three
Minors are non-blocking. Minor 1 and Minor 2 are intentionally folded into the
already accepted Slice 21 boundary; Minor 3 remains a documented evidence
characteristic rather than an implementation defect.
