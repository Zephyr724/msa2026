import type { QueryClient } from '@tanstack/react-query';
import type { PassportCompletionsPage } from '../../types/passport.ts';
import { validatePassportCompletionsPage } from '../validation/passportDto.ts';
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
