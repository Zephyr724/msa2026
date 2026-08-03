import type { QueryClient } from '@tanstack/react-query';
import type {
  AchievementCatalogItem,
  AchievementNationwideStat,
  AchievementProfile,
  EarnedAchievement,
} from '../../types/achievement.ts';
import {
  validateAchievementCatalog,
  validateAchievementNationwideStats,
  validateAchievementProfile,
  validateEarnedAchievements,
} from '../validation/achievementDto.ts';
import { apiFetch } from './apiFetch.ts';
import { executePrivateQuery } from './privateCache.ts';

/** Transport and strict validation for the anonymous achievement catalog. */
export async function fetchAchievementCatalog(options?: {
  signal?: AbortSignal;
}): Promise<AchievementCatalogItem[]> {
  const payload = await apiFetch<unknown>('/v1/achievements', {
    signal: options?.signal,
  });
  return validateAchievementCatalog(payload);
}

export async function fetchAchievementNationwideStats(options?: {
  signal?: AbortSignal;
}): Promise<AchievementNationwideStat[]> {
  const payload = await apiFetch<unknown>('/v1/achievement-stats', {
    signal: options?.signal,
  });
  return validateAchievementNationwideStats(payload);
}

/**
 * Transport and strict validation for the current principal's earned
 * achievements. A private 401 completes the shared session-expiry lifecycle
 * against the exact active QueryClient before the error is rethrown.
 */
export async function fetchMyAchievements(options: {
  queryClient: QueryClient;
  signal?: AbortSignal;
}): Promise<EarnedAchievement[]> {
  return executePrivateQuery(
    options.queryClient,
    ['achievements', 'me'],
    options.signal,
    async (signal) => {
      const payload = await apiFetch<unknown>('/v1/users/me/achievements', {
        signal,
      });
      return validateEarnedAchievements(payload);
    },
  );
}

export async function fetchMyAchievementProfile(options: {
  queryClient: QueryClient;
  signal?: AbortSignal;
}): Promise<AchievementProfile> {
  return executePrivateQuery(
    options.queryClient,
    ['achievements', 'profile', 'me'],
    options.signal,
    async (signal) => {
      const payload = await apiFetch<unknown>(
        '/v1/users/me/achievement-profile',
        { signal },
      );
      return validateAchievementProfile(payload);
    },
  );
}
