# Slice 0 Foundation — Focused Correction Task, Round 2

- **Target agent:** DeepSeek V4 Pro through Cline
- **Mode:** Act
- **Task type:** Focused dependency, documentation, and evidence correction
- **Branch:** `feat/slice-0-foundation`
- **Review basis:** Codex independent re-review
- **Current verdict:** `CHANGES REQUIRED`
- **Commit status:** Do not commit

## 1. Objective

Resolve Codex findings D1–D5 with the smallest safe change set, rerun the
required verification, and update the durable Slice 0 completion report using
actual observed evidence.

Do not redesign Slice 0. Do not add business features. Do not broaden scope.

## 2. Required Inputs

Read before editing:

```text
AGENTS.md
specs/implementation/00-slice-0-foundation.md
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
specs/ai/reviews/08-slice-0-foundation-implementation-review-2026-07-22.md
specs/ai/reviews/10-slice-0-foundation-codex-rereview-2026-07-22.md
specs/ai/prompts/08-slice-0-foundation-implementation-review-task.md
specs/00-project-profile.md
.clinerules/02-technology-stack.md
.clinerules/04c-dependency-security.md
README.md
backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj
backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj
frontend/src/lib/api/apiFetch.ts
frontend/.env.example
```

## 3. Preconditions

Run:

```bash
git branch --show-current
git status --short
node --version
dotnet --version
```

Required:

```text
Branch: feat/slice-0-foundation
Node: 24.x
.NET SDK: 10.x or later
```

Stop without editing if the branch is `main` or the working tree does not
contain the expected uncommitted Slice 0 implementation.

## 4. Findings to Resolve

### D1 — High-severity Microsoft.OpenApi vulnerability

First inspect the actual dependency chain:

```bash
dotnet list backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj package --include-transitive
dotnet list backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj package --vulnerable --include-transitive
```

The current resolved `Microsoft.OpenApi` version `2.0.0` is vulnerable.

Preferred resolution:

- keep the compatible 2.x major line;
- add or update an explicit production package reference so the resolved
  `Microsoft.OpenApi` version is `2.7.5` or a later compatible patched 2.x
  release;
- do not move to 3.x unless the existing ASP.NET Core/Scalar package chain
  requires it and compatibility is proven;
- do not create a policy exception when a compatible patched version works.

After the change, prove the resolved dependency graph and rerun:

```bash
dotnet restore
dotnet build
dotnet test
dotnet list backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj package --include-transitive
dotnet list backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj package --vulnerable --include-transitive
```

Acceptance:

- `Microsoft.OpenApi 2.0.0` is no longer resolved;
- the advisory is absent from the final vulnerable-package scan;
- no high or critical production vulnerability remains;
- OpenAPI and Scalar runtime routes still work.

Do not suppress `NU1903` or vulnerability scanning.

### D2 — xUnit v2 instead of approved xUnit v3

Inspect the test project and migrate the test framework package from:

```text
xunit 2.9.3
```

to the approved stable xUnit v3 framework package:

```text
xunit.v3
```

Use a stable xUnit v3 version compatible with .NET 10. Do not use a prerelease
package. Retain only the runner/test SDK references needed for a valid
`dotnet test` workflow.

Verify:

```bash
dotnet restore
dotnet build
dotnet test
dotnet list backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj package
```

Acceptance:

- the project directly references `xunit.v3`, not `xunit`;
- the existing architecture tests compile and pass;
- the final package list proves the v3 framework is resolved.

### D3 — Missing VITE_API_BASE_URL documentation

Update both:

```text
README.md
frontend/.env.example
```

Document:

```text
VITE_API_BASE_URL
```

and its safe default/fallback:

```text
/api
```

Keep it distinct from:

```text
VITE_DEV_PROXY_TARGET
```

Explain briefly:

- `VITE_API_BASE_URL` controls the browser API base used by `apiFetch`;
- `VITE_DEV_PROXY_TARGET` controls where the Vite development proxy forwards
  matching requests.

Do not add secrets or machine-specific values.

### D4 — Empty/misfiled Claude review artifact

The exact genuine Claude review is currently appended to:

```text
specs/ai/prompts/08-slice-0-foundation-implementation-review-task.md
```

and the intended review artifact is empty:

```text
specs/ai/reviews/08-slice-0-foundation-implementation-review-2026-07-22.md
```

Correct this without rewriting historical content:

1. Locate the appended review beginning with the exact heading:

```text
# Independent Review — Slice 0 Foundation Implementation
```

2. Copy that entire genuine review, byte-for-byte where practical, into the
   review artifact.
3. Remove the appended review from the prompt file so the prompt contains only
   the original review task.
4. Do not summarize, improve, fabricate, or change the historical verdict.
5. Confirm the review artifact is non-empty and still ends with:

```text
CHANGES REQUIRED
```

### D5 — Incomplete completion report

Update:

```text
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
```

using newly observed final evidence.

It must include:

1. the actual final `git status --short`, including the completion-report
   directory/file while it remains untracked;
2. the final project-reference graph, obtained from actual commands, not
   `"Not applicable"`;
3. every acceptance criterion from
   `specs/implementation/00-slice-0-foundation.md`, each marked `PASS`, `FAIL`,
   or `NOT VERIFIED`;
4. evidence for D1 and D2 package corrections;
5. final build, test, vulnerability-scan, and runtime results;
6. no claims based only on inference.

Obtain the project-reference graph with the repository-supported equivalent
of:

```bash
dotnet list backend/src/Kiwimpact.Core/Kiwimpact.Core.csproj reference
dotnet list backend/src/Kiwimpact.Infrastructure/Kiwimpact.Infrastructure.csproj reference
dotnet list backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj reference
dotnet list backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj reference
```

## 5. Hard Scope

Expected changed files are limited to:

```text
backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj
backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj
README.md
frontend/.env.example
specs/ai/prompts/08-slice-0-foundation-implementation-review-task.md
specs/ai/reviews/08-slice-0-foundation-implementation-review-2026-07-22.md
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
```

Lock/restore metadata may change only when required by the package corrections.

Make any additional source change only when a verification failure proves it is
necessary. Explain it in the completion report.

Do not:

- modify accepted product or architecture decisions;
- implement business features;
- add entities, migrations, seed data, or integration-test projects;
- suppress vulnerability warnings;
- create a dependency-security exception unless the compatible patched package
  route genuinely fails;
- commit, stage, push, merge, rebase, reset, clean, or switch branches.

## 6. Full Verification

### Repository

```bash
git status --short
git diff --check
git diff --stat
git diff
git diff --cached --check
git diff --cached --stat
```

Inspect every untracked file.

### Backend

Run the repository-supported equivalents of:

```bash
dotnet restore
dotnet build
dotnet test
dotnet list backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj package --include-transitive
dotnet list backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj package --vulnerable --include-transitive
dotnet list backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj package
```

Record exact commands, working directories, results, warnings, test totals, and
resolved package versions.

### Backend runtime

Start the API with the documented command and verify actual responses:

```text
http://localhost:5000/health
http://localhost:5000/openapi/v1.json
http://localhost:5000/scalar
```

Record HTTP status and a short observed response summary. Stop the API cleanly.

### Frontend

Run:

```bash
npm run lint
npm run type-check
npm run test -- --run
npm run build
npm audit --audit-level=high
```

Use the exact repository-supported non-watch test command.

### Frontend runtime

Verify the root route, not-found route, styling, proxied backend route, and
frontend rendering with the backend stopped. Record observed evidence.

## 7. Final Completion Report Requirements

The report must faithfully show:

- environment versions;
- files changed;
- package versions before and after;
- final project-reference graph;
- every Slice 0 acceptance criterion;
- all quality-gate results;
- all runtime results;
- final vulnerability-scan results;
- final Git state;
- remaining risks, if any.

End it with exactly one:

```text
SLICE 0 FOUNDATION COMPLETE — READY FOR INDEPENDENT RE-REVIEW
```

or:

```text
SLICE 0 FOUNDATION INCOMPLETE — HUMAN ACTION REQUIRED
```

Use the second result when any required command fails or any high/critical
production vulnerability remains.

## 8. Final Chat Response

Report:

1. files changed;
2. D1–D5 resolution;
3. exact resolved `Microsoft.OpenApi` and xUnit framework versions;
4. build/test/audit results;
5. runtime URLs and statuses;
6. completion-report path;
7. final Git status and diff stat.

Do not commit.

End with exactly the same final result used in the completion report.
