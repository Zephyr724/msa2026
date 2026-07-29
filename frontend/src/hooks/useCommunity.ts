import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelCommunityChallenge,
  createCommunityChallenge,
  fetchCommunityChallenges,
  fetchMyProfile,
  fetchWeeklyStreak,
  updateCommunityChallenge,
  updateMyProfile,
} from '../lib/api/community';

export const communityKeys = {
  profile: ['community', 'profile'] as const,
  streak: ['community', 'streak'] as const,
  challenges: ['community', 'challenges'] as const,
};

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: communityKeys.profile,
    queryFn: fetchMyProfile,
    enabled,
    retry: false,
  });
}

export function useUpdateMyProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => client.setQueryData(communityKeys.profile, profile),
  });
}

export function useWeeklyStreak() {
  return useQuery({
    queryKey: communityKeys.streak,
    queryFn: fetchWeeklyStreak,
    retry: false,
  });
}

export function useCommunityChallenges() {
  return useQuery({
    queryKey: communityKeys.challenges,
    queryFn: fetchCommunityChallenges,
    staleTime: 60_000,
  });
}

export function useCommunityChallengeMutations() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: communityKeys.challenges });
  return {
    create: useMutation({ mutationFn: createCommunityChallenge, onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, input }: {
        id: string;
        input: Parameters<typeof updateCommunityChallenge>[1];
      }) => updateCommunityChallenge(id, input),
      onSuccess: refresh,
    }),
    cancel: useMutation({
      mutationFn: ({ id, version }: { id: string; version: number }) =>
        cancelCommunityChallenge(id, version),
      onSuccess: refresh,
    }),
  };
}
