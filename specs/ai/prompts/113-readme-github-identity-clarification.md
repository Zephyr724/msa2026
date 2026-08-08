# README GitHub Identity Clarification — Prompt Record

Date: 2026-08-08

## Actual user instruction

> This is bad — there's an urgent issue now, and the README needs to be updated: I found that the submitted PR shows two participants. Both are my GitHub accounts, but I'm worried the MSA judges will misunderstand, since it's stated to be solo development. This should never have happened — I had account separation set up locally. Why did this happen? You explain it; it was basically caused by you. Please update the README to clarify this objectively and convincingly, with evidence. You've really gotten me into trouble this time.

The user supplied three screenshots showing two GitHub participants on a pull
request: `Zephyr724` and `zephyr942`.

The user then specified the placement:

> It should go at the very end.

## Implementation instruction

Investigate the repository's Git author and committer metadata, configuration
sources, remote ownership, and the relevant public GitHub pull-request and
commit attribution. Explain the cause accurately rather than assuming that two
avatars mean two human developers.

Add a clear README clarification at the end of the file that:

- Kiwimpact remains an individual project developed by one human;
- the product owner controls both displayed GitHub accounts;
- pull-request/push authentication and commit author metadata are independent;
- agent-assisted local commits inherited an unintended user-global Git identity
  because no repository-local author override was present;
- GitHub consequently displayed the repository/PR account and commit-attributed
  account as separate participants;
- the workflow should have checked the intended repository author identity
  before committing;
- public, reproducible evidence is linked without pretending that GitHub's
  public API can independently prove that two accounts have the same human
  owner.

Preserve the existing README work and unrelated working-tree changes. Do not
rewrite Git history, stage, commit, push, merge, or deploy without explicit
human approval.
