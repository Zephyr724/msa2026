import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelCommunityChallenge,
  createCommunityChallenge,
  fetchCommunityChallenges,
  fetchMyProfile,
  fetchWeeklyStreak,
  updateCommunityChallenge,
  updateMyProfile,
  type CommunityChallengeFilters,
} from '../lib/api/community';
import { executePrivateQuery, executePrivateRequest } from '../lib/api/privateCache.ts';

export const communityKeys = {
  profile: ['community', 'profile'] as const,
  streak: ['community', 'streak'] as const,
  challenges: ['community', 'challenges'] as const,
};

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: communityKeys.profile,
    queryFn: ({ client, signal }) => executePrivateQuery(
      client, communityKeys.profile, signal, fetchMyProfile,
    ),
    enabled,
    retry: false,
  });
}

export function useUpdateMyProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateMyProfile>[0], { client: activeClient }) =>
      executePrivateRequest(activeClient, (signal) => updateMyProfile(input, signal)),
    onSuccess: (profile) => client.setQueryData(communityKeys.profile, profile),
  });
}

export function useWeeklyStreak() {
  return useQuery({
    queryKey: communityKeys.streak,
    queryFn: ({ client, signal }) => executePrivateQuery(
      client, communityKeys.streak, signal, fetchWeeklyStreak,
    ),
    retry: false,
  });
}

export function useCommunityChallenges(
  filters: CommunityChallengeFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    // The base key stays first so `communityKeys.challenges` partial matching
    // still invalidates every filtered variant.
    queryKey: [...communityKeys.challenges, filters.regionId ?? null, filters.status ?? null],
    queryFn: () => fetchCommunityChallenges(filters),
    staleTime: 60_000,
    enabled: options.enabled ?? true,
  });
}

export function useCommunityChallengeMutations() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: communityKeys.challenges });
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof createCommunityChallenge>[0], { client: activeClient }) =>
        executePrivateRequest(activeClient, (signal) =>
          createCommunityChallenge(input, signal)),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: {
        id: string;
        input: Parameters<typeof updateCommunityChallenge>[1];
      }, { client: activeClient }) => executePrivateRequest(
        activeClient,
        (signal) => updateCommunityChallenge(id, input, signal),
      ),
      onSuccess: refresh,
    }),
    cancel: useMutation({
      mutationFn: ({ id, version }: { id: string; version: number }, { client: activeClient }) =>
        executePrivateRequest(activeClient, (signal) =>
          cancelCommunityChallenge(id, version, signal)),
      onSuccess: refresh,
    }),
  };
}
