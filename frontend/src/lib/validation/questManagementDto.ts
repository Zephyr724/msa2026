import {
  EXTERNAL_SOURCE_STATUSES,
  QUEST_STATUSES,
  type QuestManagementCoverImageDto,
  type QuestManagementDetailDto,
  type QuestManagementListItemDto,
} from '../../types/questManagement';
import {
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  QUEST_REGISTRATION_MODES,
  QUEST_SOURCE_TYPES,
  type QuestLocationRegionDto,
} from '../../types/quest';

const UINT32_MAX = 4_294_967_295;
const INT32_MAX = 2_147_483_647;

const LIST_KEYS = [
  'id', 'title', 'status', 'category', 'difficulty', 'capacity', 'startAtUtc',
  'endAtUtc', 'locationRegion', 'updatedAtUtc', 'version',
] as const;

const DETAIL_KEYS = [
  'id', 'title', 'description', 'category', 'status', 'sourceType',
  'registrationMode', 'difficulty', 'xpAward', 'capacity', 'startAtUtc',
  'endAtUtc', 'locationRegion', 'locationDescription', 'externalSourceUrl',
  'externalSourceStatus', 'sourceCheckedAtUtc', 'nextCheckDueAtUtc',
  'coverImage', 'createdAtUtc', 'updatedAtUtc', 'version',
  'latitude', 'longitude',
] as const;
const LEGACY_DETAIL_KEYS = DETAIL_KEYS.filter(
  (key) => key !== 'latitude' && key !== 'longitude',
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isUuid(value: unknown): value is string {
  return isString(value)
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isEnum(value: unknown, accepted: readonly string[]): value is string {
  return isString(value) && accepted.includes(value);
}

function isNullableEnum(value: unknown, accepted: readonly string[]) {
  return value === null || isEnum(value, accepted);
}

function isNonNegativeInt32(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= 0
    && value <= INT32_MAX;
}

function isVersion(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= 0
    && value <= UINT32_MAX;
}

function isNullableCoordinate(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number | null {
  return value === null
    || (typeof value === 'number' && value >= minimum && value <= maximum);
}

function isIsoUtcTimestamp(value: unknown): value is string {
  if (!isString(value)) return false;
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
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= days[month - 1]!;
}

function isNullableTimestamp(value: unknown): value is string | null {
  return value === null || isIsoUtcTimestamp(value);
}

function isLocationRegion(value: unknown): value is QuestLocationRegionDto {
  return isRecord(value)
    && hasExactKeys(value, ['id', 'name', 'type'])
    && isUuid(value.id)
    && isString(value.name)
    && isEnum(value.type, ['Country', 'AdministrativeArea', 'LocalArea']);
}

function isNullableLocationRegion(value: unknown) {
  return value === null || isLocationRegion(value);
}

function isCoverImage(value: unknown): value is QuestManagementCoverImageDto {
  return isRecord(value)
    && hasExactKeys(value, [
      'id', 'imageUrl', 'altText', 'creatorName', 'sourceUrl', 'licenceNote',
    ])
    && isUuid(value.id)
    && isString(value.imageUrl)
    && isString(value.altText)
    && isNullableString(value.creatorName)
    && isNullableString(value.sourceUrl)
    && isNullableString(value.licenceNote);
}

function isListItem(value: unknown): value is QuestManagementListItemDto {
  return isRecord(value)
    && hasExactKeys(value, LIST_KEYS)
    && isUuid(value.id)
    && isString(value.title)
    && isEnum(value.status, QUEST_STATUSES)
    && isEnum(value.category, QUEST_CATEGORIES)
    && isEnum(value.difficulty, QUEST_DIFFICULTIES)
    && (value.capacity === null || isNonNegativeInt32(value.capacity))
    && isNullableTimestamp(value.startAtUtc)
    && isNullableTimestamp(value.endAtUtc)
    && isNullableLocationRegion(value.locationRegion)
    && isIsoUtcTimestamp(value.updatedAtUtc)
    && isVersion(value.version);
}

function isDetail(value: unknown): value is QuestManagementDetailDto {
  return isRecord(value)
    && (hasExactKeys(value, DETAIL_KEYS) || hasExactKeys(value, LEGACY_DETAIL_KEYS))
    && isUuid(value.id)
    && isString(value.title)
    && isString(value.description)
    && isEnum(value.category, QUEST_CATEGORIES)
    && isEnum(value.status, QUEST_STATUSES)
    && isEnum(value.sourceType, QUEST_SOURCE_TYPES)
    && isNullableEnum(value.registrationMode, QUEST_REGISTRATION_MODES)
    && isEnum(value.difficulty, QUEST_DIFFICULTIES)
    && isNonNegativeInt32(value.xpAward)
    && (value.capacity === null || isNonNegativeInt32(value.capacity))
    && isNullableTimestamp(value.startAtUtc)
    && isNullableTimestamp(value.endAtUtc)
    && isNullableLocationRegion(value.locationRegion)
    && isNullableString(value.locationDescription)
    && isNullableString(value.externalSourceUrl)
    && isNullableEnum(value.externalSourceStatus, EXTERNAL_SOURCE_STATUSES)
    && isNullableTimestamp(value.sourceCheckedAtUtc)
    && isNullableTimestamp(value.nextCheckDueAtUtc)
    && isCoverImage(value.coverImage)
    && isIsoUtcTimestamp(value.createdAtUtc)
    && isIsoUtcTimestamp(value.updatedAtUtc)
    && isVersion(value.version)
    && isNullableCoordinate(value.latitude ?? null, -90, 90)
    && isNullableCoordinate(value.longitude ?? null, -180, 180)
    && (((value.latitude ?? null) === null) === ((value.longitude ?? null) === null));
}

export function validateQuestManagementList(
  payload: unknown,
): QuestManagementListItemDto[] {
  if (!Array.isArray(payload)) {
    throw new Error('Quest management list response is not an array.');
  }
  return payload.map((item, index) => {
    if (!isListItem(item)) {
      throw new Error(`Invalid managed Quest at index ${index}.`);
    }
    return item;
  });
}

export function validateQuestManagementDetail(
  payload: unknown,
): QuestManagementDetailDto {
  if (!isDetail(payload)) {
    throw new Error('Quest management detail response is not valid.');
  }
  return {
    ...payload,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
  };
}
