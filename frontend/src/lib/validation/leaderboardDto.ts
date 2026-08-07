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
      && isSafeNonNegative(row.verifiedCompletionCount)
      && typeof row.isCurrentUser === 'boolean')) {
    return {
      scope: 'nz',
      period: 'allTime',
      page: 1,
      pageSize: 10,
      totalCount: payload.rows.length,
      isPrivacyProtected: false,
      collectiveProgress: null,
      currentUser: null,
      rows: payload.rows as PeopleLeaderboard['rows'],
    };
  }
  if (!isRecord(payload)
    || !['myCommunity', 'auckland', 'nz'].includes(String(payload.scope))
    || !['weekly', 'monthly', 'allTime'].includes(String(payload.period))
    || !isSafeNonNegative(payload.totalCount)
    || typeof payload.isPrivacyProtected !== 'boolean'
    || payload.collectiveProgress !== null
    || (payload.currentUser !== null && !isCurrentUserPosition(payload.currentUser))
    || !Array.isArray(payload.rows)
    || !payload.rows.every((row) => isRecord(row)
      && isSafeNonNegative(row.rank)
      && typeof row.displayName === 'string'
      && isSafeNonNegative(row.totalXp)
      && isSafeNonNegative(row.verifiedCompletionCount)
      && typeof row.isCurrentUser === 'boolean')) {
    throw new Error('People leaderboard response is not valid.');
  }
  if (payload.isPrivacyProtected
    && (payload.totalCount !== 0
      || payload.rows.length !== 0
      || payload.currentUser !== null)) {
    throw new Error('Privacy-protected leaderboard response is not valid.');
  }
  return payload as unknown as PeopleLeaderboard;
}

function isCurrentUserPosition(value: unknown): boolean {
  if (!isRecord(value)
    || !isSafeNonNegative(value.rank)
    || value.rank < 1
    || !isSafeNonNegative(value.activeMemberCount)
    || value.activeMemberCount < 1
    || value.rank > value.activeMemberCount
    || !isSafeNonNegative(value.totalXp)
    || !isSafeNonNegative(value.verifiedCompletionCount)
    || !isSafeNonNegative(value.surpassedMemberCount)
    || value.surpassedMemberCount !== value.activeMemberCount - value.rank
    || typeof value.percentile !== 'number'
    || !Number.isFinite(value.percentile)
    || value.percentile < 0
    || value.percentile > 100
    || typeof value.hasReachedScopeUpgradeThreshold !== 'boolean') {
    return false;
  }
  const expected = value.activeMemberCount === 1
    ? 100
    : Math.round(
      (value.surpassedMemberCount * 100 / (value.activeMemberCount - 1)) * 100,
    ) / 100;
  const expectedThreshold = value.activeMemberCount === 1
    || value.surpassedMemberCount * 5
      >= (value.activeMemberCount - 1) * 4;
  return Math.abs(value.percentile - expected) < 0.011
    && value.hasReachedScopeUpgradeThreshold === expectedThreshold;
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
