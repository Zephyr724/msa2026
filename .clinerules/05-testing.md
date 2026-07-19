# 05 — Testing Strategy

## 5.1 Test Types & Boundaries

| Type | Scope | Database |
| ---- | ----- | -------- |
| Frontend Unit (Vitest) | Pure React components, hooks, utilities, Zustand stores | None (no I/O) |
| Frontend Integration (Vitest + RTL) | Component rendering, user interaction, form validation | Mocked API (MSW or similar) |
| Backend Unit (xUnit v3) | Pure domain logic, business rules, validation | None |
| Backend Integration (xUnit + Testcontainers) | Repository queries, service orchestration, auth, API endpoints | Real PostgreSQL (Testcontainers) |
| E2E (Cypress) | Full user journeys across frontend + backend | Real PostgreSQL (Testcontainers or Docker Compose) |

## 5.2 Test Commands

### Frontend

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Backend

```bash
dotnet test                                    # Run all tests
dotnet test --filter "Category=Unit"           # Unit tests only
dotnet test --filter "Category=Integration"    # Integration tests only
dotnet test /p:CollectCoverage=true            # With coverage
```

### E2E

```bash
npx cypress run       # Headless
npx cypress open      # Interactive
```

## 5.3 Database in Tests (Backend)

- Integration tests use Testcontainers to spin up a real PostgreSQL instance.
- Each test class or collection gets a fresh database.
- EF Core migrations run automatically as part of test setup.
- Minimum seed data is inserted per test; avoid sharing mutable state.
- The development `msa2026.db` (SQLite) file is NOT used by any Kiwimpact test.

## 5.4 Frontend Test Principles

- Components should be tested from the user's perspective (React Testing Library).
- API calls are mocked at the network level (MSW) or via TanStack Query test utilities.
- Zustand stores are tested as pure functions where possible.
- Form validation is tested with `user-event` and Zod schemas.
- Accessibility checks use `jest-dom` matchers.

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