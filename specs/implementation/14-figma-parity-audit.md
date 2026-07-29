# Slice 14 — Figma Parity Audit

## Status

Audit complete in the working tree on 2026-07-27. This Slice changes
documentation and stores local visual evidence only. It does not change
production frontend or backend behaviour.

## Goal

Explain why the current product remains materially different from the local
Figma Make MVP reference despite Slices 9 and 12, and define an evidence-based
next Slice that can restore the reference composition without replacing
authoritative production behaviour with prototype demo state.

## Scope

- Run the local Make export and the current React/.NET product independently.
- Compare the seven runnable Make pages:
  - Landing
  - Discover
  - Quest Detail
  - My Quests / Mission Board
  - Passport
  - Leaderboard
  - Share Card Builder
- Inspect the completion-method and reward-overlay interaction.
- Audit shared shell, navigation, typography, geometry, art, responsive rules,
  state presentation, and real-data composition.
- Reconcile observations with accepted UX and Slice 9–12 decisions.
- Store screenshots under
  `specs/implementation/evidence/14-figma-parity/`.
- Produce the completion report and a proposed Slice 15 contract.

## Boundaries

- No production code change.
- No schema, authentication, authorization, privacy, dependency, or deployment
  change.
- No new Member account or synthetic production record is created for this
  audit.
- The user-owned Make export remains untracked source material.
- Prototype demo values are evidence of intended composition, not accepted
  production facts.
- The audit does not claim pixel inspection of a Design-mode Figma file. The
  runnable local Make export is the available reference.

## Outputs

- Prompt record:
  `specs/ai/prompts/65-slice-14-figma-parity-audit.md`
- Evidence manifest:
  `specs/implementation/evidence/14-figma-parity/README.md`
- Full report:
  `specs/implementation/reports/14-figma-parity-audit-report.md`
- Proposed next Slice:
  `specs/implementation/15-figma-faithful-ui-restoration.md`

## Verification

This is a documentation/evidence Slice. Frontend and backend production code
did not change, so application build/test gates are not applicable. Required
closure checks are:

- every reported screenshot exists;
- report links resolve from the repository;
- observations distinguish browser evidence, source evidence, and inference;
- `git diff --check` passes;
- no user-owned Make or browser artifact is added to the proposed tracked
  change set.
