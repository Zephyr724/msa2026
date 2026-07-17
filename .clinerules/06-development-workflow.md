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
- PR title matches Conventional Commits format
- Description includes: what changed, why, testing performed
- CI must pass (lint, type-check, tests, audit)
- At least one approving review required for merge
- No merge commits with unresolved conversations

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
- When tests fail, fix the source code — do not modify test assertions unless the contract changed
- Commit logical units of work; avoid monolith commits

## 6.6 Code Review Checklist
- [ ] Does the change follow the layered architecture (routes → services → db)?
- [ ] Are all SQL queries parameterized?
- [ ] Is all user input validated with Zod before reaching services?
- [ ] Are new functions/types/dependencies exported and documented?
- [ ] Do tests cover happy path and error cases?
- [ ] Are any dangerous patterns introduced into runtime code?
- [ ] Did CI pass all checks?

## 6.7 Release Process
- Version bumps follow SemVer
- Changelog updated before release
- Tag releases: `v<major>.<minor>.<patch>`
- Deploy from tag, not from branch head