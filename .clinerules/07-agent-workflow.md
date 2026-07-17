# 07 — Agent Task Workflow

## 7.1 Task Execution Protocol

1. **Read context**: Review the task specification and applicable `.clinerules/` files before proposing changes.
2. **Inspect existing code**: Examine current implementation, related tests, and database schema before modifying.
3. **Plan for complex tasks**: For multi-file or high-risk changes, produce a short implementation plan before writing code.
4. **Define acceptance criteria**: List what must be true for the task to be considered complete, and identify affected files.
5. **Implement minimally**: Make the smallest coherent change that satisfies the requirements. Avoid unrelated refactoring.
6. **Run targeted tests first**: Execute tests relevant to the changed area before the full suite.
7. **Run full quality gates**: `npm run typecheck`, `npm run lint`, `npm test`, and migration checks where applicable.
8. **Review final diff**: Verify no security issues, no scope creep, no dead code, and no commented-out code left behind.
9. **Report results**:
   - Files changed
   - Tests executed and results
   - Unresolved risks or known limitations
   - Follow-up work needed (if any)
10. **Verify completion**: Do not declare the task complete unless all acceptance criteria are verified.

## 7.2 Ambiguity Handling

- Do not invent requirements. When an unresolved decision affects public API, persistence format, security, or irreversible behavior, ask for clarification before proceeding.
- For low-risk implementation details (e.g., internal variable naming, helper extraction), state the assumption and proceed.
- When a task request is vague, narrow it with a specific proposal before implementing.

## 7.3 Approval Boundaries

Do not perform these actions without explicit human approval:

- Installing or removing dependencies (`npm install`, `npm uninstall`, `npm ci` with dependency changes)
- Committing, pushing, merging, creating releases, or modifying branch protection rules
- Deleting files or directories outside the current task scope
- Rewriting migration history or resetting Git history
- Modifying production data, database schemas outside migration files, or environment configuration
- Sending repository content to external tools or services unless the task explicitly requires it and the applicable approval policy permits it

## 7.4 Stop Conditions

Stop and report instead of claiming completion when:

- Acceptance criteria cannot be verified (e.g., tests cannot run, credentials unavailable)
- The requested change conflicts with an ADR or an active rule in `.clinerules/`
- A security-sensitive decision remains unresolved (auth mechanism, data retention, PII handling)
- Quality gates (`npm run typecheck`, `npm run lint`, `npm test`) cannot pass after reasonable fixes
- A migration fails and the correct remediation path is unclear

## 7.5 Agent Self-Review Checklist

Before marking any task as complete, verify:

- [ ] Does the change follow the layered architecture (routes → services → db)?
- [ ] Are all SQL queries parameterized (`?` placeholders, no string concatenation)?
- [ ] Is all user input validated with Zod before reaching services?
- [ ] Are error responses consistent with the API envelope format?
- [ ] Do new functions include JSDoc for public APIs?
- [ ] Are symbols exported only when another module needs them?
- [ ] Do tests cover both happy path and error cases?
- [ ] Are any dangerous patterns (`eval`, `exec`, raw HTML) introduced?
- [ ] Has `npm run typecheck` passed?
- [ ] Has `npm run lint` passed?
- [ ] Has `npm test` passed?
- [ ] Are there any debug logs, commented-out code, or TODO markers left behind?

## 7.6 Error Recovery

- If a test fails after a change, identify the root cause:
  1. Implementation bug → fix the source code
  2. Incorrect test assumption → verify contract before modifying test
  3. Stale fixture → update fixture, not the production code
  4. Environment issue (port conflict, stale DB) → clean up and retry
- If type-check or lint fails, fix issues before proceeding to the next change.
- If a migration fails, do NOT modify an already-applied migration. Create a new migration that corrects the state.

## 7.7 Context Efficiency

- Prefer reading specific sections of files over loading entire files when the task is narrow.
- Use structural overview tools when available and reliable. If symbol extraction is incomplete or inaccurate, fall back to targeted search, file listing, and selective file reads.
- Avoid manually reading conditional rule files (those with `paths` frontmatter) unless their automatic activation is uncertain or the task explicitly requires them.
