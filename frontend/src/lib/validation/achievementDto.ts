import type {
  AchievementCatalogItem,
  AchievementNationwideStat,
  AchievementProfile,
  AchievementRarity,
  AchievementTrophyTier,
  EarnedAchievement,
} from '../../types/achievement.ts';
import {
  ACHIEVEMENT_RARITIES,
  ACHIEVEMENT_TROPHY_TIERS,
} from '../../types/achievement.ts';

const CATALOG_ITEM_KEYS = [
  'id',
  'code',
  'name',
  'description',
  'iconUrl',
  'category',
] as const;

const EARNED_ITEM_KEYS = [
  'achievementId',
  'code',
  'name',
  'description',
  'iconUrl',
  'category',
  'awardedAt',
] as const;

const NATIONWIDE_STAT_KEYS = [
  'achievementId',
  'nationwideEarnedCount',
  'nationwideMemberCount',
  'earnedPercentage',
  'rarity',
  'calculatedAtUtc',
] as const;

const ACHIEVEMENT_PROFILE_KEYS = [
  'earnedDistinctCount',
  'activeAchievementCount',
  'trophy',
  'cosmetics',
] as const;

const TROPHY_PROFILE_KEYS = [
  'tier',
  'requiredCount',
  'nextTier',
  'nextRequiredCount',
  'nationwideEarnedCount',
  'nationwideMemberCount',
  'earnedPercentage',
  'rarity',
  'calculatedAtUtc',
] as const;

const COSMETICS_KEYS = [
  'passportBorderStyle',
  'avatarFrameStyle',
  'badgeStampStyles',
] as const;

const PASSPORT_BORDER_STYLES = new Set([
  'forest',
  'kauri',
  'ocean',
  'aurora',
]);
const AVATAR_FRAME_STYLES = new Set([
  'sprout',
  'ember',
  'guardian',
]);
const BADGE_STAMP_STYLES = new Set([
  'explorer',
  'community',
  'legend',
]);
const TROPHY_THRESHOLDS: ReadonlyArray<{
  tier: AchievementTrophyTier;
  requiredCount: number;
}> = [
  { tier: 'Locked', requiredCount: 0 },
  { tier: 'Bronze', requiredCount: 5 },
  { tier: 'Silver', requiredCount: 10 },
  { tier: 'Gold', requiredCount: 20 },
  { tier: 'Platinum', requiredCount: 30 },
  { tier: 'Diamond', requiredCount: 40 },
];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const utcTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(?:Z|[+-]00:00)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length
    && actualKeys.every((key) => keys.includes(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isIconUrl(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isSafeInteger(value)
    && value >= 0;
}

function isPercentage(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 100;
}

function isRarity(value: unknown): value is AchievementRarity {
  return typeof value === 'string'
    && ACHIEVEMENT_RARITIES.some((rarity) => rarity === value);
}

function isTrophyTier(value: unknown): value is AchievementTrophyTier {
  return typeof value === 'string'
    && ACHIEVEMENT_TROPHY_TIERS.some((tier) => tier === value);
}

function isCatalogItem(value: unknown): value is AchievementCatalogItem {
  return isRecord(value)
    && hasExactKeys(value, CATALOG_ITEM_KEYS)
    && typeof value.id === 'string'
    && uuidPattern.test(value.id)
    && isNonEmptyString(value.code)
    && isNonEmptyString(value.name)
    && typeof value.description === 'string'
    && isIconUrl(value.iconUrl)
    && isNonEmptyString(value.category);
}

function isEarnedItem(value: unknown): value is EarnedAchievement {
  return isRecord(value)
    && hasExactKeys(value, EARNED_ITEM_KEYS)
    && typeof value.achievementId === 'string'
    && uuidPattern.test(value.achievementId)
    && isNonEmptyString(value.code)
    && isNonEmptyString(value.name)
    && typeof value.description === 'string'
    && isIconUrl(value.iconUrl)
    && isNonEmptyString(value.category)
    && typeof value.awardedAt === 'string'
    && utcTimestampPattern.test(value.awardedAt);
}

function isNationwideStat(
  value: unknown,
): value is AchievementNationwideStat {
  return isRecord(value)
    && hasExactKeys(value, NATIONWIDE_STAT_KEYS)
    && typeof value.achievementId === 'string'
    && uuidPattern.test(value.achievementId)
    && isNonNegativeInteger(value.nationwideEarnedCount)
    && isNonNegativeInteger(value.nationwideMemberCount)
    && value.nationwideEarnedCount <= value.nationwideMemberCount
    && isPercentage(value.earnedPercentage)
    && isRarity(value.rarity)
    && typeof value.calculatedAtUtc === 'string'
    && utcTimestampPattern.test(value.calculatedAtUtc);
}

function isAchievementProfile(value: unknown): value is AchievementProfile {
  if (!isRecord(value)
    || !hasExactKeys(value, ACHIEVEMENT_PROFILE_KEYS)
    || !isNonNegativeInteger(value.earnedDistinctCount)
    || !isNonNegativeInteger(value.activeAchievementCount)
    || !isRecord(value.trophy)
    || !hasExactKeys(value.trophy, TROPHY_PROFILE_KEYS)
    || !isTrophyTier(value.trophy.tier)
    || !isNonNegativeInteger(value.trophy.requiredCount)
    || !(value.trophy.nextTier === null
      || isTrophyTier(value.trophy.nextTier))
    || !(value.trophy.nextRequiredCount === null
      || isNonNegativeInteger(value.trophy.nextRequiredCount))
    || !isNonNegativeInteger(value.trophy.nationwideEarnedCount)
    || !isNonNegativeInteger(value.trophy.nationwideMemberCount)
    || value.trophy.nationwideEarnedCount
      > value.trophy.nationwideMemberCount
    || !isPercentage(value.trophy.earnedPercentage)
    || !isRarity(value.trophy.rarity)
    || typeof value.trophy.calculatedAtUtc !== 'string'
    || !utcTimestampPattern.test(value.trophy.calculatedAtUtc)
    || !isRecord(value.cosmetics)
    || !hasExactKeys(value.cosmetics, COSMETICS_KEYS)
    || !(value.cosmetics.passportBorderStyle === null
      || (isNonEmptyString(value.cosmetics.passportBorderStyle)
        && PASSPORT_BORDER_STYLES.has(
          value.cosmetics.passportBorderStyle,
        )))
    || !(value.cosmetics.avatarFrameStyle === null
      || (isNonEmptyString(value.cosmetics.avatarFrameStyle)
        && AVATAR_FRAME_STYLES.has(value.cosmetics.avatarFrameStyle)))
    || !Array.isArray(value.cosmetics.badgeStampStyles)
    || value.cosmetics.badgeStampStyles.length > 3
    || !value.cosmetics.badgeStampStyles.every(
      (style) => isNonEmptyString(style) && BADGE_STAMP_STYLES.has(style),
    )
    || new Set(value.cosmetics.badgeStampStyles).size
      !== value.cosmetics.badgeStampStyles.length) {
    return false;
  }

  const earnedDistinctCount = value.earnedDistinctCount as number;
  const current = [...TROPHY_THRESHOLDS]
    .reverse()
    .find((definition) =>
      definition.requiredCount <= earnedDistinctCount);
  const currentIndex = current === undefined
    ? -1
    : TROPHY_THRESHOLDS.findIndex(
      (definition) => definition.tier === current.tier,
    );
  const next = currentIndex < 0
    ? undefined
    : TROPHY_THRESHOLDS[currentIndex + 1];

  return current !== undefined
    && value.trophy.tier === current.tier
    && value.trophy.requiredCount === current.requiredCount
    && value.trophy.nextTier === (next?.tier ?? null)
    && value.trophy.nextRequiredCount === (next?.requiredCount ?? null);
}

export function validateAchievementCatalog(
  payload: unknown,
): AchievementCatalogItem[] {
  if (!Array.isArray(payload)) {
    throw new Error('Achievement catalog response is not valid.');
  }

  return payload.map((item, index) => {
    if (!isCatalogItem(item)) {
      throw new Error(`Invalid achievement catalog item at index ${index}.`);
    }
    return item;
  });
}

export function validateEarnedAchievements(
  payload: unknown,
): EarnedAchievement[] {
  if (!Array.isArray(payload)) {
    throw new Error('Earned achievements response is not valid.');
  }

  return payload.map((item, index) => {
    if (!isEarnedItem(item)) {
      throw new Error(`Invalid earned achievement item at index ${index}.`);
    }
    return item;
  });
}

export function validateAchievementNationwideStats(
  payload: unknown,
): AchievementNationwideStat[] {
  if (!Array.isArray(payload)) {
    throw new Error('Achievement statistics response is not valid.');
  }

  const stats = payload.map((item, index) => {
    if (!isNationwideStat(item)) {
      throw new Error(`Invalid achievement statistic at index ${index}.`);
    }
    return item;
  });
  if (new Set(stats.map((item) => item.achievementId)).size
      !== stats.length) {
    throw new Error('Achievement statistics contain duplicate ids.');
  }
  return stats;
}

export function validateAchievementProfile(
  payload: unknown,
): AchievementProfile {
  if (!isAchievementProfile(payload)) {
    throw new Error('Achievement profile response is not valid.');
  }
  return payload;
}
