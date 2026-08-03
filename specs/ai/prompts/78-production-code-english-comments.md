# Production Code English Comments — Implementation Prompt

## Source

Truthful reconstruction of the implementation instruction executed by Codex
on 2026-07-29.

## Instruction

Create a new branch and review the existing production code for opportunities
to add useful English comments.

- Limit scope to production source under `frontend/src` and `backend/src`.
- Screen all human-maintained production files, but add comments only where
  they clarify non-obvious intent, business rules, state ownership, security,
  privacy, concurrency, time boundaries, fallbacks, or accessibility.
- Keep comments informative without becoming long, complicated, or repetitive.
- Do not add comments to obvious assignments, straightforward JSX, ordinary
  DTOs, enums, or type declarations.
- Exclude tests, EF Core migration Designer files, model snapshots, and other
  generated source.
- Preserve behavior, public contracts, architecture, authentication,
  authorization, database schema, and dependencies.
- Do not stage, commit, push, merge, or deploy.
- Run applicable frontend and backend verification, inspect the final diff,
  and create the repository-required completion evidence.

The user requested stopping if ChatGPT usage fell below 85 percent. Codex
explicitly disclosed that account-level ChatGPT usage is not visible to this
session and therefore could not be monitored automatically.
