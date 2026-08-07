# Community follow-up independent review and correction prompt

## Source

Truthful reconstruction of the delegated review instruction issued on
2026-08-07 for source task `019fb793-4227-7ae1-97d0-6fc84e256d23`.

## Instruction

Identify every committed and pushed source-task change that does not yet have a
qualified independent review. Use the configured Kimi K3 CLI for one strict,
read-only full review covering security and privacy, data and API contracts,
React behavior, Community likes/comments, masonry and cover fallbacks,
Development seeds, AppShell scroll restoration, test truthfulness, migrations,
dependencies, and commit scope.

Record Blocker, Major, and Minor findings with commit-specific file and line
evidence. If Blocker or Major findings exist, make one concentrated correction,
run the applicable gates, and ask the same K3 session for one targeted closure
check limited to the original Blocker/Major findings. Safe in-scope Minors may
be corrected without a closure check. Do not stage, commit, push, modify a pull
request, merge, deploy, or touch the member-loop-gamification worktrees.
