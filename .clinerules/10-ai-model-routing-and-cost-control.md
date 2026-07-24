# 10 — AI Model Routing and Cost Control

This rule applies risk-based routing while controlling duplicate review and
context cost. All agents follow `AGENTS.md`.

## Implementation

- Codex is the default implementation agent.
- Use normal or medium effort for low-risk work.
- Use high effort for authentication, authorization, migrations,
  data-integrity, deployment, and cross-stack contracts.
- Ultra or maximum effort is exceptional and requires human approval.
- Cline with DeepSeek is a low-risk or quota-constrained fallback, not a
  mandatory implementation route.
- One task has one implementation owner.

## Independent review

- Important and high-risk tasks require one independent read-only review.
- Kimi K3 is the preferred cross-model reviewer during the initial trial.
- A fresh Codex session is the fallback reviewer.
- The reviewer must not be the implementation session.
- Claude is escalation-only when the normal implementation/review pair cannot
  resolve a concrete high-risk problem.
- Do not use multiple independent reviewers for one normal task.
- Do not run Kimi, Codex, and Claude sequentially on the same normal task.

Reviews classify findings as Blocker, Major, Minor, or Optional. Approval
requires:

- Blocker = 0;
- Major = 0.

One independent full review may be followed by one concentrated correction
pass and one targeted closure check of original unresolved Blocker/Major
findings. A second full review or reviewer requires explicit human approval.

## Cost and context control

- Review prompts must define exact scope.
- Read the task contract, current diff, and directly affected source/test
  files.
- Do not recursively read historical prompts, reviews, or reports.
- Stop before inspecting more than 25 files and ask before expanding scope.
- Read at most one prior review.
- Do not repeatedly read unchanged files.
- Do not repeatedly rerun successful full suites.
- Return a verdict when sufficient evidence exists.

## Claude escalation

Claude is not a routine planner, implementer, or reviewer. Escalation requires
a concrete high-risk problem that the normal pair cannot resolve, such as an
unresolved reproducible Blocker involving authentication, authorization,
data integrity, migration safety, or architecture. A third reviewer or
Claude escalation requires explicit human approval.
