# Slice 1 Plan Rereview Task — Codex

- **Reviewer:** Codex
- **Mode:** Read-only local repository review
- **Target:** `specs/implementation/01-slice-1-region-quest-read.md`
- **Previous review:** `specs/ai/reviews/15-slice-1-region-quest-read-plan-review-2026-07-22.md`
- **Required verdict:** `APPROVE` or `CHANGES REQUIRED`

## Objective

Verify that findings B1, M1–M4, and m1–m3 from the first Slice 1 plan review
are fully resolved without introducing scope or architecture regressions.

Do not modify files or implement Slice 1.

## Required checks

Run:

```bash
pwd
git branch --show-current
git status --short
git diff --check
git diff --stat
git diff -- specs/implementation/01-slice-1-region-quest-read.md
find specs/ai/prompts specs/ai/reviews -maxdepth 1 -type f | sort
```

Read the revised plan, previous review, accepted architecture/data/security
rules, current `KiwimpactDbContext`, `apiFetch.ts`, and dependency manifests.

## B1 — Quest concurrency

Verify that the plan:

- defines a `uint` Quest concurrency property;
- maps it through the Npgsql-supported PostgreSQL `xmin` row-version behavior;
- does not create an ordinary application `Version` column;
- requires model/migration verification;
- requires a two-context stale-update integration test that expects
  `DbUpdateConcurrencyException`;
- includes concurrency acceptance criteria.

Reject any provider-incompatible or untested concurrency design.

## M1 — Identity persistence-only boundary

Verify that the plan explicitly defines:

- `ApplicationUser : IdentityUser<Guid>`;
- `ApplicationRole : IdentityRole<Guid>`;
- `KiwimpactDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>`;
- `base.OnModelCreating`;
- required Quest-to-Identity FK mapping with Restrict;
- direct Development-only curator seeding;
- reserved `.invalid` identifier and deterministic ID;
- null password hash and no roles/claims/logins/tokens;
- no AddIdentity/AddIdentityCore/AddAuthentication/cookies/auth middleware;
- tests proving runtime Identity/auth behavior is not activated.

Assess whether Infrastructure ownership and Core isolation remain valid.

## M2 — Prerequisite transition

Verify the plan now gives an unambiguous human workflow for:

1. approving and committing plan evidence on the existing Slice 1 branch;
2. correcting `PROJECT_STATUS.md` and adding CI on a separate prerequisite
   branch;
3. merging that prerequisite PR into `main`;
4. merging updated `main` into the existing Slice 1 branch without rebase,
   deletion, recreation, or force update;
5. verifying Docker separately before implementation.

The current unmet prerequisites may remain stop conditions, but the transition
must be safe and executable.

## M3 — Prompt/review provenance

Verify:

```text
specs/ai/prompts/15-slice-1-region-quest-read-plan-review-task.md
```

contains the task and no task duplicate remains in `specs/ai/reviews/`.

Verify the genuine previous Codex result is saved as:

```text
specs/ai/reviews/15-slice-1-region-quest-read-plan-review-2026-07-22.md
```

## M4 — Frontend untrusted responses

Verify the plan requires:

- `apiFetch<unknown>`;
- explicit narrowing/parsing before TanStack Query/components receive DTOs;
- no unchecked casts;
- malformed Region, Quest page, Quest detail, and image response tests;
- no new validation dependency without approval.

## Minor findings

Verify:

- `.clinerules/04b-auth-security.md` is required reading;
- intended new packages are enumerated;
- package version compatibility, maintenance, licence, vulnerability, and human
  approval evidence are required;
- completion-report filename uses the actual completion date.

## Regression review

Confirm the revised plan still:

- limits the slice to Regions, Quest, QuestImage, public read APIs, discovery,
  detail, first migration, seed, and integration tests;
- preserves accepted API visibility/privacy;
- keeps controllers thin and EF access in Infrastructure;
- does not add auth flows, CRUD, participation, completion, gamification,
  maps, SignalR, deployment, MediatR, AutoMapper, or new frontend state tools.

## Findings format

For every finding include:

```text
ID
Severity: Blocker / Major / Minor / Optional
Affected sections
Evidence
Why it matters
Required resolution
```

Then report:

```text
Blocker:
Major:
Minor:
Optional:
```

Return `APPROVE` only with zero Blockers and zero Majors and when all prior
findings are resolved.

End exactly with:

```text
APPROVE
```

or:

```text
CHANGES REQUIRED
```
