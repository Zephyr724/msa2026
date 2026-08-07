import { describe, expect, it } from 'vitest';
import {
  validateCommunitiesLeaderboard,
  validatePeopleLeaderboard,
} from '../../src/lib/validation/leaderboardDto.ts';

const people = {
  scope: 'myCommunity',
  period: 'weekly',
  page: 1,
  pageSize: 10,
  totalCount: 1,
  isPrivacyProtected: false,
  collectiveProgress: null,
  currentUser: null,
  rows: [{
    rank: 1,
    displayName: 'Aroha',
    totalXp: 150,
    verifiedCompletionCount: 2,
    isCurrentUser: true,
  }],
};

describe('leaderboard DTO validation', () => {
  it('accepts multi-scope people and community contracts', () => {
    expect(validatePeopleLeaderboard(people)).toEqual(people);
    const communities = {
      scope: 'auckland',
      period: 'monthly',
      rows: [{
        rank: 1,
        regionId: '11111111-1111-4111-8111-111111111111',
        regionName: 'Albert-Eden',
        verifiedCompletionCount: 20,
        activeContributors: 10,
        completionsPerContributor: 2,
        isPrivacyProtected: false,
      }],
    };
    expect(validateCommunitiesLeaderboard(communities)).toEqual(communities);
  });

  it('accepts an internally consistent current-member position', () => {
    const currentUser = {
      rank: 2,
      activeMemberCount: 6,
      totalXp: 150,
      verifiedCompletionCount: 2,
      surpassedMemberCount: 4,
      percentile: 80,
      hasReachedScopeUpgradeThreshold: true,
    };
    expect(validatePeopleLeaderboard({ ...people, currentUser }).currentUser)
      .toEqual(currentUser);
  });

  it('keeps scope eligibility authoritative when display percentile rounds to 80', () => {
    const currentUser = {
      rank: 4002,
      activeMemberCount: 20001,
      totalXp: 50,
      verifiedCompletionCount: 1,
      surpassedMemberCount: 15999,
      percentile: 80,
      hasReachedScopeUpgradeThreshold: false,
    };
    expect(validatePeopleLeaderboard({ ...people, currentUser }).currentUser)
      .toEqual(currentUser);
  });

  it('accepts a privacy-protected response only without counts or progress', () => {
    expect(validatePeopleLeaderboard({
      ...people,
      totalCount: 0,
      isPrivacyProtected: true,
      collectiveProgress: null,
      currentUser: null,
      rows: [],
    }).isPrivacyProtected).toBe(true);
  });

  it.each([
    null,
    { ...people, scope: 'street' },
    { ...people, period: 'daily' },
    { ...people, totalCount: -1 },
    {
      ...people,
      totalCount: 4,
      isPrivacyProtected: true,
      collectiveProgress: null,
      currentUser: null,
      rows: [],
    },
    {
      ...people,
      totalCount: 0,
      isPrivacyProtected: true,
      collectiveProgress: { totalXp: 300, verifiedCompletionCount: 6 },
      rows: [],
    },
    { ...people, rows: [{ ...people.rows[0], totalXp: -1 }] },
    { ...people, rows: [{ ...people.rows[0], isCurrentUser: 'yes' }] },
    {
      ...people,
      currentUser: {
        rank: 2,
        activeMemberCount: 6,
        totalXp: 150,
        verifiedCompletionCount: 2,
        surpassedMemberCount: 3,
        percentile: 80,
        hasReachedScopeUpgradeThreshold: true,
      },
    },
  ])('rejects invalid people payload %#', (value) => {
    expect(() => validatePeopleLeaderboard(value)).toThrow();
  });
});
