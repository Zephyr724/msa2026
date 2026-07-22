# Independent Re-Review — Slice 0 Foundation After Corrections

- **Reviewer:** Codex
- **Review date:** 2026-07-22
- **Review type:** Focused implementation re-review
- **Branch:** `feat/slice-0-foundation`
- **Files modified by reviewer:** None
- **Verdict:** CHANGES REQUIRED

## Findings

### D1

Severity: Major  
Affected files: [Kiwimpact.Api.csproj](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj:10), [completion report](/Users/zephyr/dev/personal/msa2026/specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md:137)

Evidence: `dotnet list package --vulnerable --include-transitive` identified `Microsoft.OpenApi 2.0.0` as a high-severity production dependency affected by `GHSA-v5pm-xwqc-g5wc`. The completion report acknowledges it but defers reachability analysis and triage. It does not provide the scope, mitigation, approving owner, or expiration required by `.clinerules/04c-dependency-security.md`. The advisory concerns process termination while parsing malicious circular OpenAPI schemas. [Microsoft advisory](https://github.com/microsoft/OpenAPI.NET/security/advisories/GHSA-v5pm-xwqc-g5wc)

Why it matters: Project policy requires every high-severity finding either to be resolved or to receive documented triage. Deferring that work until deployment does not make the dependency safe to commit.

Required resolution: Resolve the vulnerable dependency through a compatible patched package chain, or create an approved exception containing the required reachability analysis, mitigation, owner, and expiration date. Rerun restore, build, tests, and vulnerability scanning afterward.

### D2

Severity: Minor  
Affected files: [Kiwimpact.UnitTests.csproj](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj:13), [project profile](/Users/zephyr/dev/personal/msa2026/specs/00-project-profile.md:197), [.clinerules/02-technology-stack.md](/Users/zephyr/dev/personal/msa2026/.clinerules/02-technology-stack.md:57)

Evidence: The test project references `xunit` 2.9.3, while the accepted stack specifies xUnit v3. The v3 Visual Studio runner does not change the referenced test framework generation.

Why it matters: The implementation diverges from the accepted testing stack even though its two tests currently pass.

Required resolution: Use the approved xUnit v3 framework package or obtain and document approval for the deviation, then rerun backend tests.

### D3

Severity: Minor  
Affected files: [apiFetch.ts](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/api/apiFetch.ts:1), [README.md](/Users/zephyr/dev/personal/msa2026/README.md:84), [frontend/.env.example](/Users/zephyr/dev/personal/msa2026/frontend/.env.example:1)

Evidence: `apiFetch` supports `VITE_API_BASE_URL`, but neither the README configuration table nor the example environment file documents that key or its `/api` fallback.

Why it matters: The accepted foundation specification requires configuration keys and safe defaults to be documented.

Required resolution: Document `VITE_API_BASE_URL` and its fallback in the README and safe environment example.

### D4

Severity: Minor  
Affected files: [Claude review artifact](/Users/zephyr/dev/personal/msa2026/specs/ai/reviews/08-slice-0-foundation-implementation-review-2026-07-22.md), [review prompt](/Users/zephyr/dev/personal/msa2026/specs/ai/prompts/08-slice-0-foundation-implementation-review-task.md:521)

Evidence: The required review artifact is zero bytes. The actual Claude review begins at line 521 of the prompt file instead. Repository rules prohibit empty placeholder documents and conventionally separate prompts from reviews.

Why it matters: Committing the current state would leave the referenced historical review empty and misfile its evidence.

Required resolution: Preserve the exact genuine review in the review artifact and keep the prompt record appropriately separated, without fabricating or rewriting historical content.

### D5

Severity: Minor  
Affected file: [completion report](/Users/zephyr/dev/personal/msa2026/specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md:141)

Evidence: Its recorded `git status --short` omits the completion-report directory itself, which is currently untracked. It also substitutes "Not applicable" for the required final project-reference graph and lists only a subset of Slice 0 acceptance criteria.

Why it matters: The completion report is not a fully faithful record in the format required by the correction task.

Required resolution: Update it using actually observed final Git state, the verified reference graph, and every Slice 0 acceptance criterion.

## Summary

| Area | PASS/FAIL | Notes |
|---|---|---|
| Prior B1 | PASS | Report contains build, test, and runtime results; independently reproduced. See D5 for report completeness. |
| Prior M1 | PASS | README, launch profile, proxy fallback, report, and live backend agree on port 5000. |
| Prior Mi1 | PASS | `UnitTest1.cs` is absent; two architecture tests remain and pass. |
| Prior Mi2 | PASS | One configurable proxy target with the required fallback covers all five paths. |
| Prior Mi3 | PASS | HTTPS redirection is enabled outside Development while local HTTP remains usable. |
| Architecture | PASS | Exactly three production projects with the accepted references; Core has no DI dependency. |
| Scope | PASS | No business feature, entity, migration, authentication, or IntegrationTests project added. |
| Security/configuration | FAIL | High-severity dependency lacks compliant resolution or triage. |
| Dependencies | FAIL | D1 and xUnit version divergence in D2. Frontend audit found zero vulnerabilities. |
| Build/tests | PASS | Backend restore/build/test passed with NU1903; frontend lint, type-check, 4 tests, and build passed. |
| Runtime verification | PASS | Backend health/OpenAPI/Scalar and Vite routes plus all five proxy families were verified. |
| Documentation | FAIL | D3 and D5. |
| Repository hygiene | FAIL | Empty/misfiled review evidence in D4. No generated output is tracked. |

```text
Blocker: 0
Major: 1
Minor: 4
Optional: 0
```

CHANGES REQUIRED