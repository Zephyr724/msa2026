import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuthQuery } from './useAuth';
import { participationKeys } from './useParticipation';
import { progressionKeys } from './useProgression.ts';
import { passportKeys } from './usePassportCompletions.ts';
import { achievementKeys } from './useAchievements.ts';
import { leaderboardKeys } from './useLeaderboard.ts';
import {
  fetchCompletionCodeStatus,
  fetchMyQuestCompletion,
  generateOrRotateCompletionCode,
  redeemCompletionCode,
  submitEvidenceClaim,
  selfReportCompletion,
  fetchMyClaims,
  fetchPendingClaims,
  fetchAdminClaim,
  reviewEvidenceClaim,
} from '../lib/api/completion';
import { ApiError } from '../lib/api/apiFetch';
import { executePrivateQuery, executePrivateRequest } from '../lib/api/privateCache.ts';
import type {
  EvidenceClaimInput,
  GeneratedCompletionCodeDto,
  RedeemCompletionResultDto,
} from '../types/completion';

export const completionCodeKeys = {
  status: (questId: string) =>
    ['organizer', 'quests', questId, 'completion-code'] as const,
};

export const completionKeys = {
  detail: (questId: string) => ['quest', questId, 'my-completion'] as const,
  claims: ['claims', 'me'] as const,
  adminClaims: ['claims', 'admin'] as const,
  adminClaim: (claimId: string) => ['claims', 'admin', claimId] as const,
};

export function useCompletionCodeStatusQuery(questId: string) {
  return useQuery({
    queryKey: completionCodeKeys.status(questId),
    queryFn: ({ client, signal }) => executePrivateQuery(
      client, completionCodeKeys.status(questId), signal,
      (signal) => fetchCompletionCodeStatus(questId, signal),
    ),
    enabled: Boolean(questId),
    retry: false,
  });
}

export function useMyQuestCompletionQuery(questId: string) {
  const auth = useAuthQuery();
  return useQuery({
    queryKey: completionKeys.detail(questId),
    queryFn: ({ client, signal }) => executePrivateQuery(
      client, completionKeys.detail(questId), signal,
      (signal) => fetchMyQuestCompletion(questId, signal),
    ),
    enabled: Boolean(questId && auth.data),
    retry: false,
  });
}

export function useSubmitEvidenceClaim(questId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EvidenceClaimInput, { client }) => executePrivateRequest(
      client,
      (signal) => submitEvidenceClaim(questId, input, signal),
    ),
    onSuccess: () => syncAuthoritativeCompletion(queryClient, questId),
  });
}

export function useSelfReportCompletion(questId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (completedAtUtc: string, { client }) => executePrivateRequest(
      client,
      (signal) => selfReportCompletion(questId, completedAtUtc, signal),
    ),
    onSuccess: () => syncAuthoritativeCompletion(queryClient, questId),
  });
}

export function useMyClaims() {
  return useQuery({
    queryKey: completionKeys.claims,
    queryFn: ({ client, signal }) => executePrivateQuery(
      client, completionKeys.claims, signal, fetchMyClaims,
    ),
    retry: false,
  });
}

export function usePendingClaims(enabled = true) {
  return useQuery({
    queryKey: completionKeys.adminClaims,
    queryFn: ({ client, signal }) => executePrivateQuery(
      client, completionKeys.adminClaims, signal, fetchPendingClaims,
    ),
    enabled,
    retry: false,
  });
}

export function useAdminClaim(claimId: string) {
  return useQuery({
    queryKey: completionKeys.adminClaim(claimId),
    queryFn: ({ client, signal }) => executePrivateQuery(
      client, completionKeys.adminClaim(claimId), signal,
      (signal) => fetchAdminClaim(claimId, signal),
    ),
    enabled: Boolean(claimId),
    retry: false,
  });
}

export function useReviewEvidenceClaim(claimId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      { approve, reviewNote }: { approve: boolean; reviewNote: string },
      { client },
    ) => executePrivateRequest(
      client,
      (signal) => reviewEvidenceClaim(claimId, approve, reviewNote, signal),
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: completionKeys.adminClaims }),
        queryClient.invalidateQueries({ queryKey: completionKeys.adminClaim(claimId) }),
        queryClient.invalidateQueries({ queryKey: leaderboardKeys.all }),
      ]);
    },
  });
}

/**
 * Generate/rotate deliberately avoids useMutation: the reveal-once plaintext
 * travels only through the returned promise into component-local state, so no
 * MutationCache entry containing the code is ever created (contract §12,
 * Option A). There are no automatic retries; each call is an explicit user
 * action.
 */
export function useGenerateOrRotateCompletionCode(questId: string) {
  const queryClient = useQueryClient();
  return useCallback(async (): Promise<GeneratedCompletionCodeDto> => {
    try {
      const generated = await executePrivateRequest(
        queryClient,
        (signal) => generateOrRotateCompletionCode(questId, signal),
      );
      // Deliberately not awaited (review M1): the reveal-once plaintext must
      // reach component memory immediately, even if the metadata resync
      // stalls. invalidateQueries resolves locally and never rejects here
      // because refetch failures surface through the query's error state.
      void queryClient.invalidateQueries({
        queryKey: completionCodeKeys.status(questId),
        exact: true,
      });
      return generated;
    } catch (error) {
      // Resync authoritative status on conflict (concurrency or state change).
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.invalidateQueries({
          queryKey: completionCodeKeys.status(questId),
          exact: true,
        });
      }
      throw error;
    }
  }, [queryClient, questId]);
}

/**
 * Redeem also avoids useMutation so the submitted code never persists as
 * MutationCache variables (contract §13: component state owns the entered
 * code). No automatic retries; 429 is never retried by the client.
 */
export function useRedeemCompletionCode(questId: string) {
  const queryClient = useQueryClient();
  return useCallback(async (code: string): Promise<RedeemCompletionResultDto> => {
    let result: RedeemCompletionResultDto;
    try {
      result = await executePrivateRequest(
        queryClient,
        (signal) => redeemCompletionCode(questId, code, signal),
      );
    } catch (error) {
      // Mirror the participation convention: resync authoritative state on 409.
      if (error instanceof ApiError && error.status === 409) {
        await syncAuthoritativeCompletion(queryClient, questId);
      }
      throw error;
    }
    // Start the authoritative refresh without delaying the reward hand-off.
    // The returned transactional before/after values drive the animation;
    // queries still converge in the background for every persistent surface.
    void syncAuthoritativeCompletion(queryClient, questId);
    return result;
  }, [queryClient, questId]);
}

function syncAuthoritativeCompletion(
  queryClient: QueryClient,
  questId: string,
): Promise<void> {
  // The Passport reads (progression totals and Verified history) are
  // resynced alongside the quest-scoped state (G7); the ['passport']
  // prefix invalidation covers every history page.
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: completionKeys.detail(questId),
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: participationKeys.detail(questId),
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: participationKeys.all,
    }),
    queryClient.invalidateQueries({
      queryKey: ['quest', questId],
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: progressionKeys.me,
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: passportKeys.all,
    }),
    queryClient.invalidateQueries({
      queryKey: achievementKeys.all,
    }),
    queryClient.invalidateQueries({
      queryKey: leaderboardKeys.all,
    }),
    queryClient.invalidateQueries({
      queryKey: completionKeys.claims,
    }),
  ]).then(() => undefined);
}
