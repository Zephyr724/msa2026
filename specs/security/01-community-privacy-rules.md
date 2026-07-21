# Community Privacy Rules

- **Status:** Accepted
- **Date:** 2026-07-20
- **Source:** ADR-0008 Community Identity, Local Leaderboards, and Virtual Economy Scope
- **Purpose:** Define privacy rules for Home Community, location data, and leaderboard visibility.

> This document records accepted security and privacy direction. It does not claim that the implementation, tests, or deployment configuration are complete.

## 1. Home Community — Data Collection Principle

The Home Community feature collects only the minimum location information needed for community identity and leaderboard scoping.

### Allowed

- Store a single coarse-grained Region identifier (LocalArea level).
- Allow the Member to select, view, and change this identifier.

### Prohibited

- Requesting or storing a street address for Home Community purposes.
- Inferring Home Community from GPS coordinates.
- Inferring Home Community from IP address geolocation.
- Inferring Home Community from a precise home address.
- Requesting continuous or background geolocation permission.
- Storing a history of past Home Community selections as a movement log.
- Building a public user movement history from quest participation locations.
- Exposing a user's residential location through any public surface.

### Rationale

A coarse, user-selected community identifier is sufficient for local leaderboards and community identity. More precise location data would create unnecessary privacy risk, permission friction, and data-governance burden without providing product value for the MVP.

## 2. Home Community Visibility

| Surface | Visibility | Rule |
|---------|-----------|------|
| Leaderboard — My Community scope | Community label shown as the scope title | Public. The scope name is visible. Individual members' community affiliations are not listed in the ranking. |
| Leaderboard — Auckland / NZ scope | No community label per row | Community affiliation is not shown. |
| Passport (own view) | Configurable | The Member can toggle `Show my community on my Passport`. Default: off. |
| Passport (viewed by another user) | Not applicable in MVP | There is no public profile or other-user Passport view in the MVP. |
| Share Card | Never shown | Home Community is excluded from Share Cards. This is not configurable. |
| Quest Detail | Quest location region may be shown | The quest's general location (e.g. "Waitākere Ranges") is public. This is the quest location, not a user's Home Community. |
| Account Settings | Visible to the owning Member | The selected Home Community is shown in the settings page. |
| Admin surfaces | Visible to Admin for authorised operational use | Admin may see a Member's Home Community for authorised operational purposes (e.g. understanding community metrics, investigating reported issues). Admin access is not a public surface and must not be used for unrelated browsing of user data. |

## 3. Small-Community Leaderboard Protection

A community with fewer than 10 active ranked Members (configurable threshold) must not display a full identifiable ranking.

### Rule

When the number of active ranked Members in a community scope is below the threshold:

- Do not render the full ranked leaderboard.
- Display a collective-progress card instead (see UX specification).
- The current Member's own position and XP may be shown privately above the collective card.
- Do not expose the exact count when it is below the threshold if the count itself could identify individuals.

### Rationale

In a small community, a full ranking combined with public XP values could effectively identify individual users and their activity patterns. The collective-progress state protects privacy while still providing community motivation.

### Threshold Configuration

The threshold is a configurable application setting, defaulting to 10. It is a product decision, not a legal privacy constant. It should be reviewable as community sizes change.

### Privacy-Protected Response Shape

For Community Challenge progress and Communities Leaderboard responses below
the configured privacy threshold:

```json
{
  "isPrivacyProtected": true,
  "activeContributors": null,
  "ratio": null
}
```

- Do not return exact contributor count.
- Do not return the exact `verified completions / active contributors` ratio.
- Do not expose participant identities.
- Exact verified-completion totals may remain only when aggregate totals are permitted.
- Apply the same suppression to SignalR payloads (`ChallengeProgressUpdated`, `LeaderboardUpdated`).

## 4. Quest Location vs Home Community

These are separate fields with different privacy properties:

| Field | Purpose | Visibility |
|-------|---------|------------|
| `Quest.LocationRegionId` | Where a Quest takes place | Public. Shown on Quest Detail and used for discovery filtering. |
| `UserProfile.HomeCommunityRegionId` | The community a Member identifies with | Private by default. Never on Share Cards. Configurable on Passport. |

A user may belong to one community and complete a Quest in another. The system must not imply or expose that a user lives near the quests they complete.

## 5. Community Change Cooldown

When a Member changes their Home Community:

- Apply a cooldown period (initially 30 days) before the next change is allowed.
- The first selection has no cooldown.
- Do not retroactively move historical XP between communities.
- Past XP stays attributed to the community in which it was earned (`XpTransaction.CommunityRegionIdAtAward`).
- The cooldown is enforced server-side in the application service layer, not only in the UI.

### Rationale

A cooldown reduces leaderboard gaming (switching to a less competitive community to achieve a higher rank) and provides stability for community metrics.

## 6. Data Retention and Deletion

### Home Community Changes

- When a Member changes their Home Community, the previous selection is overwritten. The system does not retain a history of past community selections.
- Historical `XpTransaction.CommunityRegionIdAtAward` records are retained for leaderboard integrity. They reference a Region by Id and are not deleted when a user changes community.

### Account Deletion

When a Member's account is deleted:

- Profile data, display name, and authentication information are removed or anonymised.
- `HomeCommunityRegionId` is removed with the `UserProfile`.
- Deleted users must not remain identifiable in individual leaderboard rows.
- Historical `XpTransaction.CommunityRegionIdAtAward` records may be retained only for non-identifiable aggregate metrics and required audit purposes.
- The final storage mechanism for historical attribution after account deletion is part of the complete account-deletion specification and is not fully defined by this document.

### Region Deactivation

- When a Region is deactivated (via `IsActive = false`), existing references (XP snapshots, past quest locations) must not be deleted or orphaned.
- Deactivated regions are excluded from the community selector and leaderboard scope options.

## 7. API Rules

### Community Selector Endpoint

- The Region list endpoint for the community selector is public (read-only).
- It returns an opaque stable Region ID, name, type, and parent ID where required for hierarchy navigation.
- Region IDs are internal identifiers, not secrets.
- The endpoint does not expose user associations, residential information, or private participant counts.

### Leaderboard Endpoint

- The leaderboard endpoint accepts a scope parameter (community, Auckland, NZ).
- The "My Community" scope requires authentication. The server reads the authenticated user's `HomeCommunityRegionId`; it is not supplied by the client.
- The server enforces the small-community threshold and returns the appropriate response shape.

### User Profile Endpoint

- `GET /api/v1/users/me` returns the authenticated user's `HomeCommunityRegionId` and the privacy toggle state.
- `PATCH /api/v1/users/me` accepts `HomeCommunityRegionId` changes. The server enforces the cooldown.

## 8. Testing Requirements

See `specs/testing/01-community-leaderboard-and-privacy-tests.md` for detailed test cases covering:

- Small-community suppression;
- Community change cooldown enforcement;
- Share Card exclusion of Home Community;
- Passport community label toggle;
- XP snapshot immutability after community change;
- Unattributed XP behaviour;
- Leaderboard scope correctness;
- Unauthorized leaderboard scope access;
- Deleted user exclusion from leaderboard rows;
- Community selector response shape;
- Duplicate Region prevention;
- Region deletion restriction when historical references exist.

## 9. Related Documents

- ADR-0008: Community Identity, Local Leaderboards, and Virtual Economy Scope
- `specs/product/02-community-identity-and-gamification-scope-update.md`
- `specs/ux/04-community-identity-leaderboard-and-selector.md`
- `specs/architecture/01-domain-model-region.md`
- `specs/data/01-community-identity-data-model.md`
- `specs/testing/01-community-leaderboard-and-privacy-tests.md`
- `.clinerules/04b-auth-security.md` (base authentication and authorization rules)
- `.clinerules/04d-runtime-security.md` (rate limiting, CSRF, CORS)
