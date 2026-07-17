---
alwaysApply: true
---
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

## 7.2 Agent Self-Review Checklist

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

## 7.3 Error Recovery

- If a test fails after a change, identify the root cause:
  1. Implementation bug → fix the source code
  2. Incorrect test assumption → verify contract before modifying test
  3. Stale fixture → update fixture, not the production code
  4. Environment issue (port conflict, stale DB) → clean up and retry
- If type-check or lint fails, fix issues before proceeding to the next change.
- If a migration fails, do NOT modify an already-applied migration. Create a new migration that corrects the state.

## 7.4 Context Efficiency

- Prefer reading specific sections of files over loading entire files when the task is narrow.
- Use `list_code_definition_names` for structural overview before reading full files.
- Only load `.clinerules/` files relevant to the current task (the framework uses conditional frontmatter to auto-load relevant rules).