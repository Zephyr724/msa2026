# ADR-0005: Use TanStack Query and Zustand with Explicit State Ownership

- Status: Accepted
- Date: 2026-07-19
- Decider: Product owner
- Decision source: `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- Supersedes: None

> The state-management direction is already accepted in the planning baseline.

## Context

Kiwimpact contains several state categories:

- authoritative server data such as quests, participation, completion, XP,
  achievements, users, and leaderboard results;
- local component state;
- small cross-component UI state such as theme and reward overlays;
- shareable/navigation state such as filters, sorting, pagination, and
  list/map view.

Without explicit ownership, data could be copied between React state, Zustand,
and query caches, causing stale values and synchronization bugs.

## Decision

Kiwimpact will use:

- shared `apiFetch` for HTTP transport and consistent request handling;
- TanStack Query for authoritative server state and request lifecycle;
- Zustand for small cross-component UI state;
- React state for local component state;
- URL search parameters for filters, sorting, pagination, and view state.

Initial Zustand stores are:

- `useUiStore`;
- `useRewardStore`.

Authoritative Quest, user, XP, achievement, completion, participation, claim,
and leaderboard data must not be duplicated in Zustand.

## Responsibilities

### TanStack Query

Use for fetching/caching server resources, loading/error/refetch state,
mutations, invalidation, targeted cache updates, and freshness.

### Zustand

Use only when state must be shared across unrelated components, is UI-oriented
rather than authoritative server data, and is not better represented in the
URL.

### URL state

Use for category and other filters, sorting, pagination, list/map view, and
other discovery state that should survive refresh or be shareable.

### React state

Use for transient local state that does not need global ownership.

## Consequences

### Benefits

- Server state remains close to its source of truth.
- Discovery URLs remain refreshable and shareable.
- Zustand stays small and understandable.
- Components avoid manual loading and synchronization logic.
- Reward/UI state remains independent from persisted domain data.

### Costs and trade-offs

- Developers must choose the correct owner.
- Query-key and invalidation discipline are required.
- Some workflows combine URL, query, and local state.
- Incorrect optimistic updates can still create temporary inconsistency.

## Alternatives considered

A single Zustand/Redux store was rejected because it would duplicate server
state. React Context for everything was rejected because it does not replace a
server-state cache. TanStack Query without Zustand was not selected because the
accepted UX includes small cross-component UI/reward state.

## Verification

This decision is implemented only when `apiFetch` provides the verified HTTP
boundary, server resources use TanStack Query, discovery state is reflected in
the URL, Zustand contains only approved UI/reward state, cache invalidation is
tested, and `PROJECT_STATUS.md` records the structure.

## Review triggers

Review this ADR if a new state category does not fit an owner, offline-first
behavior becomes accepted, real-time requirements expose a limitation, or store
growth shows that boundaries are not being followed.
