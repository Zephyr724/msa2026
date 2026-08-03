import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveOrganizerQuest,
  cancelOrganizerQuest,
  createOrganizerQuest,
  deleteOrganizerQuest,
  fetchOrganizerQuest,
  fetchOrganizerQuests,
  publishOrganizerQuest,
  updateOrganizerQuest,
} from '../lib/api/organizerQuests';
import { ApiError } from '../lib/api/apiFetch';
import { executePrivateQuery, executePrivateRequest } from '../lib/api/privateCache.ts';
import type { CreateQuestInput, UpdateQuestInput } from '../types/questManagement';

export const organizerQuestKeys = {
  all: ['organizer', 'quests'] as const,
  detail: (id: string) => ['organizer', 'quests', id] as const,
};

export function useOrganizerQuestListQuery() {
  return useQuery({
    queryKey: organizerQuestKeys.all,
    queryFn: ({ client, signal }) => executePrivateQuery(
      client, organizerQuestKeys.all, signal, fetchOrganizerQuests,
    ),
  });
}

export function useOrganizerQuestDetailQuery(id: string) {
  return useQuery({
    queryKey: organizerQuestKeys.detail(id),
    queryFn: ({ client, signal }) => executePrivateQuery(
      client, organizerQuestKeys.detail(id), signal,
      (signal) => fetchOrganizerQuest(id, signal),
    ),
    enabled: !!id,
  });
}

export function useCreateQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestInput, { client }) => executePrivateRequest(
      client,
      (signal) => createOrganizerQuest(input, signal),
    ),
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: organizerQuestKeys.all,
      exact: true,
    }),
  });
}

export function useUpdateQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateQuestInput }, { client }) =>
      executePrivateRequest(client, (signal) => updateOrganizerQuest(id, input, signal)),
    retry: false,
    onSuccess: (quest) => {
      queryClient.setQueryData(organizerQuestKeys.detail(quest.id), quest);
      return queryClient.invalidateQueries({
        queryKey: organizerQuestKeys.all,
        exact: true,
      });
    },
  });
}

function useLifecycleInvalidation() {
  const queryClient = useQueryClient();
  const onSuccess = (quest: { id: string }) => {
    // Lifecycle changes affect organizer views and public discovery, so update
    // the returned detail immediately and refresh every dependent projection.
    queryClient.setQueryData(organizerQuestKeys.detail(quest.id), quest);
    void queryClient.invalidateQueries({ queryKey: organizerQuestKeys.all, exact: true });
    void queryClient.invalidateQueries({ queryKey: ['quests'] });
    void queryClient.invalidateQueries({ queryKey: ['quest', quest.id] });
  };
  const onError = (error: Error) => {
    if (error instanceof ApiError && error.status === 409) {
      // A version conflict means the cached list is stale even though this
      // mutation did not succeed.
      void queryClient.invalidateQueries({ queryKey: organizerQuestKeys.all, exact: true });
    }
  };
  return { queryClient, onSuccess, onError };
}

export function usePublishQuestMutation() {
  const invalidation = useLifecycleInvalidation();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }, { client }) =>
      executePrivateRequest(client, (signal) => publishOrganizerQuest(id, version, signal)),
    retry: false,
    onSuccess: invalidation.onSuccess,
    onError: invalidation.onError,
  });
}

export function useCancelQuestMutation() {
  const invalidation = useLifecycleInvalidation();
  return useMutation({
    mutationFn: ({
      id,
      version,
      confirmActiveParticipants,
    }: {
      id: string;
      version: number;
      confirmActiveParticipants: boolean;
    }, { client }) => executePrivateRequest(
      client,
      (signal) => cancelOrganizerQuest(id, version, confirmActiveParticipants, signal),
    ),
    retry: false,
    onSuccess: invalidation.onSuccess,
    onError: invalidation.onError,
  });
}

export function useArchiveQuestMutation() {
  const invalidation = useLifecycleInvalidation();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }, { client }) =>
      executePrivateRequest(client, (signal) => archiveOrganizerQuest(id, version, signal)),
    retry: false,
    onSuccess: invalidation.onSuccess,
    onError: invalidation.onError,
  });
}

export function useDeleteQuestMutation() {
  const { queryClient } = useLifecycleInvalidation();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }, { client }) =>
      executePrivateRequest(client, (signal) => deleteOrganizerQuest(id, version, signal)),
    retry: false,
    onSuccess: (_result, variables) => {
      queryClient.removeQueries({ queryKey: organizerQuestKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: organizerQuestKeys.all, exact: true });
      void queryClient.invalidateQueries({ queryKey: ['quests'] });
      void queryClient.invalidateQueries({ queryKey: ['quest', variables.id] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: organizerQuestKeys.all, exact: true });
      }
    },
  });
}
