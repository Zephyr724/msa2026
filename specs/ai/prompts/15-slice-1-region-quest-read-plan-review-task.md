# Independent Plan Review Task — Slice 1 Regions and Public Quest Read

- **Reviewer:** Codex
- **Mode:** Read-only local repository review
- **Review type:** Independent implementation-plan review
- **Target plan:** `specs/implementation/01-slice-1-region-quest-read.md`
- **Required verdict:** `APPROVE` or `CHANGES REQUIRED`
- **Files modified by reviewer:** None

## 1. Objective

Independently review the proposed Slice 1 plan against the actual repository,
accepted specifications, current implementation, security rules, database
rules, testing rules, and MSA requirements.

This is a plan review. Do not implement the slice and do not modify files.

## 2. Repository Preconditions

Run:

```bash
pwd
git branch --show-current
git status --short
git log --oneline --decorate -8
git branch -vv
```

Determine whether:

- Slice 0 is merged into `main`;
- the review is occurring on the intended Slice 1 planning branch;
- the working tree contains only expected planning/review changes;
- `PROJECT_STATUS.md` reflects the actual Slice 0 implementation;
- basic GitHub Actions CI exists and is appropriate for verified commands.

A missing prerequisite must be reported. Do not silently assume it will be
fixed later.

## 3. Required Reading

Read:

```text
AGENTS.md
PROJECT_STATUS.md
README.md

.clinerules/00-harness-core.md
.clinerules/01-architecture.md
.clinerules/02-technology-stack.md
.clinerules/03-database.md
.clinerules/04a-security-baseline.md
.clinerules/04b-auth-security.md
.clinerules/04c-dependency-security.md
.clinerules/04d-runtime-security.md
.clinerules/05-testing.md
.clinerules/06-development-workflow.md
.clinerules/07-agent-workflow.md
.clinerules/08-typescript.md
.clinerules/09-msa-assessment.md
.clinerules/11-git-branch-and-merge-safety.md

specs/Kiwimpact_Final_Planning_Baseline_v1.0.md
specs/00-project-profile.md
specs/product/01-product-requirements.md
specs/product/02-community-identity-and-gamification-scope-update.md
specs/architecture/01-domain-model-region.md
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/data/01-community-identity-data-model.md
specs/security/01-community-privacy-rules.md
specs/adr/ADR-0001-use-postgresql.md
specs/adr/ADR-0002-use-identity-cookie-authentication.md
specs/adr/ADR-0003-use-clean-architecture-lite.md
specs/adr/ADR-0004-use-react-vite-tailwind-daisyui.md
specs/adr/ADR-0005-use-tanstack-query-and-zustand.md
specs/adr/ADR-0007-use-postgresql-integration-tests.md
specs/ai/reviews/01-implementation-readiness-audit.md
specs/implementation/00-slice-0-foundation.md
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
specs/ai/reviews/14-slice-0-final-codex-commit-readiness-review-2026-07-22.md

specs/implementation/01-slice-1-region-quest-read.md

backend/
frontend/
docker-compose.yml
```

Inspect the actual current source and package/project files, not only
specification prose.

## 4. Review Dimensions

### 4.1 Progress and sequencing

Verify that the plan correctly reflects actual repository progress.

Pay special attention to:

- GitHub `main` versus the pushed Slice 0 feature branch;
- whether Slice 0 must be merged before Slice 1;
- stale `PROJECT_STATUS.md` claims;
- the accepted requirement to add basic CI immediately after verified scaffold
  commands exist;
- whether those prerequisites belong before Slice 1 rather than being hidden
  inside implementation.

### 4.2 Slice identity and scope

Verify that Regions + Public Quest Read is the correct next vertical slice
after the repository's Slice 0 numbering.

Confirm the plan is limited to:

- Region;
- Quest;
- QuestImage;
- public anonymous read APIs;
- discovery/detail frontend;
- first migration and integration-test infrastructure;
- only the persistence prerequisite strictly needed for the accepted Quest
  owner FK.

Flag scope expansion into authentication flows, profile mutation, CRUD,
participation, completion, gamification, maps, SignalR, Cypress, or deployment.

### 4.3 Identity persistence sequencing gate

This is a mandatory review focus.

The accepted model requires:

```text
Quest.CreatedByUserId -> AspNetUsers.Id
```

Evaluate whether the plan's proposed minimal Identity persistence boundary is:

- architecturally valid;
- genuinely limited to persistence;
- safe for later Authentication/Profile implementation;
- compatible with migrations and development seeding;
- free from fake temporary schema or auth behavior.

Specifically assess:

- location of `ApplicationUser`;
- Identity DbContext inheritance/configuration;
- creator FK mapping;
- passwordless deterministic development curator;
- whether role/auth services are accidentally activated;
- whether the safer course is to reorder Authentication/Profile before Quest
  persistence.

Return `CHANGES REQUIRED` when the proposed boundary creates future migration,
security, ownership, or architectural debt.

Do not permit:

- nullable temporary `CreatedByUserId`;
- missing creator FK;
- fake owner table;
- untracked raw owner GUID without referential integrity.

### 4.4 Domain and persistence correctness

Compare every planned field, enum, relationship, index, check constraint, and
delete behavior against accepted specs.

Review:

- Region null-parent uniqueness;
- enum string storage;
- timestamps;
- Region Restrict delete;
- Quest owner and Region FKs;
- QuestImage Cascade;
- query indexes;
- cover-image rule boundary;
- migration governance;
- absence of migration-embedded application seed data;
- no `EnsureCreated`;
- no SQLite.

### 4.5 Seed governance

Verify:

- Region seed is idempotent and outside migrations;
- source is an official Auckland Council source;
- the plan accurately represents all 21 local boards;
- deterministic IDs and non-destructive update behavior;
- Development-only fictional Quest seed;
- safe assets, alt text, and attribution;
- no copied provider content;
- no secret/demo password;
- accepted baseline coverage is reasonable for pagination and filter testing.

### 4.6 API contract

Verify exact compliance for:

```text
GET /api/v1/regions
GET /api/v1/regions/{id}
GET /api/v1/regions/{id}/children
GET /api/v1/regions/{id}/ancestors
GET /api/v1/quests
GET /api/v1/quests/{id}
GET /api/v1/quests/{id}/images
```

Evaluate the proposed slice-specific decisions:

- Region list DTO;
- Quest list/detail/image DTO allowlists;
- pagination;
- search bounds;
- supported sort fields;
- deterministic default ordering;
- selected Region plus active descendants;
- invalid Region/filter behavior;
- `404` hiding of non-Published Quests;
- omission of owner/private/internal fields;
- source URL and last-checked behavior.

Check that no field such as `Featured` is invented.

### 4.7 Architecture and dependency direction

Verify:

- thin controllers;
- Core application services and repository interfaces;
- Infrastructure EF repositories;
- no controller-to-DbContext access;
- Core remains free of DI/EF/ASP.NET dependencies;
- IntegrationTests references are accepted;
- no repository framework, MediatR, AutoMapper, CQRS, or duplicate frontend
  state/HTTP dependency.

### 4.8 Security and privacy

Verify:

- public DTO allowlists;
- inactive Region filtering;
- Published-only Quest visibility;
- safe Problem Details;
- bounded query parameters;
- parameterized EF queries;
- no private user/community exposure;
- no server-side fetching of external URLs;
- `noopener`/`noreferrer`;
- no raw HTML rendering;
- no full URL logging;
- dependency scanning requirements.

### 4.9 Frontend state and UX

Verify:

- TanStack Query owns server state;
- URL search params own discovery state;
- Zustand is not used for server/filter state;
- responsive image-led cards;
- detail route;
- loading/error/empty/not-found/retry behavior;
- keyboard, semantic, focus, alt-text, and mobile criteria;
- no future-slice actions.

### 4.10 Testing sufficiency

Verify that the plan activates the accepted first data-backed test stack:

- xUnit v3;
- PostgreSQL Testcontainers;
- real migrations;
- WebApplicationFactory;
- repository tests;
- API tests;
- frontend integration tests.

Check coverage for:

- migration;
- idempotent seed;
- Region hierarchy/status;
- Published-only Quest visibility;
- filters;
- descendant Region semantics;
- pagination;
- deterministic sorting;
- invalid query Problem Details;
- `404`;
- DTO allowlist;
- frontend loading/error/empty/filter/detail states;
- runtime and browser evidence.

Reject low-value or inferred evidence.

### 4.11 Completion report and stop conditions

Verify the plan requires:

- exact commands and working directories;
- actual results;
- migration and seed evidence;
- complete acceptance-criteria status;
- deviations/approvals;
- vulnerability scans;
- runtime/browser observations;
- final Git status/diff;
- honest incomplete status when evidence is unavailable.

## 5. Finding Classification

### Blocker

Use for:

- wrong next-slice sequencing that makes implementation unsafe;
- invalid Identity/Quest owner persistence design;
- accepted schema violation;
- architecture inversion;
- secret/privacy exposure;
- implementation on `main`;
- an unimplementable or materially contradictory plan.

### Major

Use for:

- significant scope ambiguity;
- missing endpoint/DTO/filter decision;
- incomplete migration/seed strategy;
- insufficient integration testing;
- security or public-visibility gap;
- missing required CI/project-status prerequisite;
- material completion-evidence weakness.

### Minor

Use for contained plan defects that should be corrected before implementation
but do not invalidate the core approach.

### Optional

Use only for non-required improvements.

For each finding include:

```text
ID
Severity
Affected plan section(s)
Repository/spec evidence
Why it matters
Required resolution
```

## 6. Required Summary

Include:

| Area | PASS/FAIL | Notes |
|---|---|---|
| Repository progress/preconditions | | |
| Correct next-slice scope | | |
| Identity sequencing gate | | |
| Domain model | | |
| Persistence/migration | | |
| Seed governance | | |
| API contract | | |
| Architecture/layering | | |
| Security/privacy | | |
| Frontend/state ownership | | |
| Testing | | |
| Completion evidence | | |

Then report:

```text
Blocker:
Major:
Minor:
Optional:
```

## 7. Verdict

Return `APPROVE` only when:

- zero Blockers;
- zero Majors;
- repository prerequisites are satisfied or are explicitly required before
  implementation with no ambiguity;
- the Identity sequencing decision is safe and explicit;
- the plan is implementable without inventing product or architecture
  decisions;
- scope, security, persistence, API, frontend, tests, and completion evidence
  are sufficient.

Otherwise return `CHANGES REQUIRED`.

End with exactly:

```text
APPROVE
```

or:

```text
CHANGES REQUIRED
```
