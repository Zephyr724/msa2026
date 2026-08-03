# Slice 25 — Independent K3 Read-only Review

## Reviewer and scope

- **Reviewer:** Kimi K3 via Kimi Code CLI, session
  `session_c3c1b7a5-b40c-49a5-9207-45871ec1eed6`
- **Date:** 2026-07-31
- **Authorization:** the product owner explicitly requested this second
  independent reviewer after Review 77
- **Mode:** independent and read-only; K3 made no file changes, staged no
  files, and did not rerun complete test suites
- **Scope:** Slice contract/prompt/completion evidence, Review 77, complete
  worktree status/diff including untracked sources, migration/model snapshot,
  backend service/repository/API/security patterns, frontend data/cache/UI,
  tests, and documentation

## Initial result

- Blocker: 0
- Major: 0
- Minor: 2
- Verdict: **APPROVED WITH TWO NON-BLOCKING MINORS**

K3 independently confirmed that Review 77's original Major and four Minors
were truthfully closed. It also confirmed migration/configuration consistency,
public DTO privacy, global antiforgery, authenticated actor-partitioned rate
limits, literal ILIKE search escaping, bounded pagination/reply previews,
idempotent authoritative likes, two-level comment enforcement, ordered
private-session expiry, guest/write boundaries, responsive masonry behavior,
and consistency between source/tests/completion evidence. K3 independently
observed `git diff --check` pass.

## Initial findings

### Minor 1 — bounded N+1 reply-preview queries

`SocialFeedRepository.ListCommentsAsync` executed one sequential reply query
for each returned root. Although both roots and replies were bounded to 20, a
full root page could require approximately 22 database round trips.

### Minor 2 — missing profile could fail a whole public page

Post/comment author projections used `.Single()` against `UserProfiles`.
Registration and seeds currently preserve the one-profile-per-user invariant,
but exceptional manual data damage could cause a public feed/comment page to
return 500 rather than degrade one author's display label.

## Concentrated correction pass

The implementation owner addressed both K3 Minors in one focused pass:

- replaced the per-root loop with one parameterized PostgreSQL window query
  using `ROW_NUMBER() OVER (PARTITION BY ParentCommentId ...)`, retaining the
  hard limit of 20 ordered replies per root without materializing an unbounded
  reply set;
- loads the bounded reply authors in one additional profile query and groups
  the result in memory;
- changed post/root-comment projections to a neutral `Community member`
  fallback when an internal profile row is unexpectedly absent; and
- extended the public-feed integration test to delete the author's profile
  deliberately and verify a successful response with the neutral label.

## Correction verification observed by the implementation owner

| Check | Result |
| --- | --- |
| `dotnet build Kiwimpact.slnx` | Passed: 0 errors; 5 existing EF1002 warnings in unrelated integration-test source |
| Focused social API, social OpenAPI, and migration integration selection | Passed: 11 tests |

The existing 21-reply integration path exercised the new window query and
still proved a 20-item preview with authoritative truncation metadata.

## Targeted closure

The same K3 session performed one targeted closure check limited to the two
original Minors. It made no file changes, did not repeat a full review, did not
rerun tests, and independently observed `git diff --check` pass.

| Original finding | Closure result |
| --- | --- |
| Minor — bounded N+1 reply-preview queries | **Closed.** One parameterized `ROW_NUMBER()` query now enforces the per-root 20-reply limit in PostgreSQL; a second bounded profile query resolves reply authors. The existing 21-reply API path exercises this query. |
| Minor — missing profile could fail a public page | **Closed.** Feed, root-comment, and reply author paths use the neutral fallback; the API test deliberately deletes a profile and observes a successful feed response. |

## Final result

- Blocker: 0
- Major: 0
- Minor: 0
- Verdict: **APPROVED**
- Original finding closure: both K3 Minors are closed

From K3's independent perspective, Slice 25 is ready to commit subject to the
completion report's recorded XP-ledger fluctuation and explicit human
authorization for Git writes.
