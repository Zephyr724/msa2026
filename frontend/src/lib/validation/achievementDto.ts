import type {
  AchievementCatalogItem,
  EarnedAchievement,
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
