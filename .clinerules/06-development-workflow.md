# 06 — Development Workflow

## 6.1 Git Branch Strategy
- `main` — protected, requires PR + review + CI pass
- Feature branches: `feature/<description>` or `fix/<description>`
- Branch naming: lowercase, hyphens for separators
- No direct commits to `main`; all changes via pull request

## 6.2 Commit Convention
- Follow [Conventional Commits](https://www.conventionalcommits.org/) 1.0
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`
- Keep descriptions concise; use body for rationale when needed
- Example: `feat(users): add createUser service function`
- Example: `fix(tasks): handle null dueDate in updateTask`

## 6.3 Pull Request Requirements

### Solo Mode (current)
- PR required
- CI required (lint, type-check, tests, audit)
- Agent self-review checklist required
- Human final diff review required
- No approval count requirement

### Team Mode (when collaborators join)
- PR required
- CI required
- At least one independent approval required

## 6.4 Code Quality Gates
- `npm run lint` passes (ESLint, no errors, no warnings)
- `npm run typecheck` passes (`tsc --noEmit`)
- `npm test` passes (unit + integration)
- `npm audit` returns no critical or high CVEs
- Circular dependency check passes (`madge`)

## 6.5 Agent Workflow Guidelines
- Start each task by reading relevant context files before modifying
- Make focused, minimal changes; avoid unrelated refactoring in feature PRs
- Run lint + type-check after each change set; fix issues before proceeding
- When tests fail, first identify the root cause: implementation bug, incorrect test assumption, stale fixture, or environment issue. Fix the source code when the implementation is wrong. Only modify test assertions when the contract has demonstrably changed, and explain why in the task summary.
- Commit logical units of work; avoid monolith commits

## 6.6 Code Review Checklist
- [ ] Does the change follow the layered architecture (routes → services → db)?
- [ ] Are all SQL queries parameterized?
- [ ] Is all user input validated with Zod before reaching services?
- [ ] Are public APIs documented?
- [ ] Are symbols exported only when another module actually needs them?
- [ ] Do tests cover happy path and error cases?
- [ ] Are any dangerous patterns introduced into runtime code?
- [ ] Did CI pass all checks?

## 6.7 Release Process
- Version bumps follow SemVer
- Changelog updated before release
- Tag releases: `v<major>.<minor>.<patch>`
- Deploy from tag, not from branch head