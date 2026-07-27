import type {
  CommunitiesLeaderboard,
  PeopleLeaderboard,
} from '../../types/leaderboard.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function validatePeopleLeaderboard(payload: unknown): PeopleLeaderboard {
  if (isRecord(payload)
    && payload.scope === 'nz'
    && payload.period === 'allTime'
    && Array.isArray(payload.rows)
    && payload.rows.every((row) => isRecord(row)
      && isSafeNonNegative(row.rank)
      && typeof row.displayName === 'string'
      && isSafeNonNegative(row.totalXp)
      && isSafeNonNegative(row.verifiedCompletionCount))) {
    return {
      scope: 'nz',
      period: 'allTime',
      page: 1,
      pageSize: 10,
      totalCount: payload.rows.length,
      isPrivacyProtected: false,
      collectiveProgress: null,
      rows: payload.rows as PeopleLeaderboard['rows'],
    };
  }
  if (!isRecord(payload)
    || !['myCommunity', 'auckland', 'nz'].includes(String(payload.scope))
    || !['weekly', 'monthly', 'allTime'].includes(String(payload.period))
    || !isSafeNonNegative(payload.totalCount)
    || typeof payload.isPrivacyProtected !== 'boolean'
    || payload.collectiveProgress !== null
    || !Array.isArray(payload.rows)
    || !payload.rows.every((row) => isRecord(row)
      && isSafeNonNegative(row.rank)
      && typeof row.displayName === 'string'
      && isSafeNonNegative(row.totalXp)
      && isSafeNonNegative(row.verifiedCompletionCount))) {
    throw new Error('People leaderboard response is not valid.');
  }
  if (payload.isPrivacyProtected
    && (payload.totalCount !== 0 || payload.rows.length !== 0)) {
    throw new Error('Privacy-protected leaderboard response is not valid.');
  }
  return payload as unknown as PeopleLeaderboard;
}

export function validateCommunitiesLeaderboard(
  payload: unknown,
): CommunitiesLeaderboard {
  if (!isRecord(payload)
    || !['auckland', 'nz'].includes(String(payload.scope))
    || !['monthly', 'allTime'].includes(String(payload.period))
    || !Array.isArray(payload.rows)
    || !payload.rows.every((row) => isRecord(row)
      && isSafeNonNegative(row.rank)
      && typeof row.regionId === 'string'
      && typeof row.regionName === 'string'
      && isSafeNonNegative(row.verifiedCompletionCount)
      && typeof row.isPrivacyProtected === 'boolean'
      && (row.activeContributors === null || isSafeNonNegative(row.activeContributors))
      && (row.completionsPerContributor === null
        || typeof row.completionsPerContributor === 'number'))) {
    throw new Error('Communities leaderboard response is not valid.');
  }
  return payload as unknown as CommunitiesLeaderboard;
}
