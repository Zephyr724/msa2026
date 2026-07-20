# ADR-0001: Use PostgreSQL as the Application Database

- Status: Accepted
- Date: 2026-07-19
- Decider: Product owner
- Decision source: `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- Supersedes: None

> The underlying technology choice is already accepted in the planning
> baseline. 

## Context

Kiwimpact requires persistent relational data for users, roles, quests,
participation, completion claims, XP transactions, achievements, streaks,
leaderboards, source-review state, and audit records.

Important rules depend on relational constraints and transactions:

- a user must not receive duplicate completion XP for the same quest;
- capacity and duplicate-participation rules must be enforced consistently;
- approved claims must create completion and XP records atomically;
- resource ownership and role-based access must be queryable;
- completion-evidence retention requires scheduled, auditable cleanup;
- timestamps must support New Zealand business-week calculations while
  remaining unambiguous in storage.

The previous SQLite task-management artifacts are legacy material and do not
represent the Kiwimpact persistence design.

## Decision

Kiwimpact will use PostgreSQL as its only application database.

The backend will access PostgreSQL through Entity Framework Core and Npgsql.
EF Core migrations will be the canonical schema history. Application
timestamps will be stored as UTC using PostgreSQL `timestamp with time zone`.
`Pacific/Auckland` will be used for display and business-week calculations.

Local development infrastructure will provide PostgreSQL through Docker
Compose. Important integration tests will use temporary PostgreSQL instances
through Testcontainers.

SQLite will not be used as a substitute for PostgreSQL in tests that validate
database behavior.

## Constraints

- Direct `DbContext` access is limited to approved persistence components in
  `Kiwimpact.Infrastructure`.
- Controllers and application/domain services must not access `DbContext`
  directly.
- Schema changes must use EF Core migrations.
- Applied or shared migrations are immutable; corrective migrations are used
  instead.
- Production migration execution remains a deployment decision and is not
  decided by this ADR.
- The application must not introduce MongoDB, mixed persistence, or a second
  application database without a new accepted ADR.

## Consequences

### Benefits

- Relational constraints support completion, XP, ownership, and participation
  integrity.
- Production and integration-test database behavior remain aligned.
- PostgreSQL provides suitable date/time, indexing, uniqueness, and transaction
  capabilities.
- EF Core migrations provide reviewable schema history.

### Costs and trade-offs

- Local development and CI require a PostgreSQL service or container runtime.
- Integration tests are slower than in-memory or SQLite-based tests.
- PostgreSQL-specific behavior must be understood and tested.
- Migration and operational discipline are required.

## Alternatives considered

### SQLite

Rejected for the target application and critical integration tests because it
does not reliably reproduce important PostgreSQL behavior and would preserve
confusion with the archived legacy project.

### MongoDB or mixed persistence

Rejected because the domain is strongly relational and mixed persistence would
increase operational and architectural complexity without demonstrated need.

### In-memory persistence

Rejected as an application database. It remains acceptable only for isolated
pure unit tests that do not claim persistence behavior.

## Verification

This decision is considered implemented only when:

- PostgreSQL and Npgsql are present in verified backend project files;
- an EF Core `DbContext` and migrations exist;
- local PostgreSQL startup has been observed;
- integration tests execute against PostgreSQL;
- duplicate-award and other critical database constraints are tested;
- `PROJECT_STATUS.md` records the verified state.

## Review triggers

Review this ADR if deployment constraints make PostgreSQL unavailable, a
validated requirement needs a different persistence model, a separate data
store is proposed, or critical performance evidence shows the model is
unsuitable.
