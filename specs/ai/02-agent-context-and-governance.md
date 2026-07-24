# 02 — Agent Context and Governance

## Primary instruction source

`AGENTS.md` is the concise primary cross-agent instruction entry point.
`.clinerules/` contains Cline-compatible fallback guidance and project-specific
engineering detail. When wording conflicts, follow the authority hierarchy
below and the active routing policy in `AGENTS.md`.

## Authority hierarchy

1. Platform, tool, and security constraints.
2. Explicit human goals and action-specific approvals for the current task.
3. Accepted ADRs, specifications, and project governance.
4. Source code, migrations, configuration, lockfiles, contracts, tests, and
   observed behaviour.
5. Agent instructions and explicit assumptions.
6. AI proposals, prompts, reviews, and reports.

Accepted specifications define intended behaviour. Repository and runtime
evidence prove implemented behaviour. Report mismatches explicitly.

## Active agent governance

- Codex is the default planner, implementer, tester, debugger, and
  documentation agent.
- Cline with DeepSeek is an optional low-risk or quota-constrained fallback.
- One task has one implementation owner.
- Low-risk work may finish with implementation-session self-check, automated
  gates, and human inspection.
- Important and high-risk work receives one independent read-only review in a
  separate session.
- The human selects Kimi K3 or a fresh Codex session as reviewer.
- Claude is escalation-only for a concrete high-risk problem unresolved by the
  normal implementation/review pair.
- Kimi, Codex, and Claude must not be run sequentially on the same normal task.

## Approval boundaries

Explicit human approval is required for:

- product-scope changes;
- architecture or ADR changes;
- authentication or security-model changes;
- database-schema changes;
- dependency changes;
- destructive operations;
- staging, committing, pushing, merging, resetting, reverting, or deploying.

The same approval principle applies to releases, history rewriting, force
pushes, production-data operations, and sending private repository content to
external services.

## Context limits

Start with the task contract, accepted decisions directly relevant to it, the
current diff, and affected source/tests.

For review tasks:

- read at most one previous review;
- do not recursively traverse historical prompts, reviews, or reports;
- do not inspect more than 25 files without human approval;
- do not repeatedly reopen unchanged files;
- do not repeatedly rerun successful full suites;
- stop tool use and return a verdict when sufficient evidence exists.

Reference stable decisions instead of copying them into prompts.

## Evidence lifecycle

One Slice records one main implementation prompt. Save an independent review
record only when the review is actually performed. Append correction and
closure evidence to the existing task/review record. Create the completion
report once, after final gates pass.

Prompt and review evidence is process evidence, not proof that a feature is
implemented.

## Cline-compatible rule map

- `00-harness-core.md` — base task and approval protocol
- `00-meta.md` — project context and language
- `01-architecture.md` — architecture boundaries
- `02-technology-stack.md` — accepted toolchain
- `03-database.md` — PostgreSQL and EF Core
- `04a-security-baseline.md` through `04d-runtime-security.md` — security
- `05-testing.md` — testing strategy
- `06-development-workflow.md` — verified development commands
- `07-agent-workflow.md` — bounded task and review workflow
- `08-typescript.md` — frontend TypeScript rules
- `09-msa-assessment.md` — assessment requirements
- `10-ai-model-routing-and-cost-control.md` — risk-based model routing

Do not recursively load this entire map for every task. Read only the directly
relevant guidance.
