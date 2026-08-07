# Review 91 — Member Loop Delivery and Visual Closure Kimi K3 Review

- **Date:** 2026-08-07
- **Reviewer:** Kimi K3 via Kimi Code CLI 0.31.1
- **Review mode:** independent, read-only; Codex was the implementation owner
- **Scope:** Slice 37 (`37-member-loop-delivery-and-visual-closure.md`)
- **Initial verdict:** **CHANGES REQUIRED**

## Review method

Kimi K3 inspected `AGENTS.md`, the accepted Slice specification,
implementation prompt, completion report, unstaged Slice 37 diff, relevant
backend/frontend implementation, migration, and tests. It was explicitly
instructed not to modify repository files and to report only Blocker/Major
findings. K3 also independently observed 30 focused frontend tests and 316
backend unit tests passing during the initial review.

## Blocker findings

None identified.

## Major findings

### M1 — Async reward delivery omitted explicit reward-event invalidation

- **Evidence:** `RewardInboxDelivery.tsx` called
  `syncMemberRewardSurfaces(queryClient, reward.questId)`, but that helper did
  not invalidate `rewardEventKeys`. Only the immediate-redemption helper added
  the reward-event prefix invalidation.
- **Contract:** Slice 37 requires asynchronous delivery to invalidate
  completion, participation, Passport, progression, achievements,
  leaderboard, claims, and reward-event reads.
- **Impact:** The existing query topology normally converged indirectly when
  completion changed to Verified and enabled the per-Quest resolution query,
  but this relied on an incidental enabled-transition rather than the explicit
  invalidation contract. Cached/error reward-resolution state could diverge as
  the query topology evolves.
- **Bounded correction:** Invalidate the exact per-Quest reward-event query on
  asynchronous delivery and add an integration assertion for that call.

## Positive assessment recorded by K3

K3 found the remaining Slice 37 implementation conforming: the migration has
30 active titles and 50 active messages; existing events receive neutral
compatibility values without historical event backfill; both verification
methods create immutable copy snapshots; endpoints are authenticated and
actor-scoped; the 20-second Toast and pause hooks are wired; the persistent
stamp/CTA hierarchy, Passport history actions, My Quests semantics, Share
colour, and 320 px grid constraint match the contract.

## Correction pass

- `RewardInboxDelivery.tsx` now explicitly invalidates
  `rewardEventKeys.quest(reward.questId)` with `exact: true` for each delivered
  asynchronous reward.
- `RewardInboxDelivery.test.tsx` now spies on the real `QueryClient` and asserts
  the exact reward-event invalidation alongside member-surface sync and
  acknowledgement.
- Correction gates observed by the implementation owner: lint passed,
  type-check passed, and the focused delivery test passed 1/1.

## Targeted closure check

- **Date:** 2026-08-07
- **Verdict:** **CLOSED — no original Blocker/Major remains**
- K3 inspected only the two bounded correction files and re-ran the focused
  delivery test itself (1/1 passed).
- M1 is closed: the async path now invalidates the exact per-Quest reward-event
  read and the integration test proves the call.
- Per the repository's bounded review workflow, no second full review was
  performed and no new findings were introduced during closure.
