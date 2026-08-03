import type { QueryClient } from '@tanstack/react-query';

/**
 * The B1 authenticated-cache lifecycle (plan §6 D6, §12).
 *
 * Private per-principal server state lives under these allowlisted key
 * prefixes. Every principal boundary (logout, login/account replacement,
 * and any private-endpoint 401) runs this cleanup FIRST and only then
 * clears or replaces the auth session — there is never an intermediate
 * state in which authentication is anonymous while the previous
 * principal's private queries still exist.
 */
export const PRIVATE_SERVER_QUERY_KEYS = [
  ['progression'],
  ['passport'],
  ['achievements'],
  ['participations'],
  ['social'],
] as const;

/**
 * The session query key. Defined here (not in a hook module) so the API
 * layer can run the session-expiry path without depending upward on app or
 * hook modules; `useAuth.ts` re-exports it for existing consumers.
 */
export const authQueryKey = ['auth', 'me'] as const;

/**
 * Ordered private-cache cleanup: first AWAIT `cancelQueries` for all
 * prefixes, so an in-flight old-principal request cannot complete into the
 * cache; only then `removeQueries` for the same prefixes. Resolves only
 * after both phases complete. Idempotent under concurrent callers.
 *
 * The `queryClient` argument must be the ACTIVE provider client (obtained
 * from `useQueryClient()` in the calling hook) — never a hard-coded
 * module-level client.
 */
export async function clearPrivateServerState(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all(
    PRIVATE_SERVER_QUERY_KEYS.map((queryKey) =>
      queryClient.cancelQueries({ queryKey: [...queryKey] })),
  );
  for (const queryKey of PRIVATE_SERVER_QUERY_KEYS) {
    queryClient.removeQueries({ queryKey: [...queryKey] });
  }
}

/**
 * Session-expiry path (plan §12/§13, M3/B1): a private 401 first AWAITS
 * the ordered private-cache cleanup, and only after it completes clears
 * the auth session entry. The guard redirects only after that; this
 * function never resolves before the cleanup has finished. Operates on the
 * exact active QueryClient passed in. Idempotent under concurrent 401s
 * from several private queries.
 */
export async function expirePrivateSession(
  queryClient: QueryClient,
): Promise<void> {
  await clearPrivateServerState(queryClient);
  queryClient.setQueryData(authQueryKey, null);
}
