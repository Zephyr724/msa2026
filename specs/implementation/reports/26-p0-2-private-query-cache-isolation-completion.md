# P0-2 — Private Query Cache Isolation Completion Report

## Status

Production implementation and local verification are complete on
`fix/private-query-cache-isolation`. The required independent read-only review
has not yet been performed. Under `AGENTS.md`, this important authentication-
boundary correction is not ready to commit until that review exists and any
original Blocker/Major findings are closed.

## Implemented scope

- Replaced the incomplete private-query prefix allowlist with a fail-safe
  principal-boundary cleanup. The lifecycle aborts registered private requests,
  awaits cancellation of cached queries, removes every non-session query,
  clears all Mutation Cache entries, and only then clears or replaces the auth
  session.
- Intentionally clears public Query Cache entries at principal boundaries too.
  Several public endpoints already return viewer annotations, and this avoids
  future cross-account leaks when current-user semantics are added without a
  cache-key registration update.
- Added a shared authenticated request/query wrapper. A private API 401 awaits
  the same cleanup before the original error propagates; the triggering query's
  data is erased while its 401 remains available to existing redirect/error UI.
- Added principal-lifetime abort signals to private community, evidence and
  completion, participation, organizer, completion-code, leaderboard, social,
  progression, Passport, achievement, Google-link, and password-change calls.
- Connected an in-session `/auth/me` 401 to the same lifecycle. Initial
  anonymous session discovery continues to return `null` without unnecessary
  cleanup.
- Preserved anonymous catalog, nationwide-statistics, region, quest-discovery,
  and community-challenge reads outside private-401 handling. Leaderboards and
  social reads use private handling because their payloads contain viewer or
  current-user semantics.
- Expanded regression coverage for concurrent private 401s, A → logout → B,
  deferred A responses, Admin → Member account replacement, `/auth/me` 401,
  all previously omitted query families, and Mutation Cache data.

## Files changed

### Production

- `frontend/src/hooks/useAuth.ts`
- `frontend/src/hooks/useCommunity.ts`
- `frontend/src/hooks/useCompletion.ts`
- `frontend/src/hooks/useLeaderboard.ts`
- `frontend/src/hooks/useOrganizerQuests.ts`
- `frontend/src/hooks/useParticipation.ts`
- `frontend/src/hooks/usePassportCompletions.ts`
- `frontend/src/hooks/useSocialFeed.ts`
- `frontend/src/lib/api/achievements.ts`
- `frontend/src/lib/api/auth.ts`
- `frontend/src/lib/api/community.ts`
- `frontend/src/lib/api/completion.ts`
- `frontend/src/lib/api/organizerQuests.ts`
- `frontend/src/lib/api/participation.ts`
- `frontend/src/lib/api/passport.ts`
- `frontend/src/lib/api/privateCache.ts`
- `frontend/src/lib/api/progression.ts`
- `frontend/src/lib/api/social.ts`
- `frontend/src/pages/AccountLifecyclePages.tsx`
- `frontend/src/pages/ProfileSettingsPage.tsx`

### Tests

- `frontend/tests/integration/AuthSessionBoundary.test.tsx`
- `frontend/tests/integration/QuestCompletionPanel.test.tsx`
- `frontend/tests/unit/useAchievements.test.tsx`
- `frontend/tests/unit/useCompletion.test.tsx`

### Evidence

- `specs/ai/prompts/82-p0-2-private-query-cache-isolation.md`
- `specs/implementation/reports/26-p0-2-private-query-cache-isolation-completion.md`

## Verification commands and observed results

| Command | Observed result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed: 49 files, 389 tests |
| `npm run build` | Passed; Vite retained the existing main-chunk size advisory |
| `git diff --check` | Passed with no output |

Focused checks were also run during implementation for the session boundary,
auth flow, organizer 401 behavior, leaderboard cancellation, completion,
participation, and achievement paths. The final complete-gate results above are
the authoritative verification record.

## Known limitations and intentional tradeoffs

- A query that itself receives the session-expiring 401 may retain a cache
  shell containing only its error state so existing page-level 401 handling can
  run. Its old data is set to `undefined` before auth becomes anonymous; all
  other non-session queries are removed. The shell is removed by normal query
  lifecycle/garbage collection or the next principal boundary.
- Public cached reads are discarded at every principal boundary and may refetch.
  This is deliberate security hardening, not a data-correctness limitation.
- Vite continues to report the pre-existing JavaScript chunk-size advisory.
- No browser end-to-end run was performed; the applicable automated frontend
  integration suite passed in full.

## Review status

- Independent read-only review: **Pending**
- Blocker findings: not yet assessed
- Major findings: not yet assessed
- Commit readiness: **No** until the independent review record exists and any
  original Blocker/Major findings are closed
