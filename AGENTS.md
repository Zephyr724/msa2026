# Kiwimpact Agent Instructions

## Purpose and authority

This file is the primary cross-agent instruction entry point for Kiwimpact.
`.clinerules/` provides Cline-compatible fallback guidance.

Use this source-of-truth order:

1. Current explicit human instruction.
2. Accepted ADRs.
3. Accepted specifications under `/specs`.
4. Source code, migrations, configuration, tests, and observed behaviour.
5. AI proposals, prompts, reviews, and reports.

Accepted decisions define intended behaviour. Implementation evidence defines
what currently exists. Do not claim that planned behaviour is implemented
unless source, tests, and observed verification support that claim.

The human remains responsible for every accepted decision and submitted
change.

## Technology and boundaries

Kiwimpact uses React, TypeScript, Vite, React Router, Tailwind CSS, daisyUI,
TanStack Query, and Zustand in `frontend/`; C#, .NET 10+, ASP.NET Core, Entity
Framework Core, PostgreSQL, ASP.NET Core Identity with HttpOnly cookie
authentication, and Scalar in `backend/`.

Keep frontend and backend responsibilities separated. Backend enforcement is
mandatory for authentication, authorization, ownership, validation,
antiforgery, CORS, rate limiting, sensitive evidence, and privacy thresholds.

Do not replace a major technology or add a dependency without explicit human
approval.

## Agent routing

- Codex is the default planning, implementation, testing, debugging, and
  documentation agent.
- Cline with DeepSeek is an optional low-risk or quota-constrained fallback,
  not a mandatory implementation route.
- Important and high-risk tasks require one independent read-only review.
- The human selects Kimi K3 or a fresh Codex session as reviewer according to
  availability, cost, and task risk.
- The reviewer cannot be the session that implemented the task.
- Claude is escalation-only when the normal implementation/review pair cannot
  resolve a concrete high-risk problem.

One task has one implementation owner. A normal important task permits one
independent full review, one concentrated correction pass, and one targeted
closure check limited to original unresolved Blocker/Major findings. A second
full review or second reviewer requires explicit human approval.

## Approval boundaries

Obtain explicit human approval before:

- changing product scope, architecture, or an ADR;
- changing authentication or the security model;
- changing the database schema;
- adding, removing, or materially upgrading dependencies;
- performing destructive operations;
- staging, committing, pushing, merging, resetting, reverting, or deploying.

Do not create or update a pull request without explicit approval. Never discard
unrelated user changes.

## Task workflow

Before a significant task:

1. Read the short task contract and directly relevant accepted decisions.
2. Inspect the current implementation and separate intended from implemented
   behaviour.
3. Identify missing decisions and obtain required approvals.
4. Implement the smallest useful vertical slice as the sole implementation
   owner.
5. Run targeted tests during implementation.
6. Run applicable full gates once after implementation is complete.
7. Review the Git diff and report results, risks, and unfinished work.
8. For important or high-risk work, obtain the single independent review and
   follow the bounded correction workflow above.

Do not recursively traverse historical prompts, reviews, or completion
reports. Reference stable decisions instead of copying them. Do not repeatedly
read unchanged files or rerun successful full suites when sufficient evidence
already exists.

## Verified commands

Run frontend commands from `frontend/`:

```bash
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

Run backend commands from `backend/`:

```bash
dotnet build Kiwimpact.slnx
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
```

Run only the gates applicable to the changed code or configuration. Never
claim a command passed unless it was executed and its result observed.

## Repository safety

`main` is the deployable source of truth. Use short-lived `feat/`, `fix/`, or
`docs/` branches. Before editing, inspect the current branch and working tree.
Do not make substantial changes directly on `main`.

Maintain the accepted MSA requirements, including the React frontend, C# .NET
backend, Entity Framework Core, persistent database, CRUD, frontend and backend
tests, deployed frontend and backend, Scalar documentation, responsive UI, and
AI-use evidence under `/specs`.
