# Community Leaderboard and Privacy Tests

- **Status:** Accepted
- **Date:** 2026-07-20
- **Source:** ADR-0008 Community Identity, Local Leaderboards, and Virtual Economy Scope
- **Purpose:** Define test cases for community-scoped leaderboards, community privacy, Home Community management, and XP snapshot behaviour.

> This document records accepted testing requirements. It does not claim that the tests have been implemented or are passing.

## 1. Test Categories

Tests span three layers:

| Layer | Tool | Scope |
|-------|------|-------|
| Backend unit | xUnit v3 | Domain logic: cooldown calculation, small-community threshold, Region hierarchy validation |
| Backend integration | xUnit + Testcontainers | Repository queries, service orchestration, leaderboard query correctness, API endpoint behaviour |
| Frontend integration | Vitest + RTL | Community selector UI, leaderboard scope selector, small-community collective state, Passport toggle, Share Card preview |
| E2E (planned) | Cypress | Full user journey: select community, view scoped leaderboard, verify privacy surfaces |

## 2. Leaderboard Scope Tests

### 2.1 My Community Scope Returns Correct Results

**Backend integration test.**

- Given: three Members in Community A with verified XP, two Members in Community B with verified XP.
- When: a Member from Community A requests the "My Community" leaderboard.
- Then: only Community A members appear, ranked by verified XP for the selected period.

### 2.2 Auckland Scope Returns All Auckland Members

**Backend integration test.**

- Given: Members in two different Auckland local areas.
- When: the Auckland scope is requested.
- Then: members from both local areas appear, ranked together.

### 2.3 New Zealand Scope Returns All Members

**Backend integration test.**

- Given: Members across multiple regions.
- When: the New Zealand scope is requested.
- Then: all members with verified XP appear, ranked together.

### 2.4 Guest Defaults to Auckland Scope

**Backend integration test.**

- Given: an unauthenticated request.
- When: the leaderboard is requested without a scope.
- Then: the Auckland scope is used. No "My Community" scope is available.

### 2.5 My Community Scope Requires Authentication

**Backend integration test.**

- Given: an unauthenticated request.
- When: the "My Community" scope is explicitly requested.
- Then: 401 Unauthorized is returned.

### 2.6 Member Without Home Community Defaults to Auckland

**Backend integration test.**

- Given: an authenticated Member with no Home Community selected.
- When: the leaderboard is requested with default scope.
- Then: the Auckland scope is used.

### 2.7 Only Verified XP Contributes

**Backend integration test.**

- Given: a Member with both verified XP and self-reported completions (which create no XP transaction).
- When: the leaderboard is queried.
- Then: only verified XP contributes to the ranking. Self-reported completions are excluded.

### 2.8 Time Period Filtering — Weekly

**Backend integration test.**

- Given: XP transactions across multiple weeks.
- When: the Weekly scope is requested.
- Then: only XP earned in the current NZ calendar week (Monday–Sunday, Pacific/Auckland) is counted.

### 2.9 Time Period Filtering — Monthly

**Backend integration test.**

- Given: XP transactions across multiple months.
- When: the Monthly scope is requested.
- Then: only XP earned in the current calendar month (Pacific/Auckland) is counted.

### 2.10 Time Period Filtering — All-Time

**Backend integration test.**

- Given: XP transactions across all time.
- When: the All-time scope is requested.
- Then: all verified XP is counted.

## 3. Small-Community Suppression Tests

### 3.1 Below Threshold — Collective State Returned

**Backend integration test.**

- Given: a community with 5 active ranked Members (below the threshold of 10).
- When: the "My Community" leaderboard is requested.
- Then: the response indicates a collective-progress state. Individual rankings are not returned (except the requesting Member's own position).

### 3.2 At or Above Threshold — Full Ranking Returned

**Backend integration test.**

- Given: a community with 10 active ranked Members.
- When: the "My Community" leaderboard is requested.
- Then: the full ranked leaderboard is returned.

### 3.3 Threshold Applied Per Scope

**Backend integration test.**

- Given: a community below threshold, but Auckland overall above threshold.
- When: My Community scope returns collective state.
- Then: Auckland scope returns full ranking.

### 3.4 Threshold Is Configurable

**Backend unit test.**

- Verify that the threshold value is read from configuration and applied correctly.

## 4. XP Snapshot Immutability Tests

### 4.1 XP Stays Attributed to Original Community

**Backend integration test.**

- Given: a Member in Community A earns verified XP.
- When: the Member changes to Community B.
- Then: the past XP transaction still references Community A (`CommunityRegionIdAtAward` = Community A). The "My Community" leaderboard for Community A still reflects the past contribution for historical periods.

### 4.2 Future XP Attributed to New Community

**Backend integration test.**

- Given: a Member changes from Community A to Community B.
- When: the Member earns new verified XP after the change.
- Then: the new XP transaction references Community B. The "My Community" leaderboard for Community B includes the new XP.

### 4.3 Community Change Does Not Recalculate Past Leaderboards

**Backend integration test.**

- Given: historical XP in Community A.
- When: the Member changes community.
- Then: historical leaderboard queries for Community A still include the past XP. The change does not trigger a recalculation or data migration.

### 4.4 Verified XP Earned With No Home Community — Unattributed

**Backend integration test.**

- Given: a Member with no Home Community earns verified XP.
- When: the XP transaction is inspected.
- Then: `CommunityRegionIdAtAward` is null.

### 4.5 Unattributed XP Included in Personal Progression

**Backend integration test.**

- Given: unattributed verified XP (null `CommunityRegionIdAtAward`).
- When: the Member's level, XP total, and Passport are queried.
- Then: the unattributed XP counts toward personal progression.

### 4.6 Unattributed XP Included in NZ Scope

**Backend integration test.**

- Given: unattributed verified XP.
- When: the New Zealand leaderboard is queried.
- Then: the unattributed XP contributes to the NZ ranking.

### 4.7 Unattributed XP Excluded from My Community Scope

**Backend integration test.**

- Given: unattributed verified XP (null `CommunityRegionIdAtAward`).
- When: any community-attribution leaderboard (My Community, Auckland) is queried.
- Then: the unattributed XP does not contribute.

### 4.8 No Retroactive Attribution After Later Selection

**Backend integration test.**

- Given: a Member earned unattributed verified XP, then later selects a Home Community.
- When: the My Community leaderboard is queried.
- Then: the previously unattributed XP does not appear in the community leaderboard. Only XP earned after the selection has the new community snapshot.

## 5. Community Change Cooldown Tests

### 5.1 First Selection Has No Cooldown

**Backend integration test.**

- Given: a Member with no Home Community set (null).
- When: the Member selects a Home Community for the first time.
- Then: the selection is accepted immediately. No cooldown applies.

### 5.2 Cooldown Enforced After Change

**Backend integration test.**

- Given: a Member changes their Home Community (not the first selection).
- When: the Member attempts to change again within the cooldown period (30 days).
- Then: the change is rejected with a 409 Conflict or appropriate error. The response includes the date when a new change is allowed.

### 5.3 Cooldown Expired — Change Allowed

**Backend integration test.**

- Given: a Member changed their Home Community more than 30 days ago.
- When: the Member requests a new change.
- Then: the change is accepted.

### 5.4 Cooldown Is Server-Side

**Backend integration test.**

- Given: a direct API call to change Home Community within the cooldown period.
- When: the request is made.
- Then: the server rejects it regardless of what the client UI shows.

## 6. Privacy Surface Tests

### 6.1 Share Card API Payload Excludes Home Community

**Backend integration test.**

- Given: a Member with a Home Community set.
- When: the Share Card data is assembled (API response used to build the Share Card).
- Then: the Share Card data does not include `HomeCommunityRegionId` or the community name. This is true regardless of the Member's Passport privacy toggle.

### 6.2 Frontend Share Card Preview Excludes Community

**Frontend integration test.**

- Given: the Share Card builder component is rendered.
- When: the preview is inspected.
- Then: Home Community is never shown in the Share Card preview.

### 6.3 Cypress Privacy Toggle Independence

**E2E test (planned).**

- Given: a Member with Passport toggle on.
- When: the Share Card is generated.
- Then: the Share Card does not contain the community label, regardless of the toggle state.

### 6.4 Passport Shows Community When Toggle Enabled

**Backend integration test.**

- Given: a Member with "Show my community on my Passport" enabled.
- When: the Member requests their own Passport.
- Then: the response includes the Home Community name or identifier.

### 6.5 Passport Hides Community When Toggle Disabled

**Backend integration test.**

- Given: a Member with "Show my community on my Passport" disabled.
- When: the Member requests their own Passport.
- Then: the response does not include the Home Community.

### 6.6 Default Toggle State Is Off

**Backend integration test.**

- Given: a newly registered Member who selects a Home Community.
- When: the privacy toggle is not explicitly set.
- Then: the default is off (community not shown on Passport).

### 6.7 Leaderboard Does Not Expose Per-Row Community

**Backend integration test.**

- Given: a leaderboard response for Auckland or NZ scope.
- When: the response is inspected.
- Then: individual rows do not include the Member's Home Community.

### 6.8 Quest Location Is Public

**Backend integration test.**

- Given: a Quest with a `LocationRegionId` set.
- When: the Quest Detail is requested by any user (Guest or Member).
- Then: the quest's location region is included in the response. This is the quest location, not any user's Home Community.

### 6.9 Deleted Users Excluded from Leaderboard

**Backend integration test.**

- Given: a Member with verified XP who later deletes their account.
- When: the leaderboard is queried.
- Then: the deleted user does not appear as an identifiable row.

## 7. Region and Community Selector Tests

### 7.1 Active Regions Returned for Selector

**Backend integration test.**

- Given: active and inactive LocalArea regions in the database.
- When: the community selector endpoint is called.
- Then: only active LocalArea regions are returned.

### 7.2 Community Selector Is Public

**Backend integration test.**

- Given: an unauthenticated request.
- When: the Region list for the community selector is requested.
- Then: the list is returned (200 OK). Authentication is not required to see available communities.

### 7.3 Community Selector Returns Usable Opaque IDs

**Backend integration test.**

- Given: active regions exist.
- When: the community selector endpoint is called.
- Then: each entry includes an opaque stable Region ID, name, type, and parent ID where required. The response does not expose user associations, residential information, or private participant counts.

### 7.4 Invalid Region Reference Rejected

**Backend integration test.**

- Given: a Member attempts to set Home Community to a non-existent or inactive Region.
- When: the PATCH request is made.
- Then: 400 Bad Request or 422 Unprocessable Entity is returned.

### 7.5 Non-LocalArea Region Rejected for Home Community

**Backend integration test.**

- Given: a Member attempts to set Home Community to a Country or AdministrativeArea Region.
- When: the PATCH request is made.
- Then: the request is rejected. Only LocalArea (or the most granular type) is accepted.

### 7.6 Duplicate Country/Root Region Prevention

**Backend integration test.**

- Given: a Country-level Region already exists.
- When: attempting to insert another Country-level Region with the same name and a null parent.
- Then: the database rejects the duplicate.

### 7.7 Region Deletion Restricted When Historical References Exist

**Backend integration test.**

- Given: a Region referenced by historical `XpTransaction.CommunityRegionIdAtAward` records.
- When: attempting to delete the Region.
- Then: the deletion is restricted (database constraint or application rule). Deactivation via `IsActive` is the intended mechanism.

## 8. Authorization Tests

### 8.1 PATCH /api/v1/users/me Is Self-Scoped

**Backend integration test.**

- Given: Member A is authenticated.
- When: Member A sends `PATCH /api/v1/users/me` with a different user's identifier or attempts to set `HomeCommunityRegionId` for another user.
- Then: the endpoint only affects Member A's own profile. Any attempt to modify another user's data through the self-scoped endpoint is rejected or the foreign identifier is ignored.

### 8.2 Unauthenticated Cannot Set Home Community

**Backend integration test.**

- Given: an unauthenticated request.
- When: PATCH /api/v1/users/me is called.
- Then: 401 Unauthorized is returned.

## 9. Frontend Component Tests

### 9.1 Leaderboard Scope Selector Renders Correct Options for Member with Home Community

- Renders "My Community", "Auckland", "New Zealand" for an authenticated Member with a Home Community.
- "My Community" is selected by default.
- Changing scope triggers a new data fetch.

### 9.2 Leaderboard Scope Selector Renders Correct Options for Member without Home Community

- Renders "Auckland" and "New Zealand" for an authenticated Member without a Home Community.
- "Auckland" is selected by default.

### 9.3 Leaderboard Scope Selector Renders Correct Options for Guest

- Renders "Auckland" and "New Zealand" for a Guest.
- "My Community" is not visible.
- "Auckland" is selected by default.

### 9.4 Small-Community Collective State Renders

- When the API returns a collective-progress response, the UI shows the collective card instead of a ranking table.
- The card includes community metrics (completions, contributors, categories).
- A link to the Auckland leaderboard is present.

### 9.5 Community Selector Renders Region List

- The selector shows available LocalArea regions.
- Search filters the list.
- Selecting a region triggers a confirmation step.
- The cooldown message is shown when active.

### 9.6 Passport Community Toggle

- Toggle is off by default.
- When enabled, the community label appears.
- When disabled, the label is hidden.

### 9.7 Share Card Does Not Include Community

- The Share Card preview never shows a community label.

## 10. Related Documents

- ADR-0008: Community Identity, Local Leaderboards, and Virtual Economy Scope
- `specs/product/02-community-identity-and-gamification-scope-update.md`
- `specs/ux/04-community-identity-leaderboard-and-selector.md`
- `specs/architecture/01-domain-model-region.md`
- `specs/security/01-community-privacy-rules.md`
- `specs/data/01-community-identity-data-model.md`
- `.clinerules/05-testing.md` (base testing strategy)
