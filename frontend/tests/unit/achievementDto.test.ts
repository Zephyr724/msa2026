import { describe, expect, it } from 'vitest';
import {
  validateAchievementCatalog,
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
});
