import type {
  PagedResponse,
  QuestCoverImageDto,
  QuestDetailDto,
  QuestImageDto,
  QuestListItemDto,
  QuestLocationRegionDto,
} from '../../types/quest';
import {
  QUEST_CATEGORIES,
  QUEST_SOURCE_TYPES,
  QUEST_DIFFICULTIES,
  QUEST_REGISTRATION_MODES,
} from '../../types/quest';

const INT32_MIN = -2_147_483_648;
const INT32_MAX = 2_147_483_647;
const MAX_PAGE_SIZE = 50;

const QUEST_LIST_ITEM_KEYS = [
  'id', 'title', 'description', 'category', 'sourceType', 'registrationMode',
  'difficulty', 'xpAward', 'capacity', 'startAtUtc', 'endAtUtc',
  'locationRegion', 'locationDescription', 'coverImage',
  'latitude', 'longitude',
] as const;
const LEGACY_QUEST_LIST_ITEM_KEYS = QUEST_LIST_ITEM_KEYS.filter(
  (key) => key !== 'latitude' && key !== 'longitude',
);

const QUEST_DETAIL_KEYS = [
  ...QUEST_LIST_ITEM_KEYS,
  'externalSourceUrl', 'sourceCheckedAt',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= INT32_MIN
    && value <= INT32_MAX;
}

function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length
    && actualKeys.every((key) => keys.includes(key));
}

function isOptionalString(value: unknown): value is string | null {
  // null is acceptable for nullable string fields.
  // undefined is NOT acceptable — the property must be present and must be null or a string.
  if (value === null) return true;
  if (value === undefined) return false;
  return typeof value === 'string';
}

function isUuidString(value: unknown): value is string {
  return isString(value) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isValidIsoTimestamp(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== 'string') return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(?:Z|[+-]00:00)$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    return false;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31, leapYear ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
  ];
  return day >= 1 && day <= daysInMonth[month - 1]!;
}

function isValidQuestImage(value: unknown): value is QuestImageDto {
  if (!isRecord(value)) return false;
  return hasExactKeys(value, [
    'id', 'imageUrl', 'altText', 'sortOrder', 'isCover',
    'creatorName', 'sourceUrl', 'licenceNote',
  ])
    && isUuidString(value.id)
    && isString(value.imageUrl)
    && isString(value.altText)
    && isInteger(value.sortOrder)
    && typeof value.isCover === 'boolean'
    && isOptionalString(value.creatorName)
    && isOptionalString(value.sourceUrl)
    && isOptionalString(value.licenceNote);
}

function isValidCoverImage(value: unknown): value is QuestCoverImageDto {
  if (!isRecord(value)) return false;
  return hasExactKeys(value, ['id', 'imageUrl', 'altText'])
    && isUuidString(value.id)
    && isString(value.imageUrl)
    && isString(value.altText);
}

const ACCEPTED_REGION_TYPES = new Set<string>(['Country', 'AdministrativeArea', 'LocalArea']);

function isValidLocationRegion(value: unknown): value is QuestLocationRegionDto {
  if (!isRecord(value)) return false;
  return hasExactKeys(value, ['id', 'name', 'type'])
    && isUuidString(value.id)
    && isString(value.name)
    && isString(value.type)
    && ACCEPTED_REGION_TYPES.has(value.type);
}

// ── Shared enum constant sets (runtime mirrors of type-level unions) ──

const CATEGORIES_SET = new Set<string>(QUEST_CATEGORIES);
const SOURCE_TYPES_SET = new Set<string>(QUEST_SOURCE_TYPES);
const DIFFICULTIES_SET = new Set<string>(QUEST_DIFFICULTIES);
const REGISTRATION_MODES_SET = new Set<string>(QUEST_REGISTRATION_MODES);

// ── Required field validators (reject missing/undefined) ────────────

function isValidQuestCategory(value: unknown): value is string {
  return isString(value) && CATEGORIES_SET.has(value);
}

function isValidQuestSourceType(value: unknown): value is string {
  return isString(value) && SOURCE_TYPES_SET.has(value);
}

function isValidQuestDifficulty(value: unknown): value is string {
  return isString(value) && DIFFICULTIES_SET.has(value);
}

function isValidRegistrationMode(value: unknown): value is string | null {
  if (value === null) return true;
  // undefined is not allowed for nullable fields that are present
  if (value === undefined) return false;
  return isString(value) && REGISTRATION_MODES_SET.has(value);
}

function hasValidQuestListFields(value: unknown): value is QuestListItemDto {
  if (!isRecord(value)) return false;
  if (!isUuidString(value.id)) return false;
  if (!isString(value.title)) return false;
  if (!isString(value.description)) return false;
  // Required enum fields: reject missing/undefined
  if (!isValidQuestCategory(value.category)) return false;
  if (!isValidQuestSourceType(value.sourceType)) return false;
  if (value.registrationMode !== null && !isValidRegistrationMode(value.registrationMode)) return false;
  if (!isValidQuestDifficulty(value.difficulty)) return false;
  if (!isNonNegativeInteger(value.xpAward)) return false;
  if (value.capacity === undefined) return false;
  if (value.capacity !== null && !isNonNegativeInteger(value.capacity)) return false;
  if (value.startAtUtc === undefined) return false;
  if (!isValidIsoTimestamp(value.startAtUtc)) return false;
  if (value.endAtUtc === undefined) return false;
  if (!isValidIsoTimestamp(value.endAtUtc)) return false;
  if (value.locationRegion === undefined) return false;
  if (value.locationRegion !== null) {
    if (!isValidLocationRegion(value.locationRegion)) return false;
  }
  if (!isOptionalString(value.locationDescription)) return false;
  if (value.coverImage === undefined) return false;
  if (value.coverImage !== null) {
    if (!isValidCoverImage(value.coverImage)) return false;
  }
  const latitude = value.latitude ?? null;
  const longitude = value.longitude ?? null;
  if (latitude !== null
    && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
    return false;
  }
  if (longitude !== null
    && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
    return false;
  }
  if ((latitude === null) !== (longitude === null)) return false;
  return true;
}

function isValidQuestListItem(value: unknown): value is QuestListItemDto {
  return isRecord(value)
    && (hasExactKeys(value, QUEST_LIST_ITEM_KEYS)
      || hasExactKeys(value, LEGACY_QUEST_LIST_ITEM_KEYS))
    && hasValidQuestListFields(value);
}

export function validateQuestListItem(payload: unknown): QuestListItemDto {
  if (!isValidQuestListItem(payload)) {
    throw new Error('Quest list item response is not valid.');
  }
  return payload;
}

function isValidQuestDetail(value: unknown): value is QuestDetailDto {
  const legacyDetailKeys = QUEST_DETAIL_KEYS.filter(
    (key) => key !== 'latitude' && key !== 'longitude',
  );
  if (!isRecord(value)
    || (!hasExactKeys(value, QUEST_DETAIL_KEYS)
      && !hasExactKeys(value, legacyDetailKeys))) return false;
  if (!hasValidQuestListFields(value)) return false;
  const rec = value as unknown as Record<string, unknown>;
  if (rec.externalSourceUrl === undefined) return false;
  if (!isOptionalString(rec.externalSourceUrl)) return false;
  if (rec.sourceCheckedAt === undefined) return false;
  if (!isValidIsoTimestamp(rec.sourceCheckedAt)) return false;
  return true;
}

export function validateQuestsPage(payload: unknown): PagedResponse<QuestListItemDto> {
  if (!isRecord(payload)) {
    throw new Error('Quest page response is not an object.');
  }
  if (!Array.isArray(payload.items)) {
    throw new Error('Quest page items is not an array.');
  }
  const items: QuestListItemDto[] = [];
  for (let i = 0; i < payload.items.length; i += 1) {
    const item = payload.items[i];
    if (!isValidQuestListItem(item)) {
      throw new Error(`Invalid Quest list item at index ${i}.`);
    }
    items.push({
      ...item,
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
    });
  }
  if (!hasExactKeys(payload, [
    'items', 'page', 'pageSize', 'totalCount', 'totalPages',
    'hasNextPage', 'hasPreviousPage',
  ])) {
    throw new Error('Quest page response has unexpected properties.');
  }
  if (!isInteger(payload.page)) {
    throw new Error('Quest page pagination field "page" must be an integer.');
  }
  if (!isInteger(payload.pageSize)) {
    throw new Error('Quest page pagination field "pageSize" must be an integer.');
  }
  if (!isInteger(payload.totalCount)) {
    throw new Error('Quest page pagination field "totalCount" must be an integer.');
  }
  if (!isInteger(payload.totalPages)) {
    throw new Error('Quest page pagination field "totalPages" must be an integer.');
  }
  // Non-negative pagination metadata
  if (payload.page < 1) {
    throw new Error('Quest page pagination field "page" must be >= 1.');
  }
  if (payload.pageSize < 1) {
    throw new Error('Quest page pagination field "pageSize" must be >= 1.');
  }
  if (payload.pageSize > MAX_PAGE_SIZE) {
    throw new Error(`Quest page pagination field "pageSize" must be <= ${MAX_PAGE_SIZE}.`);
  }
  if (payload.totalCount < 0) {
    throw new Error('Quest page pagination field "totalCount" must be >= 0.');
  }
  if (payload.totalPages < 0) {
    throw new Error('Quest page pagination field "totalPages" must be >= 0.');
  }
  if (typeof payload.hasNextPage !== 'boolean') {
    throw new Error('Quest page pagination field "hasNextPage" must be a boolean.');
  }
  if (typeof payload.hasPreviousPage !== 'boolean') {
    throw new Error('Quest page pagination field "hasPreviousPage" must be a boolean.');
  }

  return {
    items,
    page: payload.page,
    pageSize: payload.pageSize,
    totalCount: payload.totalCount,
    totalPages: payload.totalPages,
    hasNextPage: payload.hasNextPage,
    hasPreviousPage: payload.hasPreviousPage,
  };
}

export function validateQuestDetail(payload: unknown): QuestDetailDto {
  if (!isValidQuestDetail(payload)) {
    throw new Error('Quest detail response is not valid.');
  }
  return {
    ...payload,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
  };
}

export function validateQuestImages(payload: unknown): QuestImageDto[] {
  if (!Array.isArray(payload)) {
    throw new Error('Quest images response is not an array.');
  }
  const result: QuestImageDto[] = [];
  for (let i = 0; i < payload.length; i += 1) {
    const item = payload[i];
    if (!isValidQuestImage(item)) {
      throw new Error(`Invalid Quest image at index ${i}.`);
    }
    result.push(item);
  }
  return result;
}
