 Slice 1 — Regions and Public Quest Read Plan Review

- **Reviewer:** Codex
- **Date:** 2026-07-22
- **Mode:** Independent read-only local repository review
- **Target:** `specs/implementation/01-slice-1-region-quest-read.md`
- **Files modified by reviewer:** None

## Findings

### B1 — Accepted Quest concurrency strategy is omitted

- **Severity:** Blocker
- **Affected sections:** Domain Model, EF Core Configuration, Migration Strategy, Testing, Acceptance Criteria
- **Evidence:** The accepted model requires an EF Core concurrency token on `Quest`. The plan’s Quest mapping contains no concurrency configuration or verification.
- **Why it matters:** The first Quest migration would establish an incomplete accepted schema and defer a persistence decision into the CRUD slice.
- **Required resolution:** Specify the PostgreSQL-compatible concurrency-token approach, its EF mapping and migration impact, and an integration test proving stale updates are detected.

### M1 — Minimal Identity persistence boundary is not sufficiently explicit

- **Severity:** Major
- **Affected sections:** Identity Persistence Sequencing Gate, Migration Strategy, Seed Strategy
- **Evidence:** The plan identifies an Infrastructure-owned `ApplicationUser`, Identity tables, “Identity store registration,” and a passwordless curator, but does not define:
  - the `IdentityUser<Guid>` and Identity role/key types;
  - `KiwimpactDbContext` inheritance and Identity model configuration;
  - whether Identity services are registered even though migrations do not require them;
  - the exact Quest creator-FK mapping;
  - safe curator identity fields and safeguards against later login or account collision;
  - tests proving no password, authentication middleware, endpoints, cookie handlers, or role behavior were activated.
- **Why it matters:** “Identity store registration needed for migrations” could lead to unnecessary `AddIdentityCore`/Identity service activation, while an underspecified curator could create later authentication or ownership debt.
- **Required resolution:** Define the exact persistence-only design. Keeping the framework-specific `ApplicationUser` in Infrastructure is reasonable, but the plan must explicitly define context inheritance, key types, FK mapping, direct Development-only seeding, and prohibit Identity/auth service registration until the Authentication slice unless technically demonstrated and separately approved.

### M2 — Repository prerequisites are unmet and the transition procedure is ambiguous

- **Severity:** Major
- **Affected sections:** Preconditions, Implementation Stop Conditions
- **Evidence:** Slice 0 is merged and the branch starts at current `main`, but:
  - `PROJECT_STATUS.md` still claims both scaffolds and verified commands are absent.
  - No GitHub Actions workflow exists.
  - `docker` is not installed or available.
  - The Slice 1 branch already exists, so the plan’s `git switch -c feat/slice-1-region-quest-read` command cannot be used as written.
  - The working tree is not clean because the plan and task artifact are untracked.
- **Why it matters:** The plan correctly says implementation must stop, but it does not define how CI/status corrections are merged into `main` and how this existing planning branch is then safely brought onto that updated commit without unauthorized branch switching, rebasing, or deletion.
- **Required resolution:** Define a separate prerequisite workflow and the exact human-approved method for carrying the approved plan onto a Slice 1 branch based on the corrected, CI-enabled `main`.

### M3 — Review-task prompt provenance and placement are incorrect

- **Severity:** Major
- **Affected sections:** Repository preconditions/evidence
- **Evidence:** The requested file `specs/ai/prompts/15-slice-1-region-quest-read-plan-review-task.md` does not exist. The task prompt is instead untracked under `specs/ai/reviews/15-slice-1-region-quest-read-plan-review-task.md`. Substantial prompts belong under `specs/ai/prompts/`.
- **Why it matters:** It repeats the prompt/review provenance problem corrected during Slice 0 and leaves no correctly named location for the genuine dated review.
- **Required resolution:** Preserve the exact task under `specs/ai/prompts/15-slice-1-region-quest-read-plan-review-task.md`; reserve `specs/ai/reviews/` for the genuine dated review output.

### M4 — Frontend API responses remain unchecked untrusted input

- **Severity:** Major
- **Affected sections:** Frontend API Modules and Types, Frontend Tests
- **Evidence:** The plan requires using the existing `apiFetch`, which currently casts response JSON directly to `T`. Project TypeScript rules require untrusted input to begin as `unknown` and be narrowed before use.
- **Why it matters:** Malformed API responses could reach components as trusted Quest/Region objects and cause unsafe or inconsistent rendering.
- **Required resolution:** Require the Region and Quest modules to retrieve `unknown`, validate/narrow the DTOs at the API boundary, and test malformed responses. Any new validation dependency requires explicit approval.

### m1 — Authentication rules are missing from required reading

- **Severity:** Minor
- **Affected section:** Required Reading
- **Required resolution:** Add `.clinerules/04b-auth-security.md` to mandatory reading and require explicit verification that this slice does not activate authentication behavior.

### m2 — Dependency-governance evidence is incomplete

- **Severity:** Minor
- **Affected sections:** Identity, Integration Tests, Verification, Completion Report
- **Evidence:** The plan implies new Identity EF, Testcontainers, `Microsoft.AspNetCore.Mvc.Testing`, and `dotnet-ef` dependencies but requires only vulnerability scans. Dependency rules also require approval, maintenance review, and license review.
- **Required resolution:** Enumerate the intended packages and require version compatibility, maintenance, license, and vulnerability evidence.

### m3 — Completion-report date is hard-coded

- **Severity:** Minor
- **Affected section:** Completion Report
- **Evidence:** The output filename is fixed to `2026-07-22`.
- **Required resolution:** Require the actual completion date in the filename and report.

## Required summary

| Area | PASS/FAIL | Notes |
|---|---|---|
| Repository progress/preconditions | FAIL | Slice 0 merged and branch correct; status, CI, Docker, clean-tree, and transition procedure are unresolved |
| Correct next-slice scope | PASS | Scope is otherwise tightly limited to Region, Quest, QuestImage, anonymous reads, frontend discovery/detail, and first data-backed tests |
| Identity sequencing gate | FAIL | Potentially viable, but DbContext, service-registration, curator, and test boundaries are underspecified |
| Domain model | FAIL | Accepted Quest concurrency token omitted |
| Persistence/migration | FAIL | Identity and concurrency mapping incomplete |
| Seed governance | FAIL | Official source is valid, but curator persistence safeguards are incomplete |
| API contract | PASS | Endpoints, DTO allowlists, filters, pagination, visibility, and deterministic ordering are well specified |
| Architecture/layering | FAIL | General layering is correct; Identity boundary remains ambiguous |
| Security/privacy | FAIL | Public allowlists are strong, but Identity activation and unchecked frontend responses remain unresolved |
| Frontend/state ownership | FAIL | TanStack Query and URL ownership are correct; response validation is missing |
| Testing | FAIL | Broad coverage is planned, but concurrency and Identity-boundary tests are absent |
| Completion evidence | FAIL | Generally strong, but dependency evidence and actual-date handling need correction |

Blocker: 1  
Major: 4  
Minor: 3  
Optional: 0

CHANGES REQUIRED