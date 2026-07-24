# 01 — AI Development Workflow

## Purpose

This document records the active AI-assisted development workflow for
Kiwimpact and preserves the context of the earlier multi-agent approach.

AI tools assist development. The project author remains responsible for every
accepted decision, all submitted changes, understanding the code, interpreting
test results, protecting credentials, and deciding what is committed or
submitted.

## Instruction and evidence authority

`AGENTS.md` is the primary cross-agent instruction entry point.
`.clinerules/` is Cline-compatible fallback guidance.

Use this source-of-truth order:

1. Current human decisions and approvals.
2. Accepted ADRs.
3. Accepted specifications under `/specs`.
4. Source code, migrations, configuration, lockfiles, tests, and observed
   behaviour.
5. AI prompts, suggestions, reviews, and reports.

Specifications describe intended behaviour. Implementation evidence proves
what currently exists.

## Active workflow

1. The human defines the task contract and makes product, architecture,
   security, schema, dependency, Git, deployment, and submission decisions.
2. Codex is the default planning, implementation, testing, debugging, and
   documentation agent.
3. One task has one implementation owner.
4. Targeted tests run during implementation. Applicable full gates run once
   after implementation is complete.
5. Low-risk work may complete with Codex self-check, automated gates, and
   human inspection.
6. Important and high-risk work receives one independent read-only review.
   The human selects Kimi K3 or a fresh Codex session. The implementation and
   review sessions must differ.
7. The implementer performs at most one concentrated correction pass.
8. Only original unresolved Blocker/Major findings receive a targeted closure
   check.
9. Claude is escalation-only when the normal implementation/review pair cannot
   resolve a concrete high-risk problem.
10. The human reviews the final diff and evidence before accepting changes.

Never run Kimi, Codex, and Claude sequentially on the same normal task. A
second full review or second reviewer requires explicit human approval.

## Historical context

Earlier Kiwimpact work used a multi-stage route in which ChatGPT supported
product and UX discussion, Claude supported planning and architecture, and
DeepSeek through Cline performed routine implementation. Codex also performed
repository-aware implementation and review. Those records remain valid
historical evidence, but they do not define the active routing policy.

Figma/Figma AI may still support visual exploration. ChatGPT may support
product, MSA, UX, and documentation discussion. Cline with DeepSeek remains an
optional low-risk or quota-constrained implementation fallback.

## Evidence recording

Meaningful implementation prompts are stored under `specs/ai/prompts/`.
Independent review records are stored under `specs/ai/reviews/` only when a
review is actually performed.

For each Slice:

- record one main implementation prompt;
- record one independent review only when required and performed;
- append corrections and closure results to the existing task/review evidence
  instead of creating repeated final-rereview files;
- create one completion report only after final gates pass.

Prompt records identify the date, tool/model, purpose, prompt provenance,
observed outcome, changed files, verification, and human decision. Historical
prompts, reviews, and reports must not be recursively traversed.

## Standard task sequence

1. Define Goal, Scope, Out of scope, Definition of Done, Verification, Risk,
   and Stop condition.
2. Read directly relevant accepted decisions and inspect current
   implementation.
3. Obtain human approval for any product-scope, architecture, security,
   schema, dependency, destructive, Git-write, or deployment change.
4. Implement the smallest demonstrable behaviour.
5. Run targeted checks while working.
6. Run applicable full gates once at the end.
7. Review the Git diff and record meaningful prompt evidence.
8. Apply the risk-based review workflow.
9. Obtain human acceptance.
