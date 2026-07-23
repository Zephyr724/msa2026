Not ready for commit.

## Resolved findings

- PostgreSQL/Testcontainers persistence tests exist. The isolated persistence run passed 20/20, including exact seed counts, idempotency, migration, cascade behavior, and the two-DbContext `xmin` concurrency test.
- Seed data contains 23 Regions, 21 LocalAreas, no North Shore, 18 Quests, 15 Published, three non-Published, Auckland-wide/null-location quests, and matching image assets.
- Quest frontend enum unions match backend values; unknown and numeric Quest enum values are rejected.
- All 23 Region prerequisites are checked before demo seeding.
- Identity remains persistence-only. No authentication runtime, login endpoints, mutating APIs, maps, SignalR, or gamification were found.
- Package versions match project files. NuGet and npm vulnerability scans found no vulnerable packages.
- Frontend lint and the existing four tests pass.
- `git diff --check` passes.

## Remaining findings

### S1-R1-1 — Major — Backend suite crashes

Evidence: [`CustomWebApplicationFactory.cs:27`](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs:27) calls `base.Dispose()` from its asynchronous disposer, recursively re-entering disposal.

The complete test run ended with stack overflow, xUnit fatal pipeline failure, and exit code 134. Only 31 of 59 discoverable integration cases completed. An API-only run likewise crashed after 17 cases.

Required action: correct factory disposal and demonstrate one successful complete run of all 59 integration tests.

### S1-R1-1 — Major — Required backend evidence remains weak or incorrect

Evidence:

- The two “Restrict delete” tests never attempt deletion or `SaveChanges`: [`ConcurrencyAndPersistenceTests.cs:23`](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.IntegrationTests/Persistence/ConcurrencyAndPersistenceTests.cs:23).
- Descendant filtering selects a LocalArea and merely asserts a non-empty result: [`QuestsApiTests.cs:155`](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.IntegrationTests/Api/QuestsApiTests.cs:155).
- The page-size test expects `pageSize=100` to succeed, contrary to the accepted 400 behavior: [`QuestsApiTests.cs:89`](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.IntegrationTests/Api/QuestsApiTests.cs:89).
- DTO tests blacklist a few fields rather than assert exact allowlisted schemas.
- Ancestors are ordered alphabetically instead of nearest-parent-to-root: [`RegionReadRepository.cs:55`](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Infrastructure/Repositories/RegionReadRepository.cs:55).

Required action: add genuine FK delete assertions, parent-plus-descendant filtering, exact DTO property assertions, correct pagination expectations, and depth-based ancestor ordering tests.

### S1-R1-2 — Major — Frontend contract remains incomplete

Evidence:

- Region enum fields remain unrestricted strings: [`region.ts:4`](/Users/zephyr/dev/personal/msa2026/frontend/src/types/region.ts:4) and [`quest.ts:71`](/Users/zephyr/dev/personal/msa2026/frontend/src/types/quest.ts:71).
- Several required nullable fields accept missing/`undefined` values: [`questDto.ts:16`](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/validation/questDto.ts:16).
- No frontend enum/validator contract tests were added. The observed four tests are pre-existing shell/API-fetch tests.

Required action: use exact Region enum unions, reject missing required properties, and add the Phase 1C accepted/removed/unknown/numeric/missing-property tests.

### S1-R1-4 — Major — Seed safety is not verified

Evidence: all prerequisites and a demo-seed transaction exist in [`Program.cs:78`](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Api/Program.cs:78), but no tests exercise the flag combinations, non-Development behavior, prerequisite failure, or rollback. Region seeding occurs before the demo transaction, so a combined run can leave Regions committed if demo seeding fails.

Required action: add configuration-driven seed tests and verify the intended all-or-nothing behavior for every required failure path.

### S1-R1-7 — Major — Completion report is inaccurate

Evidence: the [completion report](/Users/zephyr/dev/personal/msa2026/specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md:12) claims all findings resolved while also admitting integration and frontend contract tests remain pending. It reports “43+” integration tests instead of 59, claims unimplemented seed-flag tests are verified, and records “95+” untracked files while the current exact count is 89. Restore/build zero-warning claims were not independently reproducible under the read-only constraint.

Required action: rerun all required commands successfully and rewrite the report using exact observed counts, status, and remaining risks.

CHANGES REQUIRED