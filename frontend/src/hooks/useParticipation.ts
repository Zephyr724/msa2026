import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthQuery } from './useAuth';
import {
  cancelQuestParticipation,
  fetchMyQuestParticipations,
  fetchMyQuestParticipation,
  joinQuest,
} from '../lib/api/participation';
import { ApiError } from '../lib/api/apiFetch';
import type { MyQuestParticipationFilter } from '../types/participation.ts';

export const participationKeys = {
  all: ['participations'] as const,
  list: (status: MyQuestParticipationFilter) =>
    ['participations', 'mine', status] as const,
  detail: (questId: string) => ['quest', questId, 'my-participation'] as const,
};

export function useMyQuestParticipationsQuery(
  status: MyQuestParticipationFilter = 'all',
) {
  const auth = useAuthQuery();
  return useQuery({
    queryKey: participationKeys.list(status),
    queryFn: () => fetchMyQuestParticipations(status),
    enabled: Boolean(auth.data),
    retry: false,
  });
}

export function useMyQuestParticipationQuery(questId: string) {
  const auth = useAuthQuery();
  return useQuery({
    queryKey: participationKeys.detail(questId),
    queryFn: () => fetchMyQuestParticipation(questId),
    enabled: Boolean(questId && auth.data),
    retry: false,
  });
}

function useAuthoritativeParticipationSync(questId: string) {
  const queryClient = useQueryClient();

  const sync = () => Promise.all([
    queryClient.invalidateQueries({
      queryKey: participationKeys.all,
    }),
    queryClient.invalidateQueries({
      queryKey: participationKeys.detail(questId),
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: ['quest', questId],
      exact: true,
    }),
  ]);

  const onError = (error: Error) => {
    if (error instanceof ApiError && error.status === 409) {
      return sync();
    }
    return undefined;
  };

  return { sync, onError };
}

export function useJoinQuestMutation(questId: string) {
  const authoritative = useAuthoritativeParticipationSync(questId);
  return useMutation({
    mutationFn: () => joinQuest(questId),
    retry: false,
    onSuccess: authoritative.sync,
    onError: authoritative.onError,
  });
}

export function useCancelQuestParticipationMutation(questId: string) {
  const authoritative = useAuthoritativeParticipationSync(questId);
  return useMutation({
    mutationFn: () => cancelQuestParticipation(questId),
    retry: false,
    onSuccess: authoritative.sync,
    onError: authoritative.onError,
  });
}
