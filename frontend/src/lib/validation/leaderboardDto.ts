import type {
  LeaderboardRow,
  PeopleLeaderboard,
} from '../../types/leaderboard.ts';

const LEADERBOARD_KEYS = ['scope', 'period', 'rows'] as const;
const ROW_KEYS = [
  'rank',
  'displayName',
  'totalXp',
  'verifiedCompletionCount',
] as const;

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

function isLeaderboardRow(
  value: unknown,
  expectedRank: number,
): value is LeaderboardRow {
  return isRecord(value)
    && hasExactKeys(value, ROW_KEYS)
    && value.rank === expectedRank
    && Number.isInteger(value.rank)
    && typeof value.displayName === 'string'
    && value.displayName.length > 0
    && value.displayName.length <= 100
    && typeof value.totalXp === 'number'
    && Number.isSafeInteger(value.totalXp)
    && value.totalXp >= 0
    && typeof value.verifiedCompletionCount === 'number'
    && Number.isSafeInteger(value.verifiedCompletionCount)
    && value.verifiedCompletionCount > 0;
}

export function validatePeopleLeaderboard(
  payload: unknown,
): PeopleLeaderboard {
  if (!isRecord(payload)
    || !hasExactKeys(payload, LEADERBOARD_KEYS)
    || payload.scope !== 'nz'
    || payload.period !== 'allTime'
    || !Array.isArray(payload.rows)
    || payload.rows.length > 10
    || !payload.rows.every((row, index) => isLeaderboardRow(row, index + 1))) {
    throw new Error('People leaderboard response is not valid.');
  }

  return payload as unknown as PeopleLeaderboard;
}
