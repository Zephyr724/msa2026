# Kiwimpact Agent Instructions

## Project Overview

Kiwimpact is an individual full-stack web application for the Microsoft
Student Accelerator 2026 Phase 2 Software Development Stream.

It is a New Zealand environmental action and community platform using Quests,
XP, Achievements, streaks, Community Challenges, and Leaderboards to encourage
participation.

AI tools assist development. The project author remains responsible for every
accepted decision and all submitted work.

## Source of Truth

Use this priority order:

1. Current explicit human instruction.
2. Accepted ADRs.
3. Accepted documents under `/specs`.
4. Source code, migrations, configuration, tests, and running behaviour.
5. AI-generated proposals and review comments.

Accepted ADRs and specifications define intended behaviour.

Source code, migrations, configuration, tests, and running behaviour define
what is currently implemented.

Never treat a specification, AI response, checklist, or review record as proof
that a feature has been implemented.

## Repository Structure

```text
frontend/
backend/
specs/
.clinerules/
AGENTS.md
```

Keep frontend and backend responsibilities separated. Do not move business
rules to the frontend when they must be enforced by the backend.

## Technology Baseline

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- daisyUI
- TanStack Query
- Zustand

### Backend

- C#
- .NET 10+
- ASP.NET Core
- Entity Framework Core
- PostgreSQL
- ASP.NET Core Identity
- HttpOnly cookie authentication
- Scalar API documentation

Do not replace a major technology or install a new dependency without explicit
approval.

## Development Workflow

Before implementing a significant task:

1. Read relevant accepted specifications and ADRs.
2. Inspect the current repository implementation.
3. Separate intended behaviour from implemented behaviour.
4. Identify conflicts or missing decisions.
5. Obtain human approval for architecture, security, schema, or scope changes.
6. Implement the smallest useful vertical slice.
7. Run relevant verification commands.
8. Review Git diff and report remaining risks.

Prefer simple, explicit, maintainable solutions.

Avoid speculative features, premature abstractions, unrelated refactoring, and
duplicate implementations.

## Agent Roles

- ChatGPT supports product decisions, MSA interpretation, architecture
  discussion, UX analysis, and documentation review.
- Claude supports high-risk planning, architecture, security, data-model/API
  review, and independent review.
- DeepSeek through Cline performs routine approved implementation, testing,
  debugging, and command execution.
- Codex performs repository-aware analysis, focused approved implementation,
  review, and verification through the Codex interface.

Agent roles do not override the source-of-truth order or human approval.

## Security

Backend enforcement is mandatory for:

- authentication;
- authorization;
- resource ownership;
- validation;
- antiforgery protection;
- CORS;
- rate limiting;
- sensitive evidence handling;
- privacy thresholds.

Do not rely on hidden buttons or frontend state for security.

## Testing and Verification

Run the checks relevant to changed code or configuration.

Frontend checks may include:

- build;
- lint;
- TypeScript type-check;
- unit tests;
- end-to-end tests where required.

Backend checks may include:

- build;
- unit tests;
- PostgreSQL integration tests;
- migration verification.

Never claim that a command or test passed unless it was actually executed and
its result was observed.

## Git Safety

- `main` is the deployable source of truth.
- Do not make substantial changes directly on `main`.
- Use one short-lived branch per independent task.
- Before editing, inspect the current branch and working tree.
- Never discard unrelated user changes.
- Do not commit, push, merge, rebase, amend, reset, clean, force-push, delete a
  branch, or create/update a pull request without explicit approval in the
  current task.
- Before requesting approval, report changed files, `git diff --stat`, checks
  run, results, risks, and unfinished work.

## MSA Requirements

Maintain compliance with the accepted MSA requirements, including:

- React frontend;
- C# .NET backend;
- Entity Framework Core;
- persistent database;
- CRUD;
- frontend and backend tests;
- deployed frontend and backend;
- Scalar API documentation;
- responsive UI;
- AI usage evidence under `/specs`.