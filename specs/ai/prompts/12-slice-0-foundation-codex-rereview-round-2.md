# Independent Re-Review Task — Slice 0 Foundation, Round 2

- **Reviewer:** Codex
- **Mode:** Read-only local repository review
- **Branch:** `feat/slice-0-foundation`
- **Review type:** Security-sensitive focused re-review
- **Required verdict:** `APPROVE` or `CHANGES REQUIRED`
- **Files modified by reviewer:** None

## 1. Objective

Independently verify that Codex findings D1–D5 from the prior review are fully
resolved and that the uncommitted Slice 0 implementation is safe to commit.

Do not modify, fix, stage, commit, reset, clean, merge, or switch branches.

## 2. Required Reading

```text
AGENTS.md
specs/implementation/00-slice-0-foundation.md
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
specs/ai/reviews/08-slice-0-foundation-implementation-review-2026-07-22.md
specs/ai/reviews/10-slice-0-foundation-codex-rereview-2026-07-22.md
specs/00-project-profile.md
.clinerules/02-technology-stack.md
.clinerules/04c-dependency-security.md
README.md
backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj
backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj
frontend/src/lib/api/apiFetch.ts
frontend/.env.example
```

Inspect all changed and untracked files.

## 3. Git Inspection

Run:

```bash
pwd
git branch --show-current
git status --short
git diff --check
git diff --stat
git diff
git diff --cached --check
git diff --cached --stat
git diff --cached
```

Confirm this is the user's real local working tree and the branch is
`feat/slice-0-foundation`.

## 4. Prior Findings

### D1 — Microsoft.OpenApi vulnerability

Independently run:

```bash
dotnet list backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj package --include-transitive
dotnet list backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj package --vulnerable --include-transitive
```

Verify:

- `Microsoft.OpenApi 2.0.0` is no longer resolved;
- the resolved version is on a patched compatible line;
- `GHSA-v5pm-xwqc-g5wc` is absent;
- no high or critical production dependency vulnerability remains;
- no warning suppression or undocumented exception was introduced.

### D2 — xUnit v3

Verify:

- `Kiwimpact.UnitTests.csproj` directly references `xunit.v3`;
- it does not directly reference the v2 `xunit` package;
- the version is stable and compatible with .NET 10;
- architecture tests compile and run with `dotnet test`.

### D3 — API base documentation

Verify that README and `.env.example` document:

```text
VITE_API_BASE_URL=/api
VITE_DEV_PROXY_TARGET=http://localhost:5000
```

Verify that the explanations match `apiFetch.ts` and `vite.config.ts`.

### D4 — Review artifact separation

Verify:

- the Claude review artifact is non-empty;
- it contains the exact genuine historical review;
- it ends with `CHANGES REQUIRED`;
- the prompt file contains only the prompt/task and not the appended review;
- no historical finding or verdict was rewritten.

### D5 — Completion report fidelity

Verify that the report includes:

- actual final Git status including its own untracked location;
- the verified four-project reference graph;
- every acceptance criterion from the approved Slice 0 plan;
- actual D1/D2 package evidence;
- actual build, test, audit, and runtime results;
- no unsupported or inferred success claim.

## 5. Regression Review

Verify:

- accepted three-production-project architecture;
- Core has no Kiwimpact or DI dependency;
- no scope expansion or business feature;
- no new secrets;
- no unapproved dependency;
- port 5000 and configurable proxy remain correct;
- HTTPS redirection behaviour remains correct;
- no placeholder tests;
- no generated output is tracked;
- documentation commands and claims match observed behaviour.

## 6. Independent Quality Gates

Run the repository-supported equivalents of:

```bash
dotnet restore
dotnet build
dotnet test
npm run lint
npm run type-check
npm run test -- --run
npm run build
npm audit --audit-level=high
```

Run backend runtime verification for health, OpenAPI, and Scalar. Verify
frontend runtime where practical.

Generated ignored build output may be created by verification but must not be
staged or committed.

## 7. Finding Format

For each issue:

```text
ID
Severity: Blocker / Major / Minor / Optional
Affected files
Evidence
Why it matters
Required resolution
```

## 8. Summary

| Area | PASS/FAIL | Notes |
|---|---|---|
| D1 vulnerability | | |
| D2 xUnit v3 | | |
| D3 frontend configuration docs | | |
| D4 review artifacts | | |
| D5 completion report | | |
| Architecture | | |
| Scope | | |
| Security/dependencies | | |
| Build/tests | | |
| Runtime | | |
| Documentation | | |
| Repository hygiene | | |

Then report:

```text
Blocker:
Major:
Minor:
Optional:
```

## 9. Verdict

Return `APPROVE` only when:

- zero Blockers;
- zero Majors;
- D1 is resolved without an unapproved exception;
- D2 uses the approved xUnit v3 framework;
- all required checks pass;
- completion evidence is complete and credible;
- the implementation is safe to commit.

Otherwise return `CHANGES REQUIRED`.

End with exactly:

```text
APPROVE
```

or:

```text
CHANGES REQUIRED
```
