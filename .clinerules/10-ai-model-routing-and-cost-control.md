# AI Model Routing and Cost Control

This rule is always active. It controls how Claude and DeepSeek are used
in this repository to preserve architectural quality while controlling cost.

## Model responsibilities

- Cline was the initial primary agent interface for this repository.
- The repository now supports multiple AI agent interfaces, including Cline and
Codex IDE Extension.
- All agents must follow the shared repository instructions defined in
AGENTS.md.
- Agent-specific rules remain inside their corresponding configuration files.
- Claude Sonnet is the planning, architecture, security, and independent review model.
- DeepSeek is the routine implementation, testing, debugging, and command-execution model.
- Claude Opus is an exceptional escalation model and is never a default model.

## Claude usage boundary

Claude may be used for:

- architecture and major structural decisions;
- ADR creation or review;
- authentication, authorisation, security, and privacy decisions;
- API contracts and data-model decisions;
- complex cross-frontend/backend/database planning;
- difficult root-cause analysis after routine attempts have failed;
- independent implementation reviews;
- final architecture, security, and MSA compliance reviews.

Claude must not be used for:

- routine component implementation;
- ordinary CRUD implementation;
- styling adjustments;
- repetitive test writing;
- straightforward bug fixes;
- routine terminal commands;
- ordinary documentation updates already defined by accepted specifications.

## Claude task rules

- Every Claude task must begin in Plan mode.
- Claude planning and review tasks must remain in Plan mode.
- Claude must not request a switch to Act mode unless the user explicitly
  authorises Claude to implement a clearly bounded task.
- Claude must not modify files or execute terminal commands during planning
  or independent review.
- Claude should initially read only files explicitly mentioned by the user.
- Claude may read directly referenced dependencies when necessary.
- Claude must ask before substantially expanding the file scope.
- Claude output should normally remain under 1,200 words unless the user
  explicitly requests a more detailed response.
- Claude must distinguish accepted repository decisions from suggestions.
- Unresolved architectural decisions require explicit human approval.

## DeepSeek implementation rules

- Routine implementation must be performed by DeepSeek in Act mode.
- DeepSeek must implement only the human-approved plan and accepted specs.
- DeepSeek must not introduce new architecture decisions without approval.
- DeepSeek must run relevant build, type-check, lint, and test commands.
- DeepSeek must not claim success unless the relevant commands actually pass.

## Independent review isolation

- Each independent Claude review must use a new blank Cline task.
- Do not perform an independent review inside the implementation task.
- Provide only the accepted specification, relevant diff, changed files,
  test results, and directly related dependencies.
- Review tasks must not modify files.
- Reviews must classify findings as Blocker, Major, Minor, or Optional.
- Reviews must end with either APPROVE or CHANGES REQUIRED.

## Opus escalation

- Claude Opus must not be configured as the default Plan or Act model.
- Opus may be selected only after the user explicitly states that Opus is
  approved for the named task.
- Acceptable escalation reasons include:
  - high-risk authentication or authorisation decisions;
  - major database or architecture migration;
  - unresolved security disagreement;
  - repeated failure by the normal planning model;
  - final high-risk architecture or security audit.
- After the escalated task ends, restore Claude Sonnet as the Plan model.
