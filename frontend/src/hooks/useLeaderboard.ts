import { useQuery } from '@tanstack/react-query';
import { fetchPeopleLeaderboard } from '../lib/api/leaderboard.ts';

const LEADERBOARD_STALE_TIME_MS = 60_000;

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  peopleNzAllTime: ['leaderboard', 'people', 'nz', 'allTime'] as const,
};

export function usePeopleLeaderboard() {
  return useQuery({
    queryKey: leaderboardKeys.peopleNzAllTime,
    queryFn: ({ signal }) => fetchPeopleLeaderboard({ signal }),
    retry: false,
    staleTime: LEADERBOARD_STALE_TIME_MS,
  });
}
