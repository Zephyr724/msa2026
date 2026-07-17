# 03 — Database Rules

## 3.1 Schema Source of Truth
- **`scripts/migrations/`** is the canonical schema history
- **`init_db.sql`** is a generated baseline snapshot (not manually maintained alongside migrations)
- All schema changes go through timestamp-named migration files: `scripts/migrations/YYYYMMDDHHmmss_description.sql`
- `init_db.sql` is regenerated from migrations when the schema stabilizes

## 3.2 Query Rules
- **Always** use parameterized queries: `db.prepare().run/get/all()` with `?` placeholders
- **Never** concatenate user input into SQL strings — this is a hard rule
- **Never** use `db.exec()` with user-supplied strings
- All query functions live in `src/db/` and are the ONLY modules that import `better-sqlite3`

## 3.3 Connection Management
- Single long-lived database connection for the application lifetime
- Enable `PRAGMA foreign_keys = ON` at every connection open
- Enable `PRAGMA journal_mode = WAL` for concurrent read support
- Set `PRAGMA busy_timeout = 5000` to handle write contention gracefully
- Write transactions should be kept short; avoid holding write locks across async boundaries

## 3.4 Schema Design Principles
- Each table MUST have a primary key. Use `INTEGER PRIMARY KEY` (which aliases SQLite's rowid) by default.
- Use `AUTOINCREMENT` only when the application has a documented requirement that committed row IDs must never be reused. `AUTOINCREMENT` does not make IDs unpredictable and is not an access control measure; it also adds overhead.
- Do not treat integer IDs as security boundaries. Use opaque public identifiers (UUID/ULID) when exposing predictable integer IDs would be undesirable.
- Timestamps use an explicit ISO 8601-compatible format in `TEXT` columns. Default via expression:
  ```sql
  created_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  ```
- All timestamp columns use `TEXT`, not `TIMESTAMP`. SQLite's type affinity system does not treat `TIMESTAMP` as a distinct temporal type, so using it creates a misleading schema style.
- Foreign keys are explicitly declared with `REFERENCES` clauses
- Soft deletes:
  ```sql
  deleted_at TEXT NULL
  ```
  Soft deletes are decided per-entity, not applied uniformly. Consider privacy deletion requirements and unique constraint impact before choosing soft delete.
- Unique constraints may be column-level or table-level; composite uniqueness must use a named table constraint or unique index.

## 3.5 Migration Rules
- The migration runner owns transaction boundaries. Migration files contain schema statements only; they do NOT include `BEGIN`, `COMMIT`, or `ROLLBACK`.
- Applied migrations are stored in `schema_migrations` with: `version`, `filename`, `checksum`, `applied_at`.
- An applied migration file is immutable. Checksum mismatch is a hard failure.
- Only one instance may run migrations concurrently. The runner must acquire an advisory lock or use a single-process design to prevent concurrent application.
- Migrations are deterministic and applied exactly once.
- A migration must fail loudly when its expected precondition is not met.
- `IF NOT EXISTS` / `IF EXISTS` are only allowed for explicitly documented recovery or bootstrap scenarios.
- Migrations must not contain application-level seed data; seeds live in `src/db/seed.ts`
- No destructive migration (DROP COLUMN, DROP TABLE for existing data) without an explicit review
- Test migrations run against an in-memory or temporary database file

## 3.6 Agent Database Access
- Agent may use MCP SQLite tools for **read-only** inspection during development
- Agent must **never** execute destructive SQL (DROP, TRUNCATE, ALTER without migration) directly via MCP
- All schema changes go through migration files, not through agent SQL execution