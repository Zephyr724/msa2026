import { describe, expect, it } from 'vitest';
import {
  validateAchievementCatalog,
  validateAchievementNationwideStats,
  validateAchievementProfile,
  validateEarnedAchievements,
} from '../../src/lib/validation/achievementDto.ts';

const catalogItem = {
  id: '11111111-1111-4111-8111-111111111111',
  code: 'verified-completions-1',
  name: 'First Steps',
  description: 'Complete one verified quest.',
  iconUrl: null,
  category: 'Milestone',
};

const earnedItem = {
  achievementId: catalogItem.id,
  code: catalogItem.code,
  name: catalogItem.name,
  description: catalogItem.description,
  iconUrl: 'https://cdn.example.test/first-steps.svg',
  category: catalogItem.category,
  awardedAt: '2026-07-26T01:23:45.0000000Z',
};

const nationwideStat = {
  achievementId: catalogItem.id,
  nationwideEarnedCount: 1,
  nationwideMemberCount: 20000,
  earnedPercentage: 0.005,
  rarity: 'UltraRare',
  calculatedAtUtc: '2026-07-30T00:00:00.0000000Z',
};

const achievementProfile = {
  earnedDistinctCount: 12,
  activeAchievementCount: 45,
  trophy: {
    tier: 'Silver',
    requiredCount: 10,
    nextTier: 'Gold',
    nextRequiredCount: 20,
    nationwideEarnedCount: 8,
    nationwideMemberCount: 240,
    earnedPercentage: 3.3333,
    rarity: 'Rare',
    calculatedAtUtc: '2026-07-30T00:00:00.0000000Z',
  },
  cosmetics: {
    passportBorderStyle: 'forest',
    avatarFrameStyle: 'sprout',
    badgeStampStyles: ['explorer'],
  },
};

describe('achievement DTO validators', () => {
  it('accepts valid catalog arrays, including empty and non-null icon URLs', () => {
    expect(validateAchievementCatalog([])).toEqual([]);
    expect(validateAchievementCatalog([
      catalogItem,
      { ...catalogItem, iconUrl: 'https://cdn.example.test/icon.svg' },
    ])).toHaveLength(2);
  });

  it.each([
    ['non-array', {}],
    ['extra key', [{ ...catalogItem, threshold: 1 }]],
    ['missing key', [{ ...catalogItem, category: undefined }]],
    ['invalid UUID', [{ ...catalogItem, id: 'not-a-uuid' }]],
    ['empty code', [{ ...catalogItem, code: '' }]],
    ['empty name', [{ ...catalogItem, name: '' }]],
    ['empty category', [{ ...catalogItem, category: '' }]],
    ['invalid icon URL type', [{ ...catalogItem, iconUrl: 42 }]],
  ])('rejects an invalid catalog payload: %s', (_name, payload) => {
    const normalized = _name === 'missing key'
      ? [{ ...catalogItem }] as Record<string, unknown>[]
      : payload;
    if (_name === 'missing key') delete normalized[0]!.category;
    expect(() => validateAchievementCatalog(normalized)).toThrow();
  });

  it('accepts strict earned rows and empty earned arrays', () => {
    expect(validateEarnedAchievements([])).toEqual([]);
    expect(validateEarnedAchievements([earnedItem])).toEqual([earnedItem]);
    expect(validateEarnedAchievements([
      { ...earnedItem, awardedAt: '2026-07-26T01:23:45+00:00' },
    ])).toHaveLength(1);
  });

  it.each([
    ['non-array', {}],
    ['extra key', [{ ...earnedItem, userId: 'secret' }]],
    ['missing key', [{ ...earnedItem, awardedAt: undefined }]],
    ['invalid UUID', [{ ...earnedItem, achievementId: 'not-a-uuid' }]],
    ['date only', [{ ...earnedItem, awardedAt: '2026-07-26' }]],
    ['non-UTC offset', [{ ...earnedItem, awardedAt: '2026-07-26T01:23:45+12:00' }]],
    ['too much precision', [{ ...earnedItem, awardedAt: '2026-07-26T01:23:45.12345678Z' }]],
  ])('rejects an invalid earned payload: %s', (_name, payload) => {
    const normalized = _name === 'missing key'
      ? [{ ...earnedItem }] as Record<string, unknown>[]
      : payload;
    if (_name === 'missing key') delete normalized[0]!.awardedAt;
    expect(() => validateEarnedAchievements(normalized)).toThrow();
  });

  it('accepts exact nationwide statistics and rejects duplicate ids', () => {
    expect(validateAchievementNationwideStats([nationwideStat]))
      .toEqual([nationwideStat]);
    expect(() => validateAchievementNationwideStats([
      nationwideStat,
      nationwideStat,
    ])).toThrow(/duplicate/i);
  });

  it.each([
    ['non-array', {}],
    ['extra key', [{ ...nationwideStat, userIds: [] }]],
    ['earned exceeds members', [{
      ...nationwideStat,
      nationwideEarnedCount: 2,
      nationwideMemberCount: 1,
    }]],
    ['negative count', [{ ...nationwideStat, nationwideEarnedCount: -1 }]],
    ['percentage over 100', [{ ...nationwideStat, earnedPercentage: 101 }]],
    ['unknown rarity', [{ ...nationwideStat, rarity: 'Legendary' }]],
    ['non-UTC timestamp', [{
      ...nationwideStat,
      calculatedAtUtc: '2026-07-30T12:00:00+12:00',
    }]],
  ])('rejects an invalid nationwide statistic: %s', (_name, payload) => {
    expect(() => validateAchievementNationwideStats(payload)).toThrow();
  });

  it('accepts the exact trophy and cosmetic profile contract', () => {
    expect(validateAchievementProfile(achievementProfile))
      .toEqual(achievementProfile);
  });

  it.each([
    ['extra key', { ...achievementProfile, userId: 'secret' }],
    ['tier/count mismatch', {
      ...achievementProfile,
      trophy: { ...achievementProfile.trophy, tier: 'Bronze', requiredCount: 5 },
    }],
    ['half-null next pair', {
      ...achievementProfile,
      trophy: { ...achievementProfile.trophy, nextRequiredCount: null },
    }],
    ['unknown border token', {
      ...achievementProfile,
      cosmetics: {
        ...achievementProfile.cosmetics,
        passportBorderStyle: 'url(javascript:bad)',
      },
    }],
    ['unknown avatar token', {
      ...achievementProfile,
      cosmetics: {
        ...achievementProfile.cosmetics,
        avatarFrameStyle: 'unknown',
      },
    }],
    ['duplicate badge token', {
      ...achievementProfile,
      cosmetics: {
        ...achievementProfile.cosmetics,
        badgeStampStyles: ['explorer', 'explorer'],
      },
    }],
    ['too many badge tokens', {
      ...achievementProfile,
      cosmetics: {
        ...achievementProfile.cosmetics,
        badgeStampStyles: ['explorer', 'community', 'legend', 'explorer'],
      },
    }],
    ['invalid calculated timestamp', {
      ...achievementProfile,
      trophy: {
        ...achievementProfile.trophy,
        calculatedAtUtc: '2026-07-30',
      },
    }],
  ])('rejects an invalid achievement profile: %s', (_name, payload) => {
    expect(() => validateAchievementProfile(payload)).toThrow();
  });
});
