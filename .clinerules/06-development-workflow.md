# 06 — Development Workflow

## 6.1 Git Branch Strategy

### Target Policy (once controls are active)
- `main` — protected, requires PR + review + CI pass
- Feature branches: `feature/<description>` or `fix/<description>`
- Branch naming: lowercase, hyphens for separators
- No direct commits to `main`; all changes via pull request

### Current State
- Follow the same workflow manually.
- Until branch protection and CI are active, do not claim they are technically
  enforced. See `PROJECT_STATUS.md` for control status.

## 6.2 Commit Convention
- Follow [Conventional Commits](https://www.conventionalcommits.org/) 1.0
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`
- Keep descriptions concise; use body for rationale when needed
- Example: `feat(users): add createUser service function`
- Example: `fix(tasks): handle null dueDate in updateTask`

## 6.3 Pull Request Requirements

### Solo Mode — target policy
- PR required
- CI required (lint, type-check, tests, audit)
- Agent self-review checklist required
- Human final diff review required
- No approval count requirement

### Solo Mode — current state before CI is operational
- Use a feature branch or PR for review.
- Run equivalent gates locally.
- Record observed results in the task or PR summary.
- Do not claim that CI passed.

### Team Mode (when collaborators join)
- PR required
- CI required
- At least one independent approval required

## 6.4 Code Quality Gates
- `npm run format:check` passes (Prettier)
- `npm run lint` passes (ESLint, no errors, no warnings)
- `npm run typecheck` passes (`tsc --noEmit`)
- `npm test` passes (unit + integration)
- `npm run build` passes for production source changes and release candidates
- No untriaged critical/high vulnerability may remain
- Reachable critical/high CVEs in production dependencies block merge
- Approved temporary exceptions must comply with `04c-dependency-security.md`
- Circular dependency check passes (`madge`)
- `npm run db:baseline` regenerates `init_db.sql`; CI regenerates and fails if
  Git diff is non-empty (see `03-database.md`)

## 6.5 Agent Workflow Guidelines
- Start each task by reading relevant context files before modifying
- Make focused, minimal changes; avoid unrelated refactoring in feature PRs
- Agent execution follows `00-harness-core.md` and `07-agent-workflow.md`.
- Run the applicable targeted checks after each coherent source-code change
  set, according to the Quality Gate Matrix in `07-agent-workflow.md` §7.1.
  Run full applicable gates once before completion.
- When tests fail, first identify the root cause: implementation bug, incorrect test assumption, stale fixture, or environment issue. Fix the source code when the implementation is wrong. Only modify test assertions when the contract has demonstrably changed, and explain why in the task summary.
- When the user has explicitly approved committing, group changes into logical
  commits. Otherwise, prepare the working tree and propose commit messages
  without executing `git commit`.

## 6.6 Code Review Checklist
- [ ] Does the change follow the dependency direction:
  routes → services → repository interfaces,
  with services also using authorization policies?
- [ ] Are SQL statements restricted to repository implementations?
- [ ] Are resource-level authorization decisions enforced by policies
  called from services?
- [ ] Is all user input validated with Zod before reaching services?
- [ ] Are public APIs documented?
- [ ] Are symbols exported only when another module actually needs them?
- [ ] Do tests cover happy path and error cases?
- [ ] Are any dangerous patterns introduced into runtime code?
- [ ] Did all applicable local or CI gates pass, and were their results
  observed?

## 6.7 Release Process
- Version bumps follow SemVer
- Changelog updated before release
- Tag releases: `v<major>.<minor>.<patch>`
- Deploy from tag, not from branch head