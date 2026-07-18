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
    "test:external": "RUN_EXTERNAL_TESTS=1 vitest run --project external",
    "test:coverage": "vitest run --project unit --project integration --coverage",
    "test:watch": "vitest --project unit --project integration"
  }
}
```

- `npm test` — runs unit + integration tests, suitable for CI
- `npm run test:unit` — unit tests only (no I/O, fast)
- `npm run test:integration` — repository + API integration tests (real SQLite)
- `npm run test:e2e` — full end-to-end scenario tests
- `npm run test:external` — external integration tests (`.ext.test.ts`, real networks)
- `npm run test:coverage` — run with coverage reporting
- `npm run test:watch` — watch mode for local development
- E2E tests are NOT included in `npm test` by default; they run separately or in CI on demand.

### Vitest Project Configuration

- `vitest.config.ts` MUST define named projects: `unit`, `integration`, `e2e`, and `external`.
- Each project MUST have an explicit `include` pattern matching its test directory.
- External integration tests (`*.ext.test.ts`) MUST be excluded from all normal projects and placed in a separate `external` project.
- If `--project` names used in npm scripts do not match the vitest config, vitest will error at startup.

### Coverage Configuration

- Coverage provider MUST be `v8` (`@vitest/coverage-v8`).
- `coverage.include` MUST explicitly list `src/**/*.ts` so that unimported source files still appear in coverage reports.
- `coverage.exclude` MUST exclude `src/server.ts` and `src/**/*.d.ts` at minimum.
- Example:
  ```typescript
  coverage: {
    provider: 'v8',
    include: ['src/**/*.ts'],
    exclude: ['src/server.ts', 'src/**/*.d.ts'],
  }
  ```

## 5.3 Database in Tests

### Isolation
- Each parallel vitest worker MUST use an independent temporary database.
- Do NOT share the production `msa2026.db` file across tests.
- `:memory:` databases are isolated per connection; separate connections do not share the same in-memory database.
- For file-backed test databases, create a unique database filepath inside
  `tmpdir()` for each test worker or suite. Do not use the directory path
  itself as the database filename.
- The composition root pattern (see `01-architecture.md` Section 1.3) MUST be used to inject the test database into the app. Never import a global singleton database connection from test code.

### Setup & Teardown
- Run migrations before each relevant test suite to ensure a clean, up-to-date schema.
- Seed minimal data needed for each test case; avoid sharing mutable state between tests.
- Use `beforeEach`/`afterEach` to reset state; do not rely on test execution order.

## 5.4 Network & External Dependencies

- Tests MUST NOT access real external networks (APIs, external services) unless the test file is explicitly marked as an external integration test with a `.ext.test.ts` suffix.
- Normal test commands never run external tests.
- When `RUN_EXTERNAL_TESTS=1` is explicitly enabled, unavailable required
  dependencies are failures.
- A test may skip only when its documented contract explicitly treats the
  dependency as optional.
- Time, random numbers, and UUIDs should be injectable or freezable. Use dependency injection or mocking to control non-deterministic values.

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
- Critical paths MUST be covered.
- Coverage regression is enforced only after a CI coverage baseline mechanism
  exists. Until then, use explicit thresholds in `vitest.config.ts` and report
  coverage changes manually.
- Do not chase arbitrary percentage targets at the expense of meaningful
  tests.

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