import {
  PASSPORT_QUEST_STATUSES,
  type PassportCompletionsPage,
  type PassportCompletionItem,
} from '../../types/passport.ts';
import { QUEST_CATEGORIES } from '../../types/quest.ts';

const MAX_PAGE_SIZE = 50;

const ITEM_KEYS = [
  'completionId', 'questId', 'questTitle', 'questCategory', 'questStatus',
  'status', 'method', 'completedAtUtc', 'verifiedAtUtc', 'xpAmount',
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
    && value.status === 'Verified'
    && value.method === 'CompletionCode'
    && isUtcTimestamp(value.completedAtUtc)
    && isUtcTimestamp(value.verifiedAtUtc)
    && isXpAmount(value.xpAmount);
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
