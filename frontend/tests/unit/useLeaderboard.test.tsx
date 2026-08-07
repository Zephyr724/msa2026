import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { leaderboardKeys, usePeopleLeaderboard } from '../../src/hooks/useLeaderboard.ts';
import { jsonResponse } from '../organizerTestUtils.tsx';

const leaderboard = {
  scope: 'auckland',
  period: 'weekly',
  page: 1,
  pageSize: 10,
  totalCount: 1,
  isPrivacyProtected: false,
  collectiveProgress: null,
  currentUser: null,
  rows: [{
    rank: 1,
    displayName: 'Aroha',
    totalXp: 150,
    verifiedCompletionCount: 2,
    isCurrentUser: false,
  }],
};

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('leaderboard transport and hook', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses scoped keys, parameters, stale time, and no retries', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(leaderboard)));
    vi.stubGlobal('fetch', fetchMock);
    const queryClient = client();
    const { result } = renderHook(
      () => usePeopleLeaderboard('auckland', 'weekly'),
      { wrapper: wrapper(queryClient) },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const key = leaderboardKeys.people('auckland', 'weekly');
    expect(key).toEqual(['leaderboard', 'people', 'auckland', 'weekly']);
    const query = queryClient.getQueryCache().find({ queryKey: key });
    expect(query?.options.staleTime).toBe(60_000);
    expect(query?.options.retry).toBe(false);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      '/v1/leaderboards/people?scope=auckland&period=weekly',
    );
  });

  it('forwards and aborts the TanStack Query signal', async () => {
    let observedSignal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      observedSignal = init?.signal ?? undefined;
      return new Promise<Response>(() => {});
    }));
    const { unmount } = renderHook(
      () => usePeopleLeaderboard('nz', 'allTime'),
      { wrapper: wrapper(client()) },
    );
    await waitFor(() => expect(observedSignal).toBeInstanceOf(AbortSignal));
    unmount();
    await waitFor(() => expect(observedSignal?.aborted).toBe(true));
  });

  it('surfaces transport failures without retrying', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({}, 503)));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => usePeopleLeaderboard('auckland', 'weekly'),
      { wrapper: wrapper(client()) },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
