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
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- `npm test` — runs all tests once (unit + integration), suitable for CI
- `npm run test:watch` — watch mode for local development

## 5.3 Database in Tests
- Repository and API integration tests use a real SQLite database (file or `:memory:`)
- `:memory:` databases are acceptable for most constraints and query tests
- Use a temporary file database when testing WAL behavior, locking, or multi-connection scenarios
- Each test suite should set up and tear down its own data (migrations + seeds as needed)

## 5.4 Coverage Requirements
- Happy path and error cases for every service function
- Input validation edge cases (empty strings, boundary values, SQL-injection attempts)
- Authorization checks (user A cannot access user B's resources)

## 5.5 Test File Organization
```
tests/
├── unit/
│   └── services/        # Pure logic tests (no DB)
├── integration/
│   ├── db/              # Repository integration tests (real SQLite)
│   └── api/             # API integration tests (app + Supertest)
└── e2e/                 # Full scenario tests
```

## 5.6 When Tests Fail
1. Identify root cause: implementation bug, incorrect test assumption, stale fixture, or environment issue
2. Fix the source code when the implementation is wrong
3. Only modify test assertions when the contract has demonstrably changed — explain why in the task summary
4. If a test is incorrect or based on a stale assumption, document the correction and update the test