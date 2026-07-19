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
- Example: `feat(quests): add organizer quest creation`
- Example: `fix(claims): prevent duplicate XP awards`

## 6.3 Pull Request Requirements

### Solo Mode — target policy
- PR required
- CI required (all currently configured gates)
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

The following gates are planned project quality controls. A gate is active
only after the corresponding command or tool exists in repository
configuration, has been executed successfully, and is marked active in
`PROJECT_STATUS.md`. The required subset for a task is selected by the
Quality Gate Matrix in `07-agent-workflow.md` §7.1.

### Frontend gates (active after scaffold and verification)
- `npm run format:check` passes (Prettier)
- `npm run lint` passes (ESLint, no errors, no warnings)
- `npm run typecheck` passes (`tsc --noEmit`)
- `npm test` passes (unit + integration)
- `npm run build` passes for production source changes and release candidates

### Backend gates (active after scaffold and verification)
- `dotnet format --verify-no-changes` passes
- `dotnet build` passes
- `dotnet test` passes
- EF Core migrations are up-to-date and verified

### Cross-cutting gates (active after configuration)
- No untriaged critical/high vulnerability may remain
- Reachable critical/high CVEs in production dependencies block merge
- Approved temporary exceptions must comply with `04c-dependency-security.md`

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
  controllers → application services → repository interfaces,
  with services also using domain rules?
- [ ] Are EF Core queries restricted to repository implementations
  in `Kiwimpact.Infrastructure`?
- [ ] Are resource-level authorization decisions enforced in application
  services, not assumed from HTTP middleware?
- [ ] Is user input validated before reaching services?
  (Frontend: Zod forms improve UX; backend: DataAnnotations and
  application/domain validation are independently authoritative.)
- [ ] Are public APIs documented?
- [ ] Are symbols exported only when another module actually needs them?
- [ ] Do tests cover happy path and error cases?
- [ ] Are any dangerous patterns introduced into runtime code?
- [ ] Did all applicable local or CI gates pass, and were their results
  observed?

## 6.7 Deployment and Submission

- Deployment procedure remains governed by an accepted deployment
  specification or ADR.
- Do not create tags, releases, or changelog requirements unless explicitly
  adopted.
- Frontend and backend deployment must remain publicly accessible for marking.
- Before submission, verify public access in a private/incognito browser.
- Do not commit after the confirmed MSA submission deadline.

## 6.8 Commit History Requirements

- Maintain small, meaningful commits throughout development.
- Do not combine the entire assessment into one final commit.
- Agents still require explicit approval before committing.
