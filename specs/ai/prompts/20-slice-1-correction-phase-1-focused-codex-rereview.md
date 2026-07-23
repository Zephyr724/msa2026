# Slice 1 Correction Phase 1 — Focused Codex Rereview Task

- **Reviewer:** Codex
- **Mode:** Read-only local repository review
- **Target branch:** `feat/slice-1-region-quest-read`
- **Approved plan:** `specs/implementation/01-slice-1-region-quest-read.md`
- **Initial review:** `specs/ai/reviews/18-slice-1-region-quest-read-implementation-review-2026-07-22.md`
- **Correction task:** `specs/ai/prompts/19-slice-1-correction-phase-1-backend-persistence-tests.md`
- **Required verdict:** `APPROVE` or `CHANGES REQUIRED`
- **Reviewer file changes:** None

## 1. Objective

Independently verify whether Correction Phase 1 actually resolved:

```text
S1-I1 backend portion
S1-I2
S1-I3
S1-I4
S1-I5
S1-I7
S1-I10
```

Do not trust the DeepSeek completion summary without reproducing the claims.

Do not review final frontend/browser acceptance in this task except where
shared enum/type changes may have broken the frontend build.

Do not modify, fix, stage, commit, push, merge, rebase, reset, clean, or switch
branches.

## 2. Git and repository state

Run:

```bash
pwd
git branch --show-current
git status --short --untracked-files=all
git diff --check
git diff --stat
git diff
git ls-files --others --exclude-standard
git log --oneline --decorate -10
git log --oneline main..HEAD
git worktree list
```

Verify:

- branch is `feat/slice-1-region-quest-read`;
- no implementation-agent commit exists;
- all corrections remain uncommitted;
- no unrelated files or generated artifacts were added;
- the completion report truthfully describes the dirty working tree.

## 3. Required reading

Read in full:

```text
AGENTS.md
PROJECT_STATUS.md
.clinerules/
specs/implementation/01-slice-1-region-quest-read.md
specs/ai/reviews/18-slice-1-region-quest-read-implementation-review-2026-07-22.md
specs/ai/prompts/19-slice-1-correction-phase-1-backend-persistence-tests.md
specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md
specs/architecture/01-domain-model-region.md
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/testing/
specs/adr/
```

Inspect all current changed and untracked backend, migration, seed, test,
README, Compose, configuration, frontend enum/type, and asset files.

## 4. S1-I2 — Exact enum contract

Verify the implementation uses the exact accepted enum members from the
accepted domain model for:

```text
QuestCategory
QuestSourceType
RegistrationMode
QuestDifficulty
ExternalSourceStatus
QuestStatus
RegionType
```

Check all of:

- Core enums;
- EF conversions;
- migration and snapshot;
- seed data;
- API parsing/validation;
- DTO mapping;
- frontend types and filters;
- frontend validators;
- tests.

Confirm removed values such as `TreePlanting`, `CuratedExternal`, and `Expert`
do not remain anywhere in source, migration, seed, UI, tests, or docs.

Run targeted repository searches for old and accepted values.

## 5. S1-I3 — Seed correctness and activation

Independently verify:

### Region seed

- exactly 23 deterministic Regions;
- New Zealand, Auckland, and 21 accepted Auckland local boards;
- all GUIDs valid;
- hierarchy valid;
- official source metadata present;
- idempotent;
- non-destructive;
- no migration seed rows.

### Development curator

- deterministic valid GUID;
- reserved `.invalid` identity;
- `PasswordHash = null`;
- no role, claim, login, or token rows;
- Development-only;
- created only through explicit seed configuration.

### Demo Quest seed

- exactly 18 total;
- exactly 15 Published;
- exactly 3 accepted non-Published visibility cases;
- valid GUIDs;
- exact accepted enums;
- required category/source/difficulty/date/region cases;
- every Published Quest has a cover image;
- referenced assets actually exist;
- no third-party copied content;
- idempotent.

### Seed orchestration

Verify:

- `IHostEnvironment.IsDevelopment()` gate;
- explicit `Seed:Region` and `Seed:DemoQuests` flags;
- migration/seed failures are not swallowed;
- no auth runtime activation was introduced;
- disabled flags produce no demo data.

Do not accept source inspection alone. Reproduce seed behavior against an empty
PostgreSQL database.

## 6. S1-I4 — Region filtering and query validation

Verify with tests and runtime requests:

- selected Region plus active descendants is applied in the repository;
- Auckland includes Auckland-wide and active local-board Quests;
- LocalArea matches only itself;
- null `LocationRegionId` is excluded when filtering;
- missing/inactive Region returns `400`;
- descendant IDs are not discarded.

Verify all invalid queries return safe `400 Problem Details`:

```text
page < 1
pageSize < 1
pageSize > 50
malformed regionId
missing/inactive region
invalid category
invalid sourceType
invalid difficulty
invalid sortBy
invalid sortDirection
search length > 100
```

Verify omitted pagination still defaults to:

```text
page = 1
pageSize = 12
```

## 7. S1-I5 — Region invariants and root uniqueness

Verify Core rules for:

- non-empty trimmed name;
- maximum name length;
- Country cannot have a parent;
- AdministrativeArea parent must be Country;
- LocalArea parent must be AdministrativeArea;
- invalid hierarchy transitions are rejected before persistence.

Verify PostgreSQL uniqueness:

- duplicate root Region with same accepted key is rejected;
- child uniqueness remains correct;
- model configuration, migration, and snapshot agree;
- generated migration uses the intended PostgreSQL null-equality behavior;
- no normal model drift exists.

Do not accept the presence of `.AreNullsDistinct(false)` alone. Prove actual
database behavior.

## 8. S1-I7 — Dependency governance

Verify:

- Testcontainers is pinned to an available exact version;
- restore has no NU1603 substitution;
- requested and resolved versions are identical;
- `coverlet.collector` is absent unless separately approved;
- Design and test-runner private asset metadata is correct;
- IntegrationTests use xUnit v3;
- `dotnet test` discovers real tests;
- dependency evidence records publisher, maintenance, licence, vulnerability,
  version, source, and approval status;
- no unapproved package was introduced.

Run:

```bash
cd backend
dotnet tool restore
dotnet restore Kiwimpact.slnx
dotnet build Kiwimpact.slnx --no-restore
dotnet test Kiwimpact.slnx --no-build
dotnet list package --vulnerable --include-transitive
```

Report exact warnings, test counts, skipped tests, and exit results.

## 9. S1-I1 — Backend test adequacy

The DeepSeek summary reports only:

```text
13 unit tests
3 integration tests
```

Do not equate a passing count with adequate coverage.

Inspect the actual tests and determine whether they genuinely cover the
Correction Phase 1 requirements.

At minimum verify tests exist for:

### Unit

- Region name validation;
- Country parent rule;
- AdministrativeArea parent rule;
- LocalArea parent rule;
- invalid hierarchy transitions;
- page/pageSize validation;
- accepted and rejected enum/filter values.

### PostgreSQL/Testcontainers

- empty-database migration;
- schema/tables;
- no migration seed rows;
- FKs and delete behaviors;
- duplicate-root rejection;
- physical `xmin` mapping;
- stale update causes `DbUpdateConcurrencyException`;
- creator FK to `AspNetUsers`;
- curator deletion Restrict;
- `PasswordHash = null`;
- no roles/claims/logins/tokens;
- no auth runtime activation;
- public endpoints anonymous;
- Region seed count/idempotency;
- demo seed count/idempotency;
- Published cover-image rule;
- disabled Development seed behavior;
- Region reads;
- Published-only Quest visibility;
- Region descendant filtering;
- filters/search/sort/pagination;
- invalid-query Problem Details;
- missing/non-Published `404`;
- image ordering;
- public DTO allowlists;
- all seven endpoints.

A migration smoke test alone is not enough.

Classify missing mandatory backend tests as Major.

## 10. S1-I10 — Local PostgreSQL documentation

Verify consistency across:

```text
README.md
docker-compose.yml
backend/src/Kiwimpact.Api/appsettings.Development.json
completion report
```

Expected local mapping:

```text
host 5433 -> container 5432
```

README must explain:

- why host 5433 is used;
- exact connection string;
- how to verify with `docker compose ps`.

## 11. Shared frontend compatibility

Run:

```bash
cd frontend
npm ci
npm run lint
npm run type-check
npm run test -- --run
npm run build
npm audit --audit-level=high
```

This is only a compatibility check for enum/type changes.

Do not approve final frontend behavior, responsive UI, error states, or browser
evidence in this Phase 1 rereview.

## 12. Completion report fidelity

Verify the report now states:

```text
SLICE 1 INCOMPLETE — HUMAN ACTION REQUIRED
```

and accurately records:

- dirty uncommitted working tree;
- actual changed files;
- actual test counts;
- actual seed counts;
- actual port;
- actual warnings;
- unresolved frontend/browser Phase 2 work;
- no false `Slice 1 complete` claim.

## 13. Findings format

For every remaining or new finding include:

```text
ID
Severity: Blocker / Major / Minor / Optional
Affected files
Evidence
Why it matters
Required resolution
```

Use new IDs:

```text
S1-R1-1
S1-R1-2
...
```

## 14. Required summary

| Area | PASS/FAIL | Notes |
|---|---|---|
| Git/provenance | | |
| Exact enum contract | | |
| Region seed | | |
| Demo Quest seed | | |
| Development seed orchestration | | |
| Region filtering | | |
| Query validation | | |
| Region invariants | | |
| Root uniqueness | | |
| Dependency governance | | |
| Backend test adequacy | | |
| Backend build/test | | |
| Shared frontend compatibility | | |
| PostgreSQL port documentation | | |
| Completion report fidelity | | |
| Repository hygiene | | |

Then report:

```text
Blocker:
Major:
Minor:
Optional:
```

## 15. Verdict

Return `APPROVE` only when:

- zero Blockers;
- zero Majors;
- all Phase 1 findings are genuinely resolved;
- mandatory backend tests materially cover the approved requirements;
- migration, seed, filtering, validation, identity boundary, concurrency, and
  dependency behavior are independently verified;
- completion report is factual;
- repository is ready to proceed to Correction Phase 2.

Otherwise return `CHANGES REQUIRED`.

End exactly with:

```text
APPROVE
```

or:

```text
CHANGES REQUIRED
```
