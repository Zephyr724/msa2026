import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  leaderboardKeys,
  usePeopleLeaderboard,
} from '../../src/hooks/useLeaderboard.ts';
import { jsonResponse } from '../organizerTestUtils.tsx';

const leaderboard = {
  scope: 'nz',
  period: 'allTime',
  rows: [{
    rank: 1,
    displayName: 'Aroha',
    totalXp: 150,
    verifiedCompletionCount: 2,
  }],
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

describe('leaderboard transport and hook', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the approved key, 60-second stale time, and no retries', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(leaderboard)));
    vi.stubGlobal('fetch', fetchMock);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => usePeopleLeaderboard(),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(leaderboardKeys.all).toEqual(['leaderboard']);
    expect(leaderboardKeys.peopleNzAllTime)
      .toEqual(['leaderboard', 'people', 'nz', 'allTime']);
    const query = queryClient.getQueryCache().find({
      queryKey: leaderboardKeys.peopleNzAllTime,
    });
    expect(query?.options.staleTime).toBe(60_000);
    expect(query?.options.retry).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])
      .endsWith('/v1/leaderboards/people')).toBe(true);
  });

  it('forwards and aborts the exact TanStack Query signal', async () => {
    let observedSignal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      observedSignal = init?.signal ?? undefined;
      return new Promise<Response>(() => {});
    }));
    const queryClient = createQueryClient();
    const { unmount } = renderHook(
      () => usePeopleLeaderboard(),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(observedSignal).toBeInstanceOf(AbortSignal));
    expect(observedSignal?.aborted).toBe(false);
    unmount();
    await waitFor(() => expect(observedSignal?.aborted).toBe(true));
  });

  it('surfaces transport and strict-validation failures without retrying', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ detail: 'Internal secret' }, 503)));
    vi.stubGlobal('fetch', fetchMock);
    const queryClient = createQueryClient();
    const first = renderHook(
      () => usePeopleLeaderboard(),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(first.result.current.isError).toBe(true));
    expect(fetchMock).toHaveBeenCalledOnce();
    first.unmount();

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(jsonResponse({
      ...leaderboard,
      rows: [{ ...leaderboard.rows[0], userId: 'leak' }],
    }));
    const secondClient = createQueryClient();
    const second = renderHook(
      () => usePeopleLeaderboard(),
      { wrapper: wrapper(secondClient) },
    );

    await waitFor(() => expect(second.result.current.isError).toBe(true));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(secondClient.getQueryData(leaderboardKeys.peopleNzAllTime))
      .toBeUndefined();
  });
});
