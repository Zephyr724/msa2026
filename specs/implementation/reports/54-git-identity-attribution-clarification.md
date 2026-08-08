# Git Identity Attribution Clarification

Date: 2026-08-08
Repository: `Zephyr724/msa2026`
Prompt: `specs/ai/prompts/113-readme-github-identity-clarification.md`

## Ownership statement

The product owner states that `Zephyr724` and `zephyr942` are both GitHub
accounts controlled by the same person. Kiwimpact is an individual project;
the two account identities do not represent two human developers.

This ownership statement is necessarily a declaration by the account owner.
GitHub's public profile and commit APIs expose two separate accounts and their
attribution, but do not provide a public field that can independently prove
that both accounts are controlled by the same human. The evidence below instead
demonstrates exactly why both identities appear on the same pull requests and
is consistent with the owner's declaration.

## Root cause

Git push authentication and Git commit authorship are independent:

- the remote belongs to `Zephyr724`, and the public pull-request creation and
  merge operations are attributed to that repository owner account;
- the author and committer identity embedded in locally created commits came
  from `user.name` and `user.email` in Git configuration;
- the agent-assisted commit workflow used the available Git configuration
  without first verifying that it matched the intended repository identity;
- the repository had no local `user.name` or `user.email` override, so Git fell
  back to the user-global `zephyr942` identity and its University of Auckland
  email address;
- GitHub associated that commit email with the `zephyr942` profile, while PR
  creation and merging remained associated with `Zephyr724`.

Regardless of which credential authenticated a push, the push operation does
not alter the author identity already stored in the commit. The missed
repository-specific author check was a workflow/configuration error, not
evidence of a second contributor.

GitHub's official documentation independently confirms the attribution
mechanism:

- [Why are my commits linked to the wrong user?](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/troubleshooting-commits/why-are-my-commits-linked-to-the-wrong-user)
  states that GitHub links a commit to a user through the email address in its
  commit header and that an address connected to another account produces that
  account attribution.
- [Setting your commit email address](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address?platform=mac)
  documents that a single-repository `user.email` overrides the global setting
  for future commits, while existing commits retain their previous email
  association.

## Reproducible local observations

The following read-only checks were run on 2026-08-08.

### Remote owner

```bash
git remote -v
```

Observed fetch and push remote:

```text
git@github.com:Zephyr724/msa2026.git
```

### Effective author configuration

```bash
git config --show-origin --get-regexp '^user\.(name|email)$'
git config --local --get-regexp '^user\.(name|email)$'
```

The first command returned only the global user-level configuration. The email
is redacted here to reduce unnecessary replication of personal data; it remains
visible in the linked public commit metadata:

```text
~/.gitconfig  user.name zephyr942
~/.gitconfig  user.email <University email associated with zephyr942>
```

The repository-local query returned exit code 1 with no output, confirming
that this repository had no local author override at the time of inspection.

### History shape

```bash
git log --all --no-merges --format='%an <%ae>' | sort | uniq -c
```

Observed result:

```text
121 zephyr942 <University email associated with zephyr942>
```

At the inspection point, every non-merge commit reachable from the local refs
used one Git author identity. The other visible identity, `Zephyr`, appears in
GitHub-generated pull-request merge commits with `GitHub
<noreply@github.com>` as committer. This history pattern explains the two
avatars: one account identity authored the content commits and the other owned
and merged the pull requests.

## Public GitHub example

[PR #42](https://github.com/Zephyr724/msa2026/pull/42) is a concrete example:

- GitHub's public PR response identifies `Zephyr724` as the PR author,
  repository owner, and merger; the head label is
  `Zephyr724:feat/ui-sound-effects`, so it was not an external fork.
- The PR contains
  [commit `b02db7b`](https://github.com/Zephyr724/msa2026/commit/b02db7b547ff39fd3af9ccb3ac5f129d06faf5de)
  and
  [commit `ed03ef5`](https://github.com/Zephyr724/msa2026/commit/ed03ef524ddcd5985397cc65bdb207854f7d5a27).
- The public commit responses expose `zephyr942` as both GitHub author and
  committer and expose the same University of Auckland address in the embedded
  Git author and committer fields.

Public API endpoints used for verification:

- <https://api.github.com/repos/Zephyr724/msa2026/pulls/42>
- <https://api.github.com/repos/Zephyr724/msa2026/pulls/42/commits>
- <https://api.github.com/repos/Zephyr724/msa2026/commits/b02db7b547ff39fd3af9ccb3ac5f129d06faf5de>
- <https://api.github.com/repos/Zephyr724/msa2026/commits/ed03ef524ddcd5985397cc65bdb207854f7d5a27>

## Corrective action

- Added the README clarification at the end, following the product and
  submission information, as directed by the product owner.
- Linked the public PR and commit evidence directly from the README.
- Recorded the distinction between account-ownership declaration and facts
  independently visible in Git/GitHub metadata.
- Did not rewrite existing Git history: doing so would change published commit
  hashes and require force-pushing shared branches.
- Did not change the current Git configuration because the intended canonical
  name/email must be confirmed by the product owner before modifying repository
  metadata.

Before the next commit, configure and verify a repository-local identity for
the intended `Zephyr724` account, then confirm it with:

```bash
git config --local user.name '<intended display name>'
git config --local user.email '<email linked to Zephyr724>'
git config --show-origin --get-regexp '^user\.(name|email)$'
```

## Verification

- `git diff --check` — passed with no output.
- README relative-link existence check — passed; no missing local target.
- Independent read-only review — completed; see
  `specs/ai/reviews/98-readme-github-identity-clarification-codex-review.md`.

No application source, dependency, database, authentication, deployment, or
runtime behavior was changed; application build and test gates are not
applicable to this documentation-only clarification.

## Known limitations

- Public GitHub metadata proves the attribution path but cannot prove common
  human ownership of two separate accounts; that fact remains the explicit
  declaration of the product owner.
- Public GitHub metadata does not expose which SSH credential authenticated a
  historical command-line push. That fact is not required to explain the
  observed commit attribution and is not claimed in the README.
- Existing published commits remain attributed to `zephyr942`. The README and
  this record clarify why rather than altering public history.
- Future commits will repeat the ambiguity until an intended repository-local
  author identity is configured and verified.

## Review status

Independent read-only review completed on 2026-08-08. The reviewer found no
Blocker, one evidence-boundary Major, and three wording/privacy Minors. The
Major was closed by removing the unsupported historical push-credential claim
and explicitly documenting that limitation. A targeted closure check found one
remaining past-tense sentence that could still imply a known credential; it
was replaced with the reviewer's exact credential-neutral wording. The Minors
were closed by using the correct global user-level Git terminology, redacting
the repeated email value in this report, and distinguishing human contributors
from disclosed AI assistance. See
`specs/ai/reviews/98-readme-github-identity-clarification-codex-review.md`.
