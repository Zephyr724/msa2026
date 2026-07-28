# Slice 18 — K3 Independent Read-Only Review

## Reviewer and scope

Independent read-only review by the existing K3 review session
`k3_slice15_review`. The reviewer did not implement Slice 18 and did not edit
production code.

Reviewed:

- `specs/implementation/18-figma-content-and-test-personas.md`;
- `specs/ai/prompts/69-slice-18-figma-content-and-test-personas.md`;
- `specs/implementation/reports/18-figma-content-and-test-personas-completion.md`;
- the complete `HEAD`-to-worktree Slice 18 delta;
- the Slice 18 browser-evidence manifest and all seven current-product images;
- the retained Slice 16 Make reference images used by the manifest.

## Initial review result

- Blocker: 0
- Major: 3
- Minor: 1
- Initial readiness: **not ready to commit**

## Major findings

### Major 1 — My Quests emits incorrect remaining capacity and incomplete region hierarchy

`DtoMapping.ToListItem` now derives `availableSpots` from
`quest.Participations` and derives a Local Area's administrative area and
country from two loaded parent navigations
(`backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs:33-64`). The same mapper is
also used for each My Quests row at
`backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs:208-220`.

However, `ListMineAsync` loads only Quest images and the immediate
`LocationRegion`
(`backend/src/Kiwimpact.Infrastructure/Repositories/QuestParticipationRepository.cs:202-211`).
It does not load the Quest's participation collection or either Region
ancestor. With no lazy loading, a bounded Quest in My Quests is therefore
mapped as if it had zero participants (`availableSpots == capacity`), while a
Local Area is returned with null administrative-area and country labels.

This violates the accepted requirement that remaining capacity be derived
from active participation records and makes one API representation of the
same Quest disagree with public list/detail responses. The current integration
tests verify the public Quest response only; the focused My Quests tests pass
without asserting these new nested fields.

Required closure:

- make every call site of the shared mapper supply the required data, or move
  the derived values into an explicit query/projection that cannot silently
  treat unloaded navigations as empty;
- add a My Quests regression test with another active participation, a
  cancelled participation, and a Local Area Quest, asserting the same
  remaining capacity and Auckland/New Zealand hierarchy as public reads.

### Major 2 — `Recommended for you` is fabricated rather than data-backed

The first result is unconditionally labelled `Recommended for you` on both
Landing and Discover
(`frontend/src/pages/HomePage.tsx:175-184` and
`frontend/src/pages/QuestListPage.tsx:371-379`). That item is merely the first
row under the current sort/filter/page. It changes when the user changes sort
or pagination and uses no user preference, location, participation, or
recommendation signal.

The completion report acknowledges this at
`specs/implementation/reports/18-figma-content-and-test-personas-completion.md:174-175`.
That acknowledged limitation conflicts with the implementation prompt's
explicit instruction not to invent recommendations and with the Slice's
requirement for truthful highlights. The current fixed demo schedule can also
put an already-started/ended Quest first, which makes the personalised wording
especially misleading.

Required closure:

- either remove/rename the label to a truthful non-personalised presentation
  such as `Featured`, or back it with an accepted deterministic
  recommendation rule and tests;
- add presentation tests proving the label cannot be inferred solely from
  array index.

### Major 3 — browser evidence does not prove the responsive Make-parity acceptance

The Slice 18 evidence directory contains only seven current-product desktop
captures
(`specs/implementation/evidence/18-figma-content-and-test-personas/README.md:6-14`).
It contains no current 390 px or 320 px captures and no same-viewport
Make/current pairs. The manifest points to older Slice 16 reference files, but
does not pair them with current captures at matching desktop and mobile
viewports.

This does not substantiate the accepted requirement that the changed Landing,
Discover, Detail, My Quests, and Passport compositions visibly match Make at
desktop and remain responsive
(`specs/implementation/18-figma-content-and-test-personas.md:92-103`).
It also regresses the evidence standard already established in the Slice 16
closure review. The seven current images were visually inspected and are
useful desktop state evidence, but they cannot demonstrate narrow-layout
behavior.

Required closure:

- add matching Make/current desktop viewport pairs for the materially changed
  pages;
- add current 390 px evidence for Landing, Discover, Quest Detail, My Quests,
  and Passport, plus 320 px captures for the most layout-sensitive changed
  pages;
- make the manifest and completion report state exactly which pairs and
  responsive states were observed.

## Minor finding

### Minor 1 — idempotent persona seeding does not converge display names

For an existing standard-persona account, the seed confirms email, rotates the
password, and converges roles, but it only creates a `UserProfile` when none
exists
(`backend/src/Kiwimpact.Infrastructure/Data/Seeds/IdentitySeed.cs:118-175`).
It never restores the configured `DisplayName` on an existing profile. A
previously renamed or stale local account can therefore sign in with the right
role but the wrong test-persona identity after repeated seeding.

The integration test asserts one profile per account but not its configured
display name
(`backend/tests/Kiwimpact.IntegrationTests/Api/AuthApiTests.cs:320-349`).

Recommended closure: update the existing profile only when its display name
differs, and assert convergence across a second seed run.

## Checks accepted without findings

- Demo-account startup is bounded by `IsDevelopment()`.
- The real local password file is ignored; the checked-in example contains no
  usable secret; environment variables remain authoritative.
- The nine standard identities map to exactly three Member, three Organizer,
  and three Admin personas, with Member retained as the base role.
- Role convergence removes obsolete accepted application roles.
- Public Quest list/detail reads load active and cancelled participations and
  count only active rows; bounded remaining capacity is clamped at zero.
- Public Quest list/detail reads load two Region ancestors through split
  queries.
- `Almost full` is shown only for a non-null derived value of five or fewer.
- The Quest card is one full-card link without nested interactive links and
  retains a visible keyboard focus style.
- Map failure and missing-gallery-media fallbacks remain present.
- Passport preserves the truthful verified versus self-reported distinction.
- No schema migration or new dependency was introduced.

## Reviewer verification

Observed during this independent review:

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed: 44 files, 337 tests |
| focused `AuthApiTests`, `QuestsApiTests`, and `QuestParticipationApiTests` | Passed: 84 tests |
| backend unit suite with `--no-build` | Passed: 250 tests |
| `git diff --check HEAD` | Passed |
| secret-path check | Real local configuration is ignored; example only is untracked |
| browser-evidence inspection | Seven desktop current images inspected; responsive/current comparison evidence absent |

The passing tests do not close Major 1 because they do not assert the new
capacity and hierarchy fields in the My Quests nested Quest DTO.

## Review status

Three original Major findings remain open. Under the repository's bounded
review workflow, Slice 18 requires one concentrated correction pass followed
by a targeted closure check limited to the findings above.

## Targeted closure check

This check was limited to the three original Major findings and one original
Minor finding. It was not a second full review.

### Original Major 1 — closed

`QuestParticipationRepository.ListMineAsync` now uses
`AsNoTrackingWithIdentityResolution`, loads Quest images, both Region
ancestors, and the complete Quest participation collection, and executes the
collection includes as a split query
(`backend/src/Kiwimpact.Infrastructure/Repositories/QuestParticipationRepository.cs:202-216`).
This supplies every navigation required by the shared Quest list mapper.

`MyParticipations_ReturnsLoadedCapacityAndLocationHierarchy` creates a
capacity-five Local Area Quest, joins three users, cancels one, and asserts
that My Quests returns three available places plus
Puketāpapa → Auckland → New Zealand
(`backend/tests/Kiwimpact.IntegrationTests/Api/QuestParticipationApiTests.cs:388-433`).

The targeted integration test passed.

### Original Major 2 — closed

Landing and Discover now both call `questDiscoveryHighlight(quest)` rather
than deriving a label from array index. The helper returns
`Featured challenge` for the accepted `PlatformEcoChallenge` source type and
`Good first Quest` for Easy Quests; all other Quests remain unlabelled
(`frontend/src/lib/questPresentation.ts:113-123`).

The new unit test evaluates the same Quests in forward and reversed order and
proves that labels follow Quest attributes rather than result position
(`frontend/tests/unit/questPresentation.test.ts:4-22`). No
`Recommended for you` production string remains. The targeted frontend test
passed.

### Original Major 3 — remains open

The missing-artifact part of the finding is corrected:

- all five Make/current desktop pairs are actually 1280 × 720;
- all five current mobile captures are actually 390 × 844;
- all five current narrow captures are actually 320 × 844;
- the retained Landing and Discover mobile references are 390 × 844;
- the retained narrow Make references are 320 px wide and are truthfully
  described as full-page rather than equal-height viewport pairs.

However, the new 320 px evidence does not establish responsive closure. In
`current/narrow-320/discover.jpg`,
`current/narrow-320/my-quests.jpg`,
`current/narrow-320/passport.jpg`, and
`current/narrow-320/quest-detail.jpg`, the signed-in Admin header ends after
`Review`; the always-rendered Sign out control is outside the right edge of
the 320 px viewport. `AppShell` renders Brand, theme, management, Review, and
Sign out actions in one non-wrapping flex row
(`frontend/src/app/AppShell.tsx:65-69` and `:99-142`).

This directly contradicts the evidence manifest's claim that no horizontal
crop was observed at 320 px
(`specs/implementation/evidence/18-figma-content-and-test-personas/README.md:78-80`).
Because the original finding covered proof that the changed pages remain
responsive, it remains open. Closure requires making the 320 px authenticated
header keep every essential action reachable, recapturing the affected
current evidence, and correcting the manifest to match the observed result.

### Original Minor 1 — closed

Existing demo-account profiles now compare the stored display name with the
configured persona name and use the domain update method when they differ
(`backend/src/Kiwimpact.Infrastructure/Data/Seeds/IdentitySeed.cs:167-184`).
The integration test deliberately writes a stale Organizer display name,
re-runs the seed, and asserts convergence to `Seeded external organizer`
(`backend/tests/Kiwimpact.IntegrationTests/Api/AuthApiTests.cs:318-356`).

The targeted integration test passed.

### Targeted verification

| Check | Observed result |
| --- | --- |
| focused `questPresentation` unit test | Passed: 1 file, 1 test |
| focused My Participations and demo-seed integration tests | Passed: 2 tests |
| evidence image dimensions | All dimensions stated above verified from the files |
| visual inspection of 390 px captures | Five pages present with in-viewport first-fold layouts |
| visual inspection of 320 px captures | Admin header Sign out action cropped on four affected captures |
| `git diff --check HEAD` | Passed |
| implementer's final full gates | Reported as frontend 45 files/338 tests, backend unit 250/integration 303, with build/lint/type/diff-check passing |

### Closure status

- Original Blocker: 0
- Original Major 1: closed
- Original Major 2: closed
- Original Major 3: open
- Original Minor 1: closed
- Unresolved original Blocker/Major: **1**
- Final readiness: **not ready to commit**

## Final targeted closure check — original Major 3 only

This final check was limited to the one still-open original Major 3. No other
finding was reopened and no second full review was performed.

### Original Major 3 — closed

The authenticated Admin header now keeps the review action compact below the
`sm` breakpoint. `AppShell` renders it as a square `ShieldCheck` icon button
with the accessible name `Review evidence`; its visible `Review` text begins at
`sm`
(`frontend/src/app/AppShell.tsx:124-136`). Theme, Manage, Review, and Sign out
therefore use the same compact action pattern at 320 and 390 px.

The focused AppShell regression test asserts the Admin review link's route,
accessible name, square compact class, and `hidden sm:inline` label
(`frontend/tests/integration/AppShell.test.tsx:72-102`). Independent targeted
execution passed: 1 file, 5 tests.

All five recaptured mobile files remain exactly 390 × 844 and all five
recaptured narrow files remain exactly 320 × 844. Visual inspection of the
updated 320 px Discover capture confirms that the header now shows, in order,
the Theme, Manage, Review, and Sign out icons fully inside the viewport. The
updated My Quests and Quest Detail captures show the same complete action
cluster, with no right-side crop. The evidence manifest's no-horizontal-crop
statement is now consistent with the observed narrow captures.

The implementer also reported the final applicable full gates as passing:
frontend lint, type-check, build, and 45 files/338 tests, plus
`git diff --check`. This reviewer independently reran the focused AppShell
test and `git diff --check HEAD`; both passed.

### Final closure status

- Original Blocker: 0
- Original Major 1: closed
- Original Major 2: closed
- Original Major 3: closed
- Original Minor 1: closed
- Unresolved original Blocker/Major: **0**
- Final readiness: **ready to commit**
