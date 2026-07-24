# D1 — Streamline Codex Workflow Prompt Evidence

- **Date:** 2026-07-24
- **Tool and model:** Codex desktop, GPT-5
- **Task purpose:** Make Codex the default implementation agent, bound
  independent review and evidence traversal, align workflow commands with
  verified repository commands, and correct stale Slice 1 status.
- **Prompt provenance:** Exact prompt supplied by the human in an attached text
  file.

## Actual prompt used

> # D1 — Streamline Codex Workflow and Repository Status
>
> This is a bounded documentation-only task.
>
> The objective is to make Codex the default implementation agent, preserve one
> independent review for important and high-risk work, impose a lean deadline
> workflow, correct stale Slice 1 status text, and align repository instructions
> with commands that actually exist.
>
> The objective is to reduce duplicate and recursive review work, not to remove
> review.
>
> Do not audit the full repository.
> Do not read historical prompts or reviews.
> Do not modify production code, tests, dependencies, migrations, product
> requirements, UX specifications, security specifications, data specifications,
> API specifications, or ADR-0001 through ADR-0008.
>
> ## Preconditions
>
> Run only:
>
> - git status --short
> - git branch --show-current
> - git log --oneline origin/main..HEAD
> - git diff --check HEAD
>
> Expected branch:
>
> docs/streamline-codex-workflow
>
> Stop and report before editing if:
>
> - the branch is wrong;
> - unrelated uncommitted changes exist;
> - the working tree contains production-code changes;
> - the local commit state differs from the human description.
>
> ## Read only these files
>
> - AGENTS.md
> - .clinerules/06-development-workflow.md
> - .clinerules/07-agent-workflow.md
> - .clinerules/10-ai-model-routing-and-cost-control.md
> - specs/ai/01-ai-development-workflow.md
> - specs/ai/02-agent-context-and-governance.md
> - specs/ai/agent-instructions/01-model-routing-policy.md
> - PROJECT_STATUS.md
> - README.md
> - specs/README.md
> - specs/implementation/01-slice-1-region-quest-read.md
> - specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md
>
> Do not recursively follow links from these files.
> Do not inspect historical AI prompt or review directories.
>
> ## Required changes
>
> ### 1. AGENTS.md
>
> Make AGENTS.md the concise cross-agent repository instruction entry point.
>
> It must state:
>
> - Codex is the default planning, implementation, testing, debugging, and
>   documentation agent.
> - The human remains responsible for every accepted decision and submitted
>   change.
> - Human approval is required for:
>   - product-scope changes;
>   - architecture and ADR changes;
>   - authentication or security-model changes;
>   - database-schema changes;
>   - dependencies;
>   - destructive operations;
>   - stage, commit, push, merge, reset, revert, and deployment.
> - Cline + DeepSeek is an optional low-risk or quota-constrained fallback, not a
>   mandatory implementation route.
> - Important and high-risk tasks require one independent read-only review.
> - The independent reviewer may be Kimi K3 or a fresh Codex session, selected by
>   the human according to availability, cost, and task risk.
> - The reviewer cannot be the same session that implemented the task.
> - Claude is escalation-only when the normal implementation/review pair cannot
>   resolve a concrete high-risk problem.
> - One task has one implementation owner.
> - Important tasks allow:
>   - one independent full review;
>   - one concentrated correction pass;
>   - one targeted closure check limited to original unresolved Blocker/Major
>     findings.
> - A second full review or second reviewer requires explicit human approval.
> - Historical prompts, reviews, and completion reports must not be recursively
>   traversed.
> - Stable decisions should be referenced rather than copied.
> - Include only verified repository commands.
> - Do not claim that planned behaviour is implemented unless source, tests, and
>   observed verification support the claim.
>
> Keep AGENTS.md concise.
> Do not copy every ADR or .clinerules file into it.
>
> ### 2. .clinerules/06-development-workflow.md
>
> Remove or correct commands that do not exist.
>
> Use verified commands only.
>
> Frontend:
>
> - npm run lint
> - npm run type-check
> - npm run test -- --run
> - npm run build
>
> Backend:
>
> - dotnet build Kiwimpact.slnx
> - the actual unit-test command already used by the repository
> - the actual PostgreSQL integration-test command already used by the repository
>
> Do not require:
>
> - Prettier when no verified command exists;
> - npm run typecheck;
> - mandatory dotnet format;
> - speculative security or E2E commands.
>
> Use actual branch prefixes:
>
> - feat/
> - fix/
> - docs/
>
> State that targeted tests may run during implementation and applicable full
> gates run once after the implementation is complete.
>
> ### 3. .clinerules/07-agent-workflow.md
>
> Add the bounded workflow:
>
> - one short task contract;
> - one implementation owner;
> - targeted tests during implementation;
> - applicable full gates once at the end;
> - one independent read-only review for important or high-risk tasks;
> - the reviewer must use a separate session;
> - the reviewer may use Kimi K3 or a fresh Codex session;
> - do not run both Kimi and Codex reviews for the same normal task;
> - one concentrated correction pass;
> - only original unresolved Blocker/Major findings receive a closure check;
> - Minor findings are recorded and deferred;
> - Optional findings are not implemented by default;
> - a second full review requires explicit human reopening.
>
> Add an evidence-traversal limit for review tasks:
>
> - read the task contract, current diff, and directly affected source/test files;
> - read at most one previous review file;
> - do not recursively traverse historical prompts, reviews, or reports;
> - do not inspect more than 25 files without human approval;
> - do not repeatedly reopen the same unchanged file;
> - do not repeatedly rerun successful full suites;
> - stop tool use and return a verdict when sufficient evidence exists.
>
> ### 4. .clinerules/10-ai-model-routing-and-cost-control.md
>
> Remove any statement that routine implementation must use DeepSeek.
>
> Replace it with risk-based routing.
>
> Implementation:
>
> - Codex is the default implementation agent.
> - Use normal or medium effort for low-risk work.
> - Use high effort for authentication, authorization, migrations,
>   data-integrity, deployment, and cross-stack contracts.
> - Ultra or maximum effort is exceptional and requires human approval.
> - Cline + DeepSeek is a low-risk or quota-constrained fallback.
>
> Independent review:
>
> - Important and high-risk tasks require one independent read-only review.
> - Kimi K3 is the preferred cross-model reviewer during the initial trial.
> - A fresh Codex session is the fallback reviewer.
> - Claude is escalation-only.
> - Do not use multiple independent reviewers for one normal task.
> - The approval threshold remains:
>   - Blocker = 0;
>   - Major = 0.
>
> Cost and context control:
>
> - review prompts must define exact scope;
> - do not recursively read historical evidence;
> - stop before inspecting more than 25 files;
> - do not repeatedly read unchanged files;
> - do not repeatedly rerun successful full suites;
> - ask before expanding review scope.
>
> ### 5. AI workflow documents
>
> Update:
>
> - specs/ai/01-ai-development-workflow.md
> - specs/ai/02-agent-context-and-governance.md
> - specs/ai/agent-instructions/01-model-routing-policy.md
>
> Preserve historical context while making the active workflow unambiguous:
>
> - AGENTS.md is the primary cross-agent instruction entry point;
> - .clinerules is Cline-compatible fallback guidance;
> - Codex is the default implementer;
> - low-risk tasks may complete with Codex self-check, automated gates, and human
>   inspection;
> - important and high-risk tasks receive one independent read-only review;
> - the independent reviewer may be Kimi K3 or a fresh Codex session;
> - implementation and review must not use the same session;
> - Claude is escalation-only;
> - never run Kimi, Codex, and Claude sequentially on the same normal task;
> - one Slice records one main implementation prompt;
> - one independent review record is saved only when a review is actually
>   performed;
> - corrections and closure results are appended to the existing task/review
>   evidence instead of creating repeated final-rereview files;
> - completion reports are created once, after final gates pass.
>
> Create:
>
> specs/ai/03-deadline-execution-mode.md
>
> It must define:
>
> - one task normally represents one demonstrable behaviour;
> - normal task size is approximately 1–3 focused development hours;
> - normal task size is fewer than 10–15 primary changed files;
> - every task contract includes:
>   - Goal;
>   - Scope;
>   - Out of scope;
>   - Definition of Done;
>   - Verification;
>   - Risk;
>   - Stop condition.
> - targeted tests run during implementation;
> - applicable full gates run once at the end;
> - low-risk documentation, styling, and isolated UI work does not require an
>   independent model review unless the human requests one;
> - medium- and high-risk tasks require one independent read-only review;
> - the reviewer may be Kimi K3 or a fresh Codex session;
> - the reviewer cannot be the implementation session;
> - only one reviewer is used per task;
> - one correction pass is allowed;
> - only original unresolved Blocker/Major findings receive a closure check;
> - Claude or a third reviewer requires explicit escalation for a reproducible
>   unresolved Blocker;
> - no Git write actions without human approval;
> - no completion report before final verification.
>
> ### 6. Repository status consistency
>
> Correct only stale factual status.
>
> README.md:
>
> - state that Slice 1 is merged and frozen;
> - remove statements saying the Slice remains uncommitted;
> - do not claim authentication, CRUD, gamification, WebSockets, Cypress,
>   Storybook, Dockerized full application, or deployment already exist.
>
> PROJECT_STATUS.md:
>
> - state that Slice 1 is complete, merged, and frozen;
> - current work is workflow/scope convergence before Slice 2;
> - remove stale uncommitted-working-tree language.
>
> specs/implementation/01-slice-1-region-quest-read.md:
>
> - mark it Implemented / Merged / Frozen;
> - remove accidental exported local-path text at the beginning, if present;
> - do not rewrite the accepted implementation history.
>
> Slice 1 completion report:
>
> - preserve historical test and working-tree evidence;
> - append only a short closure addendum stating that Slice 1 was subsequently
>   merged through PR #3 and frozen;
> - do not rewrite previous observed evidence as though it was observed later.
>
> specs/README.md:
>
> - fix broken or nonexistent references;
> - include current existing Product, Architecture, AI rule, Slice, prompt, and
>   review indexes;
> - do not add links to files that do not yet exist.
>
> ### 7. Prompt evidence
>
> Create:
>
> specs/ai/prompts/35-d1-streamline-codex-workflow.md
>
> Include:
>
> - date;
> - tool and model;
> - task purpose;
> - the actual prompt used;
> - a concise observed outcome;
> - changed files;
> - verification results;
> - human decision placeholder marked `PENDING HUMAN REVIEW`.
>
> Do not create a separate review record for D1.
>
> ## Verification
>
> Run:
>
> - git diff --check HEAD
> - git diff --stat HEAD
> - git diff --name-status HEAD
>
> Confirm that no production, test, dependency, migration, Product, UX,
> Security, Data, API, or ADR file changed.
>
> ## Final response
>
> Return:
>
> 1. files changed;
> 2. workflow decisions introduced;
> 3. stale status statements corrected;
> 4. historical rules intentionally preserved;
> 5. prompt evidence created;
> 6. git diff --check result;
> 7. diff stat;
> 8. unresolved questions;
> 9. recommended commit message.
>
> Do not stage, commit, push, merge, switch branches, reset, or create a PR.

## Observed outcome

The bounded documentation set was updated so Codex is the default
implementation owner, important/high-risk work receives one independent
read-only review, review and evidence traversal are limited, only verified
commands are prescribed, and Slice 1 is consistently described as merged and
frozen. Historical implementation and verification evidence was preserved.

## Changed files

- `AGENTS.md`
- `.clinerules/06-development-workflow.md`
- `.clinerules/07-agent-workflow.md`
- `.clinerules/10-ai-model-routing-and-cost-control.md`
- `specs/ai/01-ai-development-workflow.md`
- `specs/ai/02-agent-context-and-governance.md`
- `specs/ai/03-deadline-execution-mode.md`
- `specs/ai/agent-instructions/01-model-routing-policy.md`
- `README.md`
- `PROJECT_STATUS.md`
- `specs/README.md`
- `specs/implementation/01-slice-1-region-quest-read.md`
- `specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md`
- `specs/ai/prompts/35-d1-streamline-codex-workflow.md`

No production code, tests, dependencies, migrations, Product, UX, Security,
Data, API, or ADR files were changed.

## Verification results

- `git diff --check HEAD` — passed with no output.
- `git diff --stat HEAD` — 12 tracked documentation files changed, with 625
  insertions and 762 deletions.
- `git diff --name-status HEAD` — 12 tracked documentation files reported as
  modified.
- `git status --short` — the same 12 tracked documentation files were modified;
  `specs/ai/03-deadline-execution-mode.md` and this prompt record were the two
  expected untracked documentation files.
- All indexed targets referenced by the updated `specs/README.md` were checked
  and exist.
- The changed-path review found no production, test, dependency, migration,
  Product, UX, Security, Data, API, or ADR file changes.

## Human decision

`APPROVED BY HUMAN`
