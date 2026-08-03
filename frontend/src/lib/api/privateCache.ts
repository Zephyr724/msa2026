import type { Query, QueryClient, QueryKey } from '@tanstack/react-query';
import { ApiError, resetCsrfToken } from './apiFetch.ts';

/** The session entry is replaced only after the old principal's state is gone. */
export const authQueryKey = ['auth', 'me'] as const;

const privateRequestControllers = new WeakMap<QueryClient, Set<AbortController>>();

function isAuthQuery(query: Query): boolean {
  return query.queryKey.length === authQueryKey.length
    && query.queryKey.every((part, index) => part === authQueryKey[index]);
}

function controllersFor(queryClient: QueryClient): Set<AbortController> {
  let controllers = privateRequestControllers.get(queryClient);
  if (!controllers) {
    controllers = new Set();
    privateRequestControllers.set(queryClient, controllers);
  }
  return controllers;
}

/**
 * Run an authenticated request against the active provider client.
 *
 * Every private API uses this boundary. It supplies a principal-lifetime
 * abort signal and converts any 401 into the shared, awaited session-expiry
 * lifecycle before the original error is allowed to propagate.
 */
export async function executePrivateRequest<T>(
  queryClient: QueryClient,
  operation: (signal: AbortSignal) => Promise<T>,
  options?: { externalSignal?: AbortSignal; sourceQuery?: Query },
): Promise<T> {
  const controller = new AbortController();
  const controllers = controllersFor(queryClient);
  controllers.add(controller);
  const signal = options?.externalSignal
    ? AbortSignal.any([controller.signal, options.externalSignal])
    : controller.signal;

  try {
    return await operation(signal);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // The response has completed. Exclude its Query from cancellation so
      // the original 401 can still reach page-level redirect/error handling.
      controllers.delete(controller);
      await expirePrivateSession(queryClient, options?.sourceQuery);
    }
    throw error;
  } finally {
    controllers.delete(controller);
  }
}

/** Query-specific form that preserves the triggering 401 while wiping data. */
export function executePrivateQuery<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  externalSignal: AbortSignal | undefined,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const sourceQuery = queryClient.getQueryCache().find({ queryKey, exact: true });
  return executePrivateRequest(queryClient, operation, { externalSignal, sourceQuery });
}

/**
 * Cancel and remove every cache entry that could carry old-principal state.
 *
 * This intentionally does not use a query-key allowlist: otherwise a newly
 * added viewer-aware projection can silently escape isolation. All queries
 * are cancelled, every non-session query is removed, and every cached
 * mutation (including variables and responses) is discarded. Public data is
 * consequently refetched after a principal boundary, which is the safer
 * behavior for projections that may acquire current-user semantics later.
 */
export async function clearPrivateServerState(
  queryClient: QueryClient,
  sourceQuery?: Query,
): Promise<void> {
  const controllers = privateRequestControllers.get(queryClient);
  privateRequestControllers.set(queryClient, new Set());
  controllers?.forEach((controller) => controller.abort());

  await queryClient.cancelQueries({ predicate: (query) => query !== sourceQuery });
  if (sourceQuery) {
    sourceQuery.setState({ data: undefined, dataUpdatedAt: 0 });
  }
  queryClient.removeQueries({
    predicate: (query) => query !== sourceQuery && !isAuthQuery(query),
  });
  queryClient.getMutationCache().clear();
}

/** Clear old-principal state before publishing the anonymous session. */
export async function expirePrivateSession(
  queryClient: QueryClient,
  sourceQuery?: Query,
): Promise<void> {
  await clearPrivateServerState(queryClient, sourceQuery);
  resetCsrfToken();
  queryClient.setQueryData(authQueryKey, null);
}
