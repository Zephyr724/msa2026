# 05 — Testing Rules

## 5.1 Testing Strategy
- **Unit tests**: `tests/unit/` — pure function tests, no I/O, no database
- **Integration tests**: `tests/integration/` — service + database, route + service layers
- **E2E tests**: `tests/e2e/` — full API lifecycle tests (future: when deployment target exists)
- Test runner: Vitest with `vitest.config.ts`

## 5.2 Test Principles
- Tests must be independent and not rely on execution order
- Each test sets up its own fixture data; no shared mutable state between tests
- Integration tests use a temporary SQLite database (in-memory or temp file), never the development database
- Use `supertest` for HTTP integration assertions against the Express app
- Coverage thresholds: ≥80% lines, ≥80% branches (enforced in CI)

## 5.3 What Must Be Tested
- All service-layer functions must have unit tests
- All API endpoints must have at least one integration test (happy path + validation error)
- Validation schemas (Zod) must be tested independently: valid input passes, invalid input fails with correct errors
- Database query functions must have integration tests against real SQLite

## 5.4 What Should NOT Be Tested
- Third-party library internals (test your usage, not the library)
- Express/Node.js built-in behavior
- Database driver (`better-sqlite3`) internals
- Trivial getters/setters without logic

## 5.5 Test Naming Convention
- Unit tests: `tests/unit/<layer>/<module>.test.ts`
- Integration tests: `tests/integration/<layer>/<module>.test.ts`
- E2E tests: `tests/e2e/<scenario>.test.ts`
- Test descriptions: `describe('<module>', () => { it('should <expected behavior> when <condition>', ...) })`

## 5.6 Running Tests
- `npm test` — runs unit + integration (default CI command)
- `npm run test:unit` — unit tests only (fast feedback loop)
- `npm run test:integration` — integration tests only
- `npm run test:e2e` — E2E tests (when available)
- All tests must pass before merging to `main`