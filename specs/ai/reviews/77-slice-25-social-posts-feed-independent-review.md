# Slice 25 — Independent Codex Read-only Review

## Reviewer and scope

- **Reviewer:** fresh Codex sub-agent session, independent from the
  implementation owner
- **Date:** 2026-07-31
- **Mode:** independent and read-only; the reviewer made no file changes and
  did not stage, commit, or rerun complete test suites
- **Scope:** root `AGENTS.md`, Slice 25 contract, prompt and completion
  evidence, full worktree diff, existing authentication/antiforgery/privacy
  patterns, migration/model constraints, backend API/service/repository,
  frontend queries/mutations/UI, and focused/full verification evidence

## Initial result

- Blocker: 0
- Major: 1
- Minor: 4
- Initial verdict: **CHANGES REQUESTED**

### Major 1 — unbounded direct replies in public thread reads

The root-comment page was bounded, but the repository then queried and
materialized every direct reply beneath those roots. A high-fan-out thread
could therefore create an unbounded SQL result, allocation, and public
response body.

### Minor 1 — like caller state was not database-authoritative

The response reread the aggregate count but returned the requested Boolean as
`IsLikedByViewer`, which could disagree with final database state under
interleaved calls.

### Minor 2 — social write 401 did not run session expiry

Publish, like, and comment mutations used the common transport without the
private-endpoint 401 lifecycle. An expired cookie could leave old social and
auth state visible.

### Minor 3 — extreme pages could overflow the offset calculation

Only the lower page boundary was validated. Near-`int.MaxValue` public page
values could overflow `(page - 1) * pageSize` before EF paging.

### Minor 4 — write-boundary coverage was incomplete

The initial tests proved publish authentication/antiforgery, but not the like,
unlike, and comment equivalents or each actor-partitioned 429 boundary. The
OpenAPI check also omitted like routes and some 403 responses.

## Concentrated correction pass

The implementation owner made one correction pass limited to the original
findings:

- each returned root now queries at most the first 20 direct replies and
  reports authoritative `replyCount` plus `hasMoreReplies`;
- the UI states when a reply preview is truncated;
- like mutations reread both aggregate count and caller state from the
  database;
- every social write runs ordered private-cache/session expiry on 401, and the
  optimistic-like rollback cannot restore old-principal cache after expiry;
- page values are bounded to 1–10,000 before offset calculation;
- focused API tests now cover anonymous and missing-antiforgery behavior for
  like/unlike/comment, the three production rate-limit policies and user
  partition isolation, bounded reply previews, and extreme pages;
- focused frontend coverage proves write-401 session/cache behavior; and
- OpenAPI coverage now includes like methods and documented 403 responses.

## Correction verification observed by the implementation owner

| Check | Result |
| --- | --- |
| Affected frontend files with local `oxlint` | Passed |
| `npm run type-check` after correction | Passed |
| Community integration test | Passed: 7 tests |
| `dotnet build Kiwimpact.slnx` immediately after production correction | Passed with 0 errors and 5 existing EF1002 warnings in unrelated integration-test source |
| Integration-test project build after test correction | Passed with 0 errors and the same 5 existing EF1002 warnings |
| Focused social, social OpenAPI, and migration integration selection | Passed: 11 tests |
| `git diff --check` before correction review | Passed |

Two diagnostic attempts are retained honestly: `npx eslint` attempted network
resolution because ESLint is not the repository linter and failed with
`ENOTFOUND`; the local `oxlint` command replaced it. The first focused frontend
run exposed a missing runtime `ApiError` import despite seven assertions
passing, and the first backend correction run exposed test-account rate-limit
interference. Both test defects were corrected before the final passing runs
above; no production failure was hidden.

## Targeted closure

The same independent reviewer performed one targeted closure check limited to
the original Major and four Minors. No second full review was performed.

| Original finding | Closure result |
| --- | --- |
| Major — unbounded public direct-reply reads | **Closed.** Each root returns at most 20 replies with authoritative count/truncation metadata; API coverage proves 21 replies return a bounded 20-item preview. |
| Minor — like caller state not authoritative | **Closed.** Both aggregate count and caller state are reread from the database. |
| Minor — social write 401 omitted session expiry | **Closed.** All three write transports share ordered expiry, optimistic rollback cannot restore old state, and focused frontend coverage/type-check pass. |
| Minor — extreme page overflow | **Closed.** Both public pagers reject values outside 1–10,000; `int.MaxValue` API coverage returns 400. |
| Minor — incomplete write-boundary coverage | **Closed.** Anonymous, antiforgery, all three 429 policies/user partitions, and OpenAPI like/comment boundaries are covered. |

## Final result

- Blocker: 0
- Major: 0
- Minor: 0
- Verdict: **APPROVED**
- Original Blocker/Major closure: all original findings are closed

From the independent review perspective, Slice 25 is ready to commit subject
to the completion report's recorded verification limitation and explicit
human authorization for Git writes.
