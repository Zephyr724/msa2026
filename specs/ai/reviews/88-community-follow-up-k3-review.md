# Community follow-up — independent K3 read-only review

## Reviewer and scope

- **Reviewer:** Kimi K3 through Kimi Code CLI 0.29.1
- **Configured model:** `moonshotai-cn/kimi-k3`
- **Session:** `session_5ec6db38-b67d-4592-9722-77e7d4b97ad8`
- **Date:** 2026-08-07
- **Mode:** strict read-only; K3 made no repository changes and ran no builds,
  tests, migrations, services, or database commands
- **Implementation/correction owner:** this Codex review-coordination session,
  separate from K3

The inventory check found three source-task commits without qualified
independent review:

1. `0dd9b9f88abc3075c0dc469a74762223d68c6d1f` on
   `fix/community-card-like`, already merged into `main`;
2. `f87a4109b9509d2bdfe18fd820ea2ad0343fa813` on
   `fix/community-masonry-covers`; and
3. `eee46627c5a61660f5ac11114e7b099191ef40e8` on
   `fix/app-shell-scroll-restoration`.

K3 reviewed each exact commit diff against its real parent. It confirmed that
the latter two are sibling commits from `78c0826`, and that their shared parent
already contains the merged card-like commit. Earlier source-task commits were
not re-reviewed because Reviews 77/78, 81, 82/83, 84, and 87 already provide
qualified independent evidence.

## Initial result

- Blocker: 0
- Major: 0
- Minor: 4
- Verdict: **APPROVED WITH MINORS**

K3 found no security, privacy, authentication, antiforgery, API-contract,
migration, dependency, AppShell scroll-restoration, Development-seed boundary,
like-navigation, ratio-threshold, or comment-fixture defect.

### Minor 1 — failed cover image had no visible fallback

`f87a410:frontend/src/components/social/SocialPostCard.tsx:33-43`

The card used `h-auto` until `onLoad` established a crop mode and had no
`onError` behavior. An unavailable first-image URL could collapse the cover and
the measured masonry item. K3 recommended a deterministic footprint or text
cover fallback.

### Minor 2 — completion report named the wrong evidence file

`f87a410:specs/implementation/reports/39-development-community-stories-and-comments-completion.md:25`

The report named a `38-...stories...` file even though the committed report is
numbered 39.

### Minor 3 — masonry wrappers used array-index keys

`f87a410:frontend/src/components/social/SocialMasonryGrid.tsx:49`

Index keys could retain the previous wrapper's `rowSpan` for one frame when
feed content changes before `ResizeObserver` self-corrects.

### Minor 4 — loading skeleton retained obsolete column-layout classes

`f87a410:frontend/src/pages/CommunityPage.tsx:143-146`

The skeleton container is a grid, but its items still had column-era
`inline-block`, `break-inside-avoid`, and extra margin classes.

## Concentrated Minor correction

The correction owner addressed all four safe, in-scope Minors in one pass:

- a failed image URL now renders the existing sentence-based text cover;
- failure state is associated with the failed URL, so a later image URL update
  can render normally;
- the new fallback has a focused frontend integration test;
- masonry wrappers derive stable keys from keyed React children;
- obsolete skeleton column classes were removed; and
- the stories report now names both its real prompt 95 and report 39 paths.

The prompt-path correction was an additional directly observed evidence typo
of the same kind as Minor 2.

## Closure disposition

No Blocker or Major existed, so repository policy does not call for a targeted
K3 closure check. No second full review or second reviewer was used.

## Commands K3 actually ran

K3 used read-only `git log`, `git show`, `git grep`, `git merge-base`, and
`git branch --contains` commands, including numbered commit-file views for line
evidence. It ran no test, build, migration, service, or database command.

## Verification after correction

Observed from this isolated review worktree:

| Command or check | Observed result |
| --- | --- |
| `npm run lint` | Passed. |
| `npm run type-check` | Passed after providing a writable local copy of the existing dependency tree. |
| Focused Community and cover-ratio tests | Passed: 2 files, 15 tests. |
| `npm run test -- --run` | Passed: 52 files, 410 tests. |
| `npm run build` | Passed; the existing main-chunk advisory remained (`820.90 kB`, `228.48 kB` gzip). |
| `dotnet build Kiwimpact.slnx` | Passed: 0 errors and 5 existing EF1002 warnings in unrelated integration-test source. |
| Focused Development seed integration test | Passed: 1 test. |
| Complete backend unit tests | Passed: 309 tests. |
| Complete backend integration tests | **Not fully green:** 341 passed and 1 failed out of 342. The failure was the unrelated `XpLedgerPersistenceTests.NonVerifiedCompletionIsOutsideEveryRewardBoundary` assertion at line 374. |
| Isolated rerun of the failed XP test | Passed: 1 test. This is evidence of an order/concurrency-sensitive fluctuation, but it does not convert the complete 341/342 run into a pass. |
| `git diff --check` | Passed after the final evidence update and diff inspection. |

The first verification attempt in the isolated worktree had no frontend
dependencies. Lint/test commands could not find `oxlint`/`vitest`, and the
system TypeScript version reported missing project types/options. A subsequent
read-only dependency symlink let lint run, but type-check and Vitest could not
write their normal `.tmp`/`.vite-temp` caches through the sandboxed external
target. The final passing frontend results used an APFS copy-on-write clone of
the already installed dependency tree inside this worktree; no package or
lockfile was changed and no dependency was installed or upgraded.

### AppShell sibling-commit verification

The correction branch is based on `f87a410`, so the correction owner also made
a disposable local clone in `/private/tmp`, checked out the exact `eee4662`
snapshot, and observed the following without changing that commit or branch:

| Command or check | Observed result |
| --- | --- |
| `npm run lint` | Passed. |
| `npm run type-check` | Passed. |
| Focused `AppShell.test.tsx` | Passed: 1 file, 8 tests. |
| `npm run test -- --run` | Passed: 51 files, 403 tests. |
| `npm run build` | Passed; the existing chunk-size advisory remained (`818.51 kB`, `227.56 kB` gzip). |

This independently reproduces the verification counts recorded in the
AppShell completion report. It does not constitute a browser-side observation;
the route reset remains verified through React Router's data-router integration
test and K3's source inspection.
