import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAchievementCatalog,
  fetchMyAchievements,
} from '../lib/api/achievements.ts';

const CATALOG_STALE_TIME_MS = 24 * 60 * 60 * 1000;

export const achievementKeys = {
  all: ['achievements'] as const,
  catalog: ['achievements', 'catalog'] as const,
  mine: ['achievements', 'me'] as const,
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
