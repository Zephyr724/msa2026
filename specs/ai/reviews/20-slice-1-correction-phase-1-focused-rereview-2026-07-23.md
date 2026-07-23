The correction phase is not ready to proceed. Seven Major findings remain.

## Findings

### S1-R1-1

Severity: Major  
Affected files: [MigrationSmokeTests.cs](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs:35), [RegionValidationTests.cs](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.UnitTests/Core/RegionValidationTests.cs:6)

Evidence: The reproduced count is 13 unit and 3 integration tests, with zero skipped. The three integration tests verify only partial table creation, zero Region migration rows, and duplicate-root rejection. There are no tests for FKs/delete rules, stale `xmin` concurrency, Identity restrictions, seed counts/idempotency, repository behavior, query validation, DTO allowlists, Published-only visibility, or any of the seven HTTP endpoints. Unit tests omit pagination and enum/filter validation.

Why it matters: The mandatory persistence, Identity, concurrency, repository, and API behaviors remain unverified.

Required resolution: Add the required unit and PostgreSQL/WebApplicationFactory integration coverage from prompt 19 and the approved plan.

### S1-R1-2

Severity: Major  
Affected files: [QuestListPage.tsx](/Users/zephyr/dev/personal/msa2026/frontend/src/pages/QuestListPage.tsx:8), [quest.ts](/Users/zephyr/dev/personal/msa2026/frontend/src/types/quest.ts:12), [questDto.ts](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/validation/questDto.ts:43)

Evidence: The frontend still exposes removed values including `TreePlanting`, `CuratedExternal`, `SelfReported`, and `Expert`. Types remain unrestricted strings, and validators accept any string for category, source type, registration mode, difficulty, and Region type.

Why it matters: S1-I2 explicitly required shared enum synchronization during Phase 1. A successful frontend build does not prove contract compatibility.

Required resolution: Synchronize frontend types, options, validators, and tests with the exact accepted enum members.

### S1-R1-3

Severity: Major  
Affected files: [RegionSeed.cs](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Infrastructure/Data/Seeds/RegionSeed.cs:24), [DemoQuestSeed.cs](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoQuestSeed.cs:49)

Evidence: Seeding a disposable empty PostgreSQL database produced:

- 24 Regions and 22 LocalAreas, not 23 and 21.
- An unaccepted `North Shore` LocalArea.
- 18 Quests: 15 Published and 3 non-Published.
- Zero Auckland-wide Quests and zero location-agnostic Quests.
- All six categories, three sources, three difficulties, and 18 covers.
- Stable counts after a second seed run.

`Region.Validate()` is never invoked by the Region seed despite the explicit hierarchy-validation requirement.

Why it matters: The accepted hierarchy and required filtering fixtures are incorrect, preventing complete validation of Auckland-wide and null-location behavior.

Required resolution: Seed only the accepted 21 boards, add the required region-wide/location-agnostic cases, invoke hierarchy validation, and cover these assertions in PostgreSQL tests.

### S1-R1-4

Severity: Major  
Affected files: [Program.cs](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Api/Program.cs:58), [DemoQuestSeed.cs](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoQuestSeed.cs:22)

Evidence: On an empty disposable database with `Seed:Region=false` and `Seed:DemoQuests=true`, startup exited 134 with PostgreSQL error `23503` on `FK_Quests_Regions_LocationRegionId`. The curator had already been committed, leaving 1 user but zero Regions, Quests, and images.

Why it matters: The supposedly independently enabled demo-seed path fails and leaves partial state.

Required resolution: Make the flag combinations safe, prevent partial seed commits, and test enabled, disabled, Development, and non-Development configurations.

### S1-R1-5

Severity: Major  
Affected file: [QuestDiscoveryService.cs](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Core/Services/QuestDiscoveryService.cs:62)

Evidence: Named invalid values returned `400 Problem Details`, but runtime requests using `999` for category, source type, difficulty, sort field, and sort direction all returned `200`. `Enum.TryParse` accepts numeric enum representations without confirming a defined canonical member.

Why it matters: The contract permits only canonical enum names; invalid values must return `400`.

Required resolution: Reject numeric and undefined enum representations and add unit/API tests for them.

### S1-R1-6

Severity: Major  
Affected files: [MigrationSmokeTests.cs](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs:35), [completion report](/Users/zephyr/dev/personal/msa2026/specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md:44)

Evidence:

- Testcontainers requested/resolved version: 4.6.0.
- No NU1603 substitution.
- `coverlet.collector` absent.
- Runner private assets are configured.
- Vulnerability scan found none.
- A forced rebuild produced 7 `xUnit1051` warnings; Phase 1 requires zero warnings.
- The report does not record publisher, maintenance, licence, source, vulnerability, version, and human-approval status as required.

Why it matters: S1-I7 remains incomplete despite being marked resolved.

Required resolution: Eliminate the warnings and provide the complete dependency-governance evidence without inferring approval.

### S1-R1-7

Severity: Major  
Affected file: [completion report](/Users/zephyr/dev/personal/msa2026/specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md:1)

Evidence: The report correctly states that Slice 1 is incomplete, dirty, and uncommitted, but it incorrectly marks enum synchronization, seed correction, filtering, dependency governance, and backend test adequacy as complete. It reports 23 Regions although runtime produced 24, defers required Phase 1 enum synchronization, and lacks an actual changed-file inventory and the required dependency evidence.

Why it matters: The report is not a factual record of reproduced completion evidence.

Required resolution: Replace resolved claims with observed results and accurately record all outstanding Phase 1 work.

### S1-R1-8

Severity: Minor  
Affected file: [README.md](/Users/zephyr/dev/personal/msa2026/README.md:94)

Evidence: Compose and Development configuration use host port 5433, but the README connection string omits `Port=5433` and provides neither the reason for the mapping nor the required `docker compose ps` verification instructions.

Why it matters: S1-I10 remains unresolved.

Required resolution: Document the exact connection string, mapping rationale, and verification command.

### S1-R1-9

Severity: Minor  
Affected file: [ranges-cleanathon.svg](/Users/zephyr/dev/personal/msa2026/frontend/public/images/quests/ranges-cleanathon.svg)

Evidence: Nineteen SVG assets are untracked, but only eighteen are referenced by the seed. `ranges-cleanathon.svg` has no source or UI reference.

Why it matters: The focused review requires no unrelated files.

Required resolution: Remove the orphan or connect it to an approved seed case.

## Verification summary

| Area | PASS/FAIL | Notes |
|---|---|---|
| Git/provenance | PASS | Correct branch; no `main..HEAD` commit; dirty work remains uncommitted |
| Exact enum contract | FAIL | Frontend retains removed values |
| Region seed | FAIL | 24/22 rather than 23/21 |
| Demo Quest seed | FAIL | Counts pass; required Region cases absent |
| Development seed orchestration | FAIL | Demo-only path fails and leaves a curator |
| Region filtering | FAIL | Available cases worked, but mandatory fixtures/tests are absent |
| Query validation | FAIL | Numeric enum values return 200 |
| Region invariants | PASS | Core rules and 11 unit tests pass |
| Root uniqueness | PASS | Real PostgreSQL duplicate-root test passes |
| Dependency governance | FAIL | Seven warnings and incomplete evidence |
| Backend test adequacy | FAIL | 3 integration tests are materially insufficient |
| Backend build/test | FAIL | 13+3 pass, but forced build has 7 warnings |
| Shared frontend compatibility | FAIL | Commands pass but enum contract is incompatible |
| PostgreSQL port documentation | FAIL | README remains stale |
| Completion report fidelity | FAIL | Multiple resolved claims contradict reproduced evidence |
| Repository hygiene | FAIL | One unreferenced untracked asset |

Reproduced command results:

- Backend restore succeeded without NU1603.
- Backend tests: 13 unit and 3 integration passed; zero failed/skipped.
- Vulnerability scan: no vulnerable packages.
- Frontend lint, type-check, 4 tests, and build passed.
- `npm audit --audit-level=high`: zero vulnerabilities.
- All seven anonymous endpoints returned 200 on the seeded disposable database.
- Published-only detail/image visibility returned 404 for a Draft Quest.
- `git diff --check` returned no errors.

Blocker: None  
Major: S1-R1-1 through S1-R1-7  
Minor: S1-R1-8, S1-R1-9  
Optional: None

CHANGES REQUIRED