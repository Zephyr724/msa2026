# Prompt 82 — P0-2 Private Query Cache Isolation

- **Date:** 2026-08-03
- **Implementation owner:** Codex
- **Task type:** Important frontend authentication-boundary correction
- **Human authorization:** Production implementation and tests requested
- **Excluded authority:** No staging, commit, push, merge, pull request, or deployment

## Actual implementation instruction

> Fix this section, P0-2: repair cross-account private Query Cache isolation.
> This is the most important code risk newly discovered in this round.
> Login/logout currently clears only a few cache prefixes; `privateCache.ts`
> misses:
>
> - Community profile/streak
> - Admin Evidence claims and private review content
> - Per-Quest personal participation/completion
> - Organizer management data and completion-code state
> - Leaderboards carrying user semantics such as isCurrentUser and Home
>   Community
>
> When a 401 is received mid-session, some APIs also fail to perform the
> unified session-expiry cleanup. On a shared browser, after logging out of
> account A and logging into account B, A's private data may be displayed
> briefly.
>
> Acceptance criteria: on login, logout, account switch, or a 401 from any
> private endpoint, all principal-specific query/mutation data must first be
> cancelled and cleared; add A→logout→B and admin→normal-user regression
> tests.

## Implementation constraints applied

- Preserve the existing HttpOnly-cookie authentication and authorization model.
- Make no backend, schema, dependency, architecture, or product-scope change.
- Use the active `QueryClient` supplied by the mounted provider.
- Preserve the accepted ordering: cancel and clear old-principal state before
  publishing a null or replacement session.
- Run the applicable frontend gates and record only observed results.
- Create implementation evidence before requesting the required independent
  read-only review.
