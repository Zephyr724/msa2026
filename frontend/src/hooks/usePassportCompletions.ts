import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPassportCompletions } from '../lib/api/passport.ts';

export const PASSPORT_HISTORY_PAGE_SIZE = 12;

export const passportKeys = {
  all: ['passport'] as const,
  completions: (page: number, pageSize: number) =>
    ['passport', 'completions', { page, pageSize }] as const,
};

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
