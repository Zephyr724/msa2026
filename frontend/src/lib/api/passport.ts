import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type {
  PassportCommunityParticipation,
  PassportCompletionsPage,
  PassportCompletionItem,
  PassportSummary,
} from '../../types/passport.ts';
import {
  validatePassportCommunityParticipation,
  validatePassportCompletionsPage,
  validatePassportSummary,
} from '../validation/passportDto.ts';
import { apiFetch } from './apiFetch.ts';
import { executePrivateQuery } from './privateCache.ts';

/**
 * Transport/validation for `GET /v1/users/me/passport/completions`.
 *
 * The B1 session-expiry path runs against the exact ACTIVE QueryClient
 * passed in by the calling hook (`useQueryClient()`), never a hard-coded
 * module-level client: on a private 401 it awaits the ordered
 * cancel-then-remove cleanup, only then clears the auth session entry, and
 * only then rethrows — this function never resolves before cleanup has
 * finished, and the guard redirects only after the auth entry is null.
 */
export async function fetchPassportCompletions(
  page: number,
  pageSize: number,
  options: {
    queryClient: QueryClient;
    queryKey?: QueryKey;
    signal?: AbortSignal;
  },
): Promise<PassportCompletionsPage> {
  return executePrivateQuery(
    options.queryClient,
    options.queryKey ?? ['passport', 'completions', { page, pageSize }],
    options.signal,
    async (signal) => {
      const payload = await apiFetch<unknown>(
        `/v1/users/me/passport/completions?page=${page}&pageSize=${pageSize}`,
        { signal },
      );
      return validatePassportCompletionsPage(payload);
    },
  );
}

/**
 * Read a coherent snapshot of the caller's entire de-duplicated Passport
 * completion history for truth-sensitive composition such as Mission Board
 * classification. If the history changes between page reads, fail closed
 * instead of classifying from a partial or internally inconsistent set.
 */
export async function fetchAllPassportCompletions(options: {
  queryClient: QueryClient;
  queryKey?: QueryKey;
  signal?: AbortSignal;
}): Promise<PassportCompletionItem[]> {
  const pageSize = 50;
  const first = await fetchPassportCompletions(1, pageSize, options);
  if (first.page !== 1 || first.pageSize !== pageSize) {
    throw new Error('Passport completion history started from an invalid page.');
  }
  const items = [...first.items];

  for (let pageNumber = 2; pageNumber <= first.totalPages; pageNumber += 1) {
    const page = await fetchPassportCompletions(pageNumber, pageSize, options);
    if (
      page.page !== pageNumber
      || page.pageSize !== pageSize
      || page.totalCount !== first.totalCount
      || page.totalPages !== first.totalPages
    ) {
      throw new Error('Passport completion history changed while loading.');
    }
    items.push(...page.items);
  }

  const uniqueIds = new Set(items.map((item) => item.completionId));
  if (items.length !== first.totalCount || uniqueIds.size !== items.length) {
    throw new Error('Passport completion history is incomplete.');
  }
  return items;
}

export async function fetchPassportSummary(options: {
  queryClient: QueryClient;
  queryKey?: QueryKey;
  signal?: AbortSignal;
}): Promise<PassportSummary> {
  return executePrivateQuery(
    options.queryClient,
    options.queryKey ?? ['passport', 'summary'],
    options.signal,
    async (signal) => {
      const payload = await apiFetch<unknown>('/v1/users/me/passport', {
        signal,
      });
      return validatePassportSummary(payload);
    },
  );
}

export async function fetchPassportCommunityParticipation(options: {
  queryClient: QueryClient;
  queryKey?: QueryKey;
  signal?: AbortSignal;
}): Promise<PassportCommunityParticipation[]> {
  return executePrivateQuery(
    options.queryClient,
    options.queryKey ?? ['passport', 'community-participation'],
    options.signal,
    async (signal) => {
      const payload = await apiFetch<unknown>(
        '/v1/users/me/passport/community-participation',
        { signal },
      );
      return validatePassportCommunityParticipation(payload);
    },
  );
}
