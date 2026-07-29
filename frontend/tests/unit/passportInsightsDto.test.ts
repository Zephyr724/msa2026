import { describe, expect, it } from 'vitest';
import {
  validatePassportCommunityParticipation,
  validatePassportSummary,
} from '../../src/lib/validation/passportDto.ts';

const community = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Henderson-Massey',
  type: 'LocalArea',
  parentRegionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
};

function summary() {
  return {
    displayName: 'Aroha',
    totalXp: 120,
    level: 3,
    rankTitle: 'Novice',
    homeCommunity: community,
    verifiedCompletionCount: 2,
    selfReportedCompletionCount: 1,
    pendingCompletionCount: 1,
    categoryImpact: [{
      category: 'RestoreNature',
      verifiedCompletionCount: 2,
      verifiedXp: 100,
    }],
  };
}

describe('Passport insight DTO validation', () => {
  it('accepts the exact summary and community-participation contracts', () => {
    expect(validatePassportSummary(summary())).toEqual(summary());
    const participation = [{
      community,
      isCurrentCommunity: true,
      verifiedCompletionCount: 2,
      verifiedXp: 100,
      challengesContributedTo: 1,
      challengeAchievementsEarned: 1,
      latestContributionAtUtc: '2026-07-27T01:02:03.0000000Z',
    }];
    expect(validatePassportCommunityParticipation(participation))
      .toEqual(participation);
  });

  it('rejects duplicate categories, unsafe counts, and duplicate communities', () => {
    expect(() => validatePassportSummary({
      ...summary(),
      categoryImpact: [
        ...summary().categoryImpact,
        ...summary().categoryImpact,
      ],
    })).toThrow();
    expect(() => validatePassportSummary({
      ...summary(),
      verifiedCompletionCount: -1,
    })).toThrow();
    const item = {
      community,
      isCurrentCommunity: false,
      verifiedCompletionCount: 1,
      verifiedXp: 50,
      challengesContributedTo: 0,
      challengeAchievementsEarned: 0,
      latestContributionAtUtc: '2026-07-27T01:02:03Z',
    };
    expect(() => validatePassportCommunityParticipation([item, item])).toThrow();
  });

  it('rejects privacy-expanded or malformed payloads', () => {
    expect(() => validatePassportSummary({
      ...summary(),
      email: 'private@example.test',
    })).toThrow();
    expect(() => validatePassportCommunityParticipation([{
      community,
      isCurrentCommunity: false,
      verifiedCompletionCount: 1,
      verifiedXp: 50,
      challengesContributedTo: 0,
      challengeAchievementsEarned: 0,
      latestContributionAtUtc: 'not-a-date',
      contributorNames: ['Aroha'],
    }])).toThrow();
  });
});
