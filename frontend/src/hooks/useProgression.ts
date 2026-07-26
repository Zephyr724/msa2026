import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyProgression } from '../lib/api/progression.ts';

export const progressionKeys = {
  all: ['progression'] as const,
  me: ['progression', 'me'] as const,
};

export function useProgression() {
  // The active provider client is passed explicitly so the private-401
  // lifecycle operates on this exact instance (Review 39 M2).
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: progressionKeys.me,
    queryFn: ({ signal }) => fetchMyProgression({ queryClient, signal }),
    retry: false,
  });
}
