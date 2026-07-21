# Git Branch and Merge Safety

## Branch policy

- `main` is the deployable source of truth.
- Do not implement substantial code changes directly on `main`.
- Use one short-lived branch for each independent task.
- Suggested prefixes:
  - `feat/`
  - `fix/`
  - `test/`
  - `docs/`
  - `refactor/`
  - `chore/`

## Before editing

Before modifying files:

1. Run `git branch --show-current`.
2. Run `git status --short`.
3. Confirm that the current branch matches the assigned task.
4. Stop and report if unrelated uncommitted changes exist.
5. Never discard existing user changes.

## Allowed actions

The agent may:

- Inspect Git status, log, and diff.
- Create a task branch after the user has approved its name.
- Modify files on the approved task branch.
- Run tests, linting, type-checking, and builds.
- Prepare a proposed commit message.

## Actions requiring explicit user approval

Do not perform any of the following without explicit approval in the
current task:

- Commit changes.
- Switch back to `main`.
- Merge a branch.
- Rebase a branch.
- Push commits or branches.
- Delete a branch.
- Create or update a pull request.
- Amend a commit.
- Run `git reset`.
- Run `git clean`.
- Force push.
- Modify Git history.

## Completion report

Before requesting approval to commit or merge, report:

- Current branch.
- Changed files.
- `git diff --stat`.
- Summary of the implementation.
- Tests and checks executed.
- Test results.
- Known risks or unfinished work.

After committing on a feature branch, stop and wait for approval before
merging or pushing.