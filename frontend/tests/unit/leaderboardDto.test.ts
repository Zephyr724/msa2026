import { describe, expect, it } from 'vitest';
import { validatePeopleLeaderboard } from '../../src/lib/validation/leaderboardDto.ts';

function row(overrides: Record<string, unknown> = {}) {
  return {
    rank: 1,
    displayName: 'Aroha',
    totalXp: 150,
    verifiedCompletionCount: 2,
    ...overrides,
  };
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    scope: 'nz',
    period: 'allTime',
    rows: [row()],
    ...overrides,
  };
}

describe('people leaderboard DTO validation', () => {
  it('accepts the exact staged response and preserves duplicate names', () => {
    const value = payload({
      rows: [
        row(),
        row({ rank: 2, displayName: 'Aroha', totalXp: 50 }),
      ],
    });

    expect(validatePeopleLeaderboard(value)).toEqual(value);
  });

  it.each([
    ['non-object envelope', []],
    ['extra envelope key', payload({ userId: 'leak' })],
    ['wrong scope', payload({ scope: 'auckland' })],
    ['wrong period', payload({ period: 'weekly' })],
    ['non-array rows', payload({ rows: {} })],
    ['more than ten rows', payload({
      rows: Array.from({ length: 11 }, (_, index) =>
        row({ rank: index + 1, displayName: `Member ${index}` })),
    })],
    ['extra row key', payload({ rows: [row({ userId: 'leak' })] })],
    ['missing row key', payload({
      rows: [{
        rank: 1,
        displayName: 'Aroha',
        totalXp: 50,
      }],
    })],
    ['non-sequential rank', payload({ rows: [row({ rank: 2 })] })],
    ['empty display name', payload({ rows: [row({ displayName: '' })] })],
    ['overlong display name', payload({
      rows: [row({ displayName: 'x'.repeat(101) })],
    })],
    ['negative XP', payload({ rows: [row({ totalXp: -1 })] })],
    ['fractional XP', payload({ rows: [row({ totalXp: 1.5 })] })],
    ['unsafe XP', payload({
      rows: [row({ totalXp: Number.MAX_SAFE_INTEGER + 1 })],
    })],
    ['zero completion count', payload({
      rows: [row({ verifiedCompletionCount: 0 })],
    })],
    ['fractional completion count', payload({
      rows: [row({ verifiedCompletionCount: 1.5 })],
    })],
  ])('rejects %s', (_name, value) => {
    expect(() => validatePeopleLeaderboard(value)).toThrow(
      'People leaderboard response is not valid.',
    );
  });
});
