import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  achievementKeys,
  useAchievementCatalog,
  useMyAchievements,
} from '../../src/hooks/useAchievements.ts';
import {
  fetchAchievementCatalog,
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

  it('keeps the anonymous catalog transport outside private-session cleanup', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse({ title: 'Server error' }, 500))));
    const queryClient = createQueryClient();
    queryClient.setQueryData(authQueryKey, { userId: 'user-a' });

    await expect(fetchAchievementCatalog()).rejects.toMatchObject({ status: 500 });
    expect(queryClient.getQueryData(authQueryKey)).toEqual({ userId: 'user-a' });
  });
});
