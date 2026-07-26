import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthQuery } from '../../src/hooks/useAuth';
import {
  participationKeys,
  useCancelQuestParticipationMutation,
  useJoinQuestMutation,
  useMyQuestParticipationQuery,
} from '../../src/hooks/useParticipation';
import {
  cancelQuestParticipation,
  fetchMyQuestParticipation,
  joinQuest,
} from '../../src/lib/api/participation';
import { ApiError } from '../../src/lib/api/apiFetch';

vi.mock('../../src/hooks/useAuth', () => ({ useAuthQuery: vi.fn() }));
vi.mock('../../src/lib/api/participation', () => ({
  fetchMyQuestParticipation: vi.fn(),
  joinQuest: vi.fn(),
  cancelQuestParticipation: vi.fn(),
}));

const mockAuth = vi.mocked(useAuthQuery);
const mockFetchState = vi.mocked(fetchMyQuestParticipation);
const mockJoin = vi.mocked(joinQuest);
const mockCancel = vi.mocked(cancelQuestParticipation);
const questId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

describe('participation Query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReturnValue({ data: session } as never);
  });

  it('disables the participation query for anonymous users', async () => {
    mockAuth.mockReturnValue({ data: null } as never);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useMyQuestParticipationQuery(questId),
      { wrapper: wrapper(queryClient) },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchState).not.toHaveBeenCalled();
  });

  it('fetches authenticated participation state into the accepted Query key', async () => {
    const state = {
      status: 'None' as const,
      canJoin: true,
      ineligibilityReason: null,
      capacityFull: false,
    };
    mockFetchState.mockResolvedValue(state);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useMyQuestParticipationQuery(questId),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetchState).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(participationKeys.detail(questId))).toEqual(state);
  });

  it('does not retry a failed Join and resyncs both authoritative Queries on 409', async () => {
    const error = new ApiError(409, { detail: 'Quest is at capacity.' });
    mockJoin.mockRejectedValue(error);
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useJoinQuestMutation(questId),
      { wrapper: wrapper(queryClient) },
    );

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBe(error);
    });

    expect(mockJoin).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: participationKeys.detail(questId),
      exact: true,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['quest', questId],
      exact: true,
    });
  });

  it('does not retry Cancel and invalidates authoritative state after success', async () => {
    mockCancel.mockResolvedValue({
      participationId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      questId,
      status: 'Cancelled',
      joinedAtUtc: '2026-07-25T00:00:00Z',
      cancelledAtUtc: '2026-07-25T01:00:00Z',
    });
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useCancelQuestParticipationMutation(questId),
      { wrapper: wrapper(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockCancel).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledTimes(3);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: participationKeys.all,
    });
  });
});

const session = {
  userId: 'user-1',
  displayName: 'Aroha',
  email: 'member@example.test',
  roles: ['Member'],
};

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: 3 },
    },
  });
}

function wrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}
