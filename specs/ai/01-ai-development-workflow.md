# 01 — AI Development Workflow

## Purpose

This document records how AI tools are used during the development of
Kiwimpact for the MSA 2026 Phase 2 assessment.

AI tools assist with planning, design, implementation, testing, and review.
The project author remains responsible for evaluating AI-generated outputs
and understanding all submitted code.

AI conversations are not treated as the source of truth. Human-approved
documents under `/specs`, accepted ADRs, source code, migrations,
configuration, and tests determine project status.

---

# Workflow

Kiwimpact follows a multi-stage AI-assisted development workflow:

1. Human defines requirements, evaluates trade-offs, and makes final decisions.

2. Figma / Figma AI supports visual exploration and UI iteration.

3. ChatGPT supports:
   - product decisions;
   - MSA requirement interpretation;
   - UX and gamification analysis;
   - architecture discussion;
   - documentation review.

4. Claude supports:
   - design analysis;
   - design token proposals;
   - component specifications;
   - ADR drafting;
   - ERD and API contract drafting.

5. Human reviews and accepts or rejects AI-generated specifications.

6. Codex / DeepSeek + Cline implement accepted specifications in small
   vertical slices.

7. AI agents run verified commands, report failures, and assist with review.

8. Human reviews implementation, tests, and Git diff before accepting changes.

---

# AI Roles

## Human

Responsible for:

- product decisions;
- architecture approval;
- accepting or rejecting AI output;
- reviewing generated code;
- final submission decisions.

## ChatGPT

Used for:

- product and scope decisions;
- MSA requirement interpretation;
- UX and gamification analysis;
- architecture discussion;
- documentation review;
- independent second-opinion review.

## Claude

Claude proposes and independently reviews architecture, ERDs, API contracts,
security boundaries, and major implementation plans. Claude output remains a
proposal until human approval.

## Codex

Codex operates through the Codex interface for repository-aware analysis,
focused approved implementation, review, and verification.

## DeepSeek + Cline

DeepSeek through Cline performs routine implementation and command execution
from approved specifications. Cline is the execution interface for the DeepSeek
workflow.

---

# Source of Truth

The source of truth order is:

1. Human decisions in the current task.
2. Accepted ADRs.
3. Approved `/specs` documents.
4. Source code, migrations, lockfiles, configuration, and tests.
5. AI conversations and generated suggestions.

AI-generated suggestions do not become project decisions until reviewed and accepted.

---

# Prompt Recording

Actual prompts or reconstructed prompt summaries are recorded under:

`specs/ai/prompts/`

Independent review records and their resolutions are recorded under:

`specs/ai/reviews/`

Persistent agent instructions and workflow evidence are recorded under:

`specs/ai/agent-instructions/`

Each prompt record includes:

- AI tool used;
- date;
- purpose;
- whether the prompt is exact or reconstructed;
- important outputs or decisions.

Only meaningful AI-assisted development activities are recorded.

---

# Standard Development Workflow

For significant tasks:

1. Read relevant specifications and ADRs.
2. Inspect current implementation.
3. Separate planned behaviour from implemented behaviour.
4. Create an implementation plan.
5. Obtain human approval for architecture,
   security, schema, or scope changes.
6. Implement the smallest useful vertical slice.
7. Run relevant verification commands.
8. Review Git diff.
9. Record important AI prompts or summaries.
10. Human accepts or rejects the result.

---

# Human Responsibilities

The project author remains responsible for:

- understanding submitted code;
- approving architecture and product decisions;
- reviewing AI-generated output;
- running and interpreting tests;
- protecting credentials;
- deciding commits and submission contents;
- explaining AI usage during assessment.