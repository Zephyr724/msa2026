# 03 — Deadline Execution Mode

## Purpose

Deadline execution mode keeps work demonstrable, reviewable, and bounded while
preserving independent review where risk justifies it.

## Task size

One task normally represents one demonstrable behaviour. A normal task is
approximately 1–3 focused development hours and changes fewer than 10–15
primary files. Split work that exceeds either boundary unless the human
approves a larger contract.

## Required task contract

Every task defines:

- **Goal:** the demonstrable outcome;
- **Scope:** files and behaviour allowed to change;
- **Out of scope:** explicit exclusions;
- **Definition of Done:** observable completion conditions;
- **Verification:** targeted checks and final gates;
- **Risk:** low, medium, or high, with the reason;
- **Stop condition:** when the agent must return for a decision.

## Execution

1. Assign one implementation owner.
2. Run targeted tests during implementation.
3. Run applicable full gates once after implementation is complete.
4. Review the final diff and observed evidence.
5. Do not create a completion report before final verification passes.

Low-risk documentation, styling, and isolated UI work does not require an
independent model review unless the human requests one.

Medium- and high-risk tasks require one independent read-only review. The
human selects Kimi K3 or a fresh Codex session, and the reviewer cannot be the
implementation session. Use only one reviewer per task.

After review:

- allow one concentrated correction pass;
- give only original unresolved Blocker/Major findings a targeted closure
  check;
- record and defer Minor findings;
- do not implement Optional findings by default.

Claude or a third reviewer requires explicit human escalation for a
reproducible unresolved Blocker.

## Evidence and context limits

Review the task contract, current diff, and directly affected source/tests.
Read at most one previous review. Do not recursively traverse historical
prompts, reviews, or reports, inspect more than 25 files without approval,
reopen unchanged files repeatedly, or rerun successful full suites repeatedly.
Return a verdict when sufficient evidence exists.

## Approval boundaries

No Git write action is permitted without explicit human approval, including
stage, commit, push, merge, reset, and revert. Product scope, architecture,
security, schema, dependency, destructive-operation, and deployment changes
also require explicit approval.
