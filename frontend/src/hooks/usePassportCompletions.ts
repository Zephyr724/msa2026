import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllPassportCompletions,
  fetchPassportCommunityParticipation,
  fetchPassportCompletions,
  fetchPassportSummary,
} from '../lib/api/passport.ts';

export const PASSPORT_HISTORY_PAGE_SIZE = 12;

export const passportKeys = {
  all: ['passport'] as const,
  summary: ['passport', 'summary'] as const,
  communityParticipation: ['passport', 'community-participation'] as const,
  allCompletions: ['passport', 'completions', 'all'] as const,
  completions: (page: number, pageSize: number) =>
    ['passport', 'completions', { page, pageSize }] as const,
};

export function usePassportSummary() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: passportKeys.summary,
    queryFn: ({ signal }) =>
      fetchPassportSummary({ queryClient, signal }),
    retry: false,
  });
}

export function useAllPassportCompletions() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: passportKeys.allCompletions,
    queryFn: ({ signal }) =>
      fetchAllPassportCompletions({ queryClient, signal }),
    retry: false,
  });
}

export function usePassportCommunityParticipation() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: passportKeys.communityParticipation,
    queryFn: ({ signal }) =>
      fetchPassportCommunityParticipation({ queryClient, signal }),
    retry: false,
  });
}

export function usePassportCompletions(
  page: number,
  pageSize: number = PASSPORT_HISTORY_PAGE_SIZE,
) {
  // The active provider client is passed explicitly so the private-401
  // lifecycle operates on this exact instance (Review 39 M2).
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: passportKeys.completions(page, pageSize),
    queryFn: ({ signal }) =>
      fetchPassportCompletions(page, pageSize, { queryClient, signal }),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
