# Member Loop regression corrections

## Reconstructed implementation instruction

Correct the regressions reported after integrating the Member Loop work while
making all changes only in the retained `codex/integrate-member-loop-v2`
worktree and leaving `main` untouched.

- Keep the current scroll position when a member switches the My Quests view
  to Completed (or another same-page status tab).
- Restore the green `View Quest` action in Passport completion history.
- Show the server-provided completion encouragement title and message in the
  immediate Reward feedback.
- Keep Passport image sharing as the sharing surface on the Passport page and
  move optional public-link management to Profile Settings.

Add focused regression coverage, run every applicable frontend gate, review
the resulting diff, and obtain one independent read-only review. Do not stage,
commit, push, merge, or update the pull request without explicit human
approval.
