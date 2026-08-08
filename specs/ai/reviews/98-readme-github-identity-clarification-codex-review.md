# README GitHub Identity Clarification — Independent Codex Review

Date: 2026-08-08
Reviewer: fresh Codex sub-agent, independent of the implementation owner
Review mode: read-only

## Scope

The reviewer inspected the current working-tree changes to:

- the `Individual project and GitHub identity clarification` section at the
  end of `README.md`;
- `specs/ai/prompts/113-readme-github-identity-clarification.md`;
- `specs/implementation/reports/54-git-identity-attribution-clarification.md`.

The review checked the technical distinction between Git authentication and
commit metadata, the local Git configuration and history observations, public
GitHub data for PR #42 and its two commits, ownership-claim boundaries,
privacy, wording, and repository-process readiness. The reviewer did not edit,
stage, commit, push, merge, or deploy anything.

## Verdict

The explanation and evidence chain are credible after one evidence-boundary
correction. The two-account ownership statement is correctly identified as the
product owner's declaration, while the reason both accounts appear in GitHub's
UI is supported by reproducible Git metadata, public PR/commit data, and
GitHub's official documentation.

## Findings and closure

### M1 — Historical push credential was not publicly proven — Major, closed

The initial wording grouped push authentication with the facts publicly
attributed to `Zephyr724`. A remote URL and public PR/commit metadata do not
reveal which SSH key or GitHub credential authenticated a historical
command-line push.

**Closure:** the README now claims only the verified repository ownership,
PR-creation, and merge attribution. It explains the general and sufficient
technical fact that push credentials do not rewrite existing commit author
metadata. The evidence report explicitly records that historical push
credentials are not exposed and are not required for the explanation.

The targeted closure check found one residual past-tense sentence in the
evidence report that could still imply a known historical credential. The
implementation owner replaced it with the reviewer's prescribed neutral
wording: regardless of which credential authenticated a push, pushing does not
alter the author identity already stored in the commit. The reviewer stated
that this exact correction closes M1; no second full review was performed.

### m1 — Git configuration scope terminology — Minor, closed

The initial text called `~/.gitconfig` machine-level configuration, although it
is Git's global user-level scope.

**Closure:** README and evidence now use `user-global` or `global user-level`.

### m2 — Repeated personal email exposure — Minor, closed

The University email already exists in public commit metadata, but reproducing
it repeatedly in a searchable report unnecessarily increased its exposure.

**Closure:** the report redacts the address in command output and prose while
retaining direct public GitHub links for verification.

### m3 — Human-contributor wording — Minor, closed

`external code contributor` could be read as conflicting with the separately
disclosed use of AI tools.

**Closure:** the README now says `external human contributor` and separately
states that AI assistance is disclosed rather than represented as a human
participant.

## Verified observations

- The product owner explicitly states that `Zephyr724` and `zephyr942` are
  both accounts controlled by the same person. Public GitHub APIs do not claim
  to prove common human ownership, and the documentation preserves that
  limitation.
- `origin` targets `Zephyr724/msa2026`.
- No repository-local `user.name` or `user.email` was configured; the effective
  values came from the user's global `~/.gitconfig` and mapped to `zephyr942`.
- At inspection time, all 121 non-merge commits reachable from local refs used
  that one local author identity.
- Public metadata identifies `Zephyr724` as creator and merger of PR #42 and
  shows that its head branch belonged to the same repository, not a fork.
- Public metadata maps commits `b02db7b` and `ed03ef5` to `zephyr942` and shows
  the University address embedded in their Git author/committer fields.
- GitHub's official troubleshooting and commit-email documentation supports
  the stated email-based attribution mechanism and repository-local override.
- The clarification is placed at the end of the README as explicitly directed
  by the product owner.
- `git diff --check` and the README relative-link check passed before review.

## Classification and readiness

- Blocker: 0
- Major: 1, closed
- Minor: 3, closed
- Commit readiness: ready after this review record and completion-report
  closure are included
