# 07 — Agent Task Workflow

## 7.1 Bounded task workflow

Every task uses:

1. one short task contract;
2. one implementation owner;
3. targeted tests during implementation;
4. applicable full gates once at the end;
5. for important or high-risk work, one independent read-only review in a
   separate session;
6. one concentrated correction pass;
7. a closure check limited to original unresolved Blocker/Major findings.

The reviewer may be Kimi K3 or a fresh Codex session. Do not run both Kimi and
Codex reviews for the same normal task. Minor findings are recorded and
deferred. Optional findings are not implemented by default. A second full
review requires explicit human reopening.

Low-risk documentation, styling, and isolated UI work may finish with
automated gates, implementation-session self-check, and human inspection unless
the human requests independent review.

## 7.2 Short task contract

Define:

- Goal;
- Scope;
- Out of scope;
- Definition of Done;
- Verification;
- Risk;
- Stop condition.

Stop and request a decision when the work requires a scope, architecture,
security, schema, dependency, destructive-operation, or Git-write approval not
already granted.

## 7.3 Quality gate matrix

| Change type | Applicable gates |
| --- | --- |
| Markdown/documentation | Document review and Git diff checks |
| Frontend source | Targeted frontend tests, then applicable verified frontend scripts |
| Backend source | Targeted backend tests, then build and applicable verified test projects |
| Full-stack contract | Affected backend and frontend gates |
| Database/migration | Build and applicable PostgreSQL integration tests |
| Dependency/lockfile | Approved restore/install plus affected build and tests |
| CI/configuration | Syntax review and affected verified commands |

When multiple categories apply, use their union. Do not invent a missing
command. Do not repeatedly rerun an unchanged failing command.

## 7.4 Independent review scope

A review task must:

- read the task contract, current diff, and directly affected source/test
  files;
- read at most one previous review file;
- not recursively traverse historical prompts, reviews, or reports;
- not inspect more than 25 files without human approval;
- not repeatedly reopen the same unchanged file;
- not repeatedly rerun successful full suites;
- stop tool use and return a verdict when sufficient evidence exists.

Findings are classified as Blocker, Major, Minor, or Optional. Approval
requires zero Blockers and zero Majors.

## 7.5 Error recovery

When a check fails, classify the cause before editing:

1. implementation bug introduced by the task;
2. incorrect test assumption after a verified contract change;
3. stale fixture;
4. unrelated pre-existing failure;
5. environment issue.

Perform only non-destructive recovery within scope. Database resets,
container-volume deletion, unrelated process termination, dependency changes,
or other destructive cleanup require approval. Never weaken a test merely to
make it pass.

## 7.6 Completion

Before reporting completion:

- confirm the Definition of Done;
- observe all applicable final gate results;
- review the final diff for scope and security;
- record unresolved risks and deferred Minor findings;
- create a completion report only when the task requires one and final gates
  have passed;
- do not stage, commit, push, merge, reset, revert, or deploy without explicit
  human approval.
