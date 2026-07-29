import {
  PASSPORT_QUEST_STATUSES,
  type PassportCommunityParticipation,
  type PassportCompletionsPage,
  type PassportCompletionItem,
  type PassportSummary,
} from '../../types/passport.ts';
import { QUEST_CATEGORIES } from '../../types/quest.ts';
import { isValidRegionSummaryDto } from './regionDto.ts';
import { validateMyProgression } from './progressionDto.ts';

const MAX_PAGE_SIZE = 50;

const ITEM_KEYS = [
  'completionId', 'questId', 'questTitle', 'questCategory', 'questStatus',
  'coverImage', 'status', 'method', 'completedAtUtc', 'verifiedAtUtc', 'xpAmount',
  'achievementNames',
] as const;

const categories = new Set<string>(QUEST_CATEGORIES);
const questStatuses = new Set<string>(PASSPORT_QUEST_STATUSES);
const utcTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(?:Z|[+-]00:00)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length
    && actualKeys.every((key) => keys.includes(key));
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isUuidString(value: unknown): value is string {
  return isString(value)
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isUtcTimestamp(value: unknown): value is string {
  return typeof value === 'string' && utcTimestampPattern.test(value);
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

/** Null for ordinary reward-pending rows; otherwise a positive safe integer. */
function isXpAmount(value: unknown): value is number | null {
  return value === null || (isSafeInteger(value) && value > 0);
}

function isCoverImage(value: unknown): boolean {
  return value === null || (
    isRecord(value)
    && hasExactKeys(value, ['id', 'imageUrl', 'altText'])
    && isUuidString(value.id)
    && isString(value.imageUrl)
    && value.imageUrl.length > 0
    && isString(value.altText)
    && value.altText.length > 0
  );
}

function isValidItem(value: unknown): value is PassportCompletionItem {
  return isRecord(value)
    && hasExactKeys(value, ITEM_KEYS)
    && isUuidString(value.completionId)
    && isUuidString(value.questId)
    && isString(value.questTitle)
    && isString(value.questCategory)
    && categories.has(value.questCategory)
    && isString(value.questStatus)
    && questStatuses.has(value.questStatus)
    && isCoverImage(value.coverImage)
    && typeof value.status === 'string'
    && ['Pending', 'Verified', 'Rejected', 'SelfReported'].includes(value.status)
    && typeof value.method === 'string'
    && ['CompletionCode', 'EvidenceClaim', 'SelfReported'].includes(value.method)
    && isUtcTimestamp(value.completedAtUtc)
    && (value.verifiedAtUtc === null || isUtcTimestamp(value.verifiedAtUtc))
    && isXpAmount(value.xpAmount)
    && Array.isArray(value.achievementNames)
    && value.achievementNames.every(
      (name) => isString(name) && name.trim().length > 0,
    )
    && (
      value.achievementNames.length === 0
      || (value.status === 'Verified' && value.xpAmount !== null)
    )
    && (value.status === 'Verified'
      ? value.verifiedAtUtc !== null
      : value.verifiedAtUtc === null && value.xpAmount === null);
}

/**
 * Strict validator for `GET /v1/users/me/passport/completions` (m1): exact
 * keys, enum membership, strict UTC timestamps, safe-integer bounds, and
 * envelope coherence (flags must agree with page/totalPages, items must fit
 * the page size). Any violation rejects the payload.
 */
export function validatePassportCompletionsPage(
  payload: unknown,
): PassportCompletionsPage {
  if (
    !isRecord(payload)
    || !hasExactKeys(payload, [
      'items', 'page', 'pageSize', 'totalCount', 'totalPages',
      'hasNextPage', 'hasPreviousPage',
    ])
    || !Array.isArray(payload.items)
    || !isSafeInteger(payload.page)
    || payload.page < 1
    || !isSafeInteger(payload.pageSize)
    || payload.pageSize < 1
    || payload.pageSize > MAX_PAGE_SIZE
    || !isSafeInteger(payload.totalCount)
    || payload.totalCount < 0
    || !isSafeInteger(payload.totalPages)
    || payload.totalPages < 0
    || typeof payload.hasNextPage !== 'boolean'
    || typeof payload.hasPreviousPage !== 'boolean'
    || payload.hasNextPage !== (payload.page < payload.totalPages)
    || payload.hasPreviousPage !== (payload.page > 1)
    || payload.items.length > payload.pageSize
  ) {
    throw new Error('Passport completions page response is not valid.');
  }

  const items: PassportCompletionItem[] = [];
  for (let i = 0; i < payload.items.length; i += 1) {
    const item: unknown = payload.items[i];
    if (!isValidItem(item)) {
      throw new Error(`Invalid Passport completion item at index ${i}.`);
    }
    items.push(item);
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

export function validatePassportSummary(payload: unknown): PassportSummary {
  if (
    !isRecord(payload)
    || !hasExactKeys(payload, [
      'displayName', 'totalXp', 'level', 'rankTitle', 'homeCommunity',
      'verifiedCompletionCount', 'selfReportedCompletionCount',
      'pendingCompletionCount', 'categoryImpact',
    ])
    || typeof payload.displayName !== 'string'
    || payload.displayName.length === 0
    || (payload.homeCommunity !== null
      && !isValidRegionSummaryDto(payload.homeCommunity))
    || !isNonNegativeSafeInteger(payload.verifiedCompletionCount)
    || !isNonNegativeSafeInteger(payload.selfReportedCompletionCount)
    || !isNonNegativeSafeInteger(payload.pendingCompletionCount)
    || !Array.isArray(payload.categoryImpact)
  ) {
    throw new Error('Passport summary response is not valid.');
  }
  validateMyProgression({
    totalXp: payload.totalXp,
    level: payload.level,
    rankTitle: payload.rankTitle,
  });
  const seen = new Set<string>();
  for (const item of payload.categoryImpact) {
    if (
      !isRecord(item)
      || !hasExactKeys(item, [
        'category', 'verifiedCompletionCount', 'verifiedXp',
      ])
      || typeof item.category !== 'string'
      || !categories.has(item.category)
      || seen.has(item.category)
      || !isNonNegativeSafeInteger(item.verifiedCompletionCount)
      || !isNonNegativeSafeInteger(item.verifiedXp)
    ) {
      throw new Error('Passport category impact response is not valid.');
    }
    seen.add(item.category);
  }
  return payload as unknown as PassportSummary;
}

export function validatePassportCommunityParticipation(
  payload: unknown,
): PassportCommunityParticipation[] {
  if (!Array.isArray(payload)) {
    throw new Error('Passport community participation response is not valid.');
  }
  const result: PassportCommunityParticipation[] = [];
  const seen = new Set<string>();
  for (const item of payload) {
    if (
      !isRecord(item)
      || !hasExactKeys(item, [
        'community', 'isCurrentCommunity', 'verifiedCompletionCount',
        'verifiedXp', 'challengesContributedTo', 'challengeAchievementsEarned',
        'latestContributionAtUtc',
      ])
      || !isValidRegionSummaryDto(item.community)
      || seen.has(item.community.id)
      || typeof item.isCurrentCommunity !== 'boolean'
      || !isNonNegativeSafeInteger(item.verifiedCompletionCount)
      || !isNonNegativeSafeInteger(item.verifiedXp)
      || !isNonNegativeSafeInteger(item.challengesContributedTo)
      || !isNonNegativeSafeInteger(item.challengeAchievementsEarned)
      || !isUtcTimestamp(item.latestContributionAtUtc)
    ) {
      throw new Error('Passport community participation item is not valid.');
    }
    seen.add(item.community.id);
    result.push(item as unknown as PassportCommunityParticipation);
  }
  return result;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return isSafeInteger(value) && value >= 0;
}
