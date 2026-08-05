# Slice 30 — Real Activity City Coverage and Credited Photography Completion Report

- **Date:** 2026-08-05
- **Implementation status:** Complete locally
- **Commit readiness:** Slice reviewed with no findings; strict repository-level
  readiness remains blocked by two unrelated integration-test failures in the
  concurrent dirty worktree

## Implemented scope

- Added twenty deterministic real-source assessment Quests to the existing ten,
  producing thirty total without a schema or dependency change.
- Added Hamilton City, Dunedin City, Nelson City, and Palmerston North City as
  active country-level administrative regions.
- Added several activities for Auckland, Wellington, Christchurch, Hamilton,
  Tauranga, and Dunedin, with additional Nelson and Palmerston North coverage.
- Selected ongoing, recurring, self-paced, school, and provider-directory
  programmes from councils and established conservation organisations.
- Added twenty distinct Pexels cover photos. Every row stores the photographer,
  original Pexels photo page, the Pexels licence check date, and an explicit
  statement that the image is illustrative rather than event documentation.
- Preserved the original ten rows and their project-owned illustrations. The
  existing insert-only behavior still protects operator edits.
- Kept the assessment-account completion and achievement fixture unchanged.

## Files changed

Production and tests:

- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/AssessmentDataSeed.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`

Accepted specification and operations:

- `specs/implementation/29-real-assessment-experience-data.md`
- `specs/implementation/30-real-activity-city-coverage.md`
- `specs/implementation/r1-railway-production-runbook.md`
- `specs/ai/prompts/86-real-activity-city-coverage.md`
- `specs/implementation/reports/30-real-activity-city-coverage-completion.md`

## Verification commands and observed results

| Command or check | Observed result |
| --- | --- |
| `dotnet build Kiwimpact.slnx --no-restore` | Passed: 0 errors; 5 existing EF1002 warnings in unrelated integration-test files |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build --filter 'FullyQualifiedName~SeedConfigurationTests'` | Passed: 12 tests, 0 failed, 0 skipped; 28-second run |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 308 tests, 0 failed, 0 skipped |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Failed: 2, passed: 340, skipped: 0. Both failures are exact-key assertions in `ProgressionApiTests` and `QuestCompletionApiTests` against the concurrently modified completion-redemption DTO; neither test or production path is changed by this Slice. |
| Pexels licence review | Pexels states that photos are free to use on websites/apps and attribution is not required; this Slice still stores attribution and source metadata. |
| Independent Pexels image CDN check | All twenty generated CDN URLs returned HTTP 200. |
| Independent review build | Passed: 0 errors; the same 5 unrelated existing EF1002 warnings. |
| Independent review focused seed tests | Passed: 12 tests, 0 failed. |

The focused PostgreSQL coverage observed:

- exactly 31 regions, thirty seeded assessment Quests, and thirty cover images;
- exactly twenty Pexels covers with HTTPS CDN URLs, non-empty creators, Pexels
  source pages, licence notes, and the non-documentary-image disclaimer;
- five Auckland, four Wellington, four Christchurch, three Hamilton, four
  Tauranga, three Dunedin, two Nelson, and one Palmerston North activity;
- source metadata, curator ownership, and published status on every row;
- exact count stability across repeated startup;
- preservation of an operator-edited original row;
- unchanged assessment-account completion, XP, evidence, and achievement
  counts.

## Known limitations and operator work

- No Production or Railway bootstrap was run. The seed is default-off and still
  requires the separately authorized one-shot deployment procedure.
- Activity and provider facts were checked from provider pages or indexed
  provider content on 2026-08-05. They must be rechecked before deployment,
  particularly where a page is a live directory or current-opportunities page.
- Pexels images are remote CDN assets. All twenty URLs returned HTTP 200 during
  independent review, but availability and visual cropping must still be
  smoke-tested in the deployed app.
- Stock photos are relevant illustrations and may have been photographed
  outside New Zealand. Alt text and licence metadata do not claim that the
  pictured people or place belong to the listed activity.
- Most city-wide and multi-site programmes intentionally have no fabricated
  coordinate, so only fixed venues with checked location information receive a
  map marker.
- The full integration gate is not green in the current dirty worktree because
  an existing completion-redemption response now contains a `completion`
  wrapper while two exact-key tests still assert the earlier top-level DTO.
  This Slice does not own or modify that concurrent work.
- No file was staged, committed, pushed, deployed, or added to a pull request.

## Review status

Independent read-only review completed on 2026-08-05 with no Blocker, Major, or
Minor finding. The reviewer checked provider and Pexels metadata, deterministic
IDs, city totals, insert-only behavior, region collision handling, test
coverage, URL responses, and scope isolation. The review record is
`specs/ai/reviews/86-real-activity-city-coverage-codex-review.md`.

The Slice itself has no review finding preventing an isolated commit. Strict
repository-level commit readiness is not claimed because the combined dirty
worktree's full integration gate has the two unrelated failures recorded
above. No commit was requested or created.
