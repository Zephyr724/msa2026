import { useQuery } from '@tanstack/react-query';
import {
  fetchCommunitiesLeaderboard,
  fetchPeopleLeaderboard,
} from '../lib/api/leaderboard.ts';
import type {
  CommunitiesLeaderboardPeriod,
  CommunitiesLeaderboardScope,
  PeopleLeaderboardPeriod,
  PeopleLeaderboardScope,
} from '../types/leaderboard.ts';

const LEADERBOARD_STALE_TIME_MS = 60_000;

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  people: (scope: PeopleLeaderboardScope, period: PeopleLeaderboardPeriod) =>
    ['leaderboard', 'people', scope, period] as const,
  communities: (
    scope: CommunitiesLeaderboardScope,
    period: CommunitiesLeaderboardPeriod,
  ) => ['leaderboard', 'communities', scope, period] as const,
};

export function usePeopleLeaderboard(
  scope: PeopleLeaderboardScope,
  period: PeopleLeaderboardPeriod,
  enabled = true,
) {
  return useQuery({
    queryKey: leaderboardKeys.people(scope, period),
    queryFn: ({ signal }) => fetchPeopleLeaderboard({ scope, period, signal }),
    enabled,
    retry: false,
    staleTime: LEADERBOARD_STALE_TIME_MS,
  });
}

export function useCommunitiesLeaderboard(
  scope: CommunitiesLeaderboardScope,
  period: CommunitiesLeaderboardPeriod,
  enabled = true,
) {
  return useQuery({
    queryKey: leaderboardKeys.communities(scope, period),
    queryFn: ({ signal }) =>
      fetchCommunitiesLeaderboard({ scope, period, signal }),
    enabled,
    retry: false,
    staleTime: LEADERBOARD_STALE_TIME_MS,
  });
}
