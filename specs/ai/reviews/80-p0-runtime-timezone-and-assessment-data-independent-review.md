# P0 Runtime Timezone and Assessment Data — Independent Review

## Review metadata

- Date: 2026-08-04
- Reviewer: independent Codex agent `/root/runtime_assessment_review`
- Implementation owner: primary Codex session
- Branch: `codex/fix-runtime-assessment-data`
- Baseline: `main` at `c9bdcf05140d73bc26c0ac3d1ca7370a3a93440e`
- Scope: all tracked and untracked changes for the runtime timezone and
  assessment-data slice
- Review mode: read-only; the reviewer did not modify, create, delete, format,
  stage, or commit files
- Initial result: 0 Blocker, 2 Major, 1 Minor, 0 Nit

## Accepted implementation observations

- `tzdata` is installed in the final Alpine runtime layer.
- `Seed:AssessmentData` is default-off and Production does not automatically
  migrate the database.
- Region and assessment data execute inside one explicit transaction.
- Five clearly fictional, published, undated Quests use accepted domain
  construction, deterministic IDs, Auckland coordinates, and existing local
  project-owned SVG covers.
- Development demo seeds and demo accounts remain unavailable in Production.
- The slice changes no schema, authentication model, role policy, major
  dependency, MSA technology, or Google Maps ADR boundary.

## Original findings

### Blocker: 0

### Major 1 — Reserved identity collision was not fully fail-closed

The initial implementation queried only the deterministic curator GUID. A row
with another GUID but the same reserved normalized username or normalized email
could therefore coexist or cause a later database failure. Normalized email is
not uniquely indexed, so the email case could create duplicate Identity email
lookups and did not satisfy the implementation prompt's collision contract.

**Correction:** the seed now queries the fixed ID, reserved normalized username,
and reserved normalized email together. Any matching row with another ID throws
before curator insertion. A Production PostgreSQL integration test pre-creates
another user with the reserved normalized email, observes startup failure, and
confirms the outer transaction leaves zero Regions, zero Quests, no curator,
and preserves only the pre-existing conflicting user.

**Closure status:** **Closed.** The reviewer confirmed the reserved-identity
query and rollback test satisfy the original finding.

### Major 2 — Timezone evidence did not execute the final image's managed path

The initial BusyBox `date` probe proved the system timezone file existed, but it
did not directly run .NET
`TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland")` in the corrected final
image. That managed path was the core of the observed Production 500 failure.

**Correction:** the corrected final image was rebuilt, its migration bundle was
applied to an isolated PostgreSQL container, and the application started with
the assessment bootstrap. `/health/ready` returned Ready. An anonymous request
to `/api/v1/leaderboards/people?scope=auckland&period=weekly` returned HTTP 200
with valid empty-leaderboard JSON. This endpoint executes
`LeaderboardService.PeriodStartUtc` and the .NET Auckland `TimeZoneInfo` path.
The temporary app, database, and network were then removed.

**Closure status:** **Closed.** The reviewer confirmed the final-image
leaderboard request directly proves the managed Auckland timezone path.

### Minor 1 — “Locked identity” overstated the observed Identity state

`LockoutEnabled=true` permits lockout but does not mean an account with
`LockoutEnd=null` is currently locked. The identity remains unable to use normal
sign-in because it has no password or external login and its email is
unconfirmed.

**Correction:** code and documentation now call it a “credentialless disabled
ownership identity” and no longer claim an active lockout.

## Targeted closure status

- Targeted closure reviewer: same independent Codex reviewer, limited to the
  two original Major findings
- Original Major 1: **Closed**
- Original Major 2: **Closed**
- New Blocker findings in closure scope: **0**
- New Major findings in closure scope: **0**
- Commit readiness: **Yes**
