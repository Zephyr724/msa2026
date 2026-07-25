# Review 32 — R1 Production Deployment Baseline Design Review

- **Date:** 2026-07-25
- **Task:** Independent design review of `specs/implementation/r1-production-deployment-baseline.md`
- **Reviewer:** Kimi K3 Max
- **Mode:** Read-only design review
- **Blockers:** 0
- **Majors:** 0
- **Minors:** 5
- **Verdict:** APPROVE

## Review prompt

The verbatim prompt sent to the reviewer was not included in the freeze-task
materials available in this workspace. The human-recorded review instruction
was to perform an independent read-only design review of the R1 production
deployment baseline, check it against ADR-0009, the current repository, and
the bounded planning requirements, then report Blocker, Major, and Minor
findings with a verdict. This is a truthful scope reconstruction, not a
claimed verbatim quotation.

## Verification performed

The reviewer assessed the deployment contract as design documentation only;
no implementation or deployment action was authorized. During freeze, Codex
also rechecked the branch, worktree scope, ADR and contract text, plus the
current `Program.cs` controller mapping, HTTPS redirection, and tracked
`HealthController` source.

## Minor findings and freeze disposition

1. **Health baseline:** The supplied disposition said no health endpoint was
   mapped. Source re-verification showed tracked `HealthController` plus
   `MapControllers()`, so the frozen contract truthfully records existing
   `/health` liveness and makes `/health/live` and `/health/ready` net-new R1
   work. Neither future endpoint may expose sensitive diagnostics.
2. **HTTPS ingress:** The contract now records current non-Development
   `UseHttpsRedirection()` and requires a provider-specific retain/scope/remove
   decision after trusted forwarded headers, with redirect-loop, port,
   downgrade, forwarded-scheme, and final-redirect smoke checks.
3. **Runtime/probe:** Official .NET 10 Alpine is the default candidate, not an
   architecture lock. Alpine runtime/globalization and the actual BusyBox
   probe must be verified; Debian requires an available replacement probe,
   and adding an OS package remains approval-gated.
4. **Compose migrations:** The flow is now build exact image, start healthy
   PostgreSQL, run the reviewed same-version EF bundle once, enable/start the
   app, and verify readiness. Pre-migration not-ready is intentional; normal
   startup never migrates automatically.
5. **SPA matching:** Reserved server paths now use segment boundaries, so
   `/api` and `/api/...` are reserved but `/api-docs` is not automatically
   reserved. Missing API, health, Scalar, and OpenAPI paths never return the
   SPA document.

## Freeze decision

The human accepted ADR-0009 and the single-origin topology. Provider selection
remains deferred. R1 is approved and frozen for later implementation; it is
not approval to deploy. This freeze created no deployment implementation,
cloud resource, database, volume, registry, subscription, secret, or
production migration. No closure-review record is required because the review
reported no Blocker or Major finding.
