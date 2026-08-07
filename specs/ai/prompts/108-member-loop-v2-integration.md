# Member Loop, Community masonry, and V2 integration

## Implementation instruction

Use `codex/feat/member-loop-gamification` (`50042b0`, `7b36190`) as the
functional baseline. Preserve its public Passport API and `/p/:shareId` page,
Public Passport settings, Reward Inbox, expanded Leaderboard scope, Verified
Story provenance, AppShell reward delivery, scroll restoration, and green
completed-Quest action.

Integrate the accepted Community masonry/cover fix `f87a410`, then apply the
V2 community challenge, place search, whole-Passport PNG, and per-Quest card
work from `d4f85dd`. Resolve overlapping Passport routes as:

- `/p/:shareId`: anonymous opt-in public Passport;
- `/passport/share`: authenticated whole-Passport PNG builder;
- `/passport/share/completion`: authenticated single-Quest PNG builder.

Preserve the unrelated `frontend/index.html` change in the original worktree.
Renumber imported evidence files so Member Loop prompts 96–101 and reports
37–42 stay unique. Run complete applicable frontend and backend gates. Fix
only integration-caused or deterministically exposed test problems; do not
change the production database model solely to make tests pass.
