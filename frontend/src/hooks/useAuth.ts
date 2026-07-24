import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentSession, login, logout, register } from '../lib/api/auth.ts';

export const authQueryKey = ['auth', 'me'] as const;

export function useAuthQuery() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentSession,
    retry: false,
    staleTime: 60_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (session) => queryClient.setQueryData(authQueryKey, session),
  });
}

export function useRegisterMutation() {
  return useMutation({ mutationFn: register });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.setQueryData(authQueryKey, null),
  });
}
