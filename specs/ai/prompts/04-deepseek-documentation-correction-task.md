# Kiwimpact Documentation Correction Task

- **Target agent:** DeepSeek V4 Pro through Cline
- **Mode:** Act
- **Task type:** Documentation correction only
- **Date:** 2026-07-21
- **Expected final state:** Ready for independent Claude re-review

## 1. Objective

Correct the current agent instructions, AI evidence records, core domain model,
API contract, community identity data model, privacy rules, and Community
Challenge specification.

This task applies already approved documentation corrections. It must not begin
Slice 0 and must not create application source code.

## 2. Hard Scope

### Allowed

- Create or update only the Markdown files named in this task.
- Delete the false/misnamed Codex onboarding record described below.
- Read directly related accepted specifications and ADRs for consistency.
- Run available Markdown, path, link, and formatting checks.
- Inspect and report Git status and diff.

### Forbidden

Do not:

- modify `/frontend` or `/backend`;
- create source code, DTOs, controllers, entities, migrations, tests, or CI;
- install dependencies;
- introduce MediatR, CQRS, generic repositories, Unit of Work, Hangfire,
  event buses, microservices, GraphQL, or custom JWT authentication;
- change product scope beyond the resolutions in this task;
- commit, push, merge, rebase, amend, reset, clean, or switch branches without
  explicit approval;
- claim that any documented feature has been implemented.

## 3. Before Editing

Run and report:

```bash
git branch --show-current
git status --short
```

Stop and report if unrelated uncommitted changes exist. Never discard existing
user changes.

Read:

```text
AGENTS.md
.clinerules/10-ai-model-routing-and-cost-control.md
.clinerules/11-git-branch-and-merge-safety.md
specs/ai/01-ai-development-workflow.md
specs/ai/reviews/02-specification-review-2026-07-21.md
specs/ai/reviews/03-specification-review-resolution.md
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/data/01-community-identity-data-model.md
specs/product/02-community-identity-and-gamification-scope-update.md
specs/product/03-community-challenge-scope.md
specs/security/01-community-privacy-rules.md
```

Read directly referenced accepted ADRs only when necessary.

---

# Part A — Shared Agent and AI Evidence Files

## 4. Create or Update Root `AGENTS.md`

Create `AGENTS.md` in the repository root if it does not exist. If it already
exists, merge the following requirements without duplicating sections.

```md
# Kiwimpact Agent Instructions

## Project Overview

Kiwimpact is an individual full-stack web application for the Microsoft
Student Accelerator 2026 Phase 2 Software Development Stream.

It is a New Zealand environmental action and community platform using Quests,
XP, Achievements, streaks, Community Challenges, and Leaderboards to encourage
participation.

AI tools assist development. The project author remains responsible for every
accepted decision and all submitted work.

## Source of Truth

Use this priority order:

1. Current explicit human instruction.
2. Accepted ADRs.
3. Accepted documents under `/specs`.
4. Source code, migrations, configuration, tests, and running behaviour.
5. AI-generated proposals and review comments.

Accepted ADRs and specifications define intended behaviour.

Source code, migrations, configuration, tests, and running behaviour define
what is currently implemented.

Never treat a specification, AI response, checklist, or review record as proof
that a feature has been implemented.

## Repository Structure

```text
frontend/
backend/
specs/
.clinerules/
AGENTS.md
```

Keep frontend and backend responsibilities separated. Do not move business
rules to the frontend when they must be enforced by the backend.

## Technology Baseline

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- daisyUI
- TanStack Query
- Zustand

### Backend

- C#
- .NET 10+
- ASP.NET Core
- Entity Framework Core
- PostgreSQL
- ASP.NET Core Identity
- HttpOnly cookie authentication
- Scalar API documentation

Do not replace a major technology or install a new dependency without explicit
approval.

## Development Workflow

Before implementing a significant task:

1. Read relevant accepted specifications and ADRs.
2. Inspect the current repository implementation.
3. Separate intended behaviour from implemented behaviour.
4. Identify conflicts or missing decisions.
5. Obtain human approval for architecture, security, schema, or scope changes.
6. Implement the smallest useful vertical slice.
7. Run relevant verification commands.
8. Review Git diff and report remaining risks.

Prefer simple, explicit, maintainable solutions.

Avoid speculative features, premature abstractions, unrelated refactoring, and
duplicate implementations.

## Agent Roles

- ChatGPT supports product decisions, MSA interpretation, architecture
  discussion, UX analysis, and documentation review.
- Claude supports high-risk planning, architecture, security, data-model/API
  review, and independent review.
- DeepSeek through Cline performs routine approved implementation, testing,
  debugging, and command execution.
- Codex performs repository-aware analysis, focused approved implementation,
  review, and verification through the Codex interface.

Agent roles do not override the source-of-truth order or human approval.

## Security

Backend enforcement is mandatory for:

- authentication;
- authorization;
- resource ownership;
- validation;
- antiforgery protection;
- CORS;
- rate limiting;
- sensitive evidence handling;
- privacy thresholds.

Do not rely on hidden buttons or frontend state for security.

## Testing and Verification

Run the checks relevant to changed code or configuration.

Frontend checks may include:

- build;
- lint;
- TypeScript type-check;
- unit tests;
- end-to-end tests where required.

Backend checks may include:

- build;
- unit tests;
- PostgreSQL integration tests;
- migration verification.

Never claim that a command or test passed unless it was actually executed and
its result was observed.

## Git Safety

- `main` is the deployable source of truth.
- Do not make substantial changes directly on `main`.
- Use one short-lived branch per independent task.
- Before editing, inspect the current branch and working tree.
- Never discard unrelated user changes.
- Do not commit, push, merge, rebase, amend, reset, clean, force-push, delete a
  branch, or create/update a pull request without explicit approval in the
  current task.
- Before requesting approval, report changed files, `git diff --stat`, checks
  run, results, risks, and unfinished work.

## MSA Requirements

Maintain compliance with the accepted MSA requirements, including:

- React frontend;
- C# .NET backend;
- Entity Framework Core;
- persistent database;
- CRUD;
- frontend and backend tests;
- deployed frontend and backend;
- Scalar API documentation;
- responsive UI;
- AI usage evidence under `/specs`.
```

Do not copy all `.clinerules` into `AGENTS.md`. It is the concise,
agent-agnostic repository entry point.

## 5. Update `specs/ai/01-ai-development-workflow.md`

Make these changes:

1. Replace malformed prompt-path wording with:

```md
Actual prompts or reconstructed prompt summaries are recorded under:

`specs/ai/prompts/`

Independent review records and their resolutions are recorded under:

`specs/ai/reviews/`

Persistent agent instructions and workflow evidence are recorded under:

`specs/ai/agent-instructions/`
```

2. Clarify roles:

```md
Claude proposes and independently reviews architecture, ERDs, API contracts,
security boundaries, and major implementation plans. Claude output remains a
proposal until human approval.

DeepSeek through Cline performs routine implementation and command execution
from approved specifications.

Codex operates through the Codex interface for repository-aware analysis,
focused approved implementation, review, and verification.
```

3. Remove any statement implying that Cline is the universal execution layer
for every agent. Cline is the execution interface for the DeepSeek workflow.

4. Preserve the rule that AI conversations are not normative sources of truth.

## 6. Restore the Claude Review Record

Replace the contents of:

```text
specs/ai/reviews/02-specification-review-2026-07-21.md
```

with the complete Claude specification review from the previous independent
review task.

The file must preserve:

- reviewed scope;
- all Blocker, Major, Minor, and Optional findings;
- the summary table;
- the final verdict `CHANGES REQUIRED`.

It must not contain the abbreviated two-item resolution and must not say
`READY FOR IMPLEMENTATION`.

Do not invent or paraphrase missing review content. Use the exact saved Claude
review supplied by the human in the task context. If that exact text is not
available in the current task, stop and report instead of fabricating it.

## 7. Update `specs/ai/reviews/03-specification-review-resolution.md`

Keep:

```text
Status: PENDING INDEPENDENT RE-REVIEW
```

Preserve all existing accepted resolutions and append:

```md
## Follow-up Human Documentation Audit
```

Record these additional accepted corrections:

1. Anonymous antiforgery-token issuance and Google callback semantics.
2. Evidence purge fields and retention alignment.
3. Suppression of exact contributor count and exact ratio below the privacy
   threshold.
4. Nullable Mermaid ERD cardinality corrections.
5. CommunityChallenge public-read ownership wording.
6. `LastCommunityChangeAt` migration checklist entry.
7. Half-open time intervals `[PeriodStart, PeriodEnd)`.
8. Restrictions on changing an already-started Community Challenge.
9. Organizer participant endpoint response and privacy boundaries.
10. Deferred Completion-lifecycle decisions required before the Completion
    slice.

Record `Achievement.Category` enum as a deliberately rejected Optional
suggestion because it is unnecessary for the MVP.

Do not change the resolution status to Approved until a new independent Claude
review returns `APPROVE`.

## 8. Delete the False Codex Onboarding Record

Inspect:

```text
specs/ai/reviews/2026-07-21-codex-repository-onboarding.md
```

The current file is not a real Codex onboarding record. It contains unrelated
specification-resolution content.

Delete it.

Do not replace it with invented onboarding content. A new onboarding record
may be created only after Codex onboarding is actually performed.

---

# Part B — Domain, API, Data, Product, and Privacy Corrections

## 9. Correct the Antiforgery Contract

Update:

```text
specs/architecture/03-api-contract.md
```

### Token endpoint

Change:

```text
GET /api/v1/auth/csrf-token
Auth: Member+
```

to:

```text
GET /api/v1/auth/csrf-token
Auth: None
```

Define:

- The endpoint generates/stores the antiforgery cookie token and returns the
  request token.
- The client sends the request token in `X-CSRF-TOKEN` on state-changing
  requests.
- Anonymous clients obtain a token before browser POST operations such as
  register, login, resend confirmation, forgot password, and reset password.
- Authenticated clients obtain a fresh token after successful login and after
  an antiforgery validation failure.
- The token is not an authentication credential.
- Remove vague periodic-refresh wording unless later justified.
- Do not claim authentication is needed to prevent token harvesting.

Keep antiforgery protection for browser-reachable cookie-authenticated
state-changing endpoints.

### Google external login callback

Keep:

```text
GET /api/v1/auth/external-login/google
```

as the initiation endpoint.

Remove the custom REST endpoint:

```text
POST /api/v1/auth/external-login/google/callback
```

Document instead:

- The provider callback is handled as a browser `GET` by ASP.NET Core
  authentication middleware at the configured callback path, normally
  `/signin-google`.
- After successful external authentication, the backend signs in or creates
  the Identity user and redirects to an approved frontend route.
- The middleware callback path is not a normal REST/JSON endpoint.

## 10. Align Evidence Purge Fields and Retention Rules

Update:

```text
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/security/01-community-privacy-rules.md
```

Apply:

- `EvidenceClaimDetail.Description` is nullable in persistence after purge, but
  required by API validation when submitting a new claim.
- `EvidenceUrl` remains nullable.
- `ReviewNote` remains nullable.
- `EvidencePurgeDueAt = ReviewedAt + 90 days` after either approval or
  rejection.
- `EvidencePurgedAt` is set when sensitive fields are cleared.

The purge job clears:

```text
Description
EvidenceUrl
ReviewNote
```

Retain only defined metadata:

```text
QuestCompletion.Id
QuestCompletion.UserId
QuestCompletion.QuestId
QuestCompletion.Method
QuestCompletion.Status
QuestCompletion.CreatedAt
EvidenceClaimDetail.ReviewedAt
EvidenceClaimDetail.ReviewedByUserId
EvidenceClaimDetail.UserDeclaration
EvidenceClaimDetail.EvidencePurgedAt
```

Remove undefined retained-field references unless separately approved.
Specifically do not introduce:

```text
SubmittedAt
VerificationLevel
EvidenceClaimDetail.XpTransactionId
```

Use `QuestCompletion.CreatedAt` as submission time.

The XP relation remains derivable through:

```text
XpTransaction.SourceCompletionId
```

Pending claim withdrawal remains permanent deletion of the pending
`QuestCompletion` and owned `EvidenceClaimDetail`.

## 11. Prevent Privacy-Threshold Reverse Inference

Update:

```text
specs/architecture/03-api-contract.md
specs/product/02-community-identity-and-gamification-scope-update.md
specs/product/03-community-challenge-scope.md
specs/security/01-community-privacy-rules.md
```

For Community Challenge progress and Communities Leaderboard responses below
the configured privacy threshold:

- do not return exact contributor count;
- do not return the exact
  `verified completions / active contributors` ratio;
- do not expose participant identities;
- return a privacy state such as:

```json
{
  "isPrivacyProtected": true,
  "activeContributors": null,
  "ratio": null
}
```

Exact verified-completion totals may remain only when the accepted privacy
spec permits aggregate totals.

Apply the same suppression to SignalR payloads.

## 12. Correct Mermaid ERD Cardinalities

In `specs/architecture/02-core-domain-data-model.md`, align optional
relationships with nullable foreign keys.

Use:

```mermaid
QuestParticipation o|--o{ QuestCompletion : "ParticipationId (nullable)"
QuestCompletion ||--o| EvidenceClaimDetail : "optional detail"
QuestCompletion ||--o| XpTransaction : "optional XP reward"
Achievement o|--o{ CommunityChallenge : "RewardAchievementId (nullable)"
CommunityChallenge o|--o{ UserAchievement : "SourceCommunityChallengeId (nullable)"
```

Keep the written rules and field tables consistent with the ERD.

## 13. Correct CommunityChallenge Ownership Wording

In the core domain ownership table, replace wording that says only Members
read Community Challenges with:

```text
Guest and Member: public aggregate read
Admin: create and manage
Organizer: no special management privilege beyond public/member read
```

Private personal contribution data remains available only to the owning Member
through Passport endpoints.

## 14. Complete the Community Identity Migration Checklist

In:

```text
specs/data/01-community-identity-data-model.md
```

add to the migration strategy:

```text
Add LastCommunityChangeAt
(timestamp with time zone, nullable)
to the user profile table.
```

Ensure the field table, migration notes, and EF Core notes agree.

## 15. Use Half-Open Time Intervals

Replace challenge-period wording such as:

```text
BETWEEN PeriodStart AND PeriodEnd
[PeriodStart, PeriodEnd]
```

with:

```text
CreatedAt >= PeriodStart
AND CreatedAt < PeriodEnd
```

Document the interval as:

```text
[PeriodStart, PeriodEnd)
```

Apply the same convention to Weekly and Monthly leaderboard periods wherever
their boundaries are defined.

Calendar boundaries are calculated in `Pacific/Auckland`, then converted to UTC
for persistence and querying.

## 16. Restrict Active Community Challenge Editing

Update the Community Challenge product scope and API contract.

For MVP:

- Admin may edit region, period, target, and reward only before `PeriodStart`.
- Once `PeriodStart` has arrived, or once any eligible contribution exists,
  those competitive fields are immutable.
- An already-started challenge may only be cancelled.
- Reducing the target below current progress is forbidden.
- Return `409 Conflict` for prohibited changes.

Do not add Draft/Scheduled states, versioning, or audit-history entities.

## 17. Clarify Capacity and Organizer Participant API

### Native Capacity

Keep Capacity limited to `RegistrationMode = Native`.

Add endpoint-specific rules:

- Native Completion Code redemption requires an active Participation; otherwise
  return `409`.
- Native Evidence Claim submission requires an active Participation; otherwise
  return `409`.
- External and NoneRequired completion paths may omit Participation.
- External tracking does not consume platform Capacity.
- Self-reported completion creates no XP and does not reserve Capacity.

### Organizer participant endpoint

Keep:

```text
GET /api/v1/organizer/quests/{questId}/participants
```

Define it as a paginated limited operational response containing:

```text
participationId
memberDisplayName
joinedAt
participationStatus
completionStatus
completionMethod
completedAt
```

Also include aggregate summary values such as participant count and completion
status totals.

Never include:

```text
email
HomeCommunityRegionId
EvidenceUrl
claim description
UserDeclaration
ReviewNote
private profile fields
```

Authorization:

- Organizer may access only owned quests.
- Admin may access all quests.
- Return `403` when an Organizer does not own the Quest.

Update the ownership wording from `aggregate only` to:

```text
limited operational participant list and aggregate completion summary;
no evidence or private profile data
```

## 18. Record Deferred Completion-Lifecycle Decisions

Do not invent the behaviour.

Add an:

```text
UNDECIDED — required before Completion slice
```

section in the core domain model or a clearly referenced decision register.

Record:

1. Whether more than one Pending Evidence Claim may exist for the same
   `(UserId, QuestId)`.
2. Whether more than one SelfReported completion may exist for the same
   `(UserId, QuestId)`.
3. When a SelfReported completion is later verified, whether:
   - the existing record is promoted;
   - a separate Verified record is created and Passport deduplicates; or
   - another accepted transition is used.

State:

- these decisions do not block Foundation, Regions/Public Quest Read, or Auth;
- they must be approved before Completion entities/endpoints are implemented;
- DeepSeek must not choose the behaviour during routine implementation.

---

# Part C — Consistency and Verification

## 19. Cross-Document Search

Search for outdated or conflicting phrases:

```text
RewardBadgeCode
CommunityChallengeContribution
BETWEEN PeriodStart AND PeriodEnd
current HomeCommunity filtering
csrf-token requires authentication
external-login/google/callback
Members read
aggregate only
SubmittedAt
VerificationLevel
XpTransactionId
READY FOR IMPLEMENTATION
```

Do not blindly replace text. Preserve historical evidence in the original
Claude review.

## 20. Required Completion Report

After editing:

1. Run available Markdown, documentation, path, and link checks.
2. Report the current branch.
3. Report every created, modified, and deleted file.
4. Summarize every correction.
5. List the deferred Completion-lifecycle decisions.
6. Show:

```bash
git status --short
git diff --stat
```

7. Do not commit.
8. Do not begin Slice 0.
9. End with:

```text
READY FOR INDEPENDENT CLAUDE RE-REVIEW
```

only when all requested documentation changes were completed and verified.
