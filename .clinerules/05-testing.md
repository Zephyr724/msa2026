---
paths:
  - "tests/**"
  - "vitest.config.ts"
  - "package.json"
---
# 05 — Testing Strategy

## 5.1 Test Types & Boundaries

| Type                    | Scope                                               | Database        |
| ----------------------- | --------------------------------------------------- | --------------- |
| Unit                    | Pure business rules, transformers, permission logic, I/O-free functions | None (no I/O)   |
| Repository integration  | Real SQLite queries, constraints, transactions      | Real SQLite (file or `:memory:`) |
| API integration         | Express app + services + test DB + Supertest        | Real SQLite (file or `:memory:`) |
| E2E                     | Full user scenarios                                 | Real SQLite     |

- Unit tests: test functions that have no I/O dependencies (pure logic, validation, transformation)
- Repository integration tests: verify SQL queries, constraints, and transactions against a real SQLite database
- API integration tests: use Supertest against the app (imported from `src/app.ts`, not a running server)
- E2E tests: cover complete user flows; can run locally or in CI against a temporary database

## 5.2 Test Commands

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "test:e2e": "vitest run --project e2e",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest"
  }
}
```

- `npm test` — runs unit + integration tests, suitable for CI
- `npm run test:unit` — unit tests only (no I/O, fast)
- `npm run test:integration` — repository + API integration tests (real SQLite)
- `npm run test:e2e` — full end-to-end scenario tests
- `npm run test:coverage` — run with coverage reporting
- `npm run test:watch` — watch mode for local development
- E2E tests are NOT included in `npm test` by default; they run separately or in CI on demand.

## 5.3 Database in Tests

### Isolation
- Each parallel vitest worker MUST use an independent temporary database.
- Do NOT share the production `msa2026.db` file across tests.
- `:memory:` databases are isolated per connection; separate connections do not share the same in-memory database.
- Use a temporary file database (`:memory:` or temp file via `tmpdir()`) for each test suite.
- The composition root pattern (see `01-architecture.md` Section 1.3) MUST be used to inject the test database into the app. Never import a global singleton database connection from test code.

### Setup & Teardown
- Run migrations before each relevant test suite to ensure a clean, up-to-date schema.
- Seed minimal data needed for each test case; avoid sharing mutable state between tests.
- Use `beforeEach`/`afterEach` to reset state; do not rely on test execution order.

## 5.4 Network & External Dependencies

- Tests MUST NOT access real external networks (APIs, external services) unless the test file is explicitly marked as an external integration test with a `.ext.test.ts` suffix.
- Time, random numbers, and UUIDs should be injectable or freezable. Use dependency injection or mocking to control non-deterministic values.
- Tests that require external services must be skippable when those services are unavailable.

## 5.5 Authorization Test Requirements

- Every service function that performs a read or mutation on owned resources MUST have authorization tests covering:
  - Actor A CAN access their own resources.
  - Actor A CANNOT access (read or write) Actor B's resources (IDOR prevention).
  - Unauthenticated actor CANNOT access protected resources.
- Authorization tests apply to both mutations AND reads. Reading another user's private resources is a violation equivalent to unauthorized mutation.

## 5.6 Coverage Requirements
- Happy path and error cases for every service function
- Input validation edge cases (empty strings, boundary values, SQL-injection attempts)
- Authorization checks (user A cannot access user B's resources, including reads)
- Critical paths MUST be covered; overall coverage must not regress from baseline.
- Coverage thresholds are enforced per-project in `vitest.config.ts`; do not chase arbitrary percentage targets at the expense of meaningful tests.

## 5.7 Test File Organization
```
tests/
├── unit/
│   └── services/        # Pure logic tests (no DB)
├── integration/
│   ├── db/              # Repository integration tests (real SQLite)
│   └── api/             # API integration tests (app + Supertest)
└── e2e/                 # Full scenario tests
```

## 5.8 When Tests Fail
1. Identify root cause: implementation bug, incorrect test assumption, stale fixture, or environment issue
2. Fix the source code when the implementation is wrong
3. Only modify test assertions when the contract has demonstrably changed — explain why in the task summary
4. If a test is incorrect or based on a stale assumption, document the correction and update the test