# 09 — MSA Assessment Requirements

This rule is always active. It records the mandatory MSA assessment
requirements that directly affect pass/fail and scoring.

## Mandatory Technical Requirements

- Frontend and backend must both exist and be deployed.
- Frontend: React + TypeScript.
- Backend: C# .NET 10+.
- Database: EF Core with PostgreSQL persistence.
- CRUD operations must be implemented.
- Frontend unit tests must exist.
- Backend unit tests must exist.
- API documentation must use Scalar (not Swagger UI).
- UI must be responsive and visually distinctive.

## Advanced Requirements — Top 3 in README

The final README must explicitly list only the following three advanced
requirements for scoring:

1. Security Measures
2. WebSockets using SignalR
3. Cypress End-to-End Testing

Additional advanced work (Zustand state management, Light/Dark theme
switching, Docker local infrastructure) may be implemented but must not
appear in the README top-three advanced-requirements list.

## Repository and Evidence Requirements

- `/specs` must contain planning, design, AI prompts, agent instructions,
  and context evidence.
- For every substantial AI-assisted task, save the actual prompt used.
  Do not fabricate or backfill historical prompts after the fact.
- Prompt files belong in `specs/ai/prompts/`.
- Maintain a regular, meaningful Git commit history throughout development.
  Do not combine the entire assessment into a single final commit.

## Submission Requirements

- Repository must be public.
- Frontend and backend must both be deployed and publicly accessible.
- A demonstration video must be produced, maximum 6 minutes.
- Before submission, verify public access in a private/incognito browser.
- Do not commit after the confirmed MSA submission deadline.
- The submission deadline timezone must be verified from the official MSA
  source. Do not assume or invent a timezone.

## README Requirements

- README must clearly list the top 3 advanced requirements for scoring:
  1. Security Measures
  2. WebSockets using SignalR
  3. Cypress End-to-End Testing
- README must include links to the public repository, frontend deployment,
  backend deployment, and demonstration video.

## Related Rules

- Commit history: `06-development-workflow.md` §6.8
- Deployment and submission: `06-development-workflow.md` §6.7
- AI workflow: `specs/ai/01-ai-development-workflow.md`
- Agent context and governance: `specs/ai/02-agent-context-and-governance.md`