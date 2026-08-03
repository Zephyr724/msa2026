# Slice 23 — Richer Achievements, Rarity, Trophies, and Cosmetics Completion

- **Date:** 2026-07-30
- **Implementation owner:** Codex
- **Branch:** `feat/richer-achievements-trophies`
- **Prompt:** `specs/ai/prompts/79-slice-23-richer-achievements-trophies.md`
- **Contract:** `specs/implementation/23-richer-achievements-trophies.md`
- **Risk:** High
- **Status:** Implemented and verified; independent Review 76 approved;
  pending explicit human Git approval
- **Review:** `specs/ai/reviews/76-slice-23-richer-achievements-trophies-independent-review.md`

## Implemented scope

### Typed catalog and award rules

- Expanded the static catalog from 3 cumulative milestones to 45 stable
  definitions:
  - 8 total Verified-completion milestones;
  - 18 category achievements at 3/10/25 in each of six Quest categories;
  - 3 all-category breadth achievements;
  - 6 historical Auckland-week streak achievements;
  - 7 level achievements;
  - 3 Community Challenge reward achievements.
- Preserved the original three achievement IDs and codes. A 45-row identity
  snapshot test protects every approved ID/code and display order; a canonical
  SHA-256 snapshot also freezes every definition's display text, threshold,
  typed rule/category metadata, and cosmetic metadata.
- Replaced milestone-only evaluation with a closed typed evaluator over a
  complete ordered XP-ledger snapshot. No stored expression, script,
  reflection-selected rule, or client-authored criterion was added.
- Automatic awards now cover total, category, breadth, historical streak, and
  level rules. Community Challenge rewards remain finalizer-owned and are
  excluded from automatic evaluation.
- Completion-code redemption, Evidence Claim approval, XP reconciliation, and
  historical achievement backfill share the evaluator and persist progression,
  awards, and the evaluation-version advance in one profile-locked transaction.
- Community Challenge create/update and finalization accept only an active
  static `CommunityChallengeReward` definition. A legacy persisted invalid
  reward reference fails closed before progress evaluation, status mutation,
  or award creation and remains Active for explicit Admin cancellation.
- Automatic evaluation treats any existing award for the same Achievement ID
  as earned, including a malformed legacy community-sourced automatic award,
  so historical invalid provenance cannot create a duplicate automatic award.

### Immutable category facts and migration

- Added required `QuestCompletion.QuestCategorySnapshot`; every completion
  factory captures the Quest category at creation.
- Passport category impact and achievement category rules now use this
  immutable snapshot. Passport completion history deliberately continues to
  display the current Quest row.
- Added `UserProfile.AchievementEvaluationVersion`; new profiles start at the
  current version and legacy profiles start stale for bounded backfill.
- Added one additive EF Core migration with:
  - legacy category-snapshot backfill;
  - fail-closed null detection before making the snapshot required;
  - a profile evaluation-version index and non-negative check;
  - a user/category/verification-time completion index;
  - a direct `Down()` that removes only the two Slice 23 projections.
- Migration integration tests cover clean schema, the earlier pre-achievement
  upgrade path, direct upgrade from the immediate predecessor, and direct
  rollback without deleting existing achievement tables or awards.

### Nationwide rarity and trophy APIs

- Added anonymous `GET /api/v1/achievement-stats` for active achievements.
  Each row returns an exact national distinct-earner count, exact eligible
  Member denominator, percentage, rarity label, and calculation timestamp.
- The national denominator is distinct email-confirmed Identity users who have
  a `UserProfile` and the `Member` role. No earner list, identity, email,
  region, Home Community, evidence, or activity data is exposed.
- Added caller-only
  `GET /api/v1/users/me/achievement-profile` with:
  - lifetime distinct achievement count;
  - active catalog count;
  - Locked/Bronze/Silver/Gold/Platinum/Diamond trophy state;
  - next trophy threshold;
  - nationwide current-tier count, percentage, and rarity;
  - deterministic Passport cosmetics.
- Each composite nationwide stats or trophy response reads its catalog,
  denominator, and numerator values inside one PostgreSQL `REPEATABLE READ`
  transaction.
- Public statistics fail closed with the bounded progression-not-ready `503`
  while any profile is behind the current evaluation version or any Verified
  completion lacks XP.
- Trophy ownership uses lifetime distinct achievement IDs, including
  later-inactive achievements. Repeated Community Challenge rewards for one
  achievement count once.

### Passport cosmetics and frontend

- Selected achievements unlock allowlisted, non-economic presentation styles:
  one highest-priority Passport border, one highest-priority avatar frame, and
  up to three highest-priority badge stamps.
- Cosmetic ownership persists if the source achievement later becomes
  inactive. No inventory, equipment mutation, currency, purchasing, shop,
  random reward, or gameplay effect was introduced.
- Replaced the three-milestone-only Passport composition with six stable
  achievement families and 45 catalog cards.
- Every card shows nationwide completion count, percentage, and rarity, with
  `<0.01%` display for a non-zero percentage below one hundredth of a percent.
- Added a dedicated accessible SVG trophy for Locked, Bronze, Silver, Gold,
  Platinum, and Diamond, plus a Passport progress card.
- A lit trophy is shown beside the signed-in member's navigation name at
  Bronze or above. Optional profile-query failure does not block auth,
  navigation, sign-out, Passport progression, or other Passport regions.
- Applied the unlocked Passport border, avatar frame, and badge stamps through
  fixed frontend allowlists.
- Added the Community reward selector to the Admin challenge form without a
  new dependency.

## Files changed

### Backend production

- API contracts, mapping, and controllers:
  - `backend/src/Kiwimpact.Api/Contracts/AchievementContracts.cs`
  - `backend/src/Kiwimpact.Api/Controllers/AchievementProfileController.cs`
  - `backend/src/Kiwimpact.Api/Controllers/AchievementStatsController.cs`
  - `backend/src/Kiwimpact.Api/Controllers/CommunityChallengesController.cs`
  - `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`
  - `backend/src/Kiwimpact.Api/Reconciliation/CommunityChallengeFinalizer.cs`
- Core domain, services, and repository contracts:
  - `backend/src/Kiwimpact.Core/Achievements/AchievementCatalog.cs`
  - `backend/src/Kiwimpact.Core/Achievements/AchievementPresentationRules.cs`
  - `backend/src/Kiwimpact.Core/Entities/QuestCompletion.cs`
  - `backend/src/Kiwimpact.Core/Entities/UserProfile.cs`
  - `backend/src/Kiwimpact.Core/Repositories/IAchievementRepository.cs`
  - `backend/src/Kiwimpact.Core/Services/AchievementModels.cs`
  - `backend/src/Kiwimpact.Core/Services/AchievementService.cs`
  - `backend/src/Kiwimpact.Core/Services/IAchievementService.cs`
- Persistence and award paths:
  - `backend/src/Kiwimpact.Infrastructure/Achievements/AchievementAwardService.cs`
  - `backend/src/Kiwimpact.Infrastructure/Data/Configurations/QuestCompletionConfiguration.cs`
  - `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserProfileConfiguration.cs`
  - `backend/src/Kiwimpact.Infrastructure/Repositories/AchievementRepository.cs`
  - `backend/src/Kiwimpact.Infrastructure/Repositories/PassportRepository.cs`
  - `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs`
  - `backend/src/Kiwimpact.Infrastructure/Repositories/XpLedgerRepository.cs`
  - `backend/src/Kiwimpact.Infrastructure/Migrations/20260730154051_AddRicherAchievements.cs`
  - `backend/src/Kiwimpact.Infrastructure/Migrations/20260730154051_AddRicherAchievements.Designer.cs`
  - `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`

### Backend tests

- Added:
  - `backend/tests/Kiwimpact.IntegrationTests/Api/AchievementPresentationApiTests.cs`
  - `backend/tests/Kiwimpact.UnitTests/Core/AchievementAutomaticEvaluatorTests.cs`
  - `backend/tests/Kiwimpact.UnitTests/Core/AchievementPresentationRulesTests.cs`
- Expanded API, mapping, domain, award-path, backfill, concurrency, migration,
  persistence, Passport, trusted-completion, XP-ledger, reconciliation, and
  OpenAPI coverage under:
  - `backend/tests/Kiwimpact.UnitTests/Api/`
  - `backend/tests/Kiwimpact.UnitTests/Core/`
  - `backend/tests/Kiwimpact.IntegrationTests/Api/`
  - `backend/tests/Kiwimpact.IntegrationTests/Persistence/`

### Frontend production and tests

- Production:
  - `frontend/src/app/AppShell.tsx`
  - `frontend/src/components/community/CommunityChallengesSection.tsx`
  - `frontend/src/components/game/GameArtwork.tsx`
  - `frontend/src/components/passport/AchievementCard.tsx`
  - `frontend/src/components/passport/AchievementsSection.tsx`
  - `frontend/src/components/passport/PassportSummaryCard.tsx`
  - `frontend/src/components/passport/TrophyProgressCard.tsx`
  - `frontend/src/hooks/useAchievements.ts`
  - `frontend/src/lib/api/achievements.ts`
  - `frontend/src/lib/validation/achievementDto.ts`
  - `frontend/src/pages/PassportPage.tsx`
  - `frontend/src/types/achievement.ts`
  - removed superseded
    `frontend/src/components/passport/NextMilestoneCard.tsx`
- Tests:
  - `frontend/tests/integration/AppShell.test.tsx`
  - `frontend/tests/integration/CommunityChallengesAdmin.test.tsx`
  - `frontend/tests/integration/PassportAchievements.test.tsx`
  - `frontend/tests/integration/PassportPage.test.tsx`
  - `frontend/tests/integration/RequireAuth.test.tsx`
  - `frontend/tests/unit/achievementDto.test.ts`
  - `frontend/tests/unit/useAchievements.test.tsx`

### Specifications and evidence

- `specs/implementation/23-richer-achievements-trophies.md`
- `specs/ai/prompts/79-slice-23-richer-achievements-trophies.md`
- `specs/ai/reviews/76-slice-23-richer-achievements-trophies-independent-review.md`
- `specs/architecture/02-core-domain-data-model.md`
- `specs/architecture/03-api-contract.md`
- `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- `specs/adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md`
- `PROJECT_STATUS.md`
- this completion report

## Verification observed

Final full frontend gates, run from `frontend/`:

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — 47/47 files and 377/377 tests passed.
- `npm run build` — passed; 1,964 modules transformed. Vite emitted the
  existing non-blocking large-chunk advisory; the main JavaScript chunk was
  740.52 kB (207.73 kB gzip).

Final backend gates, run from `backend/`:

- `dotnet build Kiwimpact.slnx` — final incremental run passed with 0 warnings
  and 0 errors. The earlier non-incremental run also passed and observed five
  existing EF1002 warnings in integration-test raw-SQL helpers.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — 288/288 tests passed.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — final run 320/320 tests passed.
- `git diff --check` — passed after implementation and specification edits.

Focused observations included:

- 45/45 stable catalog identities, a complete rule/content/cosmetic metadata
  fingerprint, and every automatic definition's below/at threshold;
- same-week streak deduplication and an Auckland daylight-saving transition;
- category snapshot creation for all completion methods and stability after a
  Quest category edit;
- Evidence Claim approval, live redemption, XP reconciliation, bounded
  backfill, and Community Challenge finalization;
- clean/direct migration upgrade and rollback behavior;
- zero national denominator, denominator membership rules, inactive catalog
  exclusion, repeat Community awards, profile privacy, readiness `503`,
  missing-profile `404`, lifetime trophy/cosmetic behavior, and cosmetic
  priority;
- one-repeatable-read-snapshot enforcement for both nationwide stats and
  private trophy aggregates;
- finalizer fail-closed handling of legacy automatic/inactive reward
  references and duplicate prevention for a malformed legacy
  community-sourced automatic award;
- OpenAPI status contracts and strict DTO mapping;
- fixed frontend family order, rarity failure isolation, private-session
  cleanup, navigation fallback, Admin reward create/edit/clear, trophy
  thresholds, and cosmetic rendering.

One full integration run initially reported 316/317 because the newly added
PATCH-validation test serialized its optimistic-concurrency `version` as the
literal `0`. The test request was corrected to send the fetched version; its
focused rerun passed and the pre-review full integration run passed 317/317.
After the review correction, the final full integration run passed 320/320.
No production defect was hidden or waived.

## Independent review and concentrated correction

The independent read-only review reported 0 Blockers, 2 Majors, and 2 Minors:

1. A legacy persisted Community Challenge could reference an automatic
   achievement even though new create/update requests reject it.
2. Nationwide numerator and denominator values were separate statements under
   `READ COMMITTED`, so one response was not guaranteed to use one exact
   database snapshot.
3. The catalog test froze IDs/codes but not all approved rule and cosmetic
   metadata.
4. This report's changed-file list omitted `PROJECT_STATUS.md`.

One concentrated correction pass:

- revalidates the typed active Community reward allowlist in the finalizer and
  fails closed for invalid legacy references;
- prevents a malformed community-sourced automatic award from being awarded
  again through the automatic evaluator;
- wraps nationwide stats and private trophy composite reads in PostgreSQL
  `REPEATABLE READ` transactions;
- adds focused regression tests for both Majors;
- freezes all 45 definitions' rule/content/cosmetic metadata with a canonical
  SHA-256 test; and
- corrects the evidence file inventory.

Observed correction verification:

- focused integration selection covering presentation snapshots, finalization,
  and automatic award paths — 21/21 tests passed;
- focused full-catalog metadata snapshot — 1/1 test passed;
- final backend build — 0 warnings and 0 errors;
- final backend unit suite — 288/288 passed;
- final backend PostgreSQL integration suite — 320/320 passed.

## Known limitations and explicit exclusions

- No manual browser, deployed, or production-data verification is claimed.
  Automated frontend composition, strict validation, production build, and
  backend PostgreSQL integration coverage are the observed evidence.
- The private achievement-profile endpoint intentionally retains the approved
  caller-scoped readiness boundary. During another member's bounded historical
  backfill, its nationwide trophy count can temporarily be a lower-bound
  aggregate. The anonymous achievement-stats endpoint remains globally
  fail-closed and never publishes known-low per-achievement rarity.
- The Vite main-bundle size advisory remains. No dependency or code-splitting
  architecture change was approved in this Slice.
- Google login/account linking and the social feed/post/comment system are not
  part of Slice 23 and were not modified. They remain separate requested
  tasks with their own authentication, database, media-storage, moderation,
  and dependency decisions.
- No dependency, external service, environment secret, stage, commit, push,
  merge, pull request, or deployment action was performed.

## Review status

- Initial independent read-only review: changes requested (0 Blockers,
  2 Majors, 2 Minors).
- Concentrated correction: implemented and fully verified.
- Targeted closure check by the same reviewer: passed; both original Majors
  are Closed, with 0 remaining Blockers/Majors.
- Independent review record: Review 76.
- Review condition for commit readiness is satisfied. No Git action was
  performed; stage/commit/push still require explicit human approval.
