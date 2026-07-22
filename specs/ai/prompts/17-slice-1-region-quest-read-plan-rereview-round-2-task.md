# Slice 1 Plan Rereview Round 2 — Codex

- **Reviewer:** Codex
- **Mode:** Read-only local repository review
- **Target plan:** `specs/implementation/01-slice-1-region-quest-read.md`
- **Previous review:** the Codex rereview containing `R2-M1` and `R2-m2`
- **Required verdict:** `APPROVE` or `CHANGES REQUIRED`

## Objective

Verify only the two remaining findings and check for regressions introduced by
their correction.

Do not modify files or implement Slice 1.

## Repository checks

Run:

```bash
pwd
git branch --show-current
git status --short
git diff --check
git diff --stat
git diff -- specs/implementation/01-slice-1-region-quest-read.md
```

## R2-M1 — Identity type accessibility

Verify the plan now specifies a compilable and coherent design:

```csharp
public sealed class ApplicationUser : IdentityUser<Guid>
{
}

public sealed class ApplicationRole : IdentityRole<Guid>
{
}

public sealed class KiwimpactDbContext
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
}
```

Confirm that:

- class declarations use valid bodies;
- a public DbContext does not expose less-accessible generic type arguments;
- all three types remain in Infrastructure;
- public accessibility does not expose them as Core entities or API DTOs;
- the previously approved persistence-only and no-auth-runtime boundaries
  remain intact;
- migration, DI, and integration-test access are coherent.

## R2-m2 — Test runner and private assets

Verify the intended IntegrationTests packages now include:

```text
xunit.v3
xunit.runner.visualstudio
Microsoft.NET.Test.Sdk
Microsoft.AspNetCore.Mvc.Testing
Testcontainers.PostgreSql
```

Confirm the plan requires:

- `xunit.runner.visualstudio` aligned with UnitTests;
- `PrivateAssets=all` and the normal `IncludeAssets` set for the runner;
- `Microsoft.EntityFrameworkCore.Design` configured as a private
  development/build-time asset;
- actual `dotnet test` discovery and execution evidence;
- no unapproved MTP switch.

## Regression check

Confirm the corrections did not weaken:

- Quest `xmin` concurrency requirements;
- Quest owner FK integrity;
- no Identity/auth service activation;
- frontend `unknown` response validation;
- dependency governance;
- prerequisite transition workflow;
- scope exclusions.

## Findings format

For every issue include:

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

Return `APPROVE` only when `R2-M1` and `R2-m2` are fully resolved with no new
Blocker or Major finding.

End exactly with:

```text
APPROVE
```

or:

```text
CHANGES REQUIRED
```
