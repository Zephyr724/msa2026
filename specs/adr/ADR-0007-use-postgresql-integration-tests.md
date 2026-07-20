# ADR-0007: Use PostgreSQL Testcontainers for Backend Integration Tests

- Status: Accepted
- Date: 2026-07-19
- Decider: Product owner
- Decision source: `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- Supersedes: None

> The testing direction is already accepted in the planning baseline.

## Context

Kiwimpact relies on database behavior for uniqueness, duplicate XP prevention,
capacity, claim transactions, Identity persistence, date/time behavior,
repository queries, migrations, and relational constraints.

SQLite and in-memory stores differ from PostgreSQL in SQL behavior, types,
constraints, concurrency, indexing, and timestamps. Passing tests against a
substitute would not provide sufficient confidence in production persistence.

## Decision

Backend integration tests will use temporary PostgreSQL instances through
Testcontainers.

The stack will use:

- xUnit v3;
- ASP.NET Core `WebApplicationFactory` for API tests;
- Testcontainers PostgreSQL;
- the real EF Core migrations.

SQLite will not imitate PostgreSQL for critical persistence, authentication, or
API integration tests. Pure domain/application rules without I/O remain fast
unit tests without a database.

## Test scope

Relevant integration tests include:

- repository queries and mappings;
- migration application;
- uniqueness and foreign-key constraints;
- duplicate participation and duplicate XP prevention;
- service transaction behavior;
- Identity persistence and authentication where applicable;
- authorization and IDOR at service/API boundaries;
- background evidence purge;
- API endpoints through `WebApplicationFactory`.

The detailed isolation method—database per suite, reset strategy, schema
isolation, or another verified approach—will be selected in the testing
specification after measuring reliability and runtime cost.

## Consequences

### Benefits

- Tests use the same database engine as the application.
- PostgreSQL-specific constraints and mappings are verified.
- Migration failures are detected before deployment.
- Critical integrity claims have stronger evidence.

### Costs and trade-offs

- Docker/container support is required locally and in CI.
- Integration tests are slower than pure unit tests.
- Isolation and cleanup need explicit design.
- Container failures must be distinguished from code failures.

## Alternatives considered

SQLite was rejected because it does not reproduce critical PostgreSQL behavior.
EF Core InMemory was rejected for persistence integration tests because it does
not provide relational semantics. A shared developer database was rejected as
the default because it reduces isolation. Repository mocks alone were rejected
because they cannot validate EF mappings, migrations, SQL translation, or
constraints.

## Verification

This decision is implemented only when Testcontainers is approved and present,
tests start temporary PostgreSQL, real migrations are applied, representative
repository/API tests pass locally and in CI, isolation/cleanup are reliable,
no critical PostgreSQL behavior is claimed from SQLite tests, and
`PROJECT_STATUS.md` records commands and results.

## Review triggers

Review this ADR if CI cannot support containers, suite duration cannot be made
acceptable, the production database changes, or another approach provides
equivalent PostgreSQL fidelity.
