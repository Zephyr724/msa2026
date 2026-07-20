# 02 — Agent Context and Governance

## Agent Rule Source

Cline's operational rules are stored in the repository root at `.clinerules/`.
These files define the default engineering behavior for the AI agent.

The rules are organized as:

- `00-harness-core.md` — Universal harness core (task execution, ambiguity
  handling, scope control, approval boundaries, security baseline, quality
  gates)
- `00-meta.md` — Project context, language policy, and quick reference
- `01-architecture.md` — Architecture constraints (Clean Architecture Lite)
- `02-technology-stack.md` — Accepted technology choices
- `03-database.md` — Database rules (PostgreSQL, EF Core migrations)
- `04a-security-baseline.md` — Security baseline with high-risk operation gates
- `04b-auth-security.md` — Authentication and authorization (ASP.NET Core Identity)
- `04c-dependency-security.md` — Dependency and supply-chain security
- `04d-runtime-security.md` — Runtime security (proxy trust, CORS, CSRF, SSRF)
- `05-testing.md` — Testing strategy (Vitest, xUnit v3, Testcontainers, Cypress)
- `06-development-workflow.md` — Git strategy, commit conventions, PR requirements
- `07-agent-workflow.md` — Quality gate matrix and error recovery
- `08-typescript.md` — TypeScript coding rules for the frontend
- `09-msa-assessment.md` — MSA assessment requirements

## Authority Hierarchy

The harness establishes this authority order:

1. Platform, tool, and security constraints that cannot be overridden
2. Explicit user goals and action-specific approvals for the current task
3. Accepted ADRs, accepted specifications, and project-specific governance
   rules
4. Domain-specific sources of truth (migrations, lockfiles, contracts, tests,
   source code)
5. This universal harness
6. Explicitly stated agent assumptions

Accepted specifications describe intended behavior. Source code, migrations,
configuration, lockfiles, and tests prove the currently implemented behavior.
A mismatch must be reported and resolved explicitly.

## Approval Boundaries

The agent must not perform the following without explicit human approval:
- install, remove, or materially upgrade dependencies;
- commit, push, merge, tag, publish, deploy, or create a release;
- rewrite Git history or force-push;
- delete files or directories outside the clearly stated task scope;
- perform destructive database or production-data operations;
- modify authentication, authorization, secrets, security controls, or
  production environment configuration;
- alter accepted migrations or persistence history;
- send private repository content to an external service.

## Specification Location

Current Kiwimpact specifications and ADRs are located in `/specs`. This
directory is the single source of truth for intended product behavior.
The `/docs` directory contains only archived legacy materials from the
superseded Node.js/Express/SQLite project.

Specification precedence is defined in `specs/README.md`. Later accepted
scope-specific ADRs and specifications override earlier documents only within
their explicit scope.

## Agent Rule Files

The full agent rule set includes:

- `00-harness-core.md` — Universal harness core
- `00-meta.md` — Project context and language policy
- `01-architecture.md` — Architecture constraints
- `02-technology-stack.md` — Technology stack and toolchain
- `03-database.md` — Database rules
- `04a-security-baseline.md` — Security baseline
- `04b-auth-security.md` — Authentication and authorization
- `04c-dependency-security.md` — Dependency and supply-chain security
- `04d-runtime-security.md` — Runtime security
- `05-testing.md` — Testing strategy
- `06-development-workflow.md` — Development workflow
- `07-agent-workflow.md` — Agent task workflow
- `08-typescript.md` — TypeScript coding rules for the frontend
- `09-msa-assessment.md` — MSA assessment requirements
