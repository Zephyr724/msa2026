# P0 Runtime Timezone and Assessment Data Completion Report

## Status

Implementation, the concentrated review correction, local production-image
verification, and all applicable repository gates are complete on
`codex/fix-runtime-assessment-data`. The independent reviewer found 0 Blocker,
2 Major, and 1 Minor; the concentrated correction and targeted closure check
closed both original Major findings with no new Blocker or Major. No commit,
push, pull request, merge, or Railway deployment has been performed from this
branch.

## Implemented scope

- Added Alpine `tzdata` to the production runtime image so the existing streak,
  leaderboard, and achievement calendar code can resolve `Pacific/Auckland`.
- Added a default-off `Seed:AssessmentData` production bootstrap independent of
  the Development demo seeds.
- Added five fictional, undated, published Auckland showcase Quests with
  coordinates and project-owned local SVG covers, plus the accepted 23-region
  hierarchy.
- Added only the credentialless disabled ownership identity required by the Quest
  foreign key. The seed validates that it has no confirmed email or
  authentication artifacts and fails closed on identity or Quest ownership
  collisions.
- Made the bootstrap transactional and insert-only for existing assessment
  Quests so repeated startup cannot overwrite operator edits.
- Rejects fixed-ID, reserved normalized-username, and reserved normalized-email
  collisions before adding the curator; the outer transaction rolls back all
  Region and assessment writes on a collision.
- Documented the Railway one-shot enable, verification, disable, and smoke
  sequence. Development demo flags and demo accounts remain disabled in
  Production.

## Files changed

### Production

- `Dockerfile`
- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/src/Kiwimpact.Api/appsettings.json`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/AssessmentDataSeed.cs`

### Tests

- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`

### Documentation and evidence

- `specs/implementation/r1-production-deployment-baseline.md`
- `specs/implementation/r1-railway-production-runbook.md`
- `specs/ai/prompts/84-p0-runtime-timezone-and-assessment-data.md`
- `specs/ai/reviews/80-p0-runtime-timezone-and-assessment-data-independent-review.md`
- `specs/implementation/reports/28-p0-runtime-timezone-and-assessment-data-completion.md`

## Verification commands and observed results

| Command | Observed result |
| --- | --- |
| Final `dotnet build Kiwimpact.slnx` | Passed: 0 errors; 5 pre-existing EF1002 warnings in unrelated test files |
| Final `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build --filter "FullyQualifiedName~ProductionAssessmentData"` | Passed: 3 tests, including reserved-email collision rollback |
| Final `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 305 tests |
| Final `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Passed: 338 tests |
| `docker build --file Dockerfile --tag kiwimpact:assessment-runtime .` | Passed; runtime installed `su-exec`, `tzdata 2026c`, and produced the single-origin image |
| Final `docker build --file Dockerfile --tag kiwimpact:assessment-runtime-final .` | Passed against the final source tree; backend publish, migration bundle, frontend production build layer, and runtime export all completed |
| `docker run --rm --entrypoint /bin/sh kiwimpact:assessment-runtime -c 'apk info -e tzdata && test -f /usr/share/zoneinfo/Pacific/Auckland && TZ=Pacific/Auckland date +%Z'` | Passed: printed `tzdata` and `NZST` |
| Production image migration bundle against an isolated `postgres:17-alpine` container | Passed: all accepted migrations applied and the bundle exited 0; it also emitted the existing non-fatal Alpine `libgssapi_krb5.so.2` load warning |
| Production image startup with `Seed__AssessmentData=true`, followed by `GET /health/ready` | Passed: returned `{"status":"Ready"}` |
| `GET /api/v1/quests?page=1&pageSize=20` against that production-image container | Passed: returned `totalCount: 5`; all five rows included local areas, coordinates, and project-owned cover paths |
| Corrected final image `GET /api/v1/leaderboards/people?scope=auckland&period=weekly` | Passed: HTTP 200 with an empty weekly Auckland leaderboard JSON; this executes the deployed .NET `LeaderboardService` Auckland `TimeZoneInfo` path |
| Temporary verification cleanup | Passed: the disposable app and PostgreSQL containers stopped with `--rm`, then the isolated Docker network was removed |

Frontend lint and test gates were not run because this slice changes no
frontend source or dependency. The production Docker build did execute the
frontend `npm run build` path successfully as part of the exact image build.

## Known limitations

- The local image probe proves timezone availability but is not live Railway
  endpoint evidence. The two previously failing authenticated endpoints must be
  observed after deployment.
- The assessment bootstrap does not grant Organizer/Admin access and therefore
  does not create a production CRUD persona. A role grant requires a separate,
  approved operator workflow.
- Google Maps values are build-time inputs. The map must be visually confirmed
  after the deployed image contains Quest markers.
- The migration bundle emits a non-fatal missing `libgssapi_krb5.so.2` message
  on Alpine before completing successfully. This slice did not add Kerberos
  libraries because the approved password-based private PostgreSQL connection
  does not use GSSAPI; the message remains an operations-log observation.
- `Seed__AssessmentData` must return to `false` after the one-shot bootstrap.
- Railway Hobby PostgreSQL backups and the previously documented database
  runtime/migration least-privilege deviation remain separate operational
  limitations; this slice does not change either boundary.

## Review status

- Independent read-only review: **Completed**
- Targeted closure check: **Completed**
- Original Blocker findings: **0**
- Original Major findings: **2; both corrected and closed**
- Original Minor findings: **1; corrected wording**
- New closure-scope Blocker/Major findings: **0**
- Commit readiness: **Yes**
