PASS:

- **S1-R1-8 resolved.** [README.md](/Users/zephyr/dev/personal/msa2026/README.md:94) now documents port `5433`, the `5433 → 5432` rationale, exact connection string, and `docker compose ps`.
- **S1-R1-9 resolved.** The orphan `ranges-cleanathon.svg` is gone. Exactly 18 SVGs remain, matching 18 seed references.
- Supporting corrections observed: stale enum names are absent; `xmin` and creator Restrict FK mappings remain; no authentication middleware/services were introduced.
- `dotnet test --no-build --no-restore` passed: 34 unit and 3 integration tests, zero failed/skipped.
- `git diff --check` passed.

FAIL:

### S1-R1-1

- Severity: Major
- File: [MigrationSmokeTests.cs](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs:35)
- Evidence: The integration suite still contains exactly three migration smoke tests. No `WebApplicationFactory` is instantiated despite the package reference. There are no tests for the seven endpoints, anonymous access, Published-only visibility, Draft 404 behavior, DTO allowlists, repository reads, descendant filtering, API pagination/Problem Details, Identity restrictions, FK delete behavior, seed behavior, or stale `xmin` updates.
- Required action: Add the mandatory PostgreSQL repository/persistence tests and WebApplicationFactory API tests, including an actual two-DbContext `DbUpdateConcurrencyException` test.

### S1-R1-2

- Severity: Major
- Files: [quest.ts](/Users/zephyr/dev/personal/msa2026/frontend/src/types/quest.ts:12), [region.ts](/Users/zephyr/dev/personal/msa2026/frontend/src/types/region.ts:1), [questDto.ts](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/validation/questDto.ts:43)
- Evidence: Filter options and validator sets now contain accepted values, but DTO enum fields remain unrestricted `string`. Nullable enum validators accept `undefined`, so missing required `registrationMode` and `externalSourceStatus` properties pass. No frontend enum contract tests exist.
- Required action: Introduce shared exact string unions/value arrays, reject missing required properties, and add accepted/removed/unknown/numeric contract tests.

### S1-R1-3

- Severity: Major
- Files: [RegionSeed.cs](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Infrastructure/Data/Seeds/RegionSeed.cs:47), [DemoQuestSeed.cs](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoQuestSeed.cs:49)
- Evidence: Source inspection now shows 23 Region calls, 21 LocalAreas, no North Shore, 18 Quests, 15 Published, three non-Published, an Auckland-wide fixture, and a null-location fixture. However, `Region.Validate()` is still never called by the seed, and no integration test proves counts, hierarchy, covers, or idempotency. The existing local database contains zero seed rows, so the report’s runtime counts were not independently reproducible read-only.
- Required action: Invoke hierarchy validation and add PostgreSQL tests proving exact fixtures and repeated-run idempotency.

### S1-R1-4

- Severity: Major
- File: [Program.cs](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Api/Program.cs:58)
- Evidence: A transaction and Development gate now exist, but no seed-flag combination tests exist. The prerequisite check verifies only Auckland, while the demo seed references numerous LocalArea IDs; a partially populated hierarchy therefore bypasses the clear prerequisite error and reaches an FK failure.
- Required action: Validate every required Region before demo writes and test all required environment/flag combinations, rollback, and no-partial-state behavior.

### S1-R1-5

- Severity: Major
- Files: [QuestDiscoveryService.cs](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Core/Services/QuestDiscoveryService.cs:62), [QuestDiscoveryValidationTests.cs](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.UnitTests/Core/QuestDiscoveryValidationTests.cs:73)
- Evidence: Core parsing now rejects numeric values and unit tests cover part of that behavior. There are still no API tests proving numeric/unknown values produce HTTP `400 application/problem+json` for category, source type, difficulty, sort field, and sort direction.
- Required action: Add WebApplicationFactory tests for every invalid query family and verify status, media type, and safe Problem Details body.

### S1-R1-6

- Severity: Major
- Files: [completion report](/Users/zephyr/dev/personal/msa2026/specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md:222), [IntegrationTests.csproj](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj:11)
- Evidence: The prior xUnit warning call sites were corrected, but the governance table does not match the project/assets files. Examples: it records EF/Identity/MvcTesting as 10.0.7 instead of 10.0.10, Npgsql as 10.0.7 instead of 10.0.3, runner as 3.0.2 instead of 3.1.4, and Test SDK as 17.14.9 instead of 17.14.1.
- Required action: Correct requested/resolved versions and approval evidence. Restore/build were not rerun because those commands update `obj`/`bin`, which the read-only instruction prohibited.

### S1-R1-7

- Severity: Major
- File: [completion report](/Users/zephyr/dev/personal/msa2026/specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md:9)
- Evidence: The report remains internally contradictory and factually inaccurate. It claims findings resolved while later admitting WebApplicationFactory, concurrency, Identity, DTO, seed-runtime tests, frontend tests, and `Region.Validate()` integration remain pending. It incorrectly defers mandatory Phase 1B tests to Phase 2, records incorrect package versions, and reports 11 tracked modifications when `git status` shows 12.
- Required action: Record only reproduced evidence, correct Git/package facts, and leave unresolved findings explicitly unresolved.

CHANGES REQUIRED
