import type { MyProgression } from '../../types/progression.ts';
import { deriveLevelProgress } from '../progressionRules.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length
    && actualKeys.every((key) => keys.includes(key));
}

/**
 * Strict validator for `GET /v1/users/me/progression` (m1): exact keys,
 * safe-integer numeric bounds, and the totalXp/level consistency check from
 * the client mirror (plan §10). Any violation rejects the payload.
 */
export function validateMyProgression(payload: unknown): MyProgression {
  if (
    !isRecord(payload)
    || !hasExactKeys(payload, ['totalXp', 'level', 'rankTitle'])
    || typeof payload.totalXp !== 'number'
    || !Number.isSafeInteger(payload.totalXp)
    || payload.totalXp < 0
    || typeof payload.level !== 'number'
    || !Number.isSafeInteger(payload.level)
    || typeof payload.rankTitle !== 'string'
    || payload.rankTitle.length === 0
  ) {
    throw new Error('Progression response is not valid.');
  }

  // Cross-field consistency under the mirror; throws on any invalid state.
  deriveLevelProgress(payload.totalXp, payload.level);

  return payload as unknown as MyProgression;
}
