# 06 — Development Workflow

## 6.1 Git branch strategy

- `main` is the deployable source of truth.
- Use short-lived branches with the actual prefixes `feat/`, `fix/`, or
  `docs/`.
- Use lowercase descriptions with hyphens.
- Follow the pull-request and CI workflow manually where controls are not
  technically enforced; do not claim an inactive control is enforced.
- Git write actions require explicit human approval.

## 6.2 Commit convention

- Follow Conventional Commits 1.0.
- Use `type(scope): description`.
- Keep commits small and meaningful.
- Agents propose commit messages unless the human explicitly approves the
  commit action.

## 6.3 Task execution

- Start from a short task contract and directly relevant context.
- Keep changes focused and avoid unrelated refactoring.
- Run targeted tests while implementing.
- After implementation is complete, run the applicable full gates once.
- Diagnose failures before changing source or tests.
- Fix failures introduced by the task. Report unrelated failures without
  silently expanding scope.

## 6.4 Verified quality gates

Run frontend commands from `frontend/`:

```bash
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

Run backend commands from `backend/`:

```bash
dotnet build Kiwimpact.slnx
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
```

Select gates proportionally:

- documentation-only changes: document review and Git diff checks;
- frontend changes: affected targeted tests, then applicable frontend gates;
- backend changes: affected targeted tests, then backend build and applicable
  unit or PostgreSQL integration tests;
- database or migration changes: backend build plus applicable PostgreSQL
  integration tests;
- full-stack changes: the applicable frontend and backend gates.

Do not require Prettier, `npm run typecheck`, `dotnet format`, speculative
security scans, or end-to-end commands when no verified repository command is
available. If a needed command is absent, report the gap instead of inventing
one.

## 6.5 Review checklist

- Does the change follow accepted architecture and dependency direction?
- Are backend security, authorization, ownership, and validation boundaries
  enforced on the backend?
- Are public contracts allowlisted and documented where applicable?
- Do tests cover meaningful success and failure behaviour?
- Were applicable commands actually run and their results observed?
- Does the final diff contain only in-scope changes?

## 6.6 Deployment and submission

Deployment follows an accepted deployment specification or ADR and requires
explicit human approval. Do not create tags, releases, or changelog
requirements unless adopted. Before submission, verify public access and all
applicable gates.
