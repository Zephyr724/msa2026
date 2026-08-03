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
import { ApiError, apiFetch } from './apiFetch.ts';
import { expirePrivateSession } from './privateCache.ts';

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
  try {
    const payload = await apiFetch<unknown>('/v1/users/me/achievements', {
      signal: options.signal,
    });
    return validateEarnedAchievements(payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await expirePrivateSession(options.queryClient);
    }
    throw error;
  }
}

export async function fetchMyAchievementProfile(options: {
  queryClient: QueryClient;
  signal?: AbortSignal;
}): Promise<AchievementProfile> {
  try {
    const payload = await apiFetch<unknown>(
      '/v1/users/me/achievement-profile',
      { signal: options.signal },
    );
    return validateAchievementProfile(payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await expirePrivateSession(options.queryClient);
    }
    throw error;
  }
}
