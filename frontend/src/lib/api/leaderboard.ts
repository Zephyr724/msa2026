import type { PeopleLeaderboard } from '../../types/leaderboard.ts';
import { validatePeopleLeaderboard } from '../validation/leaderboardDto.ts';
import { apiFetch } from './apiFetch.ts';

export async function fetchPeopleLeaderboard(options?: {
  signal?: AbortSignal;
}): Promise<PeopleLeaderboard> {
  const payload = await apiFetch<unknown>('/v1/leaderboards/people', {
    signal: options?.signal,
  });
  return validatePeopleLeaderboard(payload);
}
