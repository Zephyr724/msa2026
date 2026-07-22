# Independent Re-Review Task — Slice 0 Foundation After Corrections

- **Reviewer:** Codex
- **Review mode:** Read-only
- **Review type:** Focused implementation re-review
- **Branch:** `feat/slice-0-foundation`
- **Files modified by reviewer:** None
- **Required verdict:** `APPROVE` or `CHANGES REQUIRED`

## 1. Objective

Independently review the corrected, uncommitted Slice 0 implementation.

Verify that the prior Claude findings are resolved and that the implementation
is safe to commit.

Do not modify files. Do not fix findings. Do not commit or switch branches.

## 2. Required Reading

Read:

```text
AGENTS.md
specs/implementation/00-slice-0-foundation.md
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
specs/ai/reviews/08-slice-0-foundation-implementation-review-2026-07-22.md
specs/00-project-profile.md
specs/adr/ADR-0003-use-clean-architecture-lite.md
.clinerules/00-harness-core.md
.clinerules/01-architecture.md
.clinerules/02-technology-stack.md
.clinerules/07-agent-workflow.md
.clinerules/09-msa-assessment.md
README.md
```

Inspect all changed and untracked files in:

```text
backend/
frontend/
README.md
docker-compose.yml
specs/00-project-profile.md
specs/implementation/reports/
```

## 3. Git Inspection

Inspect:

```bash
git branch --show-current
git status --short
git diff --check
git diff --stat
git diff
git diff --cached --check
git diff --cached --stat
git diff --cached
```

Review all untracked files. Confirm the branch is not `main`.

Do not edit, stage, commit, reset, clean, or switch branches.

## 4. Prior Findings to Verify

### B1 — Completion evidence

Verify that the completion report exists and contains actual observed results
for:

```text
dotnet restore
dotnet build
dotnet test
npm run lint
npm run type-check
npm run test
npm run build
backend runtime
frontend runtime
```

Distinguish observed evidence from inference.

### M1 — Port consistency

Verify that these agree on local HTTP port 5000:

```text
README.md
frontend/vite.config.ts
backend/src/Kiwimpact.Api/Properties/launchSettings.json
completion report
```

Verify that the documented default backend command actually binds to port 5000.

### Mi1 — Placeholder test

Verify that `UnitTest1.cs` is removed and a meaningful backend test remains.

### Mi2 — Configurable Vite proxy

Verify that the proxy target is environment-configurable and has fallback:

```text
http://localhost:5000
```

Verify consistent handling for:

```text
/api
/hubs
/health
/openapi
/scalar
```

### Mi3 — HTTPS redirection

Verify that HTTPS redirection is configured appropriately without breaking the
documented local HTTP development workflow.

### Optional findings

Do not require a health-check middleware rewrite solely because the current
health implementation is custom.

Do not reject the throwaway local database password when it is clearly
development-only and compliant with repository rules.

## 5. Regression Review

Also verify:

- exactly three backend production projects: Api, Core, Infrastructure;
- accepted project-reference direction;
- Core has no DI dependency;
- no business feature or migration was added;
- no secrets were introduced;
- no unapproved dependency was added;
- frontend foundation dependencies remain within the approved stack;
- README and project profile contain only verified commands and claims;
- no generated build output is tracked;
- the diff remains focused.

## 6. Independent Verification

You may run non-destructive build, test, and runtime verification commands.

Do not install or upgrade dependencies unless they are already represented by
the existing lockfiles or project manifests and normal restore is required for
verification.

Do not modify source files.

When commands generate ignored files such as `bin`, `obj`, or local build
output, do not stage or commit them.

## 7. Finding Format

For every issue include:

```text
ID
Severity: Blocker / Major / Minor / Optional
Affected files
Evidence
Why it matters
Required resolution
```

Do not classify personal preferences as required changes.

## 8. Summary

Include:

| Area | PASS/FAIL | Notes |
|---|---|---|
| Prior B1 | | |
| Prior M1 | | |
| Prior Mi1 | | |
| Prior Mi2 | | |
| Prior Mi3 | | |
| Architecture | | |
| Scope | | |
| Security/configuration | | |
| Dependencies | | |
| Build/tests | | |
| Runtime verification | | |
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

- there are zero Blockers;
- there are zero Majors;
- all required commands pass;
- runtime evidence is present and credible;
- prior required findings are resolved;
- the implementation is safe to commit.

Otherwise return `CHANGES REQUIRED`.

End with exactly one of:

```text
APPROVE
```

or:

```text
CHANGES REQUIRED