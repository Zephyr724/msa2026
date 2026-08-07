# Branch history recovery and local cleanup

## Reconstructed implementation instruction

Audit the recent local branches, reflogs, remote-tracking refs, worktrees, and
working-tree changes to explain reported feature and bug regressions. Preserve
all unique work until its reachability is proven. Merge the latest
`origin/main` into `codex/integrate-member-loop-v2` without rebasing or force
pushing, resolve conflicts by retaining both accepted behaviours, and restore
the omitted `fix/community-followup-review` correction (`1f4fc41`).

Run the complete applicable frontend and backend gates, review the final diff,
obtain one independent read-only review, and only then remove local branches
and worktrees whose functional content is already reachable from `main` or the
retained integration branch. Do not push, create a pull request, delete remote
branches, or claim that unobserved checks passed.
