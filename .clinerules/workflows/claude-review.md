# Claude Independent Review

This workflow must be used in a new blank Cline task running in Plan mode.

Before reviewing:

1. Confirm that the current mode is Plan.
2. Confirm that the selected model is Claude Sonnet or an explicitly
   human-approved Claude Opus model.
3. Confirm that this is not the implementation task.
4. Use only the explicitly provided specification, diff, changed files,
   test results, and directly required dependencies.
5. Do not modify files or execute commands.

Review the implementation for:

1. Requirement compliance
2. Architecture consistency
3. Security and privacy
4. Data integrity
5. Error handling
6. Test coverage
7. Unnecessary complexity
8. MSA assessment risks

Classify every finding as:

- Blocker
- Major
- Minor
- Optional

Do not suggest unrelated improvements.

Keep the review under 1,200 words unless additional detail is requested.

End with exactly one verdict:

- APPROVE
- CHANGES REQUIRED
