import type { QueryClient } from '@tanstack/react-query';
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
import { ApiError, apiFetch } from './apiFetch.ts';
import { expirePrivateSession } from './privateCache.ts';

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
    signal?: AbortSignal;
  },
): Promise<PassportCompletionsPage> {
  try {
    const payload = await apiFetch<unknown>(
      `/v1/users/me/passport/completions?page=${page}&pageSize=${pageSize}`,
      { signal: options.signal },
    );
    return validatePassportCompletionsPage(payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await expirePrivateSession(options.queryClient);
    }
    throw error;
  }
}

/**
 * Read a coherent snapshot of the caller's entire de-duplicated Passport
 * completion history for truth-sensitive composition such as Mission Board
 * classification. If the history changes between page reads, fail closed
 * instead of classifying from a partial or internally inconsistent set.
 */
export async function fetchAllPassportCompletions(options: {
  queryClient: QueryClient;
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
  signal?: AbortSignal;
}): Promise<PassportSummary> {
  try {
    const payload = await apiFetch<unknown>('/v1/users/me/passport', {
      signal: options.signal,
    });
    return validatePassportSummary(payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await expirePrivateSession(options.queryClient);
    }
    throw error;
  }
}

export async function fetchPassportCommunityParticipation(options: {
  queryClient: QueryClient;
  signal?: AbortSignal;
}): Promise<PassportCommunityParticipation[]> {
  try {
    const payload = await apiFetch<unknown>(
      '/v1/users/me/passport/community-participation',
      { signal: options.signal },
    );
    return validatePassportCommunityParticipation(payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await expirePrivateSession(options.queryClient);
    }
    throw error;
  }
}
