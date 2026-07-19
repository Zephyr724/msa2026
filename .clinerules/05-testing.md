# 05 — Testing Strategy

## 5.1 Test Types & Boundaries

| Type | Scope | Database |
| ---- | ----- | -------- |
| Frontend Unit (Vitest) | Pure React components, hooks, utilities, Zustand stores | None (no I/O) |
| Frontend Integration (Vitest + RTL) | Component rendering, user interaction, form validation | No real I/O; API calls use an approved test boundary |
| Backend Unit (xUnit v3) | Pure domain logic, business rules, validation | None |
| Backend Integration (xUnit + Testcontainers) | Repository queries, service orchestration, auth, API endpoints | Real PostgreSQL (Testcontainers) |
| E2E (Cypress) | Full user journeys across frontend + backend | Real PostgreSQL (Testcontainers or Docker Compose) |

Kiwimpact tests must not use SQLite. Backend integration tests use
PostgreSQL via Testcontainers.

## 5.2 Test Commands (planned — verify after scaffold)

Commands below are targets. A command is active only after it exists in
repository configuration, has run successfully, and is recorded in
`PROJECT_STATUS.md`.

### Frontend (planned)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Backend (planned — filters depend on test traits)

```bash
dotnet test
```

### E2E (planned — run through committed npm scripts after Cypress config exists)

```bash
npm run test:e2e
```

## 5.3 Database in Tests (Backend)

- Integration tests use Testcontainers to spin up a real PostgreSQL instance.
- Integration tests must be isolated. The accepted testing specification will
  choose database-per-suite, database reset, schema isolation, or another
  verified strategy based on runtime cost and reliability.
- EF Core migrations run automatically as part of test setup.
- Minimum seed data is inserted per test; avoid sharing mutable state.

## 5.4 Frontend Test Principles

- Components should be tested from the user's perspective (React Testing Library).
- Frontend API test isolation must use an explicitly approved test boundary.
  Do not add MSW or another mocking dependency without approval.
- Zustand stores are tested as pure functions where possible.
- Form validation is tested with `user-event` and Zod schemas.
- jest-dom provides DOM assertions. Automated accessibility scanning requires
  a separately approved and configured tool; accessibility must also be
  reviewed through semantic queries and keyboard-focused tests.

## 5.5 Authorization Test Requirements

### Backend service/API tests
- Owner is allowed to access and mutate their own resources.
- Another user is denied access (both read and write, IDOR prevention).
- Role escalation is denied (Member cannot access Organizer endpoints).
- Missing authentication returns 401.
- Invalid/expired authentication returns 401.
- Authenticated but unauthorized returns 403.

### Authorization principles
- Authorization tests apply to both mutations AND reads.
- Services should not accept nullable actor for authorization shortcuts;
  unauthenticated requests should be rejected at the middleware boundary.

## 5.6 Coverage Requirements
- Happy path and error cases for every service function
- Validation tests for structural input constraints
- Authorization checks (user A cannot access user B's resources)
- Critical paths MUST be covered
- Coverage regression is enforced only after a CI baseline exists
- Do not chase arbitrary percentage targets at the expense of meaningful tests

## 5.7 Test File Organization

```
backend/tests/
├── Kiwimpact.UnitTests/
│   └── Core/              # Domain logic tests (no DB)
└── Kiwimpact.IntegrationTests/
    ├── Repositories/      # EF Core query tests (real PostgreSQL via Testcontainers)
    ├── Services/          # Service orchestration tests
    └── Api/               # WebApplicationFactory + HTTP client tests

frontend/tests/
├── unit/                  # Pure logic, hooks, stores
└── integration/           # Rendered components with user interaction

e2e/
└── cypress/
    ├── e2e/               # Cypress spec files
    └── fixtures/          # Test data
```

## 5.8 When Tests Fail
1. Identify root cause: implementation bug, incorrect test assumption, stale fixture, or environment issue
2. Fix the source code when the implementation is wrong
3. Only modify test assertions when the contract has demonstrably changed — explain why in the task summary
4. If a test is incorrect or based on a stale assumption, document the correction and update the test