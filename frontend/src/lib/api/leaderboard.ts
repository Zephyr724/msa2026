import type {
  CommunitiesLeaderboard,
  CommunitiesLeaderboardPeriod,
  CommunitiesLeaderboardScope,
  PeopleLeaderboard,
  PeopleLeaderboardPeriod,
  PeopleLeaderboardScope,
} from '../../types/leaderboard.ts';
import {
  validateCommunitiesLeaderboard,
  validatePeopleLeaderboard,
} from '../validation/leaderboardDto.ts';
import { apiFetch } from './apiFetch.ts';

export async function fetchPeopleLeaderboard(options: {
  scope: PeopleLeaderboardScope;
  period: PeopleLeaderboardPeriod;
  signal?: AbortSignal;
}): Promise<PeopleLeaderboard> {
  const params = new URLSearchParams({
    scope: options.scope,
    period: options.period,
  });
  const payload = await apiFetch<unknown>(`/v1/leaderboards/people?${params}`, {
    signal: options.signal,
  });
  return validatePeopleLeaderboard(payload);
}

export async function fetchCommunitiesLeaderboard(options: {
  scope: CommunitiesLeaderboardScope;
  period: CommunitiesLeaderboardPeriod;
  signal?: AbortSignal;
}): Promise<CommunitiesLeaderboard> {
  const params = new URLSearchParams({
    scope: options.scope,
    period: options.period,
  });
  const payload = await apiFetch<unknown>(
    `/v1/leaderboards/communities?${params}`,
    { signal: options.signal },
  );
  return validateCommunitiesLeaderboard(payload);
}
