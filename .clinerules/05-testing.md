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
    "test:watch": "vitest"
  }
}
```

### Backend (planned — filters depend on test traits)

```bash
dotnet test
```

### E2E (planned — run from `frontend/` after Cypress config exists)

```bash
npm run test:e2e
```

All npm commands run from `frontend/`.

## 5.3 Database in Tests (Backend)

- Integration tests use Testcontainers to spin up a real PostgreSQL instance.
- Integration tests must be isolated. The accepted testing specification will
  choose database-per-suite, database reset, schema isolation, or another
  verified strategy based on runtime cost and reliability.
- EF Core migrations run automatically as part of test setup (target;
  activate and verify after the test infrastructure is in place; not yet
  implemented).
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
- Protected operations must not accept a nullable actor for authorization
  shortcuts; unauthenticated requests for protected endpoints should be
  rejected at the middleware boundary.
- Anonymous public operations are permitted where the accepted API contract
  allows them.

## 5.6 Coverage Requirements
- Cover critical behavior, changed behavior, security boundaries, and meaningful
  failure cases. Do not create low-value tests solely to cover every method.
- Validation tests for structural input constraints
- Authorization checks (user A cannot access user B's resources)
- Critical paths MUST be covered
- Coverage regression is enforced only after a CI baseline exists
- Do not chase arbitrary percentage targets at the expense of meaningful tests

### Product-Critical Coverage Areas

- CRUD and permissions
- capacity and duplicate registration
- completion code
- claim review
- XP, level, rank
- duplicate XP prevention
- achievements
- streak
- external source review
- evidence purge
- auth, CSRF, rate limiting, and authorization
- share card
- Member, Organizer, Admin journeys

## 5.7 Test File Organization (target structure)

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

frontend/cypress/
├── e2e/                   # Cypress spec files
├── fixtures/              # Test data
└── support/               # Cypress support files
```

### E2E Test Data and Isolation

- E2E tests that mutate data must use isolated test accounts and test data,
  never production accounts or shared marker accounts.
- Do not run destructive Cypress scenarios against production or marking
  data without explicit approval and verified isolation/cleanup procedures.

## 5.8 When Tests Fail
1. Identify root cause: implementation bug, incorrect test assumption, stale fixture, or environment issue
2. If the implementation is wrong, fix only failures introduced by the current task.
3. Only modify test assertions when the contract has demonstrably changed — explain why in the task summary
4. If a test is incorrect or based on a stale assumption, document the correction and update the test
5. Report unrelated or pre-existing failures without silently expanding scope.

### SignalR Coverage Areas

- hub authentication and authorization
- leaderboard broadcasting correctness
- reconnect behavior
- cross-user data isolation
- deployed WebSocket transport verification
