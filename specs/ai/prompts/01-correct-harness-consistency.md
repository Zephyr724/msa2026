# 003 — Correct Harness Consistency

- **Type**: Reconstructed task summary
- **Date**: 2026-07-19
- **Target**: Cline (via DeepSeek)
- **Context**: After initial migration of harness from Node.js/Express/SQLite to
  Kiwimpact (.NET/PostgreSQL/React), a detailed review identified 11 categories
  of remaining issues: legacy SQLite rules, unverified technology claims,
  fictional commands, documentation contradictions, and incomplete MSA evidence.

## Prompt Text

The task prompt was the detailed correction specification provided in the user
feedback, covering:

1. Removal of SQLite baseline commands from `06-development-workflow.md`
2. Correction of Zod-only validation to dual frontend/backend validation
3. Replacement of legacy commit examples with Kiwimpact examples
4. Removal of unverified package versions from `02-technology-stack.md`
5. Removal of `madge` and `packages.lock.json` requirements
6. Credential safety in `03-database.md`
7. Production migration procedure left undecided
8. Migration immutability rule made consistent
9. Password hashing changed to framework defaults
10. Token durations marked as planning targets
11. Vite dev proxy not trusted for forwarded headers
12. Testing commands marked as planned, not active
13. MSW dependency not introduced without approval
14. jest-dom not claimed as accessibility scanner
15. Conditional quality gates in `07-agent-workflow.md`
16. Authority hierarchy updated in `00-harness-core.md`
17. `specs/architecture/adr/` empty directory removed
18. `PROJECT_STATUS.md` created
19. AI evidence documents created in `specs/ai/`

## Outcome

All corrections applied. See the final Git diff for the complete list of
changes.