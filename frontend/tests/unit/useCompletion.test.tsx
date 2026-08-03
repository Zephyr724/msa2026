import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthQuery } from '../../src/hooks/useAuth';
import {
  completionCodeKeys,
  completionKeys,
  useCompletionCodeStatusQuery,
  useGenerateOrRotateCompletionCode,
  useMyQuestCompletionQuery,
  useRedeemCompletionCode,
} from '../../src/hooks/useCompletion';
import { participationKeys } from '../../src/hooks/useParticipation';
import { progressionKeys } from '../../src/hooks/useProgression.ts';
import { passportKeys } from '../../src/hooks/usePassportCompletions.ts';
import { achievementKeys } from '../../src/hooks/useAchievements.ts';
import { leaderboardKeys } from '../../src/hooks/useLeaderboard.ts';
import {
  fetchCompletionCodeStatus,
  fetchMyQuestCompletion,
  generateOrRotateCompletionCode,
  redeemCompletionCode,
} from '../../src/lib/api/completion';
import { ApiError } from '../../src/lib/api/apiFetch';

vi.mock('../../src/hooks/useAuth', () => ({ useAuthQuery: vi.fn() }));
vi.mock('../../src/lib/api/completion', () => ({
  fetchCompletionCodeStatus: vi.fn(),
  fetchMyQuestCompletion: vi.fn(),
  generateOrRotateCompletionCode: vi.fn(),
  redeemCompletionCode: vi.fn(),
}));

const mockAuth = vi.mocked(useAuthQuery);
const mockFetchStatus = vi.mocked(fetchCompletionCodeStatus);
const mockFetchCompletion = vi.mocked(fetchMyQuestCompletion);
const mockGenerate = vi.mocked(generateOrRotateCompletionCode);
const mockRedeem = vi.mocked(redeemCompletionCode);
const questId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

const session = {
  userId: 'user-1',
  displayName: 'Aroha',
  email: 'member@example.test',
  roles: ['Member'],
};

const noneCompletion = {
  status: 'None' as const,
  method: null,
  completedAtUtc: null,
  verifiedAtUtc: null,
};

describe('completion Query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReturnValue({ data: session } as never);
  });

  it('disables the completion query for anonymous users', () => {
    mockAuth.mockReturnValue({ data: null } as never);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useMyQuestCompletionQuery(questId),
      { wrapper: wrapper(queryClient) },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchCompletion).not.toHaveBeenCalled();
  });

  it('fetches completion state into the accepted my-completion Query key', async () => {
    mockFetchCompletion.mockResolvedValue(noneCompletion);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useMyQuestCompletionQuery(questId),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetchCompletion).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(completionKeys.detail(questId))).toEqual(noneCompletion);
  });

  it('fetches organizer status into a key that cannot collide with participant keys', async () => {
    const status = {
      isConfigured: false,
      validFromUtc: null,
      validToUtc: null,
      createdAtUtc: null,
    };
    mockFetchStatus.mockResolvedValue(status);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useCompletionCodeStatusQuery(questId),
      { wrapper: wrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(completionCodeKeys.status(questId)).not.toEqual(completionKeys.detail(questId));
    expect(queryClient.getQueryData(completionCodeKeys.status(questId))).toEqual(status);
  });

  it('redeems without a MutationCache entry and invalidates the accepted keys on success', async () => {
    mockRedeem.mockResolvedValue({
      status: 'Verified',
      method: 'CompletionCode',
      completedAtUtc: '2026-07-25T09:00:00Z',
      verifiedAtUtc: '2026-07-25T09:00:00Z',
    });
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useRedeemCompletionCode(questId),
      { wrapper: wrapper(queryClient) },
    );

    await act(async () => {
      await result.current('ABCDE23456');
    });

    expect(mockRedeem).toHaveBeenCalledWith(
      questId,
      'ABCDE23456',
      expect.any(AbortSignal),
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: completionKeys.detail(questId),
      exact: true,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: participationKeys.detail(questId),
      exact: true,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['quest', questId],
      exact: true,
    });
    // The submitted code must not persist as MutationCache variables.
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it('also invalidates the Passport progression and history keys on success (F17)', async () => {
    mockRedeem.mockResolvedValue({
      status: 'Verified',
      method: 'CompletionCode',
      completedAtUtc: '2026-07-25T09:00:00Z',
      verifiedAtUtc: '2026-07-25T09:00:00Z',
    });
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useRedeemCompletionCode(questId),
      { wrapper: wrapper(queryClient) },
    );

    await act(async () => {
      await result.current('ABCDE23456');
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: progressionKeys.me,
      exact: true,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: passportKeys.all,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: achievementKeys.all,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: leaderboardKeys.all,
    });
  });

  it('resyncs authoritative state on a redeem 409 and rethrows without retrying', async () => {
    const error = new ApiError(409, { detail: 'You have already completed this Quest.' });
    mockRedeem.mockRejectedValue(error);
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useRedeemCompletionCode(questId),
      { wrapper: wrapper(queryClient) },
    );

    await act(async () => {
      await expect(result.current('ABCDE23456')).rejects.toBe(error);
    });

    expect(mockRedeem).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: completionKeys.detail(questId),
      exact: true,
    });
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it('does not invalidate or retry on a generic invalid-code 400', async () => {
    const error = new ApiError(400, {
      type: 'https://kiwimpact.app/problems/invalid-completion-code',
    });
    mockRedeem.mockRejectedValue(error);
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useRedeemCompletionCode(questId),
      { wrapper: wrapper(queryClient) },
    );

    await act(async () => {
      await expect(result.current('ABCDE23456')).rejects.toBe(error);
    });

    expect(mockRedeem).toHaveBeenCalledOnce();
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('returns reveal-once plaintext only through the promise, never through caches', async () => {
    const generated = {
      code: 'ABCDE-23456',
      validFromUtc: '2026-07-25T08:00:00Z',
      validToUtc: null,
    };
    mockGenerate.mockResolvedValue(generated);
    const queryClient = createQueryClient();
    queryClient.setQueryData(completionCodeKeys.status(questId), {
      isConfigured: false,
      validFromUtc: null,
      validToUtc: null,
      createdAtUtc: null,
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useGenerateOrRotateCompletionCode(questId),
      { wrapper: wrapper(queryClient) },
    );

    let returned: unknown;
    await act(async () => {
      returned = await result.current();
    });

    expect(returned).toEqual(generated);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: completionCodeKeys.status(questId),
      exact: true,
    });
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
    const queryData = JSON.stringify(
      queryClient.getQueryCache().findAll().map((query) => query.state.data),
    );
    expect(queryData).not.toContain(generated.code);
  });

  it('resyncs status on a generate/rotate 409 without retaining anything', async () => {
    const error = new ApiError(409, {
      detail: 'Completion Code configuration changed during this request.',
    });
    mockGenerate.mockRejectedValue(error);
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useGenerateOrRotateCompletionCode(questId),
      { wrapper: wrapper(queryClient) },
    );

    await act(async () => {
      await expect(result.current()).rejects.toBe(error);
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: completionCodeKeys.status(questId),
      exact: true,
    });
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });
});

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
