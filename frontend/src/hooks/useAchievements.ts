import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAchievementCatalog,
  fetchAchievementNationwideStats,
  fetchMyAchievementProfile,
  fetchMyAchievements,
} from '../lib/api/achievements.ts';

const CATALOG_STALE_TIME_MS = 24 * 60 * 60 * 1000;
const STATS_STALE_TIME_MS = 5 * 60 * 1000;
const PROFILE_STALE_TIME_MS = 60 * 1000;

export const achievementKeys = {
  all: ['achievements'] as const,
  catalog: ['achievements', 'catalog'] as const,
  mine: ['achievements', 'me'] as const,
  stats: ['achievements', 'stats'] as const,
  profile: ['achievements', 'profile', 'me'] as const,
};

export function useAchievementCatalog() {
  return useQuery({
    queryKey: achievementKeys.catalog,
    queryFn: ({ signal }) => fetchAchievementCatalog({ signal }),
    retry: false,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

export function useMyAchievements() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: achievementKeys.mine,
    queryFn: ({ signal }) => fetchMyAchievements({ queryClient, signal }),
    retry: false,
  });
}

export function useAchievementNationwideStats() {
  return useQuery({
    queryKey: achievementKeys.stats,
    queryFn: ({ signal }) => fetchAchievementNationwideStats({ signal }),
    retry: false,
    staleTime: STATS_STALE_TIME_MS,
  });
}

export function useMyAchievementProfile() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: achievementKeys.profile,
    queryFn: ({ signal }) =>
      fetchMyAchievementProfile({ queryClient, signal }),
    retry: false,
    staleTime: PROFILE_STALE_TIME_MS,
  });
}
