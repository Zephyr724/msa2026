# Specifications Index

## Specification Precedence Policy

1. Accepted later ADRs and scope-specific specifications override earlier
   specifications only within their explicitly defined scope.
2. ADR-0008 and its related Community specifications amend the planning baseline
   for Community identity, regional leaderboards, and virtual-economy scope.
3. The v1.0 planning baseline (`specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`)
   remains authoritative for areas not amended by later accepted specifications.
4. Review records and AI prompt files are evidence of the development process,
   not normative product specifications.
5. Implementation is proven by source code, migrations, configuration, lockfiles,
   and tests — not by specification documents alone.

## Current Accepted Specification Set

### Planning Baseline

- `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md` — v1.0 accepted planning baseline

### Project Profile

- `specs/00-project-profile.md` — concise project profile

### Architecture Decision Records

- `specs/adr/ADR-0001-use-postgresql.md` — PostgreSQL
- `specs/adr/ADR-0002-use-identity-cookie-authentication.md` — Identity + Cookie Auth
- `specs/adr/ADR-0003-use-clean-architecture-lite.md` — Clean Architecture Lite
- `specs/adr/ADR-0004-use-react-vite-tailwind-daisyui.md` — React/Vite/Tailwind/daisyUI
- `specs/adr/ADR-0005-use-tanstack-query-and-zustand.md` — TanStack Query + Zustand
- `specs/adr/ADR-0006-use-google-maps.md` — Google Maps
- `specs/adr/ADR-0007-use-postgresql-integration-tests.md` — PostgreSQL Integration Tests
- `specs/adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md` — Community Identity, Local Leaderboards, Virtual Economy Scope

### Product

- `specs/product/01-product-requirements.md` — Accepted product overview
- `specs/product/02-community-identity-and-gamification-scope-update.md` — Community identity scope update

### UX

- `specs/ux/01-ui-design-brief.md` — Accepted base UI brief
- `specs/ux/02-figma-ai-mvp-ui-generation-spec.md` — First-pass Figma AI generation spec (historical)
- `specs/ux/03-figma-ai-first-pass-ui-review.md` — First-pass UI review archive
- `specs/ux/04-community-identity-leaderboard-and-selector.md` — Community identity UX extension

### Architecture

- `specs/architecture/01-domain-model-region.md` — Region domain model

### Data

- `specs/data/01-community-identity-data-model.md` — Community identity data model

### Security

- `specs/security/01-community-privacy-rules.md` — Community privacy rules

### Testing

- `specs/testing/01-community-leaderboard-and-privacy-tests.md` — Community leaderboard and privacy tests

### Review

- `specs/review/01-pre-development-review.md` — Pre-development ADR and UI brief review (completed)
- `specs/review/02-community-scope-review.md` — Community scope and ADR-0008 review

### AI Workflow

- `specs/ai/01-ai-development-workflow.md` — AI development workflow
- `specs/ai/02-agent-context-and-governance.md` — Agent context and governance

### AI Prompts (evidence only)

- `specs/ai/prompts/003-correct-harness-consistency.md` — Reconstructed task summary
- `specs/ai/prompts/04-figma-ai-second-iteration-prompt.md` — Second Figma iteration prompt

### Agent Rules

- `.clinerules/00-harness-core.md` — Universal harness core
- `.clinerules/00-meta.md` — Project context and language policy
- `.clinerules/01-architecture.md` — Architecture constraints
- `.clinerules/02-technology-stack.md` — Technology stack and toolchain
- `.clinerules/03-database.md` — Database rules
- `.clinerules/04a-security-baseline.md` — Security baseline
- `.clinerules/04b-auth-security.md` — Authentication and authorization
- `.clinerules/04c-dependency-security.md` — Dependency and supply-chain security
- `.clinerules/04d-runtime-security.md` — Runtime security
- `.clinerules/05-testing.md` — Testing strategy
- `.clinerules/06-development-workflow.md` — Development workflow
- `.clinerules/07-agent-workflow.md` — Agent task workflow
- `.clinerules/08-typescript.md` — TypeScript coding rules
- `.clinerules/09-msa-assessment.md` — MSA assessment requirements

### Project Status

- `PROJECT_STATUS.md` — Current implementation and control status