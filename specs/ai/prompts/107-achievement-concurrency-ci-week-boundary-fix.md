# Achievement concurrency CI week-boundary fix

- **Date:** 2026-08-07
- **Branch:** `fix/app-shell-scroll-restoration`
- **Agent:** Codex

## Reconstructed implementation instruction

Debug and fix the GitHub Actions failure in
`AchievementConcurrencyTests.TwoBackfillWorkersAwardTheSameUserExactlyOnce`,
where the test intermittently expects five achievement awards but observes
six. Preserve the production concurrency and achievement rules, make the test
fixture deterministic across Auckland calendar-week boundaries, add a focused
regression assertion, and run the applicable backend verification gates.
