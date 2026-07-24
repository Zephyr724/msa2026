# Specifications Index

## Specification precedence

1. Accepted later ADRs and scope-specific specifications override earlier
   specifications only within their explicitly defined scope.
2. ADR-0008 and its related Community specifications amend the planning
   baseline for Community identity, regional leaderboards, and virtual
   economy scope.
3. The v1.0 planning baseline remains authoritative where no later accepted
   document applies.
4. Prompt, review, and completion records are process evidence, not normative
   product specifications.
5. Implementation is proven by source, migrations, configuration, lockfiles,
   tests, and observed behaviour.

## Planning and project profile

- [`Kiwimpact_Final_Planning_Baseline_v1.0.md`](Kiwimpact_Final_Planning_Baseline_v1.0.md)
- [`00-project-profile.md`](00-project-profile.md)

## Product

- [`product/01-product-requirements.md`](product/01-product-requirements.md)
- [`product/02-community-identity-and-gamification-scope-update.md`](product/02-community-identity-and-gamification-scope-update.md)

## Architecture

- [`architecture/01-domain-model-region.md`](architecture/01-domain-model-region.md)
- [`architecture/02-core-domain-data-model.md`](architecture/02-core-domain-data-model.md)
- [`architecture/03-api-contract.md`](architecture/03-api-contract.md)

## Architecture decision records

- [`adr/ADR-0001-use-postgresql.md`](adr/ADR-0001-use-postgresql.md)
- [`adr/ADR-0002-use-identity-cookie-authentication.md`](adr/ADR-0002-use-identity-cookie-authentication.md)
- [`adr/ADR-0003-use-clean-architecture-lite.md`](adr/ADR-0003-use-clean-architecture-lite.md)
- [`adr/ADR-0004-use-react-vite-tailwind-daisyui.md`](adr/ADR-0004-use-react-vite-tailwind-daisyui.md)
- [`adr/ADR-0005-use-tanstack-query-and-zustand.md`](adr/ADR-0005-use-tanstack-query-and-zustand.md)
- [`adr/ADR-0006-use-google-maps.md`](adr/ADR-0006-use-google-maps.md)
- [`adr/ADR-0007-use-postgresql-integration-tests.md`](adr/ADR-0007-use-postgresql-integration-tests.md)
- [`adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md`](adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md)

## UX, data, security, and testing

- [`ux/01-ui-design-brief.md`](ux/01-ui-design-brief.md)
- [`ux/02-figma-ai-mvp-ui-generation-spec.md`](ux/02-figma-ai-mvp-ui-generation-spec.md)
- [`ux/03-figma-ai-first-pass-ui-review.md`](ux/03-figma-ai-first-pass-ui-review.md)
- [`ux/04-community-identity-leaderboard-and-selector.md`](ux/04-community-identity-leaderboard-and-selector.md)
- [`data/01-community-identity-data-model.md`](data/01-community-identity-data-model.md)
- [`security/01-community-privacy-rules.md`](security/01-community-privacy-rules.md)
- [`testing/01-community-leaderboard-and-privacy-tests.md`](testing/01-community-leaderboard-and-privacy-tests.md)

## AI workflow and active rules

- [`ai/01-ai-development-workflow.md`](ai/01-ai-development-workflow.md)
- [`ai/02-agent-context-and-governance.md`](ai/02-agent-context-and-governance.md)
- [`ai/03-deadline-execution-mode.md`](ai/03-deadline-execution-mode.md)
- [`ai/agent-instructions/01-model-routing-policy.md`](ai/agent-instructions/01-model-routing-policy.md)
- [`../AGENTS.md`](../AGENTS.md) — primary cross-agent instructions
- [`../.clinerules/06-development-workflow.md`](../.clinerules/06-development-workflow.md)
- [`../.clinerules/07-agent-workflow.md`](../.clinerules/07-agent-workflow.md)
- [`../.clinerules/10-ai-model-routing-and-cost-control.md`](../.clinerules/10-ai-model-routing-and-cost-control.md)

## Slice index

- [`implementation/00-slice-0-foundation.md`](implementation/00-slice-0-foundation.md)
- [`implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md`](implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md)
- [`implementation/01-slice-1-region-quest-read.md`](implementation/01-slice-1-region-quest-read.md)
- [`implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md`](implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md)

## Prompt evidence index

- [`ai/prompts/04-figma-ai-second-iteration-prompt.md`](ai/prompts/04-figma-ai-second-iteration-prompt.md)
- [`ai/prompts/15-slice-1-region-quest-read-plan-review-task.md`](ai/prompts/15-slice-1-region-quest-read-plan-review-task.md)
- [`ai/prompts/16-slice-1-region-quest-read-plan-rereview-task.md`](ai/prompts/16-slice-1-region-quest-read-plan-rereview-task.md)
- [`ai/prompts/35-d1-streamline-codex-workflow.md`](ai/prompts/35-d1-streamline-codex-workflow.md)

## Review evidence index

- [`review/01-pre-development-review.md`](review/01-pre-development-review.md)
- [`review/02-community-scope-review.md`](review/02-community-scope-review.md)
- [`ai/reviews/15-slice-1-region-quest-read-plan-review-2026-07-22.md`](ai/reviews/15-slice-1-region-quest-read-plan-review-2026-07-22.md)
- [`ai/reviews/16-slice-1-region-quest-read-plan-rereview-2026-07-22.md`](ai/reviews/16-slice-1-region-quest-read-plan-rereview-2026-07-22.md)

## Project status

- [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md)
