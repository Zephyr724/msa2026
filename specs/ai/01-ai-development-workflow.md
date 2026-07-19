# 01 — AI Development Workflow

## Workflow

Kiwimpact uses a multi-stage AI-assisted development workflow:

1. **Human**: final decisions and review.
2. **Figma / Figma AI**: visual exploration.
3. **Claude**: read designs; draft tokens, component specs, ADR, ERD, API
   Contract, Component Plan.
4. **Human review**: accept or reject Claude's output.
5. **DeepSeek + Cline**: implement accepted written specifications in small
   vertical slices, run verified commands, report failures.

## Roles

- **Human**: owns product decisions, final review, approval of all AI output.
- **Claude**: visual/analytical reasoning, specification drafting from designs.
- **DeepSeek**: implementation from accepted specifications.
- **Cline**: agent execution layer — reads harness rules, executes tools,
  reports results.

## Source of Truth

AI chat is not the source of truth. Human-approved `/specs` files and accepted
ADRs guide implementation. Source code, migrations, lockfiles, configuration,
and tests prove the current state.

## Prompt Recording

From July 19 2026 onward, actual prompts submitted to Claude, DeepSeek, and
Cline are recorded in `specs/ai/prompts/`. Each file notes whether it is an
exact prompt or a reconstructed summary.