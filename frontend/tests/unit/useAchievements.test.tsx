import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  achievementKeys,
  useAchievementCatalog,
  useAchievementNationwideStats,
  useMyAchievementProfile,
  useMyAchievements,
} from '../../src/hooks/useAchievements.ts';
import {
  fetchAchievementCatalog,
  fetchAchievementNationwideStats,
  fetchMyAchievementProfile,
  fetchMyAchievements,
} from '../../src/lib/api/achievements.ts';
import { authQueryKey } from '../../src/lib/api/privateCache.ts';
import { jsonResponse } from '../organizerTestUtils.tsx';

const catalogItem = {
  id: '11111111-1111-4111-8111-111111111111',
  code: 'verified-completions-1',
  name: 'First Steps',
  description: 'Complete one verified quest.',
  iconUrl: null,
  category: 'Milestone',
};

const nationwideStat = {
  achievementId: catalogItem.id,
  nationwideEarnedCount: 1,
  nationwideMemberCount: 100,
  earnedPercentage: 1,
  rarity: 'UltraRare',
  calculatedAtUtc: '2026-07-30T00:00:00.0000000Z',
};

const achievementProfile = {
  earnedDistinctCount: 0,
  activeAchievementCount: 45,
  trophy: {
    tier: 'Locked',
    requiredCount: 0,
    nextTier: 'Bronze',
    nextRequiredCount: 5,
    nationwideEarnedCount: 0,
    nationwideMemberCount: 100,
    earnedPercentage: 0,
    rarity: 'Unawarded',
    calculatedAtUtc: '2026-07-30T00:00:00.0000000Z',
  },
  cosmetics: {
    passportBorderStyle: null,
    avatarFrameStyle: null,
    badgeStampStyles: [],
  },
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function wrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('achievement transport and hooks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the accepted query-key family', () => {
    expect(achievementKeys.all).toEqual(['achievements']);
    expect(achievementKeys.catalog).toEqual(['achievements', 'catalog']);
    expect(achievementKeys.mine).toEqual(['achievements', 'me']);
    expect(achievementKeys.stats).toEqual(['achievements', 'stats']);
    expect(achievementKeys.profile).toEqual(
      ['achievements', 'profile', 'me'],
    );
  });

  it('fetches anonymous stats with a five-minute stale time', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse([nationwideStat]))));
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useAchievementNationwideStats(),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([nationwideStat]);
    expect(queryClient.getQueryCache().find({
      queryKey: achievementKeys.stats,
    })?.options.staleTime).toBe(300_000);
  });

  it('fetches the private trophy profile with a one-minute stale time', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse(achievementProfile))));
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useMyAchievementProfile(),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(achievementProfile);
    expect(queryClient.getQueryCache().find({
      queryKey: achievementKeys.profile,
    })?.options.staleTime).toBe(60_000);
  });

  it('fetches and validates the catalog with a 24-hour stale time', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse([catalogItem]))));
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useAchievementCatalog(),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([catalogItem]);
    expect(queryClient.getQueryCache().find({
      queryKey: achievementKeys.catalog,
    })?.options.staleTime).toBe(86_400_000);
  });

  it('forwards and aborts the exact catalog query signal', async () => {
    let observedSignal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      observedSignal = init?.signal ?? undefined;
      return new Promise<Response>(() => {});
    }));
    const queryClient = createQueryClient();
    const { unmount } = renderHook(
      () => useAchievementCatalog(),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(observedSignal).toBeInstanceOf(AbortSignal));
    expect(observedSignal?.aborted).toBe(false);
    unmount();
    await waitFor(() => expect(observedSignal?.aborted).toBe(true));
  });

  it('does not retry either failed query', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ title: 'Server error' }, 500)));
    vi.stubGlobal('fetch', fetchMock);
    const catalogClient = createQueryClient();
    const catalog = renderHook(
      () => useAchievementCatalog(),
      { wrapper: wrapper(catalogClient) },
    );
    await waitFor(() => expect(catalog.result.current.isError).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    catalog.unmount();

    fetchMock.mockClear();
    const earnedClient = createQueryClient();
    const earned = renderHook(
      () => useMyAchievements(),
      { wrapper: wrapper(earnedClient) },
    );
    await waitFor(() => expect(earned.result.current.isError).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid earned payloads into the query error state', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse([{ ...catalogItem }]))));
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useMyAchievements(),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(achievementKeys.mine)).toBeUndefined();
  });

  it('expires every private prefix before rethrowing an earned 401', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse({ title: 'Unauthorized' }, 401))));
    const queryClient = createQueryClient();
    queryClient.setQueryData(authQueryKey, { userId: 'user-a' });
    queryClient.setQueryData(['progression', 'me'], { private: true });
    queryClient.setQueryData(['passport', 'completions'], { private: true });
    queryClient.setQueryData(achievementKeys.catalog, [catalogItem]);
    queryClient.setQueryData(achievementKeys.mine, [{ private: true }]);

    await expect(fetchMyAchievements({ queryClient })).rejects.toMatchObject({
      status: 401,
    });

    expect(queryClient.getQueryData(authQueryKey)).toBeNull();
    expect(queryClient.getQueriesData({ queryKey: ['progression'] })).toEqual([]);
    expect(queryClient.getQueriesData({ queryKey: ['passport'] })).toEqual([]);
    expect(queryClient.getQueriesData({ queryKey: achievementKeys.all })).toEqual([]);
  });

  it('uses the same private-session cleanup for a trophy-profile 401', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse({ title: 'Unauthorized' }, 401))));
    const queryClient = createQueryClient();
    queryClient.setQueryData(authQueryKey, { userId: 'user-a' });
    queryClient.setQueryData(achievementKeys.profile, achievementProfile);

    await expect(fetchMyAchievementProfile({ queryClient }))
      .rejects.toMatchObject({ status: 401 });

    expect(queryClient.getQueryData(authQueryKey)).toBeNull();
    expect(queryClient.getQueriesData({ queryKey: achievementKeys.all }))
      .toEqual([]);
  });

  it('keeps the anonymous catalog transport outside private-session cleanup', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse({ title: 'Server error' }, 500))));
    const queryClient = createQueryClient();
    queryClient.setQueryData(authQueryKey, { userId: 'user-a' });

    await expect(fetchAchievementCatalog()).rejects.toMatchObject({ status: 500 });
    await expect(fetchAchievementNationwideStats())
      .rejects.toMatchObject({ status: 500 });
    expect(queryClient.getQueryData(authQueryKey)).toEqual({ userId: 'user-a' });
  });
});
