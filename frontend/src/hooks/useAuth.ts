import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentSession, login, logout, register } from '../lib/api/auth.ts';
import {
  authQueryKey,
  clearPrivateServerState,
  expirePrivateSession,
} from '../lib/api/privateCache.ts';

// Re-exported so existing consumers can keep importing it from this module;
// the definition lives in `lib/api/privateCache.ts` so the API layer does
// not depend upward on this hook module.
export { authQueryKey };

export function useAuthQuery() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: async ({ client, signal }) => {
      const previousSession = client.getQueryData(authQueryKey);
      const session = await fetchCurrentSession(signal);
      if (session === null && previousSession != null) {
        const sourceQuery = client.getQueryCache().find({
          queryKey: authQueryKey,
          exact: true,
        });
        await expirePrivateSession(client, sourceQuery);
      }
      return session;
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    // B1: the previous principal's private queries are cancelled and removed
    // before the new session is installed — never the other way around.
    onSuccess: async (session) => {
      await clearPrivateServerState(queryClient);
      queryClient.setQueryData(authQueryKey, session);
    },
  });
}

export function useRegisterMutation() {
  return useMutation({ mutationFn: register });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    // B1: private cleanup completes before the auth entry becomes null.
    onSuccess: async () => {
      await clearPrivateServerState(queryClient);
      queryClient.setQueryData(authQueryKey, null);
    },
  });
}
