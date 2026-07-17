---
paths:
  - "src/db/**"
  - "scripts/migrations/**"
  - "init_db.sql"
  - "tests/integration/db/**"
---
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
- Each table SHOULD have a primary key. Use `INTEGER PRIMARY KEY` (which aliases SQLite's rowid) for most tables; only use `AUTOINCREMENT` when rowid reuse must be prevented (e.g., security-sensitive identifiers).
- Timestamps use an explicit ISO 8601-compatible format. Default via expression:
  ```sql
  created_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  ```
- Foreign keys are explicitly declared with `REFERENCES` clauses
- Soft deletes (add `deleted_at TIMESTAMP NULL`) are decided per-entity, not applied uniformly to all user data. Consider privacy deletion requirements and unique constraint impact before choosing soft delete.
- Unique constraints may be column-level or table-level; composite uniqueness must use a named table constraint or unique index.

## 3.5 Migration Rules
- Migrations are deterministic and applied exactly once. The migration runner records applied versions and checksums.
- A migration must fail loudly when its expected precondition is not met.
- `IF NOT EXISTS` / `IF EXISTS` are only allowed for explicitly documented recovery or bootstrap scenarios.
- Each migration is wrapped in a transaction (`BEGIN ... COMMIT`)
- Migrations must not contain application-level seed data; seeds live in `src/db/seed.ts`
- No destructive migration (DROP COLUMN, DROP TABLE for existing data) without an explicit review
- Test migrations run against an in-memory or temporary database file

## 3.6 Agent Database Access
- Agent may use MCP SQLite tools for **read-only** inspection during development
- Agent must **never** execute destructive SQL (DROP, TRUNCATE, ALTER without migration) directly via MCP
- All schema changes go through migration files, not through agent SQL execution