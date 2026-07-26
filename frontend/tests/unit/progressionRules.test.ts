import { describe, expect, it } from 'vitest';
import {
  deriveLevelProgress,
  levelFloor,
  MAX_LEVEL,
} from '../../src/lib/progressionRules.ts';

describe('progressionRules client mirror (F2)', () => {
  it('pins the exact cumulative floors of the server curve', () => {
    expect(levelFloor(1)).toBe(0);
    expect(levelFloor(2)).toBe(45);
    expect(levelFloor(3)).toBe(100);
    expect(levelFloor(4)).toBe(165);
    expect(levelFloor(10)).toBe(765);
    expect(levelFloor(99)).toBe(51_940);
  });

  it('rejects invalid levels instead of clamping', () => {
    expect(() => levelFloor(0)).toThrow();
    expect(() => levelFloor(100)).toThrow();
    expect(() => levelFloor(2.5)).toThrow();
    expect(() => levelFloor(-3)).toThrow();
    expect(() => levelFloor(2 ** 53)).toThrow();
  });

  it('derives unified within-level quantities for a mid-level total', () => {
    // Level 3, 120 total XP: floor(3) = 100, floor(4) = 165.
    expect(deriveLevelProgress(120, 3)).toEqual({
      levelFloor: 100,
      nextFloor: 165,
      currentLevelXp: 20,
      levelSpanXp: 65,
      xpToNextLevel: 45,
    });
  });

  it('derives the Level 1 starting state', () => {
    expect(deriveLevelProgress(0, 1)).toEqual({
      levelFloor: 0,
      nextFloor: 45,
      currentLevelXp: 0,
      levelSpanXp: 45,
      xpToNextLevel: 45,
    });
  });

  it('treats totalXp == floor(L+1) as server-level L+1 input', () => {
    // At exactly 100 XP the server reports level 3, so (100, 2) is invalid
    // and (100, 3) is the consistent zero-progress boundary state.
    expect(() => deriveLevelProgress(100, 2)).toThrow();
    expect(deriveLevelProgress(100, 3)).toEqual({
      levelFloor: 100,
      nextFloor: 165,
      currentLevelXp: 0,
      levelSpanXp: 65,
      xpToNextLevel: 65,
    });
  });

  it('has no next threshold at the maximum level', () => {
    expect(MAX_LEVEL).toBe(99);
    expect(deriveLevelProgress(51_940, 99)).toEqual({
      levelFloor: 51_940,
      nextFloor: null,
      currentLevelXp: 0,
      levelSpanXp: null,
      xpToNextLevel: null,
    });
    // XP keeps accruing past the cap; the level stays 99.
    expect(deriveLevelProgress(60_000, 99).currentLevelXp).toBe(8_060);
  });

  it('rejects invalid server state with no silent clamping', () => {
    expect(() => deriveLevelProgress(-1, 1)).toThrow();
    expect(() => deriveLevelProgress(2.5, 1)).toThrow();
    expect(() => deriveLevelProgress(2 ** 53, 1)).toThrow();
    // totalXp below the reported level floor.
    expect(() => deriveLevelProgress(44, 2)).toThrow();
    // totalXp at/above the next floor while level < 99.
    expect(() => deriveLevelProgress(45, 1)).toThrow();
    // Level outside 1..99.
    expect(() => deriveLevelProgress(100, 0)).toThrow();
    expect(() => deriveLevelProgress(100, 100)).toThrow();
    expect(() => deriveLevelProgress(100, 2.5)).toThrow();
  });
});
