// ── Slice 5B client mirror of the server progression curve ─────────
// Pure deterministic mirror of
// backend/src/Kiwimpact.Core/Progression/ProgressionRules.cs
// (plan §6 D3, §10). The server remains authoritative for totalXp, level,
// and rankTitle; this module derives display-only thresholds and never
// writes XP, level, or rank anywhere. Any accepted curve change must update
// both implementations and both test suites in one approved Slice.
//
// Rejection style: every invalid input THROWS. There is no clamping —
// inconsistent authoritative data must surface as an error state, never as
// a plausible-looking bar (M2/m1).

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 99;

export interface LevelProgress {
  /** Cumulative XP required to reach the current level. */
  levelFloor: number;
  /** Cumulative XP required for the next level; null at MAX_LEVEL. */
  nextFloor: number | null;
  /** XP earned within the current level (totalXp - levelFloor). */
  currentLevelXp: number;
  /** Span of the current level (nextFloor - levelFloor); null at MAX_LEVEL. */
  levelSpanXp: number | null;
  /** XP remaining to the next level; null at MAX_LEVEL. */
  xpToNextLevel: number | null;
}

function assertLevel(level: number): void {
  if (!Number.isSafeInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
    throw new Error(`Level must be an integer between ${MIN_LEVEL} and ${MAX_LEVEL}.`);
  }
}

/** Cumulative total XP required to reach `level`; level 1 begins at 0 XP. */
export function levelFloor(level: number): number {
  assertLevel(level);
  if (level === MIN_LEVEL) {
    return 0;
  }
  return 5 * (level - 1) * (level + 7);
}

/**
 * Derives the unified within-level progress quantities from the
 * server-authoritative totals. Throws when totalXp/level are mutually
 * inconsistent under the mirror (totalXp below the level floor, or at/above
 * the next floor while level < MAX_LEVEL) — the server would have reported
 * a different level for such a total.
 */
export function deriveLevelProgress(totalXp: number, level: number): LevelProgress {
  if (!Number.isSafeInteger(totalXp) || totalXp < 0) {
    throw new Error('Total XP must be a non-negative safe integer.');
  }
  assertLevel(level);

  const floor = levelFloor(level);
  if (totalXp < floor) {
    throw new Error('Total XP is below the reported level floor.');
  }

  if (level === MAX_LEVEL) {
    return {
      levelFloor: floor,
      nextFloor: null,
      currentLevelXp: totalXp - floor,
      levelSpanXp: null,
      xpToNextLevel: null,
    };
  }

  const next = levelFloor(level + 1);
  if (totalXp >= next) {
    throw new Error('Total XP reaches the next level; the reported level is stale.');
  }

  return {
    levelFloor: floor,
    nextFloor: next,
    currentLevelXp: totalXp - floor,
    levelSpanXp: next - floor,
    xpToNextLevel: next - totalXp,
  };
}
