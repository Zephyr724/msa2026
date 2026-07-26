import { describe, expect, it } from 'vitest';
import { validateMyProgression } from '../../src/lib/validation/progressionDto.ts';

const valid = { totalXp: 120, level: 3, rankTitle: 'Novice' };

describe('validateMyProgression (F1)', () => {
  it('accepts a valid progression payload', () => {
    expect(validateMyProgression(valid)).toEqual(valid);
    expect(validateMyProgression({ totalXp: 0, level: 1, rankTitle: 'Novice' }))
      .toEqual({ totalXp: 0, level: 1, rankTitle: 'Novice' });
    expect(
      validateMyProgression({ totalXp: 60_000, level: 99, rankTitle: 'Kiwimpact Legend' }),
    ).toEqual({ totalXp: 60_000, level: 99, rankTitle: 'Kiwimpact Legend' });
  });

  it('rejects unknown or missing keys', () => {
    expect(() => validateMyProgression({ ...valid, thresholds: [45] })).toThrow();
    expect(() => validateMyProgression({ totalXp: 120, level: 3 })).toThrow();
    expect(() => validateMyProgression(null)).toThrow();
    expect(() => validateMyProgression([valid])).toThrow();
  });

  it('rejects fractional, unsafe, and negative numbers', () => {
    expect(() => validateMyProgression({ ...valid, totalXp: 120.5 })).toThrow();
    expect(() => validateMyProgression({ ...valid, totalXp: 2 ** 53 })).toThrow();
    expect(() => validateMyProgression({ ...valid, totalXp: -1 })).toThrow();
    expect(() => validateMyProgression({ ...valid, totalXp: '120' })).toThrow();
  });

  it('rejects levels outside 1..99', () => {
    expect(() => validateMyProgression({ ...valid, level: 0 })).toThrow();
    expect(() => validateMyProgression({ ...valid, level: 100 })).toThrow();
    expect(() => validateMyProgression({ ...valid, level: 2.5 })).toThrow();
    expect(() => validateMyProgression({ ...valid, level: '3' })).toThrow();
  });

  it('rejects totalXp/level combinations inconsistent under the mirror', () => {
    // 44 XP is below the level 2 floor of 45.
    expect(() => validateMyProgression({ totalXp: 44, level: 2, rankTitle: 'Novice' }))
      .toThrow();
    // 100 XP reaches the level 3 floor; the server would report level 3.
    expect(() => validateMyProgression({ totalXp: 100, level: 2, rankTitle: 'Novice' }))
      .toThrow();
  });

  it('rejects an empty or non-string rank title', () => {
    expect(() => validateMyProgression({ ...valid, rankTitle: '' })).toThrow();
    expect(() => validateMyProgression({ ...valid, rankTitle: 3 })).toThrow();
  });
});
