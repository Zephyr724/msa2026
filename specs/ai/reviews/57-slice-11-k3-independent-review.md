# Review 57 — Slice 11 K3 Independent Implementation Review

- **Date:** 2026-07-27
- **Reviewer:** Kimi K3
- **Review type:** Independent, read-only implementation review
- **Implementation owner:** Codex
- **Branch:** `codex/feat/slice-11-community-discovery`
- **Baseline:** `94a129c`
- **Kimi session:** `session_eba6362b-758e-4a97-a662-7680e257410a`

## Initial verdict

**CHANGES REQUIRED**

The reviewer inspected the Slice 11 contract, Prompt 61, completion report,
`PROJECT_STATUS.md`, relevant ADRs, the complete working-tree change set,
migration, production implementation, and tests. The user-owned
`.playwright-mcp/`, `docs/UI/`, and `figma-make-1.jpeg` paths were explicitly
excluded.

## Original findings

### Major M1 — Sub-threshold My Community response exposed exact metrics

When fewer than 10 ranked members existed, the implementation hid the people
rows but still returned the exact `TotalCount` and exact collective XP and
completion totals. K3 found this inconsistent with the accepted privacy
threshold and susceptible to inference against public broader-scope boards.

Original locations:

- `backend/src/Kiwimpact.Core/Services/LeaderboardService.cs`
- `backend/src/Kiwimpact.Api/Contracts/LeaderboardContracts.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/LeaderboardServiceTests.cs`
- `specs/implementation/reports/11-community-discovery-completion.md`

### Minors

1. Share Card could select a Pending/Self-reported latest history item while
   displaying the “VERIFIED IMPACT” banner.
2. Streak API loads the user's XP timestamps into memory.
3. Home Community cooldown has a same-user concurrent PATCH race because the
   profile has no concurrency token.
4. Challenge list uses unbounded N+1 progress aggregation.
5. Milestone dedup deliberately ignores challenge-sourced awards, permitting
   the same catalog achievement through both sources if an Admin reuses an ID.
6. Direct multi-instance finalizer, SignalR emission, and some endpoint test
   coverage remain limited.

## Verified-correct observations

K3 confirmed through static read-only inspection:

- state-changing APIs remain covered by global antiforgery and role checks;
- Quest coordinates have domain and database pair/range enforcement;
- the migration is additive and preserves existing milestone uniqueness;
- Auckland time boundaries and `[start, end)` challenge windows are consistent;
- XP rows remain verified-impact-only and authoritative;
- one-active-challenge uniqueness and reward idempotency have database
  backstops;
- the SignalR client only invalidates REST-owned queries;
- Share Card rendering is local and excludes the prohibited sensitive fields;
- Google Maps has list and numeric-input fallbacks and no key is committed;
- UI scope/period choices match the accepted matrix.

## Bounded correction pass

The implementation owner applied the following corrections:

- **M1:** privacy-protected My Community responses now return empty rows,
  `TotalCount = 0`, and `CollectiveProgress = null`; the frontend validator
  rejects protected payloads containing exact counts or collective progress,
  and the UI renders only a generic protected state.
- **Minor 1:** Passport now selects only a `Verified` completion for the Share
  Card.
- The completion report was corrected to state the exact protected contract.

Other Minors remain recorded as non-blocking residual risks. Per the bounded
review workflow, the same Kimi session receives one targeted closure check
limited to original Major M1.

## Closure status

**M1 CLOSED — final verdict APPROVED.**

The same Kimi session performed the permitted targeted closure check and
confirmed:

- protected My Community results no longer emit exact count, rows, XP, or
  completion aggregates;
- the backend service test asserts the protected sentinel contract;
- the frontend validator fails closed on any protected payload carrying exact
  data;
- the protected UI contains no numeric metrics;
- the completion evidence now matches the corrected behavior.

Residual M1-only note: `CollectiveProgress` remains as an always-null
compatibility field and protected `TotalCount = 0` is a sentinel. Neither
exposes private data. No Blocker or Major finding remains.
