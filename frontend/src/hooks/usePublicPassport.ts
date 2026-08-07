import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPublicPassport,
  fetchPublicPassportSettings,
  fetchVerifiedStoryContext,
  updatePublicPassportSettings,
} from '../lib/api/publicPassport.ts';

export const publicPassportKeys = {
  settings: ['public-passport', 'settings'] as const,
  public: (shareId: string) => ['public-passport', 'public', shareId] as const,
  story: (completionId: string) => ['verified-story-context', completionId] as const,
};

export function usePublicPassportSettings() {
  const client = useQueryClient();
  return useQuery({
    queryKey: publicPassportKeys.settings,
    queryFn: ({ signal }) => fetchPublicPassportSettings(client, signal),
  });
}

export function useUpdatePublicPassportSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { isEnabled: boolean; featuredAchievementIds: string[] }) =>
      updatePublicPassportSettings(client, input),
    onSuccess: (settings) => client.setQueryData(publicPassportKeys.settings, settings),
  });
}

export function usePublicPassport(shareId: string) {
  return useQuery({
    queryKey: publicPassportKeys.public(shareId),
    queryFn: ({ signal }) => fetchPublicPassport(shareId, signal),
    enabled: Boolean(shareId),
    retry: false,
  });
}

export function useVerifiedStoryContext(completionId: string | null) {
  const client = useQueryClient();
  return useQuery({
    queryKey: publicPassportKeys.story(completionId ?? ''),
    queryFn: ({ signal }) => fetchVerifiedStoryContext(client, completionId!, signal),
    enabled: Boolean(completionId),
    retry: false,
  });
}
