# Slice 23 — Richer Achievements, National Rarity, Trophies, and Passport Cosmetics

- **Status:** Implemented and verified; independent Review 76 approved;
  pending explicit human Git approval
- **Date:** 2026-07-30
- **Risk:** High — award correctness, historical backfill, public aggregates,
  privacy, and additive schema migration
- **Decision source:** Product-owner instructions in the active Codex task on
  2026-07-30

## 1. Goal

Replace the three-item milestone-only presentation with a broad,
server-authoritative achievement system that:

- awards typed completion, category, breadth, historical streak, level, and
  Community Challenge achievements;
- shows the nationwide distinct-earner count and percentage for every active
  achievement;
- derives a stable Bronze-to-Diamond trophy from the number of distinct
  achievements a member has earned;
- shows the current trophy beside the signed-in member's name in navigation;
- derives a Passport border, avatar frame, and badge stamps from earned
  achievements without adding inventory, currency, purchasing, or a shop.

## 2. Locked product decisions

### 2.1 Typed rules

The rule engine is a closed, typed evaluator. It never executes stored scripts,
expressions, reflection-selected methods, or client-authored criteria.

Supported kinds:

1. `TotalVerifiedCompletions`
2. `CategoryVerifiedCompletions`
3. `AllCategoriesMinimum`
4. `LongestWeeklyStreak`
5. `LevelReached`
6. `CommunityChallengeReward`

All automatic rules derive only from committed XP transactions and their
source Verified completions. Self-reported completions do not count.
Category rules use an immutable completion-time category snapshot. Level rules
use the existing server-authoritative XP curve. Streak rules use distinct
Pacific/Auckland weeks and the historical longest run, so an earned
achievement is never revoked after a later broken streak.

Automatic awards reference the XP transaction that first satisfied the rule.
Community Challenge rewards continue to reference their source challenge.

### 2.2 Initial catalog

The first rich catalog contains 45 definitions:

- 8 total Verified-completion milestones at 1, 3, 5, 10, 25, 50, 100, and
  250;
- 18 category achievements: 3, 10, and 25 Verified completions in each of the
  six accepted Quest categories;
- 3 breadth achievements: at least 1, 5, and 10 Verified completions in every
  accepted Quest category;
- 6 longest-weekly-streak achievements at 2, 4, 8, 12, 26, and 52 weeks;
- 7 level achievements at Levels 5, 10, 20, 30, 50, 75, and 99;
- 3 active Community Challenge reward definitions selectable by Admins.

The existing three achievement IDs and codes remain unchanged.

### 2.3 National rarity

Rarity is a dynamic aggregate and never changes award eligibility or trophy
ownership.

- Denominator: distinct confirmed Identity users who have a `UserProfile` and
  the `Member` role.
- Numerator: distinct denominator users who have at least one
  `UserAchievement` for the achievement.
- Community Challenge repeats count the user once per achievement.
- Output includes exact earned count, exact denominator, percentage,
  calculated timestamp, and label.
- Only national aggregates are public. No earner list, regional slice, email,
  user ID, Home Community, evidence, or activity history is exposed.
- Existing small-community suppression remains unchanged; the product owner
  explicitly approved exact national aggregate counts for achievements.

Labels:

- `Unawarded`: zero earners;
- `UltraRare`: percentage greater than 0 and at most 1%;
- `Rare`: greater than 1% and at most 5%;
- `Uncommon`: greater than 5% and at most 20%;
- `Common`: greater than 20%.

An earned percentage below 0.01% is displayed as `<0.01%`; the API retains a
bounded decimal value.

The stats endpoint is not ready while any existing profile has not completed
the current catalog evaluation version. It returns the existing bounded
progression-not-ready response rather than publishing a known-low count.

### 2.4 Trophy

The trophy is a derived presentation, not an Achievement row and not a new
inventory entity. It uses the lifetime count of distinct achievement IDs
earned by the member, including later-inactive historical achievements.
Repeated Community Challenge awards count once.

| Tier | Required distinct achievements |
| --- | ---: |
| Bronze | 5 |
| Silver | 10 |
| Gold | 20 |
| Platinum | 30 |
| Diamond | 40 |

Below Bronze, the trophy is `Locked`. Trophy state never depends on dynamic
rarity, so another member earning an achievement cannot downgrade anyone.

The signed-in navigation shows the lit trophy beside the member name at Bronze
or above. Failure to load the optional trophy query never blocks auth,
navigation, or sign-out. Passport shows the locked/current tier, next
threshold, progress, nationwide tier count, and nationwide percentage.

### 2.5 Cosmetics

Cosmetics are deterministic allowlisted presentation tokens declared by
selected static achievement definitions:

- one highest-priority `PassportBorder`;
- one highest-priority `AvatarFrame`;
- up to three highest-priority `BadgeStamp` values.

The user owns a cosmetic by owning its source achievement. There is no
inventory, equip mutation, shop, virtual currency, random reward, or gameplay
effect. The API returns only allowlisted style codes. The frontend maps those
codes to repository-owned CSS/SVG.

The first version frames the existing Rank Crest/initial identity. It does not
add profile-photo upload.

## 3. Schema changes

One additive migration is approved:

1. `QuestCompletions.QuestCategorySnapshot`
   - required enum-as-string, max length 50;
   - every completion factory copies `Quest.Category`;
   - legacy rows are backfilled once from their current Quest row;
   - this legacy backfill is an explicitly recorded historical approximation;
   - add a category/user index suitable for award facts and Passport
     aggregation.
2. `UserProfiles.AchievementEvaluationVersion`
   - required integer;
   - legacy rows start behind the current catalog and are processed by the
     bounded achievement backfill;
   - new profiles start at the current catalog version;
   - live XP award paths evaluate all active automatic rules and mark the
     tracked profile current inside the same profile-lock transaction.

Passport category aggregates must switch to the immutable category snapshot so
the Passport and category achievements cannot disagree after a Quest edit.

## 4. API

Existing v1 achievement catalog and earned-achievement response shapes remain
unchanged to preserve strict-client compatibility.

Add:

### `GET /api/v1/achievement-stats`

Anonymous, active catalog only:

```json
[
  {
    "achievementId": "uuid",
    "nationwideEarnedCount": 12,
    "nationwideMemberCount": 240,
    "earnedPercentage": 5.0,
    "rarity": "Rare",
    "calculatedAtUtc": "2026-07-30T00:00:00Z"
  }
]
```

### `GET /api/v1/users/me/achievement-profile`

Caller-only:

```json
{
  "earnedDistinctCount": 12,
  "activeAchievementCount": 45,
  "trophy": {
    "tier": "Silver",
    "requiredCount": 10,
    "nextTier": "Gold",
    "nextRequiredCount": 20,
    "nationwideEarnedCount": 8,
    "nationwideMemberCount": 240,
    "earnedPercentage": 3.3333,
    "rarity": "Rare",
    "calculatedAtUtc": "2026-07-30T00:00:00Z"
  },
  "cosmetics": {
    "passportBorderStyle": "forest",
    "avatarFrameStyle": "sprout",
    "badgeStampStyles": ["explorer"]
  }
}
```

The private endpoint follows the same caller-only and readiness boundary as
the existing earned-achievement endpoint.

## 5. Awarding, concurrency, and backfill

- Keep the existing per-user `UserProfile FOR UPDATE` serialization and
  partial unique-index backstop.
- Replace per-definition union scans with one current-catalog evaluation
  version on `UserProfile`.
- For one user, load the ordered XP/completion fact rows once and evaluate all
  active typed rules in memory.
- Live redemption, evidence approval, and XP reconciliation evaluate and stage
  missing automatic awards in the same transaction as XP/progression.
- Historical backfill selects bounded profiles whose evaluation version is
  behind, locks and evaluates one profile per transaction, then marks it
  current even when it earns zero awards.
- Definition order never decides rule correctness. Trigger selection is
  deterministic by `(CreatedAt, XpTransactionId)`.
- Community Challenge rewards retain their existing per-challenge idempotency.
- The challenge finalizer revalidates that any persisted reward still maps to
  an active static `CommunityChallengeReward`; a legacy invalid reference
  fails closed without a status transition or award and requires explicit
  Admin cancellation.
- Trophy and rarity queries always use distinct achievement/user counts and
  calculate their composite numerator/denominator values from one PostgreSQL
  `REPEATABLE READ` snapshot.

## 6. Frontend

- Group the 45 catalog cards by achievement family.
- Every card shows national earned count, percentage, and rarity.
- Preserve locked/unlocked state and truthful award date.
- Replace the hard-coded three-milestone card with the trophy progress card.
- Apply allowlisted border/frame/stamp styles to Passport presentation.
- Render an accessible trophy SVG for Locked, Bronze, Silver, Gold, Platinum,
  and Diamond.
- Show the lit current trophy beside the signed-in navigation name.
- Keep loading, empty, not-ready, error, mobile, dark-theme, reduced-motion,
  and strict DTO validation behavior.

## 7. Verification

Targeted verification must cover:

- all static IDs/codes and exact 45-definition catalog;
- every rule boundary and deterministic trigger;
- category snapshot creation, migration backfill, and Quest-edit stability;
- historical Auckland streaks including same-week duplicates and DST;
- level threshold crossing;
- live, reconciliation, and historical award paths;
- evaluation-version readiness and backfill convergence;
- concurrency and uniqueness;
- national distinct counts, repeated challenge awards, denominator semantics,
  zero denominator, rounding, and rarity labels;
- trophy thresholds, monotonic distinct counting, rarity, and Locked state;
- cosmetic allowlisting and priority;
- API exact keys and privacy exclusions;
- Passport grouping, rarity, trophy progress, cosmetics, navigation fallback,
  responsive layout, and themes.

Applicable full frontend and backend gates run once after implementation.

## 8. Explicit exclusions

- user-selected equipment;
- real profile-photo upload;
- public earner/user lists;
- regional achievement rarity;
- arbitrary rule expressions or scripts;
- retroactive rewrites after an award;
- trophy tables or unlock-time history;
- currency, shop, purchasing, trading, gifting, loot boxes, or gameplay power.
